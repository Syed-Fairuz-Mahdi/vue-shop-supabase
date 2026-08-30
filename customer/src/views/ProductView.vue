<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { Star, ShoppingCart, ArrowLeft, Heart, Check, Truck, ShieldCheck, User } from 'lucide-vue-next'

import { useProductsStore } from '@/stores/products'
import { useReviewsStore } from '@/stores/reviews'
import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()

const productsStore = useProductsStore()
const reviewsStore = useReviewsStore()
const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const authStore = useAuthStore()

/*
|--------------------------------------------------------------------------
| Product
|--------------------------------------------------------------------------
*/

const product = computed(() => {
  return productsStore.getById(Number(route.params.id))
})

// Make sure we have the product catalog, then load this product's reviews.
onMounted(async () => {
  if (!productsStore.isLoaded) {
    await productsStore.fetchProducts()
  }

  if (product.value) {
    reviewsStore.fetchReviewsForProduct(product.value.id)
  }
})

watch(
  () => route.params.id,
  () => {
    if (product.value) {
      reviewsStore.fetchReviewsForProduct(product.value.id)
    }
  },
)

/*
|--------------------------------------------------------------------------
| Reviews / Rating
|--------------------------------------------------------------------------
*/

const productReviews = computed(() => {
  if (!product.value) return []
  return reviewsStore.getReviewsForProduct(product.value.id)
})

const averageRating = computed(() => product.value?.rating || 0)
const reviewCount = computed(() => product.value?.reviewCount || 0)

