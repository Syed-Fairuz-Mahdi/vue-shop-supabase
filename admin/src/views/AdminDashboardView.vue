<script setup>
import { computed, onMounted, ref } from 'vue'
import { Package, Tags, Star, DollarSign, PlusCircle, ShoppingBag, Clock } from 'lucide-vue-next'

import { useProductsStore } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'
import { useReviewsStore } from '@/stores/reviews'
import { supabase } from '@/lib/supabase'

const productsStore = useProductsStore()
const categoriesStore = useCategoriesStore()
const reviewsStore = useReviewsStore()

const orders = ref([])

onMounted(async () => {
  productsStore.fetchProducts({ force: true })
  categoriesStore.fetchCategories({ force: true })
  reviewsStore.fetchAllReviews()

  // RLS (orders_select_own_or_admin) lets an admin see every order here.
  const { data } = await supabase
    .from('orders')
    .select('order_number, total, status, payment_status, created_at')
    .order('created_at', { ascending: false })

  orders.value = data || []
})

const totalProducts = computed(() => productsStore.products.length)
const totalCategories = computed(() => categoriesStore.categories.length)
const totalReviews = computed(() => reviewsStore.allReviews.length)

const inventoryValue = computed(() => {
  return productsStore.products
    .reduce((sum, product) => sum + product.price * product.stock, 0)
    .toFixed(2)
})

const averageRating = computed(() => {
  if (reviewsStore.allReviews.length === 0) return '0.0'

  const total = reviewsStore.allReviews.reduce((sum, review) => sum + review.rating, 0)

  return (total / reviewsStore.allReviews.length).toFixed(1)
})

const lowStockProducts = computed(() => {
  return productsStore.products.filter((product) => product.stock <= 5).slice(0, 5)
})

const pendingOrders = computed(() => orders.value.filter((order) => order.status === 'pending'))

const paidRevenue = computed(() => {
  return orders.value
    .filter((order) => order.payment_status === 'paid')
    .reduce((sum, order) => sum + Number(order.total), 0)
    .toFixed(2)
})

const stats = computed(() => [
  { label: 'Products', value: totalProducts.value, icon: Package, color: 'bg-blue-100 text-blue-600' },
  { label: 'Categories', value: totalCategories.value, icon: Tags, color: 'bg-purple-100 text-purple-600' },
  { label: 'Orders', value: orders.value.length, icon: ShoppingBag, color: 'bg-indigo-100 text-indigo-600' },
  { label: 'Paid Revenue', value: `$${paidRevenue.value}`, icon: DollarSign, color: 'bg-green-100 text-green-600' },
])
</script>

<template>
  <div>
    <div class="flex items-center justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold">Dashboard</h1>
        <p class="text-gray-500 mt-1">Overview of your store.</p>
      </div>

      <RouterLink
        to="/products/new"
        class="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        <PlusCircle class="w-5 h-5" />
        Add Product
      </RouterLink>
    </div>

    <!-- Stats -->

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-2xl shadow-md p-6">
        <div class="w-12 h-12 rounded-xl flex items-center justify-center" :class="stat.color">
          <component :is="stat.icon" class="w-6 h-6" />
        </div>

        <p class="text-3xl font-bold mt-4">{{ stat.value }}</p>
        <p class="text-gray-500 mt-1">{{ stat.label }}</p>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mt-8">
      <!-- Pending orders -->

      <div class="bg-white rounded-2xl shadow-md p-6">
        <h2 class="text-xl font-bold">Pending Orders</h2>

        <div v-if="pendingOrders.length > 0" class="flex items-center gap-3 mt-4">
          <Clock class="w-8 h-8 text-amber-500" />
          <span class="text-4xl font-bold">{{ pendingOrders.length }}</span>
          <span class="text-gray-500">awaiting processing</span>
        </div>

        <p v-else class="text-gray-500 mt-4">No pending orders right now.</p>

        <RouterLink to="/orders" class="inline-block mt-5 text-blue-600 hover:underline text-sm">
          Manage orders →
        </RouterLink>
      </div>

      <!-- Average rating -->

      <div class="bg-white rounded-2xl shadow-md p-6">
        <h2 class="text-xl font-bold">Average Site Rating</h2>

        <div class="flex items-center gap-3 mt-4">
          <Star class="w-8 h-8 fill-yellow-400 text-yellow-400" />
          <span class="text-4xl font-bold">{{ averageRating }}</span>
          <span class="text-gray-500">/ 5 across {{ totalReviews }} reviews</span>
        </div>

        <RouterLink to="/reviews" class="inline-block mt-5 text-blue-600 hover:underline text-sm">
          Manage reviews →
        </RouterLink>
      </div>

      <!-- Low stock -->

      <div class="bg-white rounded-2xl shadow-md p-6">
        <h2 class="text-xl font-bold">Low Stock</h2>

        <div v-if="lowStockProducts.length > 0" class="mt-4 space-y-3">
          <div
            v-for="product in lowStockProducts"
            :key="product.id"
            class="flex items-center justify-between"
          >
            <span class="truncate">{{ product.title }}</span>
            <span class="text-red-600 font-semibold shrink-0 ml-3">{{ product.stock }} left</span>
          </div>
        </div>

        <p v-else class="text-gray-500 mt-4">All products are well stocked.</p>

        <RouterLink to="/products" class="inline-block mt-5 text-blue-600 hover:underline text-sm">
          Manage products →
        </RouterLink>
      </div>

      <!-- Inventory value -->

      <div class="bg-white rounded-2xl shadow-md p-6">
        <h2 class="text-xl font-bold">Inventory Value</h2>

        <div class="flex items-center gap-3 mt-4">
          <DollarSign class="w-8 h-8 text-green-600" />
          <span class="text-4xl font-bold">${{ inventoryValue }}</span>
        </div>

        <p class="text-gray-500 mt-3 text-sm">Total value of current stock at listed prices.</p>
      </div>
    </div>
  </div>
</template>
