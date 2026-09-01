<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  LayoutDashboard,
  Package,
  Tags,
  Star,
  Settings,
  Palette,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShoppingBag,
  Users,
  ShieldCheck,
} from 'lucide-vue-next'

import { useAdminAuthStore } from '@/stores/adminAuth'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const adminAuthStore = useAdminAuthStore()
const settingsStore = useSettingsStore()

const showMobileMenu = ref(false)

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/categories', label: 'Categories & Filters', icon: Tags },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/settings', label: 'Site Settings', icon: Settings },
  { to: '/design', label: 'Design', icon: Palette },
  { to: '/team', label: 'Team & Admin Access', icon: ShieldCheck },
]

// Points back at the customer storefront. Set VITE_CUSTOMER_SITE_URL
// in .env for local dev (defaults to a same-origin guess otherwise).
const customerSiteUrl = import.meta.env.VITE_CUSTOMER_SITE_URL || 'http://localhost:5173'

const logout = async () => {
  await adminAuthStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- ================================================= -->
    <!-- SIDEBAR (desktop) -->
    <!-- ================================================= -->

    <aside class="hidden lg:flex lg:flex-col w-64 bg-gray-900 text-white shrink-0">
      <div class="px-6 py-6 border-b border-gray-800">
        <p class="text-xs uppercase tracking-wider text-gray-400">Admin Panel</p>
        <p class="text-lg font-bold mt-1 truncate">{{ settingsStore.settings.siteName }}</p>
      </div>

      <nav class="flex-1 px-3 py-6 space-y-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
          active-class="!bg-blue-600 !text-white"
          :exact="item.to === '/'"
        >
          <component :is="item.icon" class="w-5 h-5" />
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="px-3 py-4 border-t border-gray-800 space-y-1">
        <a
          :href="customerSiteUrl"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
        >
          <ExternalLink class="w-5 h-5" />
          View Store
        </a>

        <button
          @click="logout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950 transition"
        >
          <LogOut class="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>

    <!-- ================================================= -->
    <!-- MOBILE HEADER + MENU -->
    <!-- ================================================= -->

    <div class="lg:hidden fixed top-0 left-0 right-0 z-40 bg-gray-900 text-white flex items-center justify-between px-4 py-3">
      <p class="font-bold">{{ settingsStore.settings.siteName }} Admin</p>
      <button @click="showMobileMenu = !showMobileMenu">
        <component :is="showMobileMenu ? X : Menu" class="w-6 h-6" />
      </button>
    </div>

    <div
      v-if="showMobileMenu"
      class="lg:hidden fixed top-16 left-0 right-0 z-40 bg-gray-900 text-white px-3 py-3 space-y-1 max-h-[80vh] overflow-y-auto"
    >
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        @click="showMobileMenu = false"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
        active-class="!bg-blue-600 !text-white"
      >
        <component :is="item.icon" class="w-5 h-5" />
        {{ item.label }}
      </RouterLink>

      <a
        :href="customerSiteUrl"
        target="_blank"
        rel="noopener"
        class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition"
      >
        <ExternalLink class="w-5 h-5" />
        View Store
      </a>

      <button
        @click="logout"
        class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-950 transition"
      >
        <LogOut class="w-5 h-5" />
        Logout
      </button>
    </div>

    <!-- ================================================= -->
    <!-- MAIN CONTENT -->
    <!-- ================================================= -->

    <main class="flex-1 min-w-0 px-6 py-8 lg:py-10 mt-16 lg:mt-0">
      <RouterView />
    </main>
  </div>
</template>
