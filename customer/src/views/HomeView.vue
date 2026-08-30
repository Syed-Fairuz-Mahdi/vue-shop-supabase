<script setup>
import { computed } from 'vue'

import Hero from '@/components/home/hero.vue'
import Categories from '@/components/home/categories.vue'
import FlashSale from '@/components/home/FlashSale.vue'
import FeaturedProducts from '@/components/home/FeaturedProducts.vue'
import WhyChooseUs from '@/components/home/WhyChooseUs.vue'

import { useSettingsStore } from '@/stores/settings'
import { cloneDefaultHomeSections } from '@/lib/design'

const settingsStore = useSettingsStore()

const sectionComponents = {
  hero: Hero,
  categories: Categories,
  flashSale: FlashSale,
  featuredProducts: FeaturedProducts,
  whyChooseUs: WhyChooseUs,
}

// Admin > Design controls the order and visibility of these sections.
// Fall back to the default order until settings finish loading (or if
// something ends up missing a key we don't recognize).
const orderedSections = computed(() => {
  const configured = settingsStore.settings.homeSections
  const sections = Array.isArray(configured) && configured.length > 0 ? configured : cloneDefaultHomeSections()

  return sections.filter((section) => section.visible !== false && sectionComponents[section.key])
})
</script>

<template>
  <component :is="sectionComponents[section.key]" v-for="section in orderedSections" :key="section.key" />
</template>
