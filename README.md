# VueShop — Setup Guide

This project is now a monorepo:

```
project/
├── customer/     # your original storefront, now backed by Supabase
├── admin/        # new, separate admin dashboard app
└── supabase/     # migrations + Edge Functions (shared by both apps)
```

Everything below has been written carefully and the two frontends build
successfully (`npx vite build` passes in both `customer/` and `admin/`),
but **none of it has been run against a live Supabase project** — I
don't have your project credentials, and my build sandbox can't reach
`supabase.co` or `sslcommerz.com` even if I did. Treat this as "should
work, needs your verification," not "tested." The steps below tell you
exactly what to check at each stage.

## 1. Run the database migrations

In the Supabase Dashboard → SQL Editor, run the files in
`supabase/migrations/` **in order**:

1. `0001_schema.sql` — tables
2. `0002_rls.sql` — security policies
3. `0003_seed.sql` — your 8 original dummy products + images
4. `0004_settings_seed.sql` — homepage/footer defaults
5. `0005_order_functions.sql` — trusted order creation
6. `0006_storage.sql` — product-images storage bucket

(If you have the Supabase CLI installed and linked instead, `supabase
db push` will apply all of them in order automatically.)

**Verify:** after running these, check Table Editor → `products` — you
should see your 8 dummy products with `is_dummy = true`.

## 2. Configure both frontends

In **both** `customer/.env` and `admin/.env` (copy from `.env.example`
in each folder):

```
VITE_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR-ANON-PUBLIC-KEY
```

Both values come from Supabase Dashboard → Project Settings → API.
The anon key is safe to put in frontend code — it grants nothing on
its own; RLS is what actually restricts access.

Optionally, in `admin/.env`, set `VITE_CUSTOMER_SITE_URL` to your
storefront's URL (used for the "View Store" link) — defaults to
`http://localhost:5173`.

Then in each folder:

```
npm install
npm run dev
```

## 3. Create your first admin account

There is no admin signup form on purpose — promoting yourself to admin
is not something the app lets happen through the UI. Instead:

1. Register a normal account on the **customer** site (or via Supabase
   Dashboard → Authentication → Add User).
2. In the SQL Editor, run:

   ```sql
   update public.profiles set role = 'admin' where email = 'you@example.com';
   ```

3. Log into the **admin** app with that same email/password.

**Verify:** log into `admin/` with that account — you should reach the
dashboard. Log into `admin/` with a normal customer account — it
should sign in but immediately be rejected with "This account does not
have admin access" (this is `adminAuth.js` checking `profiles.role`,
backed by RLS — not a frontend email check).

## 4. Edge Functions

Deploy with the Supabase CLI:

```
supabase functions deploy create-order
supabase functions deploy sslcommerz-ipn --no-verify-jwt
supabase functions deploy sslcommerz-callback --no-verify-jwt
```

Then set secrets (Dashboard → Edge Functions → Secrets, or CLI):

```
supabase secrets set SSLCOMMERZ_STORE_ID=your_store_id
supabase secrets set SSLCOMMERZ_STORE_PASSWORD=your_store_password
supabase secrets set SSLCOMMERZ_IS_SANDBOX=true
supabase secrets set CUSTOMER_SITE_URL=https://www.yourdomain.com
```

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are already available to
Edge Functions automatically — you don't set those yourself, and they
never appear in either frontend's code or bundle.

**Until you have real SSLCommerz sandbox credentials**, Cash on
Delivery works end-to-end. "Pay Online" will create the order (unpaid)
and then fail at the SSLCommerz session-init step with a clear error,
rather than pretending to succeed.

**Verify once you have credentials:** place a test order with "Pay
Online," complete a test payment on SSLCommerz's sandbox page, and
confirm the order's `payment_status` flips to `paid` in Table Editor —
that's the IPN function firing.

## 5. Deploying to `www.` / `admin.`

Each folder is an independent Vite app — build and deploy them
separately:

```
cd customer && npm run build   # deploy dist/ to www.yourdomain.com
cd admin && npm run build      # deploy dist/ to admin.yourdomain.com
```

Any static host (Vercel, Netlify, Cloudflare Pages) works for both;
just point each subdomain at its own build output and set that host's
environment variables to the same `.env` values.

## What changed from the original app, and why

- **Admin removed from the customer app** — no more `/admin/*` routes,
  no more "Admin" link in the footer, no more fake `adminAuth`
  token-in-localStorage system.
- **Checkout no longer collects card numbers.** The old form had
  card-number/expiry/CVV inputs that went nowhere. Real SSLCommerz
  integration works by redirecting to SSLCommerz's own hosted,
  PCI-compliant payment page — there's no legitimate way to collect
  raw card data in a plain form yourself, so those fields were replaced
  with a short explanation instead of silently faking them.
- **Admin login is now email/password** (Supabase Auth), not
  username/password against a fake DB record. The Site Settings page's
  "Admin Username/Password" fields, which wrote into the same fake
  system, were replaced with a real "change your password" action.
- **Product IDs stayed as plain numbers**, not UUIDs, specifically so
  `ProductView.vue`'s and `AdminProductFormView.vue`'s existing
  `Number(route.params.id)` code didn't need to change.
- Everything else — layout, styling, components, product cards, cart
  UI, wishlist UI — is untouched.

## Known gaps / things I did not get to

- End-to-end testing against a live project (see caveat above).
- Email templates for Supabase Auth (signup confirmation, password
  reset) use Supabase's defaults — you may want to customize these in
  Dashboard → Authentication → Email Templates.
- No automated tests were written for the Edge Functions.
