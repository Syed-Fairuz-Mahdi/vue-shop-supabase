<script setup>
import { onMounted } from 'vue'
import { useWishlistStore } from '@/stores/wishlist'

import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-vue-next'

import { useCartStore } from '@/stores/cart'
import { useProductsStore } from '@/stores/products'

const wishlistStore = useWishlistStore()
const cartStore = useCartStore()
const productsStore = useProductsStore()

const ratingFor = (id) => productsStore.getById(id)?.rating || 0
const reviewCountFor = (id) => productsStore.getById(id)?.reviewCount || 0

onMounted(() => {
  productsStore.fetchProducts()
})

const moveToCart = (item) => {
  // Wishlist items don't carry `stock` (see stores/wishlist.js mapRow) —
  // cartStore.addToCart needs it to compute quantity, so look up the
  // full product from the products store first, same as ProductCard.vue
  // and ProductView.vue already do.
  const product = productsStore.getById(item.id)

  if (!product) return

  cartStore.addToCart(product, 1)

  wishlistStore.removeFromWishlist(item.id)
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-6 py-12">
    <!-- Header -->

    <div class="mb-10">
      <h1 class="text-4xl font-bold">My Wishlist</h1>

      <p class="text-gray-500 mt-2">
        {{ wishlistStore.totalItems }}
        item(s) saved
      </p>
    </div>

    <!-- Empty Wishlist -->

    <div v-if="wishlistStore.items.length === 0" class="text-center py-20">
      <Heart class="w-20 h-20 mx-auto text-gray-300" />

      <h2 class="text-2xl font-bold mt-6">Your wishlist is empty</h2>

      <p class="text-gray-500 mt-2">Save products you love and find them here later.</p>

      <RouterLink
        to="/shop"
        class="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        <ArrowLeft class="w-5 h-5" />

        Continue Shopping
      </RouterLink>
    </div>

    <!-- Wishlist -->

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <div
        v-for="item in wishlistStore.items"
        :key="item.id"
        class="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
      >
        <!-- Image -->

        <div class="relative">
          <RouterLink :to="`/product/${item.id}`">
            <img :src="item.image" :alt="item.title" class="w-full h-56 object-cover" />
          </RouterLink>

          <!-- Remove -->

          <button
            @click="wishlistStore.removeFromWishlist(item.id)"
            class="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100"
          >
            <Trash2 class="w-5 h-5 text-red-500" />
          </button>
        </div>

        <!-- Information -->

        <div class="p-5">
          <RouterLink :to="`/product/${item.id}`">
            <h2 class="font-semibold text-lg hover:text-blue-600 transition">
              {{ item.title }}
            </h2>
          </RouterLink>

          <!-- Rating -->

          <p class="text-gray-500 mt-2">
            <span v-if="reviewCountFor(item.id) > 0">
              ⭐ {{ ratingFor(item.id) }} ({{ reviewCountFor(item.id) }})
            </span>
            <span v-else>No ratings yet</span>
          </p>

          <!-- Price -->

          <div class="flex items-center gap-3 mt-4">
            <span class="text-xl font-bold text-blue-600"> ৳{{ item.price }} </span>

            <span class="text-gray-400 line-through"> ৳{{ item.originalPrice }} </span>
          </div>

          <!-- Move to cart -->

          <button
            @click="moveToCart(item)"
            class="mt-5 w-full bg-blue-600 text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-700 transition"
          >
            <ShoppingCart class="w-5 h-5" />

            Add to Cart
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
