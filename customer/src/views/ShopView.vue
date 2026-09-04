<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { SlidersHorizontal, X, Search } from 'lucide-vue-next'

import ProductCard from '@/components/products/ProductCard.vue'
import { useProductsStore } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'

const productsStore = useProductsStore()
const categoriesStore = useCategoriesStore()

onMounted(() => {
  productsStore.fetchProducts()
  categoriesStore.fetchCategories()
})
const products = computed(() => productsStore.products)

// --------------------------------------------------
// Router
// --------------------------------------------------

const route = useRoute()
const router = useRouter()

// --------------------------------------------------
// Search
// --------------------------------------------------

const searchQuery = ref(typeof route.query.search === 'string' ? route.query.search : '')

// --------------------------------------------------
// Category
// --------------------------------------------------

const selectedCategory = ref(
  typeof route.query.category === 'string' ? route.query.category : 'All',
)

// --------------------------------------------------
// Price
// --------------------------------------------------

const minPrice = ref(typeof route.query.min === 'string' ? route.query.min : '')

const maxPrice = ref(typeof route.query.max === 'string' ? route.query.max : '')

// --------------------------------------------------
// Rating
// --------------------------------------------------

const minimumRating = ref(route.query.rating ? Number(route.query.rating) : 0)

// --------------------------------------------------
// Sorting
// --------------------------------------------------

const sortBy = ref(typeof route.query.sort === 'string' ? route.query.sort : 'featured')

// --------------------------------------------------
// Mobile filters
// --------------------------------------------------

const showFilters = ref(false)

// --------------------------------------------------
// Categories
// --------------------------------------------------

const categories = computed(() => {
  return ['All', ...categoriesStore.categories.map((category) => category.title)]
})

// --------------------------------------------------
// Filtered products
// --------------------------------------------------

const filteredProducts = computed(() => {
  let result = [...products.value]

  // -----------------------------------------------
  // Search
  // -----------------------------------------------

  if (searchQuery.value.trim()) {
    const search = searchQuery.value.toLowerCase().trim()

    result = result.filter((product) => {
      return (
        product.title.toLowerCase().includes(search) ||
        product.brand.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search)
      )
    })
  }

  // -----------------------------------------------
  // Category
  // -----------------------------------------------

  if (selectedCategory.value !== 'All') {
    result = result.filter((product) => product.category === selectedCategory.value)
  }

  // -----------------------------------------------
  // Minimum price
  // -----------------------------------------------

  if (minPrice.value !== '') {
    result = result.filter((product) => product.price >= Number(minPrice.value))
  }

  // -----------------------------------------------
  // Maximum price
  // -----------------------------------------------

  if (maxPrice.value !== '') {
    result = result.filter((product) => product.price <= Number(maxPrice.value))
  }

  // -----------------------------------------------
  // Rating
  // -----------------------------------------------

  if (minimumRating.value > 0) {
    result = result.filter((product) => product.rating >= minimumRating.value)
  }

  // -----------------------------------------------
  // Sorting
  // -----------------------------------------------

  switch (sortBy.value) {
    case 'price-low':
      result.sort((a, b) => a.price - b.price)
      break

    case 'price-high':
      result.sort((a, b) => b.price - a.price)
      break

    case 'rating':
      result.sort((a, b) => b.rating - a.rating)
      break

    case 'name':
      result.sort((a, b) => a.title.localeCompare(b.title))
      break

    default:
      break
  }

  return result
})

// --------------------------------------------------
// Active filter count
// --------------------------------------------------

const activeFilterCount = computed(() => {
  let count = 0

  if (searchQuery.value.trim()) {
    count++
  }

  if (selectedCategory.value !== 'All') {
    count++
  }

  if (minPrice.value !== '') {
    count++
  }

  if (maxPrice.value !== '') {
    count++
  }

  if (minimumRating.value > 0) {
    count++
  }

  if (sortBy.value !== 'featured') {
    count++
  }

  return count
})

// --------------------------------------------------
// Update URL
// --------------------------------------------------

