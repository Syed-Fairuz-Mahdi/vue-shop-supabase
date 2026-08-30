<script setup>
import { onMounted, reactive, watch, ref } from 'vue'
import { Save, RotateCcw, KeyRound } from 'lucide-vue-next'

import { useSettingsStore } from '@/stores/settings'
import { supabase } from '@/lib/supabase'
import { useAdminAuthStore } from '@/stores/adminAuth'

const settingsStore = useSettingsStore()
const adminAuthStore = useAdminAuthStore()

const form = reactive({ ...settingsStore.settings })

onMounted(async () => {
  await settingsStore.fetchSettings({ force: true })
  Object.assign(form, settingsStore.settings)
})

watch(
  () => settingsStore.settings,
  (value) => {
    Object.assign(form, value)
  },
  { deep: true },
)

const savedMessage = ref('')
const errorMessage = ref('')
const isSaving = ref(false)

const save = async () => {
  isSaving.value = true
  errorMessage.value = ''

  try {
    await settingsStore.updateSettings({ ...form })

    savedMessage.value = 'Settings saved!'
    setTimeout(() => (savedMessage.value = ''), 2000)
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong saving settings.'
  } finally {
    isSaving.value = false
  }
}

const discardChanges = async () => {
  await settingsStore.fetchSettings({ force: true })
  Object.assign(form, settingsStore.settings)
  savedMessage.value = 'Changes discarded.'
  setTimeout(() => (savedMessage.value = ''), 2000)
}

// --------------------------------------------------
// Change the currently signed-in admin's own password.
// There's no separate "admin username/password" anymore — admin
// accounts are real Supabase Auth users with profiles.role = 'admin',
// so this simply updates that user's own password.
// --------------------------------------------------

const newPassword = ref('')
const passwordMessage = ref('')
const passwordError = ref('')
const isChangingPassword = ref(false)

const changePassword = async () => {
  passwordMessage.value = ''
  passwordError.value = ''

  if (newPassword.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters.'
    return
  }

  isChangingPassword.value = true

  const { error } = await supabase.auth.updateUser({ password: newPassword.value })

  isChangingPassword.value = false

  if (error) {
    passwordError.value = error.message
    return
  }

  newPassword.value = ''
  passwordMessage.value = 'Password updated.'
  setTimeout(() => (passwordMessage.value = ''), 2000)
}
</script>

<template>
  <div class="max-w-3xl">
    <div class="flex items-center justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold">Site Settings</h1>
        <p class="text-gray-500 mt-1">Everything here controls the live storefront.</p>
      </div>

      <span v-if="savedMessage" class="text-green-600 font-medium">{{ savedMessage }}</span>
    </div>

    <form @submit.prevent="save" class="space-y-8">
      <!-- Branding -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <h2 class="text-xl font-bold">Branding</h2>

        <div>
          <label class="block text-sm font-medium mb-2">Site Name</label>
          <input v-model="form.siteName" type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Tagline</label>
          <input v-model="form.siteTagline" type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </section>

      <!-- Hero -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <h2 class="text-xl font-bold">Homepage Hero</h2>

        <div>
          <label class="block text-sm font-medium mb-2">Badge Text</label>
          <input v-model="form.heroBadge" type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div class="grid sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Title Line 1</label>
            <input v-model="form.heroTitleLine1" type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Title Line 2</label>
            <input v-model="form.heroTitleLine2" type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Title Line 3</label>
            <input v-model="form.heroTitleLine3" type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Subtitle</label>
          <textarea v-model="form.heroSubtitle" rows="2"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Hero Image URL</label>
          <input v-model="form.heroImage" type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-2">Primary Button Text</label>
            <input v-model="form.heroPrimaryButtonText" type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label class="block text-sm font-medium mb-2">Secondary Button Text</label>
            <input v-model="form.heroSecondaryButtonText" type="text"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </section>

      <!-- Footer -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <h2 class="text-xl font-bold">Footer</h2>

        <div>
          <label class="block text-sm font-medium mb-2">About Text</label>
          <textarea v-model="form.footerAbout" rows="2"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"></textarea>
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Copyright Line</label>
          <input v-model="form.footerCopyright" type="text"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </section>

      <!-- Admin account -->
      <section class="bg-white rounded-2xl shadow-md p-8 space-y-5">
        <h2 class="text-xl font-bold">Your Admin Account</h2>
        <p class="text-sm text-gray-500">Signed in as {{ adminAuthStore.user?.email }}.</p>

        <div v-if="passwordError" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
          {{ passwordError }}
        </div>
        <div v-if="passwordMessage" class="bg-green-50 text-green-600 text-sm rounded-lg px-4 py-3">
          {{ passwordMessage }}
        </div>

        <div class="flex flex-col sm:flex-row gap-4 sm:items-end">
          <div class="flex-1">
            <label class="block text-sm font-medium mb-2">New Password</label>
            <input v-model="newPassword" type="password" placeholder="At least 6 characters"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <button type="button" @click="changePassword" :disabled="isChangingPassword"
            class="flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition disabled:opacity-60">
            <KeyRound class="w-4 h-4" />
            {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
          </button>
        </div>

        <p class="text-xs text-gray-400">
          To add another admin, promote their account's role in the database — see the project README.
        </p>
      </section>

      <div v-if="errorMessage" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
        {{ errorMessage }}
      </div>

      <div class="flex gap-4">
        <button type="submit" :disabled="isSaving" class="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60">
          <Save class="w-5 h-5" />
          {{ isSaving ? 'Saving...' : 'Save Settings' }}
        </button>

        <button type="button" @click="discardChanges" class="flex items-center gap-2 px-8 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition">
          <RotateCcw class="w-5 h-5" />
          Discard Changes
        </button>
      </div>
    </form>
  </div>
</template>
