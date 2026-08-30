<script setup>
import { useSettingsStore } from '@/stores/settings'
import { useCategoriesStore } from '@/stores/categories'

const settingsStore = useSettingsStore()
const categoriesStore = useCategoriesStore()
</script>

<template>
  <footer class="bg-gray-900 text-white mt-20">
    <div class="max-w-7xl mx-auto px-6 py-16 grid md:grid-cols-4 gap-10">
      <div>
        <h2 class="text-3xl font-bold mb-4">
          {{ settingsStore.settings.siteName }}
        </h2>

        <p class="text-gray-400">
          {{ settingsStore.settings.footerAbout }}
        </p>
      </div>

      <div>
        <h3 class="font-semibold mb-4">Shop</h3>

        <ul class="space-y-2 text-gray-400">
          <li v-for="category in categoriesStore.categories" :key="category.id">
            <RouterLink :to="`/shop?category=${encodeURIComponent(category.title)}`" class="hover:text-white transition">
              {{ category.title }}
            </RouterLink>
          </li>
        </ul>
      </div>

      <div>
        <h3 class="font-semibold mb-4">Company</h3>

        <ul class="space-y-2 text-gray-400">
          <li v-for="link in settingsStore.settings.footerCompanyLinks" :key="link">{{ link }}</li>
        </ul>
      </div>

      <div>
        <h3 class="font-semibold mb-4">Support</h3>

        <ul class="space-y-2 text-gray-400">
          <li v-for="link in settingsStore.settings.footerSupportLinks" :key="link">{{ link }}</li>
        </ul>
      </div>
    </div>

    <div class="border-t border-gray-800 py-6 flex flex-col sm:flex-row items-center justify-center gap-2 text-center text-gray-500">
      <span>{{ settingsStore.settings.footerCopyright }}</span>
    </div>
  </footer>
</template>
