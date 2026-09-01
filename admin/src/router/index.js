import { createRouter, createWebHistory } from 'vue-router'

import { useAdminAuthStore } from '@/stores/adminAuth'

import AdminLayout from '@/views/AdminLayout.vue'
import AdminLoginView from '@/views/AdminLoginView.vue'
import AdminDashboardView from '@/views/AdminDashboardView.vue'
import AdminProductsView from '@/views/AdminProductsView.vue'
import AdminProductFormView from '@/views/AdminProductFormView.vue'
import AdminCategoriesView from '@/views/AdminCategoriesView.vue'
import AdminOrdersView from '@/views/AdminOrdersView.vue'
import AdminCustomersView from '@/views/AdminCustomersView.vue'
import AdminReviewsView from '@/views/AdminReviewsView.vue'
import AdminSettingsView from '@/views/AdminSettingsView.vue'
import AdminDesignView from '@/views/AdminDesignView.vue'
import AdminTeamView from '@/views/AdminTeamView.vue'
import SetPasswordView from '@/views/SetPasswordView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/login',
      name: 'login',
      component: AdminLoginView,
    },

    // Landed on from an invite email. Not gated by requiresAdmin —
    // this page's only job is letting an already-authenticated (via
    // the invite link's token) account set a password. Their
    // profiles.role is already 'admin' by the time the email was
    // sent (see the invite-admin Edge Function), so once they've set
    // a password they land in the normal admin area like anyone else.
    {
      path: '/set-password',
      name: 'set-password',
      component: SetPasswordView,
    },

    {
      path: '/',
      component: AdminLayout,
      meta: { requiresAdmin: true },

      children: [
        { path: '', name: 'dashboard', component: AdminDashboardView },
        { path: 'products', name: 'products', component: AdminProductsView },
        { path: 'products/new', name: 'product-new', component: AdminProductFormView },
        { path: 'products/:id/edit', name: 'product-edit', component: AdminProductFormView },
        { path: 'categories', name: 'categories', component: AdminCategoriesView },
        { path: 'orders', name: 'orders', component: AdminOrdersView },
        { path: 'customers', name: 'customers', component: AdminCustomersView },
        { path: 'reviews', name: 'reviews', component: AdminReviewsView },
        { path: 'settings', name: 'settings', component: AdminSettingsView },
        { path: 'design', name: 'design', component: AdminDesignView },
        { path: 'team', name: 'team', component: AdminTeamView },
      ],
    },
  ],
})

// --------------------------------------------------
// The ONLY gate that matters is `isAdmin`, which is derived from
// reading profiles.role back from the database under RLS (see
// stores/adminAuth.js) — never a client-side email/username check.
// Even if someone bypasses this guard entirely, every write in the
// admin views still goes through Supabase, where RLS independently
// enforces the same rule server-side.
// --------------------------------------------------

router.beforeEach(async (to) => {
  const adminAuthStore = useAdminAuthStore()

  if (!adminAuthStore.isReady) {
    await adminAuthStore.init()
  }

  if (to.meta.requiresAdmin && !adminAuthStore.isAdmin) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && adminAuthStore.isAdmin) {
    return { name: 'dashboard' }
  }

  return true
})

export default router
