// supabase/functions/invite-admin/index.ts
//
// Lets an existing admin grant admin access to someone else, from
// inside the admin app — no SQL Editor required after the very first
// admin account (which is still bootstrapped manually, on purpose;
// see README).
//
// Trust boundary:
//   - The caller's JWT is checked against profiles.role themselves,
//     server-side, before anything else happens. A non-admin (or an
//     unauthenticated request) is rejected outright.
//   - The client only ever sends an email address. It never sends a
//     role, a user id, or anything else that could be tampered with
//     to grant more than "make this email an admin".
//
// Two paths, depending on whether the email already has an account:
//   - New email  -> Supabase Auth creates the user and emails them an
//                    invite link (to set a password). Their profile is
//                    promoted to 'admin' immediately, so by the time
//                    they finish the invite link they already have
//                    admin access.
//   - Existing email -> no email needed, just flips role -> 'admin'
//                    directly (they already have a login).
// Every grant is written to admin_invites for a visible audit trail.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // --------------------------------------------------
    // 1. Identify the caller and confirm they're already an admin.
    //    Same pattern as create-order: decode the caller's own JWT
    //    with the anon-key client (does not bypass RLS on its own).
    // --------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization header. Please log in again.' }, 401)
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user: caller },
      error: callerError,
    } = await callerClient.auth.getUser()

    if (callerError || !caller) {
      return json({ error: 'Your session has expired. Please log in again.' }, 401)
    }

    const { data: callerProfile } = await callerClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .maybeSingle()

    if (callerProfile?.role !== 'admin') {
      // Deliberately generic — don't confirm/deny admin status of
      // arbitrary accounts to a non-admin caller.
      return json({ error: 'Not authorized.' }, 403)
    }

    // --------------------------------------------------
    // 2. Parse + validate the request body.
    // --------------------------------------------------
    const body = await req.json()
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email || !emailPattern.test(email)) {
      return json({ error: 'Please enter a valid email address.' }, 400)
    }

    // --------------------------------------------------
    // 3. Service-role client — only this function has this key.
    // --------------------------------------------------
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    const { data: existingProfile } = await adminClient
      .from('profiles')
      .select('id, role')
      .eq('email', email)
      .maybeSingle()

    // --------------------------------------------------
    // 4a. Existing account -> just flip their role. No email needed,
    //     they already have a working login.
    // --------------------------------------------------
    if (existingProfile) {
      if (existingProfile.role === 'admin') {
        return json({ error: `${email} is already an admin.` }, 400)
      }

      const { error: updateError } = await adminClient
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', existingProfile.id)

      if (updateError) {
        return json({ error: 'Could not update that account. Please try again.' }, 500)
      }

      await adminClient.from('admin_invites').insert({
        email,
        invited_by: caller.id,
        invited_user_id: existingProfile.id,
        kind: 'promoted',
      })

      return json({ status: 'promoted', message: `${email} now has admin access.` })
    }

    // --------------------------------------------------
    // 4b. Brand-new email -> create the account via Supabase Auth's
    //     invite flow (sends them a "set your password" email), then
    //     immediately promote the profile the handle_new_user trigger
    //     creates for it.
    // --------------------------------------------------
    const adminSiteUrl = req.headers.get('origin') || Deno.env.get('ADMIN_SITE_URL') || ''

    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      redirectTo: adminSiteUrl ? `${adminSiteUrl}/set-password` : undefined,
    })

    if (inviteError || !inviteData?.user) {
      return json({ error: inviteError?.message || 'Could not send the invite. Please try again.' }, 502)
    }

    const newUserId = inviteData.user.id

    // handle_new_user (trigger on auth.users) already created a
    // 'customer' profile row for this id by this point — promote it.
    const { error: promoteError } = await adminClient
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', newUserId)

    if (promoteError) {
      return json(
        {
          error:
            'Invite email was sent, but promoting the new account failed. Please try promoting them again once they accept the invite.',
        },
        500,
      )
    }

    await adminClient.from('admin_invites').insert({
      email,
      invited_by: caller.id,
      invited_user_id: newUserId,
      kind: 'invited',
    })

    return json({ status: 'invited', message: `Invite sent to ${email}.` })
  } catch (err) {
    console.error('invite-admin error:', err)
    return json({ error: 'Something went wrong sending the invite. Please try again.' }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