const updateUrl = () => {
  const query = {}

  // Search

  if (searchQuery.value.trim()) {
    query.search = searchQuery.value.trim()
  }

  // Category

  if (selectedCategory.value !== 'All') {
    query.category = selectedCategory.value
  }

  // Minimum price

  if (minPrice.value !== '') {
    query.min = minPrice.value
  }

  // Maximum price

  if (maxPrice.value !== '') {
    query.max = maxPrice.value
  }

  // Rating

  if (minimumRating.value > 0) {
    query.rating = minimumRating.value
  }

  // Sorting

  if (sortBy.value !== 'featured') {
    query.sort = sortBy.value
  }

  router.replace({
    path: '/shop',
    query,
  })
}

// --------------------------------------------------
// Watch filters
// --------------------------------------------------

watch([searchQuery, selectedCategory, minPrice, maxPrice, minimumRating, sortBy], () => {
  updateUrl()
})

// --------------------------------------------------
// Watch browser Back / Forward
// --------------------------------------------------

watch(
  () => route.query,
  (newQuery) => {
    searchQuery.value = typeof newQuery.search === 'string' ? newQuery.search : ''

    selectedCategory.value = typeof newQuery.category === 'string' ? newQuery.category : 'All'

    minPrice.value = typeof newQuery.min === 'string' ? newQuery.min : ''

    maxPrice.value = typeof newQuery.max === 'string' ? newQuery.max : ''

    minimumRating.value = newQuery.rating ? Number(newQuery.rating) : 0

    sortBy.value = typeof newQuery.sort === 'string' ? newQuery.sort : 'featured'
  },
)

// --------------------------------------------------
// Clear filters
// --------------------------------------------------

const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = 'All'
  minPrice.value = ''
  maxPrice.value = ''
  minimumRating.value = 0
  sortBy.value = 'featured'

  router.replace('/shop')
}

// --------------------------------------------------
// Close mobile filters
// --------------------------------------------------

