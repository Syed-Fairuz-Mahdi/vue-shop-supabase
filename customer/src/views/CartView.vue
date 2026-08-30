<script setup>
import { computed } from 'vue'

import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowLeft,
  ShieldCheck,
  Truck,
  CreditCard,
} from 'lucide-vue-next'

import { useCartStore } from '@/stores/cart'

const cartStore = useCartStore()

/*
|--------------------------------------------------------------------------
| Shipping
|--------------------------------------------------------------------------
*/

const shipping = computed(() => {
  if (cartStore.totalPrice === 0) {
    return 0
  }

  // Free shipping for orders of $50 or more
  if (cartStore.totalPrice >= 50) {
    return 0
  }

  return 5
})

/*
|--------------------------------------------------------------------------
| Grand Total
|--------------------------------------------------------------------------
*/

const grandTotal = computed(() => {
  return cartStore.totalPrice + shipping.value
})

/*
|--------------------------------------------------------------------------
| Savings
|--------------------------------------------------------------------------
*/

const totalSavings = computed(() => {
  return cartStore.items.reduce((total, item) => {
    if (!item.originalPrice) {
      return total
    }

    const saving = (item.originalPrice - item.price) * item.quantity

    return total + Math.max(saving, 0)
  }, 0)
})

/*
|--------------------------------------------------------------------------
| Clear Cart
|--------------------------------------------------------------------------
*/

const clearCart = () => {
  const confirmed = window.confirm('Are you sure you want to remove all items from your cart?')

  if (!confirmed) {
    return
  }

  // Works even if your store doesn't have clearCart()
  cartStore.items.splice(0)
}
</script>

