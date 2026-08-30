<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { ArrowLeft, CreditCard, Lock, Truck, Check } from 'lucide-vue-next'

import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { supabase } from '@/lib/supabase'

const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()

/*
|--------------------------------------------------------------------------
| Form
|--------------------------------------------------------------------------
*/

const form = ref({
  firstName: '',
  lastName: '',
  email: authStore.user?.email || '',
  phone: '',
  address: '',
  city: '',
  postalCode: '',
  country: 'Bangladesh',
})

/*
|--------------------------------------------------------------------------
| Payment Method
|--------------------------------------------------------------------------
*/

// 'sslcommerz' covers Visa/Mastercard/bKash/Nagad/bank — all handled on
// SSLCommerz's own hosted, PCI-compliant payment page. This app never
// collects card numbers directly (that's both safer and how SSLCommerz
// actually works — there's no legitimate way to accept raw card details
// in a plain form and forward them yourself).
const paymentMethod = ref('sslcommerz')

/*
|--------------------------------------------------------------------------
| Shipping
|--------------------------------------------------------------------------
*/

const shipping = computed(() => {
  if (cartStore.totalPrice >= 50) {
    return 0
  }

  return 5
})

/*
|--------------------------------------------------------------------------
| Total
|--------------------------------------------------------------------------
*/

const total = computed(() => {
  return cartStore.totalPrice + shipping.value
})

/*
|--------------------------------------------------------------------------
| Form Error
|--------------------------------------------------------------------------
*/

const errorMessage = ref('')

/*
|--------------------------------------------------------------------------
| Order Processing
|--------------------------------------------------------------------------
*/

const isProcessing = ref(false)

/*
|--------------------------------------------------------------------------
| Place Order
|--------------------------------------------------------------------------
*/

