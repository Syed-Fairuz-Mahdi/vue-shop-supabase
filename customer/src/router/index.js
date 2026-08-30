import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '@/views/HomeView.vue'
import ShopView from '@/views/ShopView.vue'
import ProductView from '@/views/ProductView.vue'
import CartView from '@/views/CartView.vue'
import CheckoutView from '@/views/CheckoutView.vue'
import OrderSuccessView from '@/views/OrderSuccessView.vue'
import LoginView from '@/views/LoginView.vue'
import RegisterView from '@/views/RegisterView.vue'
import WishlistView from '@/views/WishlistView.vue'

import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    /*
    |--------------------------------------------------------------------------
    | Public Routes
    |--------------------------------------------------------------------------
    */

    {
      path: '/',
      name: 'home',
      component: HomeView,
    },

    {
      path: '/shop',
      name: 'shop',
      component: ShopView,
    },

    {
      path: '/product/:id',
      name: 'product',
      component: ProductView,
    },

    {
      path: '/cart',
      name: 'cart',
      component: CartView,
    },

    {
      path: '/login',
      name: 'login',
      component: LoginView,
    },

    {
      path: '/register',
      name: 'register',
      component: RegisterView,
    },

    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
    },

    {
      path: '/wishlist',
      name: 'wishlist',
      component: WishlistView,
    },

    /*
    |--------------------------------------------------------------------------
    | Protected Routes
    |--------------------------------------------------------------------------
    */

    {
      path: '/checkout',
      name: 'checkout',
      component: CheckoutView,

      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/order-success',
      name: 'order-success',
      component: OrderSuccessView,

      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/profile',
      name: 'profile',

      component: () => import('@/views/ProfileView.vue'),

      meta: {
        requiresAuth: true,
      },
    },

    {
      path: '/orders',
      name: 'orders',

      component: () => import('@/views/OrdersView.vue'),

      meta: {
        requiresAuth: true,
      },
    },
  ],
})

/*
|--------------------------------------------------------------------------
| Navigation Guard
|--------------------------------------------------------------------------
*/

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // The auth store restores any existing Supabase session on app
  // startup (see main.js) — wait for that before deciding access,
  // otherwise a hard refresh on a protected route would bounce a
  // logged-in user to /login before their session finished loading.
  if (!authStore.isReady) {
    await authStore.init()
  }

  /*
  |--------------------------------------------------------------------------
  | Protected page
  |--------------------------------------------------------------------------
  */

  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    return {
      name: 'login',

      query: {
        redirect: to.fullPath,
      },
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Already logged in
  |--------------------------------------------------------------------------
  */

  if ((to.name === 'login' || to.name === 'register') && authStore.isLoggedIn) {
    return {
      name: 'home',
    }
  }

  return true
})

export default router
