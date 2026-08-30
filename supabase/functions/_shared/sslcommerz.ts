// Minimal SSLCommerz REST client for Deno Edge Functions.
// Docs: https://developer.sslcommerz.com/doc/v4/
//
// Credentials are read from Edge Function secrets (set via
// `supabase secrets set ...`) — they are NEVER sent to or readable by
// the browser. Only this server-side code ever sees them.

const isSandbox = (Deno.env.get('SSLCOMMERZ_IS_SANDBOX') ?? 'true') === 'true'

const BASE_URL = isSandbox ? 'https://sandbox.sslcommerz.com' : 'https://securepay.sslcommerz.com'

interface InitSessionParams {
  totalAmount: number
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerAddress: string
  customerCity: string
  successUrl: string
  failUrl: string
  cancelUrl: string
  ipnUrl: string
}

export async function initSslcommerzSession(params: InitSessionParams) {
  const storeId = Deno.env.get('SSLCOMMERZ_STORE_ID')
  const storePassword = Deno.env.get('SSLCOMMERZ_STORE_PASSWORD')

  if (!storeId || !storePassword) {
    throw new Error('SSLCommerz credentials are not configured (SSLCOMMERZ_STORE_ID / SSLCOMMERZ_STORE_PASSWORD).')
  }

  const body = new URLSearchParams({
    store_id: storeId,
    store_passwd: storePassword,
    total_amount: params.totalAmount.toFixed(2),
    currency: 'BDT',
    tran_id: params.orderNumber,
    success_url: params.successUrl,
    fail_url: params.failUrl,
    cancel_url: params.cancelUrl,
    ipn_url: params.ipnUrl,
    cus_name: params.customerName,
    cus_email: params.customerEmail,
    cus_phone: params.customerPhone,
    cus_add1: params.customerAddress,
    cus_city: params.customerCity,
    cus_country: 'Bangladesh',
    shipping_method: 'NO',
    product_name: 'VueShop Order',
    product_category: 'General',
    product_profile: 'general',
  })

  const response = await fetch(`${BASE_URL}/gwprocess/v4/api.php`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })

  const data = await response.json()

  if (data.status !== 'SUCCESS') {
    throw new Error(data.failedreason || 'SSLCommerz session init failed.')
  }

  return data as { GatewayPageURL: string; sessionkey: string }
}

// Server-to-server validation — this is the ONLY source of truth for
// whether a payment actually succeeded. The success_url redirect from
// the browser, and even the IPN POST body, are never trusted on their
// own; we always call back into SSLCommerz to confirm.
export async function validateSslcommerzTransaction(valId: string) {
  const storeId = Deno.env.get('SSLCOMMERZ_STORE_ID')
  const storePassword = Deno.env.get('SSLCOMMERZ_STORE_PASSWORD')

  const url = new URL(`${BASE_URL}/validator/api/validationserverAPI.php`)
  url.searchParams.set('val_id', valId)
  url.searchParams.set('store_id', storeId ?? '')
  url.searchParams.set('store_passwd', storePassword ?? '')
  url.searchParams.set('format', 'json')

  const response = await fetch(url.toString())
  const data = await response.json()

  return data as {
    status: string // 'VALID' | 'VALIDATED' | 'FAILED' | ...
    tran_id: string
    amount: string
    currency: string
    val_id: string
  }
}
