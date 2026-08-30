<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { CheckCircle, Package, MapPin, CreditCard, ArrowRight, ShoppingBag, Loader2 } from 'lucide-vue-next'

import { supabase } from '@/lib/supabase'

const route = useRoute()

/*
|--------------------------------------------------------------------------
| Get Order — fetched from Supabase by order_number (RLS guarantees a
| customer can only ever see their own order here).
|--------------------------------------------------------------------------
*/

const order = ref(null)
const isLoading = ref(true)

onMounted(async () => {
  const orderNumberParam = route.query.order

  if (!orderNumberParam) {
    isLoading.value = false
    return
  }

  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('order_number', orderNumberParam)
    .maybeSingle()

  if (data) {
    const [firstName, ...rest] = (data.shipping_full_name || '').split(' ')

    order.value = {
      orderNumber: data.order_number,
      date: data.created_at,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      customer: {
        firstName,
        lastName: rest.join(' '),
        email: data.shipping_email,
        phone: data.shipping_phone,
        address: data.shipping_address,
        city: data.shipping_city,
        postalCode: data.shipping_postcode,
        country: data.shipping_country,
      },
      items: data.order_items.map((item) => ({
        id: item.id,
        title: item.title,
        image: item.image,
        price: Number(item.unit_price),
        quantity: item.quantity,
      })),
      subtotal: Number(data.subtotal),
      shipping: Number(data.shipping_fee),
      total: Number(data.total),
    }
  }

  isLoading.value = false
})

/*
|--------------------------------------------------------------------------
| Format Date
|--------------------------------------------------------------------------
*/

