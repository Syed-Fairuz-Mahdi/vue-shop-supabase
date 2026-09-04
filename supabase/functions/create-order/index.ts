// supabase/functions/create-order/index.ts
//
// The ONLY entry point for placing an order. Called by the customer
// app via supabase.functions.invoke('create-order', { body: {...} }).
//
// Trust boundary:
//   - The client sends product ids + quantities + shipping details.
//   - This function verifies who the caller actually is (their JWT),
//     then hands off to the `create_order` Postgres function, which
//     re-reads price/stock from the database itself. The client's
//     opinion of the price is never used for anything.
//   - If paying online, this function also starts an SSLCommerz
//     session using store credentials that live only in Edge Function
//     secrets, and returns the gateway URL for the browser to redirect to.

import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders, handleOptions } from '../_shared/cors.ts'
import { initSslcommerzSession } from '../_shared/sslcommerz.ts'

Deno.serve(async (req) => {
  const preflight = handleOptions(req)
  if (preflight) return preflight

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // --------------------------------------------------
    // 1. Identify the caller from their own JWT (anon-key client —
    //    this does NOT bypass RLS, it just decodes/verifies who's asking).
    // --------------------------------------------------
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'Missing Authorization header. Please log in again.' }, 401)
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await callerClient.auth.getUser()

    if (userError || !user) {
      return json({ error: 'Your session has expired. Please log in again.' }, 401)
    }

    // --------------------------------------------------
    // 2. Parse + minimally shape the request body.
    // --------------------------------------------------
    const body = await req.json()
    const items = Array.isArray(body.items) ? body.items : []
    const shipping = body.shipping || {}
    const paymentMethod = body.paymentMethod === 'sslcommerz' ? 'sslcommerz' : 'cod'

    if (items.length === 0) {
      return json({ error: 'Your cart is empty.' }, 400)
    }

    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity < 1) {
        return json({ error: 'Invalid cart item.' }, 400)
      }
    }

    const requiredShippingFields = ['fullName', 'email', 'phone', 'address', 'city']
    for (const field of requiredShippingFields) {
      if (!shipping[field]) {
        return json({ error: `Missing shipping field: ${field}` }, 400)
      }
    }

    // --------------------------------------------------
    // 3. Service-role client — only this function has this key.
    //    Used to call the trusted create_order() Postgres function.
    // --------------------------------------------------
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: order, error: rpcError } = await adminClient
      .rpc('create_order', {
        p_user_id: user.id,
        p_items: items.map((item: { productId: number; quantity: number }) => ({
          product_id: item.productId,
          quantity: item.quantity,
        })),
        p_payment_method: paymentMethod,
        p_shipping_full_name: shipping.fullName,
        p_shipping_email: shipping.email,
        p_shipping_phone: shipping.phone,
        p_shipping_address: shipping.address,
        p_shipping_city: shipping.city,
        p_shipping_postcode: shipping.postcode || '',
        p_shipping_country: shipping.country || 'Bangladesh',
      })
      .single()

    if (rpcError) {
      // create_order() raises plain, customer-safe messages (empty
      // cart, out of stock, etc.) via `raise exception`.
      return json({ error: rpcError.message }, 400)
    }

    // --------------------------------------------------
    // 4. Cash on delivery — nothing more to do.
    // --------------------------------------------------
    if (paymentMethod === 'cod') {
      return json({ order, gatewayUrl: null })
    }

    // --------------------------------------------------
    // 5. Online payment — start an SSLCommerz session.
    // --------------------------------------------------
    // SECURITY: siteOrigin is later used to build the URL the
    // customer's browser gets redirected to after payment. It must
    // NEVER be trusted verbatim from the request's Origin header —
    // an attacker could call this function directly with a forged
    // Origin and get a legitimate payment redirected to their own
    // domain (open redirect / phishing after a real purchase). Only
    // an origin that exactly matches our own known, configured
    // storefront domain(s) is accepted; anything else silently falls
    // back to the trusted CUSTOMER_SITE_URL secret.
    const requestOrigin = req.headers.get('origin') || ''
    const allowedOrigins = (Deno.env.get('CUSTOMER_SITE_URL') || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
    const siteOrigin = allowedOrigins.includes(requestOrigin) ? requestOrigin : allowedOrigins[0] || ''
    const functionsBase = `${supabaseUrl}/functions/v1`

    try {
      const session = await initSslcommerzSession({
        totalAmount: order.total,
        orderNumber: order.order_number,
        customerName: shipping.fullName,
        customerEmail: shipping.email,
        customerPhone: shipping.phone,
        customerAddress: shipping.address,
        customerCity: shipping.city,
        successUrl: `${functionsBase}/sslcommerz-callback?status=success&site=${encodeURIComponent(siteOrigin)}`,
        failUrl: `${functionsBase}/sslcommerz-callback?status=fail&site=${encodeURIComponent(siteOrigin)}`,
        cancelUrl: `${functionsBase}/sslcommerz-callback?status=cancel&site=${encodeURIComponent(siteOrigin)}`,
        ipnUrl: `${functionsBase}/sslcommerz-ipn`,
      })

      return json({ order, gatewayUrl: session.GatewayPageURL })
    } catch (sslError) {
      // Order already exists as unpaid/pending — customer can retry
      // payment later. Surface a clear error instead of pretending it worked.
      return json(
        { order, error: `Order created but payment could not be started: ${(sslError as Error).message}` },
        502,
      )
    }
  } catch (err) {
    console.error('create-order error:', err)
    return json({ error: 'Something went wrong placing your order. Please try again.' }, 500)
  }
})

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
