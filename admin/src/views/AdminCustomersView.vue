<script setup>
import { computed, onMounted, ref } from 'vue'
import { Search, Loader2, Users } from 'lucide-vue-next'

import { supabase } from '@/lib/supabase'

const customers = ref([])
const isLoading = ref(true)
const searchQuery = ref('')

// RLS (profiles_select_own_or_admin) lets an admin session read every
// profile row; anyone else only ever gets their own row back.
onMounted(async () => {
  const [{ data: profiles }, { data: orders }] = await Promise.all([
    supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }),
    supabase.from('orders').select('user_id, total, payment_status'),
  ])

  const orderStatsByUser = new Map()
  for (const order of orders || []) {
    const stats = orderStatsByUser.get(order.user_id) || { count: 0, spent: 0 }
    stats.count += 1
    if (order.payment_status === 'paid') stats.spent += Number(order.total)
    orderStatsByUser.set(order.user_id, stats)
  }

  customers.value = (profiles || []).map((profile) => ({
    ...profile,
    orderCount: orderStatsByUser.get(profile.id)?.count || 0,
    totalSpent: orderStatsByUser.get(profile.id)?.spent || 0,
  }))

  isLoading.value = false
})

const filteredCustomers = computed(() => {
  const search = searchQuery.value.toLowerCase().trim()
  if (!search) return customers.value

  return customers.value.filter(
    (customer) =>
      (customer.full_name || '').toLowerCase().includes(search) || customer.email.toLowerCase().includes(search),
  )
})
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Customers</h1>
      <p class="text-gray-500 mt-1">{{ customers.length }} registered customers</p>
    </div>

    <div class="relative mb-6 max-w-md">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search by name or email..."
        class="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>

    <div v-if="isLoading" class="text-center py-20">
      <Loader2 class="w-10 h-10 mx-auto text-blue-600 animate-spin" />
    </div>

    <div v-else class="bg-white rounded-2xl shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th class="px-5 py-4">Name</th>
              <th class="px-5 py-4">Email</th>
              <th class="px-5 py-4">Orders</th>
              <th class="px-5 py-4">Total Spent</th>
              <th class="px-5 py-4">Joined</th>
            </tr>
          </thead>

          <tbody class="divide-y">
            <tr v-for="customer in filteredCustomers" :key="customer.id" class="hover:bg-gray-50">
              <td class="px-5 py-4 font-medium">{{ customer.full_name || '—' }}</td>
              <td class="px-5 py-4 text-gray-600">{{ customer.email }}</td>
              <td class="px-5 py-4">{{ customer.orderCount }}</td>
              <td class="px-5 py-4 font-semibold">৳{{ customer.totalSpent.toFixed(2) }}</td>
              <td class="px-5 py-4 text-gray-500 text-sm">
                {{ new Date(customer.created_at).toLocaleDateString() }}
              </td>
            </tr>

            <tr v-if="filteredCustomers.length === 0">
              <td colspan="5" class="px-5 py-16 text-center text-gray-400">
                <Users class="w-10 h-10 mx-auto mb-3 text-gray-300" />
                No customers found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
