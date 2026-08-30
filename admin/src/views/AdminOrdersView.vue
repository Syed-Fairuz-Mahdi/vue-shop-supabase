<script setup>
import { computed, onMounted, ref } from 'vue'
import { Search, Loader2, Package, ChevronDown, ChevronUp } from 'lucide-vue-next'

import { supabase } from '@/lib/supabase'

const orders = ref([])
const isLoading = ref(true)
const searchQuery = ref('')
const statusFilter = ref('all')
const expandedId = ref(null)
const savingId = ref(null)

const statusOptions = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']

// RLS (orders_select_own_or_admin) returns every order for an admin
// session; a customer session calling this same query would only ever
// get their own rows back, no matter what filters they added.
const fetchOrders = async () => {
  isLoading.value = true

  const { data, error } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })

  if (!error) orders.value = data || []
  isLoading.value = false
}

onMounted(fetchOrders)

const filteredOrders = computed(() => {
  let list = orders.value

  if (statusFilter.value !== 'all') {
    list = list.filter((order) => order.status === statusFilter.value)
  }

  const search = searchQuery.value.toLowerCase().trim()
  if (search) {
    list = list.filter(
      (order) =>
        order.order_number.toLowerCase().includes(search) ||
        order.shipping_full_name.toLowerCase().includes(search) ||
        order.shipping_email.toLowerCase().includes(search),
    )
  }

  return list
})

const toggleExpand = (id) => {
  expandedId.value = expandedId.value === id ? null : id
}

// Order write access is admin-only per RLS (orders_update_admin_only) —
// this UPDATE would simply be rejected by Postgres for a non-admin session.
const updateStatus = async (order, status) => {
  savingId.value = order.id
  const { error } = await supabase.from('orders').update({ status }).eq('id', order.id)
  if (!error) order.status = status
  savingId.value = null
}

const paymentBadgeClass = (order) => {
  if (order.payment_status === 'paid') return 'bg-green-50 text-green-600'
  if (order.payment_status === 'failed') return 'bg-red-50 text-red-600'
  return 'bg-amber-50 text-amber-600'
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Orders</h1>
      <p class="text-gray-500 mt-1">{{ orders.length }} total orders</p>
    </div>

    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="relative flex-1 max-w-md">
        <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by order number, name, or email..."
          class="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      <select
        v-model="statusFilter"
        class="border border-gray-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        <option value="all">All statuses</option>
        <option v-for="status in statusOptions" :key="status" :value="status">
          {{ status[0].toUpperCase() + status.slice(1) }}
        </option>
      </select>
    </div>

    <div v-if="isLoading" class="text-center py-20">
      <Loader2 class="w-10 h-10 mx-auto text-blue-600 animate-spin" />
    </div>

    <div v-else class="bg-white rounded-2xl shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th class="px-5 py-4">Order</th>
              <th class="px-5 py-4">Customer</th>
              <th class="px-5 py-4">Total</th>
              <th class="px-5 py-4">Payment</th>
              <th class="px-5 py-4">Status</th>
              <th class="px-5 py-4">Date</th>
              <th class="px-5 py-4 text-right"></th>
            </tr>
          </thead>

          <tbody class="divide-y">
            <template v-for="order in filteredOrders" :key="order.id">
              <tr class="hover:bg-gray-50">
                <td class="px-5 py-4 font-medium text-blue-600">{{ order.order_number }}</td>

                <td class="px-5 py-4">
                  <p class="font-medium">{{ order.shipping_full_name }}</p>
                  <p class="text-xs text-gray-400">{{ order.shipping_email }}</p>
                </td>

                <td class="px-5 py-4 font-semibold">${{ Number(order.total).toFixed(2) }}</td>

                <td class="px-5 py-4">
                  <span class="text-xs font-semibold px-2 py-1 rounded-full" :class="paymentBadgeClass(order)">
                    {{ order.payment_status }}
                  </span>
                  <p class="text-xs text-gray-400 mt-1">{{ order.payment_method }}</p>
                </td>

                <td class="px-5 py-4">
                  <select
                    :value="order.status"
                    :disabled="savingId === order.id"
                    @change="updateStatus(order, $event.target.value)"
                    class="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:opacity-50"
                  >
                    <option v-for="status in statusOptions" :key="status" :value="status">
                      {{ status[0].toUpperCase() + status.slice(1) }}
                    </option>
                  </select>
                </td>

                <td class="px-5 py-4 text-gray-500 text-sm">
                  {{ new Date(order.created_at).toLocaleDateString() }}
                </td>

                <td class="px-5 py-4 text-right">
                  <button @click="toggleExpand(order.id)" class="p-2 rounded-lg hover:bg-gray-100 text-gray-500">
                    <component :is="expandedId === order.id ? ChevronUp : ChevronDown" class="w-5 h-5" />
                  </button>
                </td>
              </tr>

              <tr v-if="expandedId === order.id" class="bg-gray-50">
                <td colspan="7" class="px-5 py-5">
                  <div class="grid md:grid-cols-2 gap-6">
                    <div>
                      <p class="text-sm font-semibold text-gray-500 mb-2">Shipping Address</p>
                      <p class="text-sm">{{ order.shipping_address }}</p>
                      <p class="text-sm">{{ order.shipping_city }}, {{ order.shipping_postcode }}</p>
                      <p class="text-sm">{{ order.shipping_country }}</p>
                      <p class="text-sm mt-2 text-gray-500">{{ order.shipping_phone }}</p>
                    </div>

                    <div>
                      <p class="text-sm font-semibold text-gray-500 mb-2">Items</p>
                      <div v-for="item in order.order_items" :key="item.id" class="flex justify-between text-sm py-1">
                        <span>{{ item.title }} × {{ item.quantity }}</span>
                        <span class="font-medium">${{ Number(item.line_total).toFixed(2) }}</span>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </template>

            <tr v-if="filteredOrders.length === 0">
              <td colspan="7" class="px-5 py-16 text-center text-gray-400">
                <Package class="w-10 h-10 mx-auto mb-3 text-gray-300" />
                No orders found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