<template>
  <section class="max-w-7xl mx-auto px-6 py-12">
    <!-- ================================================= -->
    <!-- HEADER -->
    <!-- ================================================= -->

    <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
      <div>
        <h1 class="text-4xl font-bold">Shopping Cart</h1>

        <p class="text-gray-500 mt-2">
          {{ cartStore.totalItems }}
          item(s) in your cart
        </p>
      </div>

      <!-- Clear Cart -->

      <button
        v-if="cartStore.items.length > 0"
        @click="clearCart"
        class="inline-flex items-center gap-2 text-red-500 hover:text-red-700 transition"
      >
        <Trash2 class="w-5 h-5" />

        Clear Cart
      </button>
    </div>

    <!-- ================================================= -->
    <!-- EMPTY CART -->
    <!-- ================================================= -->

    <div v-if="cartStore.items.length === 0" class="text-center py-20">
      <ShoppingCart class="w-20 h-20 mx-auto text-gray-300" />

      <h2 class="text-2xl font-bold mt-6">Your cart is empty</h2>

      <p class="text-gray-500 mt-2">Add some products to get started.</p>

      <RouterLink
        to="/shop"
        class="inline-flex items-center gap-2 mt-6 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        <ArrowLeft class="w-5 h-5" />

        Continue Shopping
      </RouterLink>
    </div>

    <!-- ================================================= -->
    <!-- CART -->
    <!-- ================================================= -->

    <div v-else class="grid lg:grid-cols-3 gap-10">
      <!-- ================================================= -->
      <!-- PRODUCTS -->
      <!-- ================================================= -->

      <div class="lg:col-span-2 space-y-5">
        <div v-for="item in cartStore.items" :key="item.id" class="bg-white rounded-2xl shadow p-5">
          <div class="flex flex-col sm:flex-row gap-6">
            <!-- ========================================= -->
            <!-- IMAGE -->
            <!-- ========================================= -->

            <RouterLink :to="`/product/${item.id}`" class="shrink-0">
              <img
                :src="item.image"
                :alt="item.title"
                class="w-full sm:w-32 h-32 object-cover rounded-xl hover:opacity-90 transition"
              />
            </RouterLink>

            <!-- ========================================= -->
            <!-- INFORMATION -->
            <!-- ========================================= -->

            <div class="flex-1">
              <div class="flex justify-between gap-4">
                <RouterLink
                  :to="`/product/${item.id}`"
                  class="text-xl font-semibold hover:text-blue-600 transition"
                >
                  {{ item.title }}
                </RouterLink>

                <!-- Remove -->

                <button
                  @click="cartStore.removeFromCart(item.id)"
                  class="text-red-500 hover:text-red-700 transition shrink-0"
                  title="Remove item"
                >
                  <Trash2 class="w-5 h-5" />
                </button>
              </div>

              <!-- Brand -->

              <p v-if="item.brand" class="text-gray-500 text-sm mt-1">
                {{ item.brand }}
              </p>

              <!-- Price -->

              <div class="flex items-center gap-3 mt-3">
                <p class="text-blue-600 font-bold text-xl">${{ Number(item.price).toFixed(2) }}</p>

                <p v-if="item.originalPrice" class="text-gray-400 line-through">
                  ${{ Number(item.originalPrice).toFixed(2) }}
                </p>
              </div>

              <!-- ======================================= -->
              <!-- QUANTITY -->
              <!-- ======================================= -->

              <div class="flex flex-wrap items-center gap-4 mt-5">
                <span class="text-gray-600"> Quantity: </span>

                <div class="flex items-center border rounded-lg overflow-hidden">
                  <!-- Minus -->

                  <button
                    @click="cartStore.decreaseQuantity(item.id)"
                    :disabled="item.quantity <= 1"
                    class="px-3 py-2 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <Minus class="w-4 h-4" />
                  </button>

                  <!-- Number -->

                  <span class="px-5 py-2 border-x font-medium">
                    {{ item.quantity }}
                  </span>

                  <!-- Plus -->

                  <button
                    @click="cartStore.increaseQuantity(item.id)"
                    :disabled="item.quantity >= item.stock"
                    class="px-3 py-2 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
                  >
                    <Plus class="w-4 h-4" />
                  </button>
                </div>

                <!-- Stock -->

                <span
                  v-if="item.stock && item.quantity >= item.stock"
                  class="text-xs text-orange-600"
                >
                  Maximum available
                </span>
              </div>

              <!-- ======================================= -->
              <!-- ITEM TOTAL -->
              <!-- ======================================= -->

              <p class="text-gray-600 mt-4">
                Item total:

                <span class="font-semibold text-gray-900">
                  ${{ (item.price * item.quantity).toFixed(2) }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- ================================================= -->
      <!-- ORDER SUMMARY -->
      <!-- ================================================= -->

      <div>
        <div class="bg-gray-50 rounded-2xl p-6 sticky top-24">
          <h2 class="text-2xl font-bold">Order Summary</h2>

          <!-- =========================================== -->
          <!-- SUBTOTAL -->
          <!-- =========================================== -->

          <div class="flex justify-between mt-8">
            <span class="text-gray-600"> Subtotal </span>

            <span class="font-medium"> ${{ cartStore.totalPrice.toFixed(2) }} </span>
          </div>

          <!-- =========================================== -->
          <!-- SAVINGS -->
          <!-- =========================================== -->

          <div v-if="totalSavings > 0" class="flex justify-between mt-4">
            <span class="text-gray-600"> You save </span>

            <span class="text-green-600 font-medium"> -${{ totalSavings.toFixed(2) }} </span>
          </div>

          <!-- =========================================== -->
          <!-- SHIPPING -->
          <!-- =========================================== -->

          <div class="flex justify-between mt-4">
            <span class="text-gray-600"> Shipping </span>

            <span v-if="shipping === 0" class="text-green-600 font-medium"> Free </span>

            <span v-else class="font-medium"> ${{ shipping.toFixed(2) }} </span>
          </div>

          <!-- Free shipping message -->

          <div
            v-if="shipping > 0 && cartStore.totalPrice < 50"
            class="mt-4 bg-blue-50 text-blue-700 text-sm p-3 rounded-lg"
          >
            Add ${{ (50 - cartStore.totalPrice).toFixed(2) }}
            more for free shipping.
          </div>

          <!-- Divider -->

          <div class="border-t my-6"></div>

          <!-- =========================================== -->
          <!-- TOTAL -->
          <!-- =========================================== -->

          <div class="flex justify-between items-center">
            <span class="text-xl font-bold"> Total </span>

            <span class="text-2xl font-bold text-blue-600"> ${{ grandTotal.toFixed(2) }} </span>
          </div>

          <!-- =========================================== -->
          <!-- CHECKOUT -->
          <!-- =========================================== -->

          <RouterLink
            to="/checkout"
            class="mt-8 w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
          >
            <CreditCard class="w-5 h-5" />

            Proceed to Checkout
          </RouterLink>

          <!-- Continue Shopping -->

          <RouterLink
            to="/shop"
            class="flex items-center justify-center gap-2 mt-5 text-blue-600 hover:underline"
          >
            <ArrowLeft class="w-4 h-4" />

            Continue Shopping
          </RouterLink>

          <!-- =========================================== -->
          <!-- SECURITY -->
          <!-- =========================================== -->

          <div class="mt-8 pt-6 border-t space-y-4">
            <div class="flex items-center gap-3">
              <Truck class="w-5 h-5 text-gray-500" />

              <span class="text-sm text-gray-600"> Free shipping over $50 </span>
            </div>

            <div class="flex items-center gap-3">
              <ShieldCheck class="w-5 h-5 text-gray-500" />

              <span class="text-sm text-gray-600"> Secure checkout </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
