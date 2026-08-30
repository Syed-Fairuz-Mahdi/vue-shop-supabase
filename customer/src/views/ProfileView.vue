<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, Mail, LogOut, ShoppingBag } from 'lucide-vue-next'

import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const isEditing = ref(false)
const isSaving = ref(false)
const saveError = ref('')

const name = ref(authStore.user?.name || '')
const email = ref(authStore.user?.email || '')

const saveProfile = async () => {
  isSaving.value = true
  saveError.value = ''

  try {
    await authStore.updateProfile({ name: name.value, email: email.value })
    isEditing.value = false
  } catch (err) {
    saveError.value = err.message || 'Could not save your changes.'
  } finally {
    isSaving.value = false
  }
}

const logout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<template>
  <section class="max-w-5xl mx-auto px-6 py-12">
    <!-- Header -->

    <div class="mb-10">
      <h1 class="text-4xl font-bold">My Profile</h1>

      <p class="text-gray-500 mt-2">Manage your VueShop account.</p>
    </div>

    <div class="grid lg:grid-cols-3 gap-8">
      <!-- Profile Card -->

      <div class="bg-white rounded-2xl shadow p-6 text-center">
        <div class="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
          <User class="w-12 h-12 text-blue-600" />
        </div>

        <h2 class="text-2xl font-bold mt-5">
          {{ authStore.user?.name }}
        </h2>

        <p class="text-gray-500 mt-1">
          {{ authStore.user?.email }}
        </p>

        <RouterLink
          to="/orders"
          class="mt-6 inline-flex items-center gap-2 text-blue-600 hover:underline"
        >
          <ShoppingBag class="w-5 h-5" />

          My Orders
        </RouterLink>

        <button
          @click="logout"
          class="mt-6 w-full flex items-center justify-center gap-2 border border-red-200 text-red-600 py-3 rounded-lg hover:bg-red-50 transition"
        >
          <LogOut class="w-5 h-5" />

          Logout
        </button>
      </div>

      <!-- Account Information -->

      <div class="lg:col-span-2 bg-white rounded-2xl shadow p-8">
        <div class="flex items-center justify-between mb-8">
          <div>
            <h2 class="text-2xl font-bold">Account Information</h2>

            <p class="text-gray-500 mt-1">Update your personal information.</p>
          </div>

          <button
            v-if="!isEditing"
            @click="isEditing = true"
            class="text-blue-600 font-semibold hover:underline"
          >
            Edit
          </button>
        </div>

        <!-- Name -->

        <div class="mb-6">
          <label class="block text-sm font-medium mb-2"> Full Name </label>

          <div class="relative">
            <User class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              v-model="name"
              :disabled="!isEditing"
              type="text"
              class="w-full border rounded-lg pl-12 pr-4 py-3 outline-none disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Email -->

        <div class="mb-8">
          <label class="block text-sm font-medium mb-2"> Email </label>

          <div class="relative">
            <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />

            <input
              v-model="email"
              :disabled="!isEditing"
              type="email"
              class="w-full border rounded-lg pl-12 pr-4 py-3 outline-none disabled:bg-gray-100 focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <!-- Buttons -->

        <p v-if="saveError" class="text-red-600 text-sm mb-4">{{ saveError }}</p>

        <div v-if="isEditing" class="flex gap-4">
          <button
            @click="saveProfile"
            :disabled="isSaving"
            class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400"
          >
            {{ isSaving ? 'Saving...' : 'Save Changes' }}
          </button>

          <button
            @click="isEditing = false"
            class="border px-6 py-3 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
