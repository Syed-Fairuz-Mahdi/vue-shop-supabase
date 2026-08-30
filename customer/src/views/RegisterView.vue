<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { User, Mail, Lock, UserPlus } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')

const errorMessage = ref('')
const confirmationMessage = ref('')
const isLoading = ref(false)

const register = async () => {
  errorMessage.value = ''

  if (!name.value || !email.value || !password.value || !confirmPassword.value) {
    errorMessage.value = 'Please complete all fields.'

    return
  }

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
    const { confirmationRequired } = await authStore.register({
      name: name.value,
      email: email.value,
      password: password.value,
    })

    if (confirmationRequired) {
      errorMessage.value = ''
      confirmationMessage.value = 'Account created! Check your email to confirm your address before logging in.'
      isLoading.value = false
      return
    }

    router.push('/')
  } catch (err) {
    errorMessage.value = err.message || 'Could not create your account. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<template>
  <section class="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center px-6 py-12">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-lg p-8">
        <!-- Header -->

        <div class="text-center">
          <div class="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
            <UserPlus class="w-8 h-8 text-blue-600" />
          </div>

          <h1 class="text-3xl font-bold mt-5">Create Account</h1>

          <p class="text-gray-500 mt-2">Join VueShop today.</p>
        </div>

        <!-- Error -->

        <div v-if="errorMessage" class="mt-6 bg-red-50 text-red-600 p-4 rounded-lg text-sm">
          {{ errorMessage }}
        </div>

        <div v-if="confirmationMessage" class="mt-6 bg-green-50 text-green-600 p-4 rounded-lg text-sm">
          {{ confirmationMessage }}
        </div>

        <!-- Form -->

        <form @submit.prevent="register" class="mt-8 space-y-5">
          <!-- Name -->

          <div>
            <label class="block text-sm font-medium mb-2"> Full Name </label>

            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                v-model="name"
                type="text"
                placeholder="John Doe"
                class="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

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
                placeholder="At least 6 characters"
                class="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Confirm Password -->

          <div>
            <label class="block text-sm font-medium mb-2"> Confirm Password </label>

            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

              <input
                v-model="confirmPassword"
                type="password"
                placeholder="Repeat your password"
                class="w-full border border-gray-300 rounded-lg pl-12 pr-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Submit -->

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {{ isLoading ? 'Creating account...' : 'Create Account' }}
          </button>
        </form>

        <!-- Login -->

        <p class="text-center text-gray-500 mt-8">
          Already have an account?

          <RouterLink to="/login" class="text-blue-600 font-semibold hover:underline">
            Login
          </RouterLink>
        </p>
      </div>
    </div>
  </section>
</template>
