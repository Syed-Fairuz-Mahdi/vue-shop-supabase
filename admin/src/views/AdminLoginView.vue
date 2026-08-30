<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Lock, Mail, ShieldCheck } from 'lucide-vue-next'

import { useAdminAuthStore } from '@/stores/adminAuth'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const route = useRoute()
const adminAuthStore = useAdminAuthStore()
const settingsStore = useSettingsStore()

const email = ref('')
const password = ref('')
const errorMessage = ref('')
const isLoading = ref(false)

const submit = async () => {
  errorMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password.'
    return
  }

  isLoading.value = true

  const result = await adminAuthStore.login(email.value, password.value)

  isLoading.value = false

  if (!result.success) {
    errorMessage.value = result.error || 'Invalid admin email or password.'
    return
  }

  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'

  router.push(redirect)
}
</script>

<template>
  <section class="min-h-screen bg-gray-50 flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <ShieldCheck class="w-8 h-8 text-blue-600" />
          </div>

          <h1 class="text-2xl font-bold mt-5">Admin Login</h1>

          <p class="text-gray-500 mt-2">Manage {{ settingsStore.settings.siteName }} from here.</p>
        </div>

        <form @submit.prevent="submit" class="mt-8 space-y-5">
          <div v-if="errorMessage" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
            {{ errorMessage }}
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Email</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                v-model="email"
                type="email"
                placeholder="admin@yourstore.com"
                class="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="w-full border border-gray-300 rounded-xl pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-60"
          >
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>

        <p class="text-center text-xs text-gray-400 mt-6">
          Access requires an account with the admin role — see the README for how to promote one.
        </p>
      </div>
    </div>
  </section>
</template>