const closeFilters = () => {
  showFilters.value = false
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-6 py-12">
    <!-- ========================================== -->
    <!-- HEADER -->
    <!-- ========================================== -->

    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
      <div>
        <h1 class="text-4xl font-bold">Shop</h1>

        <p class="text-gray-500 mt-2">Discover products you'll love.</p>
      </div>

      <!-- Mobile filters -->

      <button
        @click="showFilters = !showFilters"
        class="lg:hidden flex items-center justify-center gap-2 border border-gray-300 px-5 py-3 rounded-lg"
      >
        <SlidersHorizontal class="w-5 h-5" />

        Filters

        <span
          v-if="activeFilterCount > 0"
          class="bg-blue-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center"
        >
          {{ activeFilterCount }}
        </span>
      </button>
    </div>

    <!-- ========================================== -->
    <!-- SEARCH -->
    <!-- ========================================== -->

    <div class="relative mb-8">
      <Search class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search products, brands, categories..."
        class="w-full border border-gray-300 rounded-xl pl-12 pr-12 py-4 outline-none focus:ring-2 focus:ring-blue-500"
      />

      <button
        v-if="searchQuery"
        @click="searchQuery = ''"
        class="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
      >
        <X class="w-5 h-5" />
      </button>
    </div>

    <!-- ========================================== -->
    <!-- MAIN AREA -->
    <!-- ========================================== -->

    <div class="grid lg:grid-cols-4 gap-8">
      <!-- ======================================== -->
      <!-- SIDEBAR -->
      <!-- ======================================== -->

      <aside class="lg:block" :class="showFilters ? 'block' : 'hidden'">
        <div class="bg-gray-50 rounded-2xl p-6 sticky top-24">
          <!-- Filter header -->

          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold">Filters</h2>

            <button
              v-if="activeFilterCount > 0"
              @click="clearFilters"
              class="text-sm text-blue-600 hover:underline"
            >
              Clear all
            </button>
          </div>

          <!-- Mobile close -->

          <button @click="closeFilters" class="lg:hidden absolute right-8 mt-1 text-gray-500">
            <X class="w-5 h-5" />
          </button>

          <!-- ==================================== -->
          <!-- CATEGORY -->
          <!-- ==================================== -->

          <div class="mt-8">
            <h3 class="font-semibold mb-4">Category</h3>

            <div class="space-y-3">
              <label
                v-for="category in categories"
                :key="category"
                class="flex items-center gap-3 cursor-pointer"
              >
                <input
                  v-model="selectedCategory"
                  type="radio"
                  :value="category"
                  class="w-4 h-4 accent-blue-600"
                />

                <span>
                  {{ category }}
                </span>
              </label>
            </div>
          </div>

          <!-- ==================================== -->
          <!-- PRICE -->
          <!-- ==================================== -->

          <div class="mt-8">
            <h3 class="font-semibold mb-4">Price Range</h3>

            <div class="grid grid-cols-2 gap-3">
              <input
                v-model="minPrice"
                type="number"
                min="0"
                placeholder="Min"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />

              <input
                v-model="maxPrice"
                type="number"
                min="0"
                placeholder="Max"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- ==================================== -->
          <!-- RATING -->
          <!-- ==================================== -->

          <div class="mt-8">
            <h3 class="font-semibold mb-4">Minimum Rating</h3>

            <div class="space-y-3">
              <label
                v-for="rating in [4, 3, 2, 1]"
                :key="rating"
                class="flex items-center gap-3 cursor-pointer"
              >
                <input
                  v-model="minimumRating"
                  type="radio"
                  :value="rating"
                  class="w-4 h-4 accent-blue-600"
                />

                <span> ⭐ {{ rating }} & up </span>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  v-model="minimumRating"
                  type="radio"
                  :value="0"
                  class="w-4 h-4 accent-blue-600"
                />

                <span> All ratings </span>
              </label>
            </div>
          </div>

          <!-- Clear mobile -->

          <button
            v-if="activeFilterCount > 0"
            @click="clearFilters"
            class="lg:hidden mt-8 w-full border border-gray-300 py-3 rounded-lg"
          >
            Clear Filters
          </button>
        </div>
      </aside>

      <!-- ======================================== -->
      <!-- PRODUCTS -->
      <!-- ======================================== -->

      <div class="lg:col-span-3">
        <!-- Results header -->

        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <p class="text-gray-500">
            Showing

            <span class="font-semibold text-gray-900">
              {{ filteredProducts.length }}
            </span>

            of

            <span class="font-semibold text-gray-900">
              {{ products.length }}
            </span>

            products
          </p>

          <!-- Sort -->

          <select
            v-model="sortBy"
            class="border border-gray-300 rounded-lg px-4 py-3 bg-white outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="featured">Featured</option>

            <option value="price-low">Price: Low to High</option>

            <option value="price-high">Price: High to Low</option>

            <option value="rating">Highest Rated</option>

            <option value="name">Name: A to Z</option>
          </select>
        </div>

        <!-- Active filters -->

        <div v-if="activeFilterCount > 0" class="flex flex-wrap gap-2 mb-6">
          <span v-if="searchQuery" class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            Search: {{ searchQuery }}
          </span>

          <span
            v-if="selectedCategory !== 'All'"
            class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
          >
            {{ selectedCategory }}
          </span>

          <span v-if="minPrice" class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            Min: ৳{{ minPrice }}
          </span>

          <span v-if="maxPrice" class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm">
            Max: ৳{{ maxPrice }}
          </span>

          <span
            v-if="minimumRating > 0"
            class="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm"
          >
            ⭐ {{ minimumRating }}+
          </span>
        </div>

        <!-- Loading -->

        <div v-if="productsStore.isLoading && products.length === 0" class="text-center py-20">
          <div class="animate-spin w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto"></div>
          <p class="text-gray-500 mt-4">Loading products...</p>
        </div>

        <!-- Product grid -->

        <div v-else-if="filteredProducts.length > 0" class="grid sm:grid-cols-2 xl:grid-cols-3 gap-6">
          <ProductCard v-for="product in filteredProducts" :key="product.id" :product="product" />
        </div>

        <!-- No products -->

        <div v-else class="text-center py-20 bg-gray-50 rounded-2xl">
          <div class="text-6xl">🔍</div>

          <h2 class="text-2xl font-bold mt-5">No products found</h2>

          <p class="text-gray-500 mt-2">Try changing your search or filters.</p>

          <button
            @click="clearFilters"
            class="mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
