<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSettingsStore } from '@/stores/settings'
import { HERO_SIZE_OPTIONS, HERO_IMAGE_SIZE_OPTIONS } from '@/lib/design'

const router = useRouter()
const settingsStore = useSettingsStore()

const heroSectionStyle = computed(() => {
  const s = settingsStore.settings
  const angle = Number(s.heroGradientAngle ?? 90)
  const from = s.heroGradientFrom || '#1d4ed8'
  const to = s.heroGradientTo || '#818cf8'
  const sizeOption =
    HERO_SIZE_OPTIONS.find((option) => option.id === s.heroPaddingY) || HERO_SIZE_OPTIONS[2]

  return {
    background: `linear-gradient(${angle}deg, ${from}, ${to})`,
    paddingTop: `${sizeOption.py}px`,
    paddingBottom: `${sizeOption.py}px`,
  }
})

const heroImageStyle = computed(() => {
  const sizeOption =
    HERO_IMAGE_SIZE_OPTIONS.find((option) => option.id === settingsStore.settings.heroImageSize) ||
    HERO_IMAGE_SIZE_OPTIONS[2]

  return { maxWidth: `${sizeOption.width}px` }
})
</script>

<template>
  <section class="text-white" :style="heroSectionStyle">
    <div class="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
      <!-- Left -->
      <div>
        <span v-if="settingsStore.settings.heroBadge" class="bg-white/20 px-4 py-2 rounded-full text-sm">
          {{ settingsStore.settings.heroBadge }}
        </span>

        <h1 class="text-5xl lg:text-7xl font-extrabold mt-6 leading-tight">
          {{ settingsStore.settings.heroTitleLine1 }}
          <br />
          {{ settingsStore.settings.heroTitleLine2 }}
          <br />
          {{ settingsStore.settings.heroTitleLine3 }}
        </h1>

        <p class="mt-6 text-lg text-blue-100">
          {{ settingsStore.settings.heroSubtitle }}
        </p>

        <div class="flex gap-4 mt-10">
          <button
            @click="router.push('/shop')"
            class="bg-white text-blue-700 px-8 py-3 rounded-lg font-semibold hover:scale-105 transition"
          >
            {{ settingsStore.settings.heroPrimaryButtonText }}
          </button>

          <button
            @click="router.push('/shop')"
            class="border border-white px-8 py-3 rounded-lg hover:bg-white hover:text-blue-700 transition"
          >
            {{ settingsStore.settings.heroSecondaryButtonText }}
          </button>
        </div>
      </div>

      <!-- Right -->

      <div class="flex justify-center">
        <img
          :src="settingsStore.settings.heroImage"
          alt="Hero"
          :style="heroImageStyle"
          class="rounded-3xl shadow-2xl w-full"
        />
      </div>
    </div>
  </section>
</template>
