-- =====================================================================
-- VueShop — admin invites (audit trail for granting admin access)
-- =====================================================================
-- This table does NOT gate anything by itself — it's a record of who
-- invited/promoted whom and when. The actual privilege is (as always)
-- the `role` column on public.profiles, and the only code path that
-- ever writes 'admin' into it is the invite-admin Edge Function,
-- running as service role, after independently verifying the caller
-- is already an admin.
-- =====================================================================

create table public.admin_invites (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  invited_by uuid not null references public.profiles (id),
  invited_user_id uuid references public.profiles (id) on delete set null,
  -- 'invited'  — brand-new account created via Supabase invite email,
  --              not yet accepted (no password set / link not used yet).
  -- 'promoted' — an existing account was promoted directly (no email
  --              round-trip needed, since they already have a login).
  kind text not null check (kind in ('invited', 'promoted')),
  created_at timestamptz not null default now()
);

create index admin_invites_email_idx on public.admin_invites (email);

alter table public.admin_invites enable row level security;

-- Only admins can ever read the invite log.
create policy "admin_invites_select_admin"
  on public.admin_invites for select
  using (public.is_admin());

-- No insert/update/delete policies for regular clients on purpose:
-- rows are written only by the invite-admin Edge Function using the
-- service role key, which bypasses RLS entirely. A customer or even
-- a compromised admin session can't write here directly.
