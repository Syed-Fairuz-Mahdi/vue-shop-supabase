<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { ShoppingCart, Heart, User, LogOut, ChevronDown, Menu, X } from 'lucide-vue-next'

import { useCartStore } from '@/stores/cart'
import { useWishlistStore } from '@/stores/wishlist'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()

const cartStore = useCartStore()
const wishlistStore = useWishlistStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()

const showMenu = ref(false)
const showMobileNav = ref(false)

const logout = async () => {
  await authStore.logout()
  showMenu.value = false
  showMobileNav.value = false
}

// Close the mobile drawer whenever the route changes.
watch(
  () => route.fullPath,
  () => {
    showMobileNav.value = false
    showMenu.value = false
  },
)
</script>

<template>
  <header class="bg-white shadow-md sticky top-0 z-50">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
      <!-- ================================================= -->
      <!-- HAMBURGER (mobile only) -->
      <!-- ================================================= -->

      <button
        @click="showMobileNav = !showMobileNav"
        class="md:hidden p-2 -ml-2 text-gray-700"
        aria-label="Toggle navigation menu"
      >
        <component :is="showMobileNav ? X : Menu" class="w-6 h-6" />
      </button>

      <!-- ================================================= -->
      <!-- LOGO -->
      <!-- ================================================= -->

      <RouterLink to="/" class="flex items-center gap-2 sm:gap-3 min-w-0">
        <img
          v-if="settingsStore.settings.siteLogo"
          :src="settingsStore.settings.siteLogo"
          alt="Logo"
          class="w-9 h-9 rounded-lg object-cover shrink-0"
        />

        <div
          v-else
          class="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0"
        >
          {{ (settingsStore.settings.siteName || 'V').charAt(0).toUpperCase() }}
        </div>

        <span class="text-xl sm:text-2xl font-bold text-blue-600 truncate">
          {{ settingsStore.settings.siteName }}
        </span>
      </RouterLink>

      <!-- ================================================= -->
      <!-- NAVIGATION (desktop) -->
      <!-- ================================================= -->

      <div class="hidden md:flex items-center gap-8">
        <RouterLink to="/" class="hover:text-blue-600 transition"> Home </RouterLink>

        <RouterLink to="/shop" class="hover:text-blue-600 transition"> Shop </RouterLink>

        <RouterLink to="/cart" class="hover:text-blue-600 transition"> Cart </RouterLink>
      </div>

      <!-- ================================================= -->
      <!-- RIGHT -->
      <!-- ================================================= -->

      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Cart -->

        <RouterLink to="/cart" class="relative">
          <ShoppingCart class="w-6 h-6" />

          <span
            v-if="cartStore.totalItems > 0"
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
          >
            {{ cartStore.totalItems }}
          </span>
        </RouterLink>

        <!-- Wishlist -->

        <RouterLink to="/wishlist" class="relative hidden sm:inline-block">
          <Heart class="w-6 h-6" />

          <span
            v-if="wishlistStore.totalItems > 0"
            class="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
          >
            {{ wishlistStore.totalItems }}
          </span>
        </RouterLink>

        <!-- ================================================= -->
        <!-- LOGGED IN -->
        <!-- ================================================= -->

        <div v-if="authStore.isLoggedIn" class="relative">
          <button
            @click="showMenu = !showMenu"
            class="flex items-center gap-2 hover:text-blue-600 transition"
          >
            <div class="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
              <User class="w-5 h-5 text-blue-600" />
            </div>

            <span class="hidden sm:block font-medium">
              {{ authStore.user.name }}
            </span>

            <ChevronDown class="w-4 h-4 hidden sm:block" />
          </button>

          <!-- Dropdown -->

          <div
            v-if="showMenu"
            class="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-xl border p-2"
          >
            <RouterLink
              to="/profile"
              @click="showMenu = false"
              class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
            >
              <User class="w-5 h-5" />

              Profile
            </RouterLink>

            <RouterLink
              to="/orders"
              @click="showMenu = false"
              class="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100"
            >
              <ShoppingCart class="w-5 h-5" />

              My Orders
            </RouterLink>

            <button
              @click="logout"
              class="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 text-red-600"
            >
              <LogOut class="w-5 h-5" />

              Logout
            </button>
          </div>
        </div>

        <!-- ================================================= -->
        <!-- LOGGED OUT -->
        <!-- ================================================= -->

        <RouterLink
          v-else
          to="/login"
          class="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm sm:text-base"
        >
          Login
        </RouterLink>
      </div>
    </nav>

    <!-- ================================================= -->
    <!-- MOBILE NAV DRAWER -->
    <!-- ================================================= -->

    <Transition
      enter-active-class="transition ease-out duration-150"
      enter-from-class="opacity-0 -translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition ease-in duration-100"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-2"
    >
      <div v-if="showMobileNav" class="md:hidden border-t bg-white px-4 py-4 space-y-1">
        <RouterLink
          to="/"
          class="block px-3 py-3 rounded-lg hover:bg-gray-100 font-medium"
          active-class="text-blue-600 bg-blue-50"
        >
          Home
        </RouterLink>

        <RouterLink
          to="/shop"
          class="block px-3 py-3 rounded-lg hover:bg-gray-100 font-medium"
          active-class="text-blue-600 bg-blue-50"
        >
          Shop
        </RouterLink>

        <RouterLink
          to="/cart"
          class="block px-3 py-3 rounded-lg hover:bg-gray-100 font-medium"
          active-class="text-blue-600 bg-blue-50"
        >
          Cart
        </RouterLink>

        <RouterLink
          to="/wishlist"
          class="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-gray-100 font-medium"
          active-class="text-blue-600 bg-blue-50"
        >
          Wishlist
          <span v-if="wishlistStore.totalItems > 0" class="text-sm text-gray-400">
            {{ wishlistStore.totalItems }}
          </span>
        </RouterLink>

        <div class="border-t my-2"></div>

        <template v-if="authStore.isLoggedIn">
          <RouterLink to="/profile" class="block px-3 py-3 rounded-lg hover:bg-gray-100 font-medium">
            Profile
          </RouterLink>

          <RouterLink to="/orders" class="block px-3 py-3 rounded-lg hover:bg-gray-100 font-medium">
            My Orders
          </RouterLink>

          <button
            @click="logout"
            class="w-full text-left px-3 py-3 rounded-lg hover:bg-red-50 text-red-600 font-medium"
          >
            Logout
          </button>
        </template>

        <RouterLink
          v-else
          to="/login"
          class="block px-3 py-3 rounded-lg bg-blue-600 text-white text-center font-medium"
        >
          Login
        </RouterLink>
      </div>
    </Transition>
  </header>
</template>
