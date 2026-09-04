<script setup>
import { computed, onMounted, ref } from 'vue'
import { PlusCircle, Pencil, Trash2, Search } from 'lucide-vue-next'

import { useProductsStore } from '@/stores/products'

const productsStore = useProductsStore()

onMounted(() => {
  productsStore.fetchProducts({ force: true })
})

const searchQuery = ref('')
const confirmDeleteId = ref(null)

const filteredProducts = computed(() => {
  if (!searchQuery.value.trim()) {
    return productsStore.products
  }

  const search = searchQuery.value.toLowerCase().trim()

  return productsStore.products.filter(
    (product) =>
      product.title.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.brand.toLowerCase().includes(search),
  )
})

const askDelete = (id) => {
  confirmDeleteId.value = id
}

const cancelDelete = () => {
  confirmDeleteId.value = null
}

const confirmDelete = async (id) => {
  await productsStore.deleteProduct(id)
  confirmDeleteId.value = null
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold">Products</h1>
        <p class="text-gray-500 mt-1">{{ productsStore.products.length }} total products</p>
      </div>

      <RouterLink
        to="/products/new"
        class="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        <PlusCircle class="w-5 h-5" />
        Add Product
      </RouterLink>
    </div>

    <div class="relative mb-6 max-w-md">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search products..."
        class="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      />
    </div>

    <div class="bg-white rounded-2xl shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th class="px-5 py-4">Product</th>
              <th class="px-5 py-4">Category</th>
              <th class="px-5 py-4">Price</th>
              <th class="px-5 py-4">Stock</th>
              <th class="px-5 py-4">Badge</th>
              <th class="px-5 py-4">Rating</th>
              <th class="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y">
            <tr v-for="product in filteredProducts" :key="product.id" class="hover:bg-gray-50">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <img
                    :src="product.image"
                    :alt="product.title"
                    class="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0"
                  />
                  <div class="min-w-0">
                    <p class="font-medium truncate">{{ product.title }}</p>
                    <p class="text-xs text-gray-400 truncate">{{ product.brand }}</p>
                  </div>
                </div>
              </td>

              <td class="px-5 py-4 text-gray-600">{{ product.category }}</td>

              <td class="px-5 py-4">
                <span class="font-semibold">৳{{ product.price }}</span>
                <span v-if="product.originalPrice" class="text-gray-400 line-through text-sm ml-2">
                  ৳{{ product.originalPrice }}
                </span>
              </td>

              <td class="px-5 py-4">
                <span :class="product.stock <= 5 ? 'text-red-600 font-semibold' : 'text-gray-600'">
                  {{ product.stock }}
                </span>
              </td>

              <td class="px-5 py-4">
                <span
                  v-if="product.badge"
                  class="bg-red-50 text-red-600 text-xs font-semibold px-2 py-1 rounded-full"
                >
                  {{ product.badge }}
                </span>
                <span v-else class="text-gray-300 text-sm">—</span>
              </td>

              <td class="px-5 py-4 text-gray-600">
                ⭐ {{ product.rating || '—' }}
                <span class="text-xs text-gray-400">({{ product.reviewCount }})</span>
              </td>

              <td class="px-5 py-4">
                <div class="flex items-center justify-end gap-2">
                  <RouterLink
                    :to="`/products/${product.id}/edit`"
                    class="p-2 rounded-lg hover:bg-blue-50 text-blue-600"
                  >
                    <Pencil class="w-4 h-4" />
                  </RouterLink>

                  <button
                    @click="askDelete(product.id)"
                    class="p-2 rounded-lg hover:bg-red-50 text-red-600"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredProducts.length === 0">
              <td colspan="7" class="px-5 py-12 text-center text-gray-400">No products found.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete confirmation modal -->

    <div
      v-if="confirmDeleteId !== null"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
    >
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold">Delete this product?</h3>
        <p class="text-gray-500 mt-2">This action cannot be undone.</p>

        <div class="flex gap-3 mt-6">
          <button @click="cancelDelete" class="flex-1 border border-gray-300 py-3 rounded-lg">
            Cancel
          </button>
          <button
            @click="confirmDelete(confirmDeleteId)"
            class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
