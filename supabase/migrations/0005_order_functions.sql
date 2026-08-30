-- =====================================================================
-- VueShop — trusted order creation
-- =====================================================================
-- This function is the ONLY way an order is ever created. It:
--   * re-reads price/stock from the products table itself (never
--     trusts anything the client sent except product id + quantity)
--   * validates stock is available
--   * computes subtotal/shipping/total server-side
--   * writes the order + order_items + decrements stock atomically
--
-- SECURITY: this is SECURITY DEFINER so it can write across tables
-- regardless of RLS, but EXECUTE is revoked from anon/authenticated
-- below — it can only be called with the service_role key, i.e. from
-- inside the create-order Edge Function, after that function has
-- already verified the caller's JWT and knows their real user id.
-- A customer can NEVER call this directly and pass someone else's
-- user_id or a fabricated price.
-- =====================================================================

create or replace function public.create_order(
  p_user_id uuid,
  p_items jsonb, -- [{ "product_id": 1, "quantity": 2 }, ...]
  p_payment_method text,
  p_shipping_full_name text,
  p_shipping_email text,
  p_shipping_phone text,
  p_shipping_address text,
  p_shipping_city text,
  p_shipping_postcode text,
  p_shipping_country text
)
returns public.orders
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_product public.products%rowtype;
  v_subtotal numeric(10, 2) := 0;
  v_shipping_fee numeric(10, 2) := 0;
  v_total numeric(10, 2) := 0;
  v_order public.orders;
  v_order_number text;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Cart is empty.' using errcode = 'P0001';
  end if;

  if p_payment_method not in ('sslcommerz', 'cod') then
    raise exception 'Invalid payment method.' using errcode = 'P0001';
  end if;

  -- Lock the rows we're about to sell so two simultaneous checkouts
  -- can't both oversell the last unit.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product
    from public.products
    where id = (v_item ->> 'product_id')::bigint
    for update;

    if not found then
      raise exception 'Product % no longer exists.', (v_item ->> 'product_id') using errcode = 'P0001';
    end if;

    if v_product.stock < (v_item ->> 'quantity')::integer then
      raise exception 'Not enough stock for %. Only % left.', v_product.title, v_product.stock using errcode = 'P0001';
    end if;

    v_subtotal := v_subtotal + (v_product.price * (v_item ->> 'quantity')::integer);
  end loop;

  if v_subtotal < 50 then
    v_shipping_fee := 5;
  end if;

  v_total := v_subtotal + v_shipping_fee;
  v_order_number := 'VS-' || to_char(now(), 'YYMMDD') || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);

  insert into public.orders (
    order_number, user_id, payment_method, subtotal, shipping_fee, total,
    shipping_full_name, shipping_email, shipping_phone, shipping_address,
    shipping_city, shipping_postcode, shipping_country
  ) values (
    v_order_number, p_user_id, p_payment_method, v_subtotal, v_shipping_fee, v_total,
    p_shipping_full_name, p_shipping_email, p_shipping_phone, p_shipping_address,
    p_shipping_city, p_shipping_postcode, p_shipping_country
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = (v_item ->> 'product_id')::bigint;

    insert into public.order_items (order_id, product_id, title, image, unit_price, quantity, line_total)
    values (
      v_order.id, v_product.id, v_product.title, v_product.image, v_product.price,
      (v_item ->> 'quantity')::integer, v_product.price * (v_item ->> 'quantity')::integer
    );

    update public.products
    set stock = stock - (v_item ->> 'quantity')::integer
    where id = v_product.id;
  end loop;

  -- Clear whatever the customer had in their DB cart — mirrors the old
  -- "cartStore.items.splice(0)" behaviour after a successful order.
  delete from public.cart_items where user_id = p_user_id;

  return v_order;
end;
$$;

revoke execute on function public.create_order from public, anon, authenticated;

-- --------------------------------------------------------------------
-- Called only by the sslcommerz-ipn / sslcommerz-callback Edge
-- Functions (service role) after independently verifying payment
-- status with SSLCommerz's own Validation API — never from the client.
-- --------------------------------------------------------------------
create or replace function public.mark_order_paid(p_order_number text, p_transaction_id text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.orders
  set payment_status = 'paid',
      payment_transaction_id = p_transaction_id,
      status = case when status = 'pending' then 'processing' else status end
  where order_number = p_order_number;
$$;

revoke execute on function public.mark_order_paid from public, anon, authenticated;

create or replace function public.mark_order_failed(p_order_number text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.orders
  set payment_status = 'failed'
  where order_number = p_order_number and payment_status = 'unpaid';
$$;

revoke execute on function public.mark_order_failed from public, anon, authenticated;
