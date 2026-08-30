<script setup>
import { computed } from 'vue'

import CategoryCard from '../ui/CategoryCard.vue'
import { useCategoriesStore } from '@/stores/categories'
import { useProductsStore } from '@/stores/products'

const categoriesStore = useCategoriesStore()
const productsStore = useProductsStore()

const categoriesWithCounts = computed(() => {
  return categoriesStore.categories.map((category) => ({
    ...category,
    items: productsStore.products.filter((product) => product.category === category.title).length,
  }))
})
</script>

<template>
  <section v-if="categoriesWithCounts.length > 0" class="max-w-7xl mx-auto px-6 py-16">
    <h2 class="text-4xl font-bold mb-10">Shop by Category</h2>

    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <RouterLink
        v-for="category in categoriesWithCounts"
        :key="category.id"
        :to="`/shop?category=${encodeURIComponent(category.title)}`"
      >
        <CategoryCard :title="category.title" :icon="category.icon" :items="category.items" />
      </RouterLink>
    </div>
  </section>
</template>
