<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Lock, KeyRound } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref('')
const successMessage = ref('')
const isLoading = ref(false)

// Supabase redirects here (with a recovery session already active in
// the URL fragment, handled automatically by detectSessionInUrl) after
// the user clicks the "reset your password" link from their email.
const submit = async () => {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true

  try {
    await authStore.updatePassword(password.value)
    successMessage.value = 'Password updated. Redirecting...'
    setTimeout(() => router.push('/'), 1500)
  } catch (err) {
    errorMessage.value = err.message || 'Could not update your password. Please request a new reset link.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <KeyRound class="w-8 h-8 text-blue-600" />
          </div>

          <h1 class="text-3xl font-bold mt-5">Set a New Password</h1>

          <p class="text-gray-500 mt-2">Choose a new password for your account.</p>
        </div>

        <div v-if="errorMessage" class="mt-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          {{ errorMessage }}
        </div>

        <div v-if="successMessage" class="mt-6 bg-green-50 text-green-600 p-4 rounded-lg text-sm">
          {{ successMessage }}
        </div>

        <form @submit.prevent="submit" class="mt-8 space-y-5">
          <div>
            <label class="block text-sm font-medium mb-2">New Password</label>

            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Confirm Password</label>

            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                v-model="confirmPassword"
                type="password"
                placeholder="••••••••"
                class="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {{ isLoading ? 'Updating...' : 'Update Password' }}
          </button>
        </form>
      </div>
    </div>
  </section>
</template>
