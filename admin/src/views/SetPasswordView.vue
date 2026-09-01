<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { KeyRound, Loader2, AlertTriangle } from 'lucide-vue-next'

import { supabase } from '@/lib/supabase'

const router = useRouter()

const password = ref('')
const confirmPassword = ref('')
const isSubmitting = ref(false)
const errorMessage = ref('')

// By the time this page mounts, supabase-js has already picked up the
// access token from the invite link's URL fragment (detectSessionInUrl:
// true in lib/supabase.js) and established a session for this account.
// This form's only job is to give that already-authenticated user a
// password, via the standard (non-admin) updateUser call — it never
// touches profiles.role. That was already set to 'admin' server-side
// by the invite-admin Edge Function, before the email was even sent.
const submit = async () => {
  errorMessage.value = ''

  if (password.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters.'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isSubmitting.value = true

  const { error } = await supabase.auth.updateUser({ password: password.value })

  isSubmitting.value = false

  if (error) {
    errorMessage.value = error.message || 'Could not set your password. The invite link may have expired.'
    return
  }

  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="bg-white rounded-2xl shadow p-8 w-full max-w-md">
      <div class="flex items-center gap-2 mb-2">
        <KeyRound class="w-6 h-6 text-blue-600" />
        <h1 class="text-2xl font-bold">Set your password</h1>
      </div>

      <p class="text-gray-500 text-sm mb-6">
        You've been granted admin access to VueShop. Choose a password to finish setting up your account.
      </p>

      <form class="space-y-4" @submit.prevent="submit">
        <div>
          <label class="block text-sm font-medium mb-1">New password</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-1">Confirm password</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            minlength="8"
            class="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <p v-if="errorMessage" class="flex items-start gap-2 text-sm text-red-600">
          <AlertTriangle class="w-4 h-4 mt-0.5 flex-shrink-0" />
          {{ errorMessage }}
        </p>

        <button
          type="submit"
          :disabled="isSubmitting"
          class="w-full inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          <Loader2 v-if="isSubmitting" class="w-4 h-4 animate-spin" />
          Set password &amp; continue
        </button>
      </form>
    </div>
  </div>
</template>
