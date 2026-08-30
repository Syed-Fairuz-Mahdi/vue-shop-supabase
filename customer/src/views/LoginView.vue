<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter, useRoute } from 'vue-router'
import { Lock, Mail, LogIn } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')

const errorMessage = ref('')
const infoMessage = ref('')
const isLoading = ref(false)

const login = async () => {
  errorMessage.value = ''
  infoMessage.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter your email and password.'

    return
  }

  isLoading.value = true

  const success = await authStore.login(email.value, password.value)

  isLoading.value = false

  if (!success) {
    errorMessage.value = 'Invalid email or password.'

    return
  }

  const redirect = route.query.redirect || '/'

  router.push(redirect)
}

const forgotPassword = async () => {
  errorMessage.value = ''
  infoMessage.value = ''

  if (!email.value) {
    errorMessage.value = 'Enter your email above first, then click "Forgot password?" again.'
    return
  }

  try {
    await authStore.sendPasswordReset(email.value)
    infoMessage.value = 'If an account exists for that email, a reset link has been sent.'
  } catch {
    infoMessage.value = 'If an account exists for that email, a reset link has been sent.'
  }
}
</script>

<template>
  <section class="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-md">
      <!-- Card -->

      <div class="bg-white rounded-2xl shadow-lg p-8">
        <!-- Header -->

        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <LogIn class="w-8 h-8 text-blue-600" />
          </div>

          <h1 class="text-3xl font-bold mt-5">Welcome Back</h1>

          <p class="text-gray-500 mt-2">Login to your VueShop account.</p>
        </div>

        <!-- Error -->

        <div v-if="errorMessage" class="mt-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          {{ errorMessage }}
        </div>

        <div v-if="infoMessage" class="mt-6 bg-blue-50 text-blue-600 p-4 rounded-lg text-sm">
          {{ infoMessage }}
        </div>

        <!-- Form -->

        <form @submit.prevent="login" class="mt-8 space-y-5">
          <!-- Email -->

          <div>
            <label class="block text-sm font-medium mb-2"> Email </label>

            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                v-model="email"
                type="email"
                placeholder="you@example.com"
                class="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Password -->

          <div>
            <label class="block text-sm font-medium mb-2"> Password </label>

            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="button"
              @click="forgotPassword"
              class="mt-2 text-sm text-blue-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>

          <!-- Submit -->

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {{ isLoading ? 'Logging in...' : 'Login' }}
          </button>
        </form>

        <!-- Register -->

        <p class="text-center text-gray-500 mt-8">
          Don't have an account?

          <RouterLink to="/register" class="text-blue-600 font-semibold hover:underline">
            Create one
          </RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>