const formattedDate = computed(() => {
  if (!order.value?.date) {
    return ''
  }

  return new Date(order.value.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
})

/*
|--------------------------------------------------------------------------
| Payment Label
|--------------------------------------------------------------------------
*/

const paymentLabel = computed(() => {
  if (!order.value) {
    return ''
  }

  if (order.value.paymentMethod === 'cod') {
    return 'Cash on Delivery'
  }

  return order.value.paymentStatus === 'paid' ? 'Paid Online' : 'Online Payment (pending)'
})

/*
|--------------------------------------------------------------------------
| Order Number
|--------------------------------------------------------------------------
*/

const orderNumber = computed(() => {
  return route.query.order || order.value?.orderNumber || 'Unknown'
})
</script>

<template>
  <section class="max-w-5xl mx-auto px-6 py-12">
    <!-- ================================================= -->
    <!-- SUCCESS HEADER -->
    <!-- ================================================= -->

    <div class="text-center">
      <div class="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
        <CheckCircle class="w-12 h-12 text-green-600" />
      </div>

      <h1 class="text-4xl font-bold mt-6">Order Confirmed!</h1>

      <p class="text-gray-500 mt-3 text-lg">Thank you for your purchase.</p>

      <div class="inline-block bg-gray-100 rounded-lg px-5 py-3 mt-5">
        <span class="text-gray-500"> Order Number: </span>

        <span class="font-bold text-blue-600 ml-2">
          {{ orderNumber }}
        </span>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- LOADING -->
    <!-- ================================================= -->

    <div v-if="isLoading" class="text-center py-16">
      <Loader2 class="w-10 h-10 mx-auto text-blue-600 animate-spin" />
    </div>

    <!-- ================================================= -->
    <!-- NO ORDER -->
    <!-- ================================================= -->

    <div v-else-if="!order" class="text-center py-16">
      <Package class="w-16 h-16 mx-auto text-gray-300" />

      <h2 class="text-2xl font-bold mt-5">Order information unavailable</h2>

      <p class="text-gray-500 mt-2">We couldn't find the details for this order.</p>

      <RouterLink
        to="/shop"
        class="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        Continue Shopping

        <ArrowRight class="w-5 h-5" />
      </RouterLink>
    </div>

    <!-- ================================================= -->
    <!-- ORDER DETAILS -->
    <!-- ================================================= -->

    <div v-else class="mt-12 space-y-8">
      <!-- ================================================= -->
      <!-- ORDER META -->
      <!-- ================================================= -->

      <div class="grid sm:grid-cols-3 gap-5">
        <!-- Order Number -->

        <div class="bg-white rounded-2xl shadow p-5">
          <div class="flex items-center gap-3">
            <div class="bg-blue-100 p-3 rounded-lg">
              <Package class="w-6 h-6 text-blue-600" />
            </div>

            <div>
              <p class="text-sm text-gray-500">Order Number</p>

              <p class="font-bold">
                {{ order.orderNumber }}
              </p>
            </div>
          </div>
        </div>

        <!-- Date -->

        <div class="bg-white rounded-2xl shadow p-5">
          <p class="text-sm text-gray-500">Order Date</p>

          <p class="font-semibold mt-1">
            {{ formattedDate }}
          </p>
        </div>

        <!-- Payment -->

        <div class="bg-white rounded-2xl shadow p-5">
          <div class="flex items-center gap-3">
            <div class="bg-green-100 p-3 rounded-lg">
              <CreditCard class="w-6 h-6 text-green-600" />
            </div>

            <div>
              <p class="text-sm text-gray-500">Payment</p>

              <p class="font-semibold">
                {{ paymentLabel }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- CUSTOMER + SHIPPING -->
      <!-- ================================================= -->

      <div class="grid md:grid-cols-2 gap-8">
        <!-- Customer -->

        <div class="bg-white rounded-2xl shadow p-6">
          <h2 class="text-xl font-bold">Customer Information</h2>

          <div class="mt-5 space-y-3">
            <p>
              <span class="text-gray-500"> Name: </span>

              <span class="font-medium ml-2">
                {{ order.customer.firstName }}
                {{ order.customer.lastName }}
              </span>
            </p>

            <p>
              <span class="text-gray-500"> Email: </span>

              <span class="font-medium ml-2">
                {{ order.customer.email }}
              </span>
            </p>

            <p>
              <span class="text-gray-500"> Phone: </span>

              <span class="font-medium ml-2">
                {{ order.customer.phone }}
              </span>
            </p>
          </div>
        </div>

        <!-- Shipping -->

        <div class="bg-white rounded-2xl shadow p-6">
          <div class="flex items-center gap-3">
            <MapPin class="w-6 h-6 text-blue-600" />

            <h2 class="text-xl font-bold">Shipping Address</h2>
          </div>

          <div class="mt-5 text-gray-600 leading-relaxed">
            <p>
              {{ order.customer.address }}
            </p>

            <p>
              {{ order.customer.city }},
              {{ order.customer.postalCode }}
            </p>

            <p>
              {{ order.customer.country }}
            </p>
          </div>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- PRODUCTS -->
      <!-- ================================================= -->

      <div class="bg-white rounded-2xl shadow p-6">
        <div class="flex items-center gap-3">
          <ShoppingBag class="w-6 h-6 text-blue-600" />

          <h2 class="text-xl font-bold">Ordered Products</h2>
        </div>

        <div class="mt-6 divide-y">
          <div v-for="item in order.items" :key="item.id" class="py-5 flex gap-5">
            <!-- Image -->

            <img :src="item.image" :alt="item.title" class="w-24 h-24 object-cover rounded-xl" />

            <!-- Information -->

            <div class="flex-1">
              <h3 class="font-semibold text-lg">
                {{ item.title }}
              </h3>

              <p class="text-gray-500 mt-1">
                Quantity:
                {{ item.quantity }}
              </p>

              <p class="text-blue-600 font-semibold mt-2">
                ${{ item.price.toFixed(2) }}
                each
              </p>
            </div>

            <!-- Total -->

            <div class="font-bold text-lg">${{ (item.price * item.quantity).toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- TOTAL -->
      <!-- ================================================= -->

      <div class="bg-gray-50 rounded-2xl p-6">
        <h2 class="text-xl font-bold">Order Summary</h2>

        <div class="mt-6 space-y-4">
          <!-- Subtotal -->

          <div class="flex justify-between">
            <span class="text-gray-600"> Subtotal </span>

            <span> ${{ order.subtotal.toFixed(2) }} </span>
          </div>

          <!-- Shipping -->

          <div class="flex justify-between">
            <span class="text-gray-600"> Shipping </span>

            <span :class="order.shipping === 0 ? 'text-green-600' : ''">
              {{ order.shipping === 0 ? 'Free' : `$${order.shipping.toFixed(2)}` }}
            </span>
          </div>

          <div class="border-t"></div>

          <!-- Total -->

          <div class="flex justify-between items-center">
            <span class="text-2xl font-bold"> Total </span>

            <span class="text-3xl font-bold text-blue-600"> ${{ order.total.toFixed(2) }} </span>
          </div>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- ACTION BUTTONS -->
      <!-- ================================================= -->

      <div class="flex flex-col sm:flex-row justify-center gap-4 pt-4">
        <RouterLink
          to="/shop"
          class="inline-flex items-center justify-center gap-2 border border-gray-300 px-7 py-3 rounded-xl hover:bg-gray-50 transition"
        >
          Continue Shopping
        </RouterLink>

        <RouterLink
          to="/orders"
          class="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-7 py-3 rounded-xl hover:bg-blue-700 transition"
        >
          View My Orders

          <ArrowRight class="w-5 h-5" />
        </RouterLink>
      </div>
    </div>
  </section>
</template>
