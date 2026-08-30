<script setup>
import { computed } from "vue";

import ProductCard from "@/components/products/ProductCard.vue";
import { useProductsStore } from "@/stores/products";

const productsStore = useProductsStore();

const featuredProducts = computed(() => {
  const featured = productsStore.products.filter((product) => product.featured);

  return featured.length > 0 ? featured : productsStore.products.slice(0, 4);
});
</script>

<template>
  <section v-if="featuredProducts.length > 0" class="max-w-7xl mx-auto py-20 px-6">
    <h2 class="text-4xl font-bold mb-12">
      Featured Products
    </h2>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <ProductCard
        v-for="product in featuredProducts"
        :key="product.id"
        :product="product"
      />
    </div>
  </section>
</template>