const placeOrder = async () => {
  errorMessage.value = ''

  /*
  |--------------------------------------------------------------------------
  | Check Cart
  |--------------------------------------------------------------------------
  */

  if (cartStore.items.length === 0) {
    errorMessage.value = 'Your cart is empty.'
    return
  }

  /*
  |--------------------------------------------------------------------------
  | Validate Customer Information
  |--------------------------------------------------------------------------
  */

  if (
    !form.value.firstName ||
    !form.value.lastName ||
    !form.value.email ||
    !form.value.phone ||
    !form.value.address ||
    !form.value.city ||
    !form.value.postalCode
  ) {
    errorMessage.value = 'Please complete all required fields.'

    return
  }

  isProcessing.value = true

  /*
  |--------------------------------------------------------------------------
  | Ask the server to create the order. It re-checks price/stock itself —
  | nothing about pricing here is trusted from this form.
  |--------------------------------------------------------------------------
  */

  let { data, error } = await supabase.functions.invoke('create-order', {
    body: {
      paymentMethod: paymentMethod.value,
      items: cartStore.items.map((item) => ({ productId: item.id, quantity: item.quantity })),
      shipping: {
        fullName: `${form.value.firstName} ${form.value.lastName}`.trim(),
        email: form.value.email,
        phone: form.value.phone,
        address: form.value.address,
        city: form.value.city,
        postcode: form.value.postalCode,
        country: form.value.country,
      },
    },
  })

  isProcessing.value = false

  // supabase-js hides the real response body behind a generic
  // "Edge Function returned a non-2xx status code" message whenever
  // create-order responds with an error status — the actual JSON
  // (with the real error, and sometimes the order that WAS created
  // before payment failed) lives on error.context, so unwrap it here
  // rather than showing the generic message.
  if (error && error.context) {
    try {
      data = await error.context.json()
    } catch {
      // context wasn't JSON — fall through to the generic message below.
    }
  }

  if (error || data?.error) {
    // The order can exist even though this call "failed" — e.g. stock
    // was reserved and the order row was written, but starting the
    // SSLCommerz session then failed (missing/invalid credentials,
    // SSLCommerz being down, etc). If we just showed an error and let
    // the customer click "Place Order" again, it would create a SECOND
    // order for the same items — so if an order was created, treat this
    // as "created, payment needs to be retried" instead of a hard failure.
    if (data?.order) {
      cartStore.items.splice(0)
      router.push({
        path: '/orders',
        query: { paymentIssue: data.order.order_number },
      })
      return
    }

    errorMessage.value = data?.error || error?.message || 'Could not place your order. Please try again.'
    return
  }

  // Local cart is only a mirror of the DB cart for logged-in users —
  // create_order() already cleared the server-side cart_items.
  cartStore.items.splice(0)

  if (paymentMethod.value === 'sslcommerz' && data.gatewayUrl) {
    // Hand off to SSLCommerz's hosted payment page. The order stays
    // "unpaid" until SSLCommerz's server-to-server IPN (or the
    // callback redirect) independently confirms payment.
    window.location.href = data.gatewayUrl
    return
  }

  router.push({
    path: '/order-success',

    query: {
      order: data.order.order_number,
    },
  })
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-6 py-12">
    <!-- ================================================= -->
    <!-- HEADER -->
    <!-- ================================================= -->

    <div class="mb-10">
      <RouterLink
        to="/cart"
        class="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 transition mb-6"
      >
        <ArrowLeft class="w-5 h-5" />

        Back to Cart
      </RouterLink>

      <h1 class="text-4xl font-bold">Checkout</h1>

      <p class="text-gray-500 mt-2">Complete your order securely.</p>
    </div>

    <!-- ================================================= -->
    <!-- EMPTY CART -->
    <!-- ================================================= -->

    <div v-if="cartStore.items.length === 0" class="text-center py-20">
      <h2 class="text-2xl font-bold">Your cart is empty</h2>

      <p class="text-gray-500 mt-2">Add products before checking out.</p>

      <RouterLink
        to="/shop"
        class="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Continue Shopping
      </RouterLink>
    </div>

    <!-- ================================================= -->
    <!-- CHECKOUT -->
    <!-- ================================================= -->

    <div v-else class="grid lg:grid-cols-3 gap-10">
      <!-- ================================================= -->
      <!-- LEFT -->
      <!-- ================================================= -->

      <div class="lg:col-span-2 space-y-8">
        <!-- =============================================== -->
        <!-- CONTACT -->
        <!-- =============================================== -->

        <div class="bg-white rounded-2xl shadow p-6">
          <h2 class="text-2xl font-bold">Contact Information</h2>

          <div class="grid sm:grid-cols-2 gap-5 mt-6">
            <div>
              <label class="block text-sm font-medium mb-2"> First Name * </label>

              <input
                v-model="form.firstName"
                type="text"
                placeholder="John"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2"> Last Name * </label>

              <input
                v-model="form.lastName"
                type="text"
                placeholder="Doe"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2"> Email * </label>

              <input
                v-model="form.email"
                type="email"
                placeholder="john@example.com"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2"> Phone * </label>

              <input
                v-model="form.phone"
                type="tel"
                placeholder="+880 1XXXXXXXXX"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- =============================================== -->
        <!-- SHIPPING -->
        <!-- =============================================== -->

        <div class="bg-white rounded-2xl shadow p-6">
          <h2 class="text-2xl font-bold">Shipping Address</h2>

          <div class="space-y-5 mt-6">
            <div>
              <label class="block text-sm font-medium mb-2"> Street Address * </label>

              <input
                v-model="form.address"
                type="text"
                placeholder="House, road, area"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div class="grid sm:grid-cols-2 gap-5">
              <div>
                <label class="block text-sm font-medium mb-2"> City * </label>

                <input
                  v-model="form.city"
                  type="text"
                  placeholder="Dhaka"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium mb-2"> Postal Code * </label>

                <input
                  v-model="form.postalCode"
                  type="text"
                  placeholder="1200"
                  class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2"> Country </label>

              <select
                v-model="form.country"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option>Bangladesh</option>

                <option>India</option>

                <option>Pakistan</option>

                <option>United States</option>

                <option>United Kingdom</option>
              </select>
            </div>
          </div>
        </div>

        <!-- =============================================== -->
        <!-- PAYMENT -->
        <!-- =============================================== -->

        <div class="bg-white rounded-2xl shadow p-6">
          <h2 class="text-2xl font-bold">Payment Method</h2>

          <div class="grid sm:grid-cols-2 gap-4 mt-6">
            <button
              type="button"
              @click="paymentMethod = 'sslcommerz'"
              class="border-2 rounded-xl p-5 text-left transition"
              :class="
                paymentMethod === 'sslcommerz'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-400'
              "
            >
              <CreditCard class="w-6 h-6 text-blue-600" />

              <p class="font-semibold mt-3">Pay Online</p>

              <p class="text-sm text-gray-500 mt-1">Card, bKash, Nagad, or bank via SSLCommerz</p>
            </button>

            <button
              type="button"
              @click="paymentMethod = 'cod'"
              class="border-2 rounded-xl p-5 text-left transition"
              :class="
                paymentMethod === 'cod'
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-400'
              "
            >
              <Truck class="w-6 h-6 text-blue-600" />

              <p class="font-semibold mt-3">Cash on Delivery</p>

              <p class="text-sm text-gray-500 mt-1">Pay when your order arrives.</p>
            </button>
          </div>

          <!-- Online payment -->

          <div
            v-if="paymentMethod === 'sslcommerz'"
            class="mt-6 flex items-start gap-3 bg-blue-50 text-blue-700 p-4 rounded-lg"
          >
            <Lock class="w-5 h-5 mt-0.5 flex-shrink-0" />

            <p class="text-sm">
              You'll be redirected to SSLCommerz's secure payment page to complete payment. Your card details are
              never entered on this site.
            </p>
          </div>

          <!-- COD -->

          <div
            v-if="paymentMethod === 'cod'"
            class="mt-6 bg-green-50 text-green-700 p-4 rounded-lg"
          >
            You will pay when your order is delivered.
          </div>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- RIGHT -->
      <!-- ================================================= -->

      <div>
        <div class="bg-gray-50 rounded-2xl p-6 sticky top-24">
          <h2 class="text-2xl font-bold">Order Summary</h2>

          <!-- Products -->

          <div class="mt-6 space-y-4 max-h-80 overflow-y-auto">
            <div v-for="item in cartStore.items" :key="item.id" class="flex gap-4">
              <img :src="item.image" :alt="item.title" class="w-16 h-16 object-cover rounded-lg" />

              <div class="flex-1 min-w-0">
                <p class="font-medium truncate">
                  {{ item.title }}
                </p>

                <p class="text-sm text-gray-500">Qty: {{ item.quantity }}</p>
              </div>

              <span class="font-semibold"> ${{ (item.price * item.quantity).toFixed(2) }} </span>
            </div>
          </div>

          <div class="border-t my-6"></div>

          <div class="flex justify-between">
            <span class="text-gray-600"> Subtotal </span>

            <span> ${{ cartStore.totalPrice.toFixed(2) }} </span>
          </div>

          <div class="flex justify-between mt-4">
            <span class="text-gray-600"> Shipping </span>

            <span :class="shipping === 0 ? 'text-green-600' : ''">
              {{ shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}` }}
            </span>
          </div>

          <div class="border-t my-6"></div>

          <div class="flex justify-between items-center">
            <span class="text-xl font-bold"> Total </span>

            <span class="text-2xl font-bold text-blue-600"> ${{ total.toFixed(2) }} </span>
          </div>

          <!-- Error -->

          <div v-if="errorMessage" class="mt-5 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
            {{ errorMessage }}
          </div>

          <!-- Place Order -->

          <button
            @click="placeOrder"
            :disabled="isProcessing"
            class="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <span v-if="isProcessing"> Processing... </span>

            <template v-else>
              <Check class="w-5 h-5" />

              Place Order
            </template>
          </button>

          <div class="flex items-center justify-center gap-2 text-sm text-gray-500 mt-5">
            <Lock class="w-4 h-4" />

            Secure checkout
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
