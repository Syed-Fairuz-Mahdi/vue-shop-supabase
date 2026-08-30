// supabase/functions/sslcommerz-ipn/index.ts
//
// SSLCommerz calls this URL directly, server-to-server, whenever a
// transaction's status changes — independent of whether the customer's
// browser ever made it back to our site. This is the authoritative
// path for marking an order paid: it always re-validates with
// SSLCommerz's Validation API before touching the database, and it's
// safe to call more than once for the same transaction (mark_order_paid
// is idempotent).

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'
import { validateSslcommerzTransaction } from '../_shared/sslcommerz.ts'

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  try {
    const form = await req.formData()
    const valId = form.get('val_id')?.toString()
    const tranId = form.get('tran_id')?.toString()

    if (!valId || !tranId) {
      return new Response('Missing val_id/tran_id', { status: 400 })
    }

    const validation = await validateSslcommerzTransaction(valId)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
      // Extra sanity check: the amount SSLCommerz confirms must match
      // what we actually charged for this order, not just "some" success.
      const { data: order } = await adminClient
        .from('orders')
        .select('total')
        .eq('order_number', validation.tran_id)
        .maybeSingle()

      const amountMatches = order && Math.abs(Number(order.total) - Number(validation.amount)) < 0.01

      if (amountMatches) {
        await adminClient.rpc('mark_order_paid', {
          p_order_number: validation.tran_id,
          p_transaction_id: validation.val_id,
        })
      } else {
        console.error('IPN amount mismatch', { order, validation })
        await adminClient.rpc('mark_order_failed', { p_order_number: validation.tran_id })
      }
    } else {
      await adminClient.rpc('mark_order_failed', { p_order_number: tranId })
    }

    return new Response('OK', { headers: corsHeaders })
  } catch (err) {
    console.error('sslcommerz-ipn error:', err)
    return new Response('Error', { status: 500 })
  }
})
