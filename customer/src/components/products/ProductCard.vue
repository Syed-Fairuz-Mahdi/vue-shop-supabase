<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Heart, Star, Check } from 'lucide-vue-next'

import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'

const props = defineProps({
  product: {
    type: Object,
    required: true,
  },
})

const router = useRouter()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()

const addedToCart = ref(false)

const goToProduct = () => {
  router.push(`/product/${props.product.id}`)
}

const addToCart = () => {
  cartStore.addToCart(props.product)

  addedToCart.value = true

  setTimeout(() => {
    addedToCart.value = false
  }, 1500)
}

const toggleWishlist = () => {
  wishlistStore.toggleWishlist(props.product)
}

const isWishlisted = () => {
  return wishlistStore.isInWishlist(props.product.id)
}
</script>

<template>
  <div
    @click="goToProduct"
    class="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-2xl transition duration-300 cursor-pointer"
  >
    <!-- Product Image -->
    <div class="relative">
      <!-- Badge -->
      <span
        v-if="product.badge"
        class="absolute top-4 left-4 bg-red-500 text-white text-xs font-semibold px-3 py-1 rounded-full z-10"
      >
        {{ product.badge }}
      </span>

      <!-- Wishlist -->
      <button
        @click.stop="toggleWishlist"
        class="absolute top-4 right-4 bg-white p-2 rounded-full shadow hover:bg-gray-100 z-10 transition"
      >
        <Heart
          class="w-5 h-5"
          :class="isWishlisted() ? 'fill-red-500 text-red-500' : 'text-gray-700'"
        />
      </button>

      <!-- Image -->
      <img
        :src="product.image"
        :alt="product.title"
        class="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
      />
    </div>

    <!-- Product Information -->
    <div class="p-5">
      <!-- Title -->
      <h3 class="font-semibold text-lg">
        {{ product.title }}
      </h3>

      <!-- Rating -->
      <div class="flex items-center gap-2 mt-3">
        <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />

        <span v-if="product.reviewCount > 0">
          {{ product.rating }}
        </span>

        <span v-else class="text-gray-400">No ratings</span>

        <span v-if="product.reviewCount > 0" class="text-gray-500">
          ({{ product.reviewCount }} reviews)
        </span>
      </div>

      <!-- Price -->
      <div class="flex items-center gap-3 mt-4">
        <span class="text-2xl font-bold text-blue-600"> ${{ product.price }} </span>

        <span v-if="product.originalPrice" class="line-through text-gray-400">
          ${{ product.originalPrice }}
        </span>
      </div>

      <!-- Add to Cart -->
      <button
        @click.stop="addToCart"
        class="mt-6 w-full py-3 rounded-lg transition flex items-center justify-center gap-2"
        :class="
          addedToCart ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
        "
      >
        <Check v-if="addedToCart" class="w-5 h-5" />

        <span>
          {{ addedToCart ? 'Added to Cart!' : 'Add to Cart' }}
        </span>
      </button>
    </div>
  </div>
</template>