const formatDate = (date) => {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/*
|--------------------------------------------------------------------------
| Quantity
|--------------------------------------------------------------------------
*/

const quantity = ref(1)

/*
|--------------------------------------------------------------------------
| Selected Image
|--------------------------------------------------------------------------
*/

const selectedImage = ref(null)

const currentImage = computed(() => {
  if (!product.value) {
    return ''
  }

  return selectedImage.value || product.value.image
})

/*
|--------------------------------------------------------------------------
| Product Images
|--------------------------------------------------------------------------
*/

const productImages = computed(() => {
  if (!product.value) {
    return []
  }

  if (product.value.images && product.value.images.length > 0) {
    return product.value.images
  }

  return [product.value.image]
})

/*
|--------------------------------------------------------------------------
| Discount
|--------------------------------------------------------------------------
*/

const discountPercentage = computed(() => {
  if (
    !product.value ||
    !product.value.originalPrice ||
    product.value.originalPrice <= product.value.price
  ) {
    return 0
  }

  return Math.round(
    ((product.value.originalPrice - product.value.price) / product.value.originalPrice) * 100,
  )
})

/*
|--------------------------------------------------------------------------
| Wishlist
|--------------------------------------------------------------------------
*/

const isWishlisted = computed(() => {
  if (!product.value) {
    return false
  }

  return wishlistStore.isInWishlist(product.value.id)
})

const toggleWishlist = () => {
  if (!product.value) {
    return
  }

  wishlistStore.toggleWishlist(product.value)
}

/*
|--------------------------------------------------------------------------
| Add To Cart Feedback
|--------------------------------------------------------------------------
*/

const addedToCart = ref(false)

const addToCart = () => {
  if (!product.value || product.value.stock <= 0) {
    return
  }

  cartStore.addToCart(product.value, quantity.value)

  addedToCart.value = true

  setTimeout(() => {
    addedToCart.value = false
  }, 1500)
}

/*
|--------------------------------------------------------------------------
| Buy Now
|--------------------------------------------------------------------------
*/

const buyNow = () => {
  if (!product.value || product.value.stock <= 0) {
    return
  }

  cartStore.addToCart(product.value, quantity.value)

  router.push('/cart')
}

/*
|--------------------------------------------------------------------------
| Quantity Functions
|--------------------------------------------------------------------------
*/

const increaseQuantity = () => {
  if (product.value && quantity.value < product.value.stock) {
    quantity.value++
  }
}

const decreaseQuantity = () => {
  if (quantity.value > 1) {
    quantity.value--
  }
}

/*
|--------------------------------------------------------------------------
| Related Products
|--------------------------------------------------------------------------
*/

const relatedProducts = computed(() => {
  if (!product.value) {
    return []
  }

  return productsStore.products
    .filter((item) => item.id !== product.value.id && item.category === product.value.category)
    .slice(0, 4)
})

/*
|--------------------------------------------------------------------------
| Write a Review
|--------------------------------------------------------------------------
*/

const reviewForm = reactive({
  name: authStore.isLoggedIn ? authStore.user.name : '',
  rating: 5,
  comment: '',
})

const hoveredStar = ref(0)
const reviewSubmitted = ref(false)
const reviewError = ref('')

const isSubmittingReview = ref(false)

const submitReview = async () => {
  reviewError.value = ''

  if (!reviewForm.name.trim()) {
    reviewError.value = 'Please enter your name.'
    return
  }

  if (!reviewForm.comment.trim()) {
    reviewError.value = 'Please share a few words about the product.'
    return
  }

  isSubmittingReview.value = true

  try {
    await reviewsStore.addReview({
      productId: product.value.id,
      name: reviewForm.name.trim(),
      rating: reviewForm.rating,
      comment: reviewForm.comment.trim(),
    })

    reviewForm.comment = ''
    reviewForm.rating = 5
    reviewSubmitted.value = true

    setTimeout(() => {
      reviewSubmitted.value = false
    }, 2500)
  } catch (error) {
    reviewError.value = error.message || 'Something went wrong submitting your review.'
  } finally {
    isSubmittingReview.value = false
  }
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-6 py-12">
    <!-- ================================================= -->
    <!-- BACK -->
    <!-- ================================================= -->

    <RouterLink
      to="/shop"
      class="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-10 transition"
    >
      <ArrowLeft class="w-5 h-5" />

      Back to Shop
    </RouterLink>

    <!-- ================================================= -->
    <!-- PRODUCT -->
    <!-- ================================================= -->

    <div v-if="product" class="grid lg:grid-cols-2 gap-12">
      <!-- ================================================= -->
      <!-- IMAGE SECTION -->
      <!-- ================================================= -->

      <div>
        <!-- Main Image -->

        <div class="relative bg-gray-100 rounded-2xl overflow-hidden">
          <!-- Discount -->

          <span
            v-if="discountPercentage > 0"
            class="absolute top-5 left-5 z-10 bg-red-500 text-white px-4 py-2 rounded-full font-semibold"
          >
            -{{ discountPercentage }}%
          </span>

          <!-- Wishlist -->

          <button
            @click="toggleWishlist"
            class="absolute top-5 right-5 z-10 bg-white p-3 rounded-full shadow-md hover:bg-gray-100 transition"
          >
            <Heart
              class="w-6 h-6"
              :class="isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-700'"
            />
          </button>

          <img :src="currentImage" :alt="product.title" class="w-full h-125 object-cover" />
        </div>

        <!-- Thumbnails -->

        <div v-if="productImages.length > 1" class="grid grid-cols-4 gap-4 mt-4">
          <button
            v-for="image in productImages"
            :key="image"
            @click="selectedImage = image"
            class="rounded-xl overflow-hidden border-2 transition"
            :class="currentImage === image ? 'border-blue-600' : 'border-transparent'"
          >
            <img :src="image" :alt="product.title" class="w-full h-24 object-cover" />
          </button>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- PRODUCT INFORMATION -->
      <!-- ================================================= -->

      <div>
        <!-- Badge -->

        <span
          v-if="product.badge"
          class="inline-block bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-full"
        >
          {{ product.badge }}
        </span>

        <!-- Title -->

        <h1 class="text-4xl font-bold mt-5">
          {{ product.title }}
        </h1>

        <!-- Brand -->

        <p class="text-gray-500 mt-3">
          Brand:
          <span class="font-medium text-gray-700">
            {{ product.brand }}
          </span>
        </p>

        <!-- Rating -->

        <div class="flex items-center gap-3 mt-5">
          <div class="flex">
            <Star
              v-for="n in 5"
              :key="n"
              class="w-5 h-5"
              :class="
                n <= Math.round(averageRating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              "
            />
          </div>

          <span v-if="reviewCount > 0" class="font-medium">
            {{ averageRating }}
          </span>

          <span v-if="reviewCount > 0" class="text-gray-500"> ({{ reviewCount }} reviews) </span>

          <span v-else class="text-gray-500">No reviews yet — be the first!</span>
        </div>

        <!-- Price -->

        <div class="flex items-center gap-4 mt-8">
          <span class="text-4xl font-bold text-blue-600"> ${{ product.price }} </span>

          <span v-if="product.originalPrice" class="text-xl text-gray-400 line-through">
            ${{ product.originalPrice }}
          </span>

          <span v-if="discountPercentage > 0" class="text-green-600 font-semibold">
            Save {{ discountPercentage }}%
          </span>
        </div>

        <!-- Description -->

        <p class="text-gray-600 leading-relaxed mt-8">
          {{ product.description }}
        </p>

        <!-- Stock -->

        <div class="mt-6">
          <span v-if="product.stock > 0" class="text-green-600 font-medium">
            ✓ In Stock ({{ product.stock }} available)
          </span>

          <span v-else class="text-red-600 font-medium"> Out of Stock </span>
        </div>

        <!-- ================================================= -->
        <!-- QUANTITY -->
        <!-- ================================================= -->

        <div v-if="product.stock > 0" class="flex items-center gap-5 mt-8">
          <span class="font-medium"> Quantity: </span>

          <div class="flex items-center border rounded-lg overflow-hidden">
            <!-- Minus -->

            <button
              @click="decreaseQuantity"
              :disabled="quantity === 1"
              class="px-5 py-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              −
            </button>

            <!-- Number -->

            <span class="px-6 py-3 border-x font-medium">
              {{ quantity }}
            </span>

            <!-- Plus -->

            <button
              @click="increaseQuantity"
              :disabled="quantity >= product.stock"
              class="px-5 py-3 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
        </div>

        <!-- ================================================= -->
        <!-- ACTION BUTTONS -->
        <!-- ================================================= -->

        <div v-if="product.stock > 0" class="grid sm:grid-cols-2 gap-4 mt-8">
          <!-- Add To Cart -->

          <button
            @click="addToCart"
            class="py-4 rounded-xl font-semibold flex items-center justify-center gap-3 transition"
            :class="
              addedToCart ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
            "
          >
            <Check v-if="addedToCart" class="w-5 h-5" />

            <ShoppingCart v-else class="w-5 h-5" />

            {{ addedToCart ? 'Added to Cart!' : 'Add to Cart' }}
          </button>

          <!-- Buy Now -->

          <button
            @click="buyNow"
            class="py-4 rounded-xl font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition"
          >
            Buy Now
          </button>
        </div>

        <!-- Out of stock -->

        <button
          v-else
          disabled
          class="mt-8 w-full bg-gray-400 text-white py-4 rounded-xl font-semibold cursor-not-allowed"
        >
          Out of Stock
        </button>

        <!-- ================================================= -->
        <!-- BENEFITS -->
        <!-- ================================================= -->

        <div class="grid sm:grid-cols-2 gap-4 mt-8">
          <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <Truck class="w-6 h-6 text-blue-600" />

            <div>
              <p class="font-semibold">Free Shipping</p>

              <p class="text-sm text-gray-500">On orders over $50</p>
            </div>
          </div>

          <div class="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
            <ShieldCheck class="w-6 h-6 text-blue-600" />

            <div>
              <p class="font-semibold">Secure Payment</p>

              <p class="text-sm text-gray-500">100% secure checkout</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ================================================= -->
    <!-- REVIEWS -->
    <!-- ================================================= -->

    <section v-if="product" class="mt-20 grid lg:grid-cols-3 gap-12">
      <!-- Review list -->

      <div class="lg:col-span-2">
        <div class="flex items-center justify-between mb-8">
          <h2 class="text-3xl font-bold">Customer Reviews</h2>

          <div v-if="reviewCount > 0" class="flex items-center gap-2">
            <Star class="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span class="font-semibold">{{ averageRating }}</span>
            <span class="text-gray-500">({{ reviewCount }})</span>
          </div>
        </div>

        <div v-if="productReviews.length > 0" class="space-y-6">
          <div
            v-for="review in productReviews"
            :key="review.id"
            class="bg-white rounded-2xl shadow-sm p-6"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User class="w-5 h-5 text-blue-600" />
                </div>

                <div>
                  <p class="font-semibold">{{ review.name }}</p>
                  <p class="text-xs text-gray-400">{{ formatDate(review.date) }}</p>
                </div>
              </div>

              <div class="flex">
                <Star
                  v-for="n in 5"
                  :key="n"
                  class="w-4 h-4"
                  :class="n <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'"
                />
              </div>
            </div>

            <p class="text-gray-600 mt-4 leading-relaxed">{{ review.comment }}</p>
          </div>
        </div>

        <div v-else class="bg-gray-50 rounded-2xl py-16 text-center text-gray-500">
          No reviews yet. Be the first to share your thoughts!
        </div>
      </div>

      <!-- Write a review -->

      <div>
        <div class="bg-white rounded-2xl shadow-md p-6 sticky top-24">
          <h3 class="text-xl font-bold">Write a Review</h3>

          <div v-if="reviewSubmitted" class="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mt-4">
            Thanks for your review!
          </div>

          <form v-else @submit.prevent="submitReview" class="mt-5 space-y-4">
            <div v-if="reviewError" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
              {{ reviewError }}
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Your Rating</label>

              <div class="flex gap-1" @mouseleave="hoveredStar = 0">
                <button
                  v-for="n in 5"
                  :key="n"
                  type="button"
                  @click="reviewForm.rating = n"
                  @mouseenter="hoveredStar = n"
                >
                  <Star
                    class="w-7 h-7 transition"
                    :class="
                      n <= (hoveredStar || reviewForm.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    "
                  />
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Your Name</label>
              <input
                v-model="reviewForm.name"
                type="text"
                placeholder="e.g. Jamie S."
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Your Review</label>
              <textarea
                v-model="reviewForm.comment"
                rows="4"
                placeholder="What did you think of this product?"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              ></textarea>
            </div>

            <button
              type="submit"
              :disabled="isSubmittingReview"
              class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {{ isSubmittingReview ? 'Submitting...' : 'Submit Review' }}
            </button>
          </form>
        </div>
      </div>
    </section>

    <!-- ================================================= -->
    <!-- RELATED PRODUCTS -->
    <!-- ================================================= -->

    <section v-if="product && relatedProducts.length > 0" class="mt-20">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-3xl font-bold">You May Also Like</h2>

          <p class="text-gray-500 mt-2">
            More products from
            {{ product.category }}
          </p>
        </div>

        <RouterLink to="/shop" class="text-blue-600 hover:underline"> View All </RouterLink>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div
          v-for="relatedProduct in relatedProducts"
          :key="relatedProduct.id"
          class="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition"
        >
          <RouterLink :to="`/product/${relatedProduct.id}`">
            <img
              :src="relatedProduct.image"
              :alt="relatedProduct.title"
              class="w-full h-52 object-cover"
            />
          </RouterLink>

          <div class="p-4">
            <h3 class="font-semibold">
              {{ relatedProduct.title }}
            </h3>

            <div class="flex items-center gap-2 mt-2">
              <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />

              <span v-if="relatedProduct.reviewCount > 0">
                {{ relatedProduct.rating }}
              </span>

              <span v-else class="text-gray-400 text-sm">No ratings</span>
            </div>

            <p class="text-xl font-bold text-blue-600 mt-3">${{ relatedProduct.price }}</p>

            <RouterLink
              :to="`/product/${relatedProduct.id}`"
              class="block text-center mt-4 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
            >
              View Product
            </RouterLink>
          </div>
        </div>
      </div>
    </section>

    <!-- ================================================= -->
    <!-- PRODUCT NOT FOUND -->
    <!-- ================================================= -->

    <div v-else class="text-center py-20">
      <h1 class="text-3xl font-bold">Product Not Found</h1>

      <p class="text-gray-500 mt-3">The product you're looking for doesn't exist.</p>

      <RouterLink to="/shop" class="inline-block mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg">
        Back to Shop
      </RouterLink>
    </div>
  </section>
</template>
