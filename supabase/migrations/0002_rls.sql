-- =====================================================================
-- VueShop — Row Level Security
-- =====================================================================

-- ---------------------------------------------------------------------
-- is_admin() — SECURITY DEFINER so it can read profiles.role without
-- re-triggering RLS on profiles (which would recurse). This is the
-- ONLY place "admin" is decided — never trust anything from the client.
-- ---------------------------------------------------------------------
create function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------------------
-- Prevent a user from ever changing their own role (or anyone else's)
-- through a normal client update. Only a call made with the service
-- role (Edge Function) or run by an existing admin bypasses this.
-- ---------------------------------------------------------------------
create function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role = old.role;
  end if;
  return new;
end;
$$;

create trigger protect_profile_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- =====================================================================
-- profiles
-- =====================================================================
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  using (id = auth.uid() or public.is_admin());

-- no insert/delete policies for regular clients: rows are created only
-- by the handle_new_user trigger (security definer) on signup.

-- =====================================================================
-- categories — public read, admin write
-- =====================================================================
alter table public.categories enable row level security;

create policy "categories_select_all"
  on public.categories for select
  using (true);

create policy "categories_write_admin"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- products — public read, admin write
-- =====================================================================
alter table public.products enable row level security;

create policy "products_select_all"
  on public.products for select
  using (true);

create policy "products_write_admin"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- product_images — public read, admin write
-- =====================================================================
alter table public.product_images enable row level security;

create policy "product_images_select_all"
  on public.product_images for select
  using (true);

create policy "product_images_write_admin"
  on public.product_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- cart_items — owner only
-- =====================================================================
alter table public.cart_items enable row level security;

create policy "cart_items_owner"
  on public.cart_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "cart_items_admin_read"
  on public.cart_items for select
  using (public.is_admin());

-- =====================================================================
-- wishlist_items — owner only
-- =====================================================================
alter table public.wishlist_items enable row level security;

create policy "wishlist_items_owner"
  on public.wishlist_items for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- =====================================================================
-- orders — customers see/create their own, cannot edit after creation;
-- only admins (or the service-role Edge Function) can change status /
-- payment fields. Direct client INSERT is intentionally NOT allowed —
-- orders are created exclusively by the create-order Edge Function
-- (service role), which validates prices/stock server-side.
-- =====================================================================
alter table public.orders enable row level security;

create policy "orders_select_own_or_admin"
  on public.orders for select
  using (user_id = auth.uid() or public.is_admin());

create policy "orders_update_admin_only"
  on public.orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- =====================================================================
-- order_items — readable by the owning customer (via their order) or
-- admin; writes only via the service role (Edge Function).
-- =====================================================================
alter table public.order_items enable row level security;

create policy "order_items_select_own_or_admin"
  on public.order_items for select
  using (
    public.is_admin()
    or exists (
      select 1 from public.orders o
      where o.id = order_items.order_id and o.user_id = auth.uid()
    )
  );

-- =====================================================================
-- reviews — anyone can read approved reviews; authenticated users can
-- create/update/delete their own; admins can moderate (delete/hide) any.
-- =====================================================================
alter table public.reviews enable row level security;

create policy "reviews_select_approved_or_own_or_admin"
  on public.reviews for select
  using (is_approved or user_id = auth.uid() or public.is_admin());

create policy "reviews_insert_own"
  on public.reviews for insert
  with check (user_id = auth.uid());

create policy "reviews_update_own_or_admin"
  on public.reviews for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "reviews_delete_own_or_admin"
  on public.reviews for delete
  using (user_id = auth.uid() or public.is_admin());

-- =====================================================================
-- settings — public read, admin write
-- =====================================================================
alter table public.settings enable row level security;

create policy "settings_select_all"
  on public.settings for select
  using (true);

create policy "settings_write_admin"
  on public.settings for update
  using (public.is_admin())
  with check (public.is_admin());
