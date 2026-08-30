<script setup>
import { onMounted, reactive, ref, watch, computed } from 'vue'
import { Save, RotateCcw, Upload, Loader2, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-vue-next'

import { useSettingsStore } from '@/stores/settings'
import { uploadImage } from '@/lib/storage'
import {
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  HERO_SIZE_OPTIONS,
  HERO_IMAGE_SIZE_OPTIONS,
  HERO_GRADIENT_ANGLE_OPTIONS,
  cloneDefaultHomeSections,
} from '@/lib/design'

const settingsStore = useSettingsStore()

// --------------------------------------------------
// Form state
// --------------------------------------------------

const form = reactive({
  siteLogo: '',
  fontFamily: 'inter',
  baseFontSize: 'base',
  heroGradientFrom: '#1d4ed8',
  heroGradientTo: '#818cf8',
  heroGradientAngle: 90,
  heroPaddingY: 'lg',
  heroImageSize: 'lg',
  homeSections: cloneDefaultHomeSections(),
})

const flashSaleEndsAtLocal = ref('')

const isoToLocalInput = (iso) => {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const localInputToIso = (local) => {
  if (!local) return ''
  const date = new Date(local)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

const applyStoreValues = (settings) => {
  form.siteLogo = settings.siteLogo || ''
  form.fontFamily = settings.fontFamily || 'inter'
  form.baseFontSize = settings.baseFontSize || 'base'
  form.heroGradientFrom = settings.heroGradientFrom || '#1d4ed8'
  form.heroGradientTo = settings.heroGradientTo || '#818cf8'
  form.heroGradientAngle = Number(settings.heroGradientAngle ?? 90)
  form.heroPaddingY = settings.heroPaddingY || 'lg'
  form.heroImageSize = settings.heroImageSize || 'lg'
  form.homeSections =
    Array.isArray(settings.homeSections) && settings.homeSections.length > 0
      ? settings.homeSections.map((section) => ({ ...section }))
      : cloneDefaultHomeSections()
  flashSaleEndsAtLocal.value = isoToLocalInput(settings.flashSaleEndsAt)
}

onMounted(async () => {
  await settingsStore.fetchSettings({ force: true })
  applyStoreValues(settingsStore.settings)
})

watch(
  () => settingsStore.settings,
  (value) => applyStoreValues(value),
  { deep: true },
)

// --------------------------------------------------
// Logo upload
// --------------------------------------------------

const isUploadingLogo = ref(false)

const onLogoUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  isUploadingLogo.value = true
  try {
    form.siteLogo = await uploadImage(file)
  } finally {
    isUploadingLogo.value = false
  }
}

// --------------------------------------------------
// Homepage section order / visibility
// --------------------------------------------------

const moveSection = (index, direction) => {
  const target = index + direction
  if (target < 0 || target >= form.homeSections.length) return

  const sections = form.homeSections
  ;[sections[index], sections[target]] = [sections[target], sections[index]]
}

const toggleSectionVisibility = (index) => {
  form.homeSections[index].visible = !form.homeSections[index].visible
}

const resetSectionsToDefault = () => {
  form.homeSections = cloneDefaultHomeSections()
}

// --------------------------------------------------
// Flash sale quick-set helpers
// --------------------------------------------------

const setQuickEnd = (hours) => {
  const end = new Date(Date.now() + hours * 60 * 60 * 1000)
  flashSaleEndsAtLocal.value = isoToLocalInput(end.toISOString())
}

const clearFlashSaleEnd = () => {
  flashSaleEndsAtLocal.value = ''
}

// --------------------------------------------------
// Preview
// --------------------------------------------------

const heroPreviewStyle = computed(() => ({
  background: `linear-gradient(${form.heroGradientAngle}deg, ${form.heroGradientFrom}, ${form.heroGradientTo})`,
}))

// --------------------------------------------------
// Save / discard
// --------------------------------------------------

const savedMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)

const save = async () => {
  isSaving.value = true
  errorMessage.value = ''

  try {
    await settingsStore.updateSettings({
      ...form,
      flashSaleEndsAt: localInputToIso(flashSaleEndsAtLocal.value),
    })

    savedMessage.value = 'Design saved!'
    setTimeout(() => (savedMessage.value = ''), 2000)
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong saving your design changes.'
  } finally {
    isSaving.value = false
  }
}

const discardChanges = async () => {
  await settingsStore.fetchSettings({ force: true })
  applyStoreValues(settingsStore.settings)
  savedMessage.value = 'Changes discarded.'
  setTimeout(() => (savedMessage.value = ''), 2000)
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="flex items-center justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold">Design</h1>
        <p class="text-gray-500 mt-1">Customize how the storefront looks — no code required.</p>
      </div>

      <span v-if="savedMessage" class="text-green-600 font-medium">{{ savedMessage }}</span>
    </div>

    <form @submit.prevent="save" class="space-y-8">
      <!-- Logo -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <h2 class="text-xl font-bold">Shop Logo</h2>
        <p class="text-sm text-gray-500">Shown in the navbar, to the left of the site name.</p>

        <div class="flex items-start gap-4">
          <img
            v-if="form.siteLogo"
            :src="form.siteLogo"
            class="w-16 h-16 rounded-lg object-cover bg-gray-100 shrink-0"
          />
          <div v-else class="w-16 h-16 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0">
            {{ (settingsStore.settings.siteName || 'V').charAt(0).toUpperCase() }}
          </div>

          <div class="flex-1 space-y-2">
            <input
              v-model="form.siteLogo"
              type="text"
              placeholder="Logo image URL (leave blank to use the default badge)"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            />

            <label class="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer">
              <Loader2 v-if="isUploadingLogo" class="w-4 h-4 animate-spin" />
              <Upload v-else class="w-4 h-4" />
              {{ isUploadingLogo ? 'Uploading...' : 'Upload from device' }}
              <input type="file" accept="image/*" class="hidden" :disabled="isUploadingLogo" @change="onLogoUpload" />
            </label>
          </div>
        </div>
      </section>

      <!-- Typography -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <h2 class="text-xl font-bold">Typography</h2>
        <p class="text-sm text-gray-500">Applies site-wide, on the storefront and product pages.</p>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Font Style</label>
            <select
              v-model="form.fontFamily"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="font in FONT_OPTIONS" :key="font.id" :value="font.id">{{ font.label }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Font Size</label>
            <select
              v-model="form.baseFontSize"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="size in FONT_SIZE_OPTIONS" :key="size.id" :value="size.id">{{ size.label }}</option>
            </select>
          </div>
        </div>

        <p
          class="text-lg border border-dashed border-gray-300 rounded-lg px-4 py-3"
          :style="{ fontFamily: FONT_OPTIONS.find((f) => f.id === form.fontFamily)?.family }"
        >
          The quick brown fox jumps over the lazy dog.
        </p>
      </section>

      <!-- Hero design -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <h2 class="text-xl font-bold">Hero Section Design</h2>
        <p class="text-sm text-gray-500">
          Hero text and image URL are edited in Site Settings — this controls how it looks.
        </p>

        <div class="rounded-xl h-24 flex items-center justify-center text-white font-semibold" :style="heroPreviewStyle">
          Gradient Preview
        </div>

        <div class="grid sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Gradient Start</label>
            <div class="flex gap-2">
              <input v-model="form.heroGradientFrom" type="color" class="w-12 h-12 rounded-lg border border-gray-300 shrink-0" />
              <input
                v-model="form.heroGradientFrom"
                type="text"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Gradient End</label>
            <div class="flex gap-2">
              <input v-model="form.heroGradientTo" type="color" class="w-12 h-12 rounded-lg border border-gray-300 shrink-0" />
              <input
                v-model="form.heroGradientTo"
                type="text"
                class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Gradient Direction</label>
            <select
              v-model.number="form.heroGradientAngle"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="angle in HERO_GRADIENT_ANGLE_OPTIONS" :key="angle.id" :value="Number(angle.id)">
                {{ angle.label }}
              </option>
            </select>
          </div>
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Hero Section Size</label>
            <select
              v-model="form.heroPaddingY"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="size in HERO_SIZE_OPTIONS" :key="size.id" :value="size.id">{{ size.label }}</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Hero Image Size</label>
            <select
              v-model="form.heroImageSize"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option v-for="size in HERO_IMAGE_SIZE_OPTIONS" :key="size.id" :value="size.id">{{ size.label }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- Homepage layout -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold">Homepage Layout</h2>
            <p class="text-sm text-gray-500 mt-1">Reorder or hide sections on the homepage.</p>
          </div>

          <button type="button" @click="resetSectionsToDefault" class="text-sm text-blue-600 hover:underline shrink-0">
            Reset order
          </button>
        </div>

        <div class="space-y-2">
          <div
            v-for="(section, index) in form.homeSections"
            :key="section.key"
            class="flex items-center gap-3 border border-gray-200 rounded-lg px-4 py-3"
            :class="section.visible === false ? 'opacity-50' : ''"
          >
            <span class="font-medium flex-1">{{ section.label }}</span>

            <button
              type="button"
              @click="toggleSectionVisibility(index)"
              class="p-2 rounded-lg hover:bg-gray-100"
              :title="section.visible === false ? 'Show on homepage' : 'Hide from homepage'"
            >
              <EyeOff v-if="section.visible === false" class="w-4 h-4 text-gray-400" />
              <Eye v-else class="w-4 h-4 text-gray-700" />
            </button>

            <button
              type="button"
              @click="moveSection(index, -1)"
              :disabled="index === 0"
              class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowUp class="w-4 h-4" />
            </button>

            <button
              type="button"
              @click="moveSection(index, 1)"
              :disabled="index === form.homeSections.length - 1"
              class="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-30"
            >
              <ArrowDown class="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      <!-- Flash sale -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <h2 class="text-xl font-bold">Flash Sale Countdown</h2>
        <p class="text-sm text-gray-500">
          Set when the homepage flash sale countdown ends. Leave blank to always count down 2 days from when a visitor loads the page.
        </p>

        <div>
          <label class="block text-sm font-medium mb-2">Sale Ends At</label>
          <input
            v-model="flashSaleEndsAtLocal"
            type="datetime-local"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" @click="setQuickEnd(24)" class="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
            +24 hours
          </button>
          <button type="button" @click="setQuickEnd(48)" class="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
            +48 hours
          </button>
          <button type="button" @click="setQuickEnd(24 * 7)" class="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
            +7 days
          </button>
          <button type="button" @click="clearFlashSaleEnd" class="px-4 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">
            Clear
          </button>
        </div>
      </section>

      <div v-if="errorMessage" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
        {{ errorMessage }}
      </div>

      <div class="flex gap-4">
        <button
          type="submit"
          :disabled="isSaving"
          class="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
        >
          <Save class="w-5 h-5" />
          {{ isSaving ? 'Saving...' : 'Save Design' }}
        </button>

        <button
          type="button"
          @click="discardChanges"
          class="flex items-center gap-2 px-8 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
        >
          <RotateCcw class="w-5 h-5" />
          Discard Changes
        </button>
      </div>
    </form>
  </div>
</template>
