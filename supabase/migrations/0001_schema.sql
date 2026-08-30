-- =====================================================================
-- VueShop — core schema
-- =====================================================================
-- Run order: this file first, then 0002_rls.sql, then 0003_seed.sql
-- (functions/triggers used by RLS live in 0002 so this file is pure DDL)
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles — one row per auth.users row, created by trigger on signup
-- ---------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_role_idx on public.profiles (role);

-- ---------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  slug text not null unique,
  icon text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------
-- NOTE: products.id is a plain bigint (not uuid) on purpose. The
-- existing frontend routes to /product/:id and does Number(route.params.id)
-- in a couple of places (ProductView.vue, AdminProductFormView.vue) —
-- keeping numeric ids here means those files didn't need to change.
create table public.products (
  id bigint generated always as identity primary key,
  slug text not null unique,
  title text not null,
  brand text default '',
  category_id uuid references public.categories (id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  original_price numeric(10, 2) check (original_price is null or original_price >= 0),
  stock integer not null default 0 check (stock >= 0),
  badge text default '',
  featured boolean not null default false,
  flash_sale boolean not null default false,
  description text default '',
  image text default '',
  is_dummy boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_idx on public.products (category_id);
create index products_featured_idx on public.products (featured) where featured = true;
create index products_flash_sale_idx on public.products (flash_sale) where flash_sale = true;
create index products_active_idx on public.products (is_active) where is_active = true;

-- ---------------------------------------------------------------------
-- product_images — gallery, ordered. products.image stays as the
-- primary/cover image so existing product-card code keeps working
-- unmodified; this table is for the full gallery + admin management.
-- ---------------------------------------------------------------------
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products (id) on delete cascade,
  url text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, position);

-- ---------------------------------------------------------------------
-- cart_items
-- ---------------------------------------------------------------------
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index cart_items_user_idx on public.cart_items (user_id);

-- ---------------------------------------------------------------------
-- wishlist_items
-- ---------------------------------------------------------------------
create table public.wishlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  product_id bigint not null references public.products (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create index wishlist_items_user_idx on public.wishlist_items (user_id);

-- ---------------------------------------------------------------------
-- orders — prices/totals are always computed server-side (Edge
-- Function using the service role), never trusted from the client.
-- ---------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid not null references public.profiles (id) on delete restrict,

  status text not null default 'pending'
    check (status in ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('sslcommerz', 'cod')),
  payment_status text not null default 'unpaid'
    check (payment_status in ('unpaid', 'paid', 'failed', 'refunded')),
  payment_transaction_id text,

  subtotal numeric(10, 2) not null check (subtotal >= 0),
  shipping_fee numeric(10, 2) not null default 0 check (shipping_fee >= 0),
  total numeric(10, 2) not null check (total >= 0),

  shipping_full_name text not null,
  shipping_email text not null,
  shipping_phone text not null,
  shipping_address text not null,
  shipping_city text not null,
  shipping_postcode text,
  shipping_country text not null default 'Bangladesh',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index orders_payment_status_idx on public.orders (payment_status);

-- ---------------------------------------------------------------------
-- order_items — snapshot of product/price at time of purchase
-- ---------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id bigint references public.products (id) on delete set null,
  title text not null,
  image text default '',
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(10, 2) not null check (line_total >= 0)
);

create index order_items_order_idx on public.order_items (order_id);

-- ---------------------------------------------------------------------
-- reviews
-- ---------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id bigint not null references public.products (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  reviewer_name text not null,
  rating integer not null check (rating between 1 and 5),
  comment text default '',
  is_approved boolean not null default true,
  created_at timestamptz not null default now(),
  unique (product_id, user_id)
);

create index reviews_product_idx on public.reviews (product_id);

-- ---------------------------------------------------------------------
-- settings — single-row site settings (hero copy, footer links, etc.)
-- editable from Admin > Design/Settings, read publicly by the storefront
-- ---------------------------------------------------------------------
create table public.settings (
  id boolean primary key default true check (id),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.settings (id, data) values (true, '{}'::jsonb);

-- ---------------------------------------------------------------------
-- updated_at maintenance
-- ---------------------------------------------------------------------
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.products
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.cart_items
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- new auth user -> profile row (role always starts as 'customer')
-- ---------------------------------------------------------------------
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- keep products.rating / review_count in sync with reviews
-- ---------------------------------------------------------------------
create function public.recalc_product_rating()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  target_product_id bigint;
begin
  target_product_id := coalesce(new.product_id, old.product_id);

  update public.products p
  set rating = coalesce((
        select round(avg(r.rating)::numeric, 1)
        from public.reviews r
        where r.product_id = target_product_id and r.is_approved
      ), 0),
      review_count = (
        select count(*) from public.reviews r
        where r.product_id = target_product_id and r.is_approved
      )
  where p.id = target_product_id;

  return null;
end;
$$;

alter table public.products add column if not exists rating numeric(2, 1) not null default 0;
alter table public.products add column if not exists review_count integer not null default 0;

create trigger reviews_recalc_rating
  after insert or update or delete on public.reviews
  for each row execute function public.recalc_product_rating();
