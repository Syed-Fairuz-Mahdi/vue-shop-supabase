<script setup>
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { Package, ShoppingBag, ArrowRight, Loader2, AlertTriangle } from 'lucide-vue-next'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const orders = ref([])
const isLoading = ref(true)

const statusLabels = {
  pending: 'Order Placed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
}

// RLS (orders_select_own_or_admin) already guarantees this only ever
// returns the signed-in customer's own orders.
onMounted(async () => {
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', authStore.user.id)
    .order('created_at', { ascending: false })

  orders.value = data || []
  isLoading.value = false
})
</script>

<template>
  <section class="max-w-6xl mx-auto px-6 py-12">
    <!-- Header -->

    <div class="mb-10">
      <h1 class="text-4xl font-bold">My Orders</h1>

      <p class="text-gray-500 mt-2">View your previous VueShop orders.</p>
    </div>

    <div
      v-if="route.query.paymentIssue"
      class="mb-8 flex items-start gap-3 bg-amber-50 text-amber-700 p-4 rounded-lg"
    >
      <AlertTriangle class="w-5 h-5 mt-0.5 flex-shrink-0" />
      <p class="text-sm">
        Order <strong>{{ route.query.paymentIssue }}</strong> was placed, but online payment couldn't be
        started. It's saved as unpaid — cash on delivery works normally, or contact us to complete payment
        another way.
      </p>
    </div>

    <!-- Empty -->

    <div v-if="isLoading" class="text-center py-20">
      <Loader2 class="w-10 h-10 mx-auto text-blue-600 animate-spin" />
    </div>

    <div v-else-if="orders.length === 0" class="text-center py-20 bg-gray-50 rounded-2xl">
      <Package class="w-20 h-20 mx-auto text-gray-300" />

      <h2 class="text-2xl font-bold mt-6">No orders yet</h2>

      <p class="text-gray-500 mt-2">Your orders will appear here.</p>

      <RouterLink
        to="/shop"
        class="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        <ShoppingBag class="w-5 h-5" />

        Start Shopping
      </RouterLink>
    </div>

    <!-- Orders -->

    <div v-else class="space-y-6">
      <div v-for="order in orders" :key="order.order_number" class="bg-white rounded-2xl shadow p-6">
        <!-- Order Header -->

        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-5"
        >
          <div>
            <p class="text-sm text-gray-500">Order Number</p>

            <h2 class="font-bold text-lg text-blue-600">
              {{ order.order_number }}
            </h2>
          </div>

          <div>
            <p class="text-sm text-gray-500">Order Date</p>

            <p class="font-medium">
              {{ new Date(order.created_at).toLocaleDateString() }}
            </p>
          </div>

          <div>
            <p class="text-sm text-gray-500">Total</p>

            <p class="font-bold text-lg">${{ Number(order.total).toFixed(2) }}</p>
          </div>
        </div>

        <!-- Products -->

        <div class="mt-6 space-y-4">
          <div
            v-for="item in order.order_items"
            :key="`${order.order_number}-${item.id}`"
            class="flex gap-4"
          >
            <img :src="item.image" :alt="item.title" class="w-20 h-20 object-cover rounded-xl" />

            <div class="flex-1">
              <h3 class="font-semibold">
                {{ item.title }}
              </h3>

              <p class="text-sm text-gray-500 mt-1">
                Quantity:
                {{ item.quantity }}
              </p>

              <p class="text-blue-600 font-semibold mt-2">
                ${{ Number(item.line_total).toFixed(2) }}
              </p>
            </div>
          </div>
        </div>

        <!-- Status -->

        <div class="mt-6 pt-5 border-t flex flex-wrap items-center justify-between gap-3">
          <span
            class="inline-flex items-center gap-2 bg-green-50 text-green-600 px-4 py-2 rounded-full text-sm font-medium"
          >
            <Package class="w-4 h-4" />

            {{ statusLabels[order.status] || order.status }}
          </span>

          <span
            class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium"
            :class="order.payment_status === 'paid' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'"
          >
            {{ order.payment_status === 'paid' ? 'Paid' : order.payment_status === 'unpaid' && order.payment_method === 'cod' ? 'Pay on Delivery' : order.payment_status }}
          </span>

          <RouterLink
            :to="{
              name: 'order-success',
              query: {
                order: order.order_number,
              },
            }"
            class="inline-flex items-center gap-2 text-blue-600 hover:underline"
          >
            View Order

            <ArrowRight class="w-4 h-4" />
          </RouterLink>
        </div>
      </div>
    </div>
  </section>
</template>
