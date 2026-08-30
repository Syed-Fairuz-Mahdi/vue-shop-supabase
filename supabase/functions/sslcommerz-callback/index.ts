// supabase/functions/sslcommerz-callback/index.ts
//
// SSLCommerz redirects the customer's BROWSER here (via an HTML form
// POST) after they finish on the hosted payment page — for all three
// outcomes (success/fail/cancel), decided by the ?status= query param
// this URL was registered with in create-order.
//
// IMPORTANT: we never mark an order paid just because the browser
// landed on the "success" URL. We re-validate with SSLCommerz's own
// Validation API first (same as the IPN handler), and only then
// redirect the browser to the matching page on the storefront. The
// IPN function (server-to-server, no browser involved) is the other,
// independent path to the same result — whichever arrives first wins,
// and both are idempotent.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { handleOptions } from '../_shared/cors.ts'
import { validateSslcommerzTransaction } from '../_shared/sslcommerz.ts'

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  const url = new URL(req.url)
  const status = url.searchParams.get('status') // success | fail | cancel
  const siteOrigin = url.searchParams.get('site') || Deno.env.get('CUSTOMER_SITE_URL') || ''

  try {
    const form = await req.formData().catch(() => null)
    const tranId = form?.get('tran_id')?.toString() || url.searchParams.get('tran_id') || ''
    const valId = form?.get('val_id')?.toString()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    if (status === 'success' && valId) {
      const validation = await validateSslcommerzTransaction(valId)

      if (validation.status === 'VALID' || validation.status === 'VALIDATED') {
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
          return redirect(`${siteOrigin}/order-success?order=${encodeURIComponent(validation.tran_id)}`)
        }
      }

      await adminClient.rpc('mark_order_failed', { p_order_number: tranId })
      return redirect(`${siteOrigin}/checkout?payment=failed&order=${encodeURIComponent(tranId)}`)
    }

    if (tranId) {
      await adminClient.rpc('mark_order_failed', { p_order_number: tranId })
    }

    const reason = status === 'cancel' ? 'cancelled' : 'failed'
    return redirect(`${siteOrigin}/checkout?payment=${reason}&order=${encodeURIComponent(tranId)}`)
  } catch (err) {
    console.error('sslcommerz-callback error:', err)
    return redirect(`${siteOrigin}/checkout?payment=error`)
  }
})

function redirect(location: string) {
  return new Response(null, { status: 302, headers: { Location: location } })
}
