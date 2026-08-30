import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const CART_STORAGE_KEY = 'vue-shop-cart'

const loadGuestCart = () => {
  const saved = localStorage.getItem(CART_STORAGE_KEY)
  if (!saved) return []
  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

const saveGuestCart = (items) => {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
}

const mapRow = (row) => ({
  id: row.product_id,
  title: row.products?.title,
  price: Number(row.products?.price ?? 0),
  image: row.products?.image,
  stock: row.products?.stock ?? 0,
  quantity: row.quantity,
})

export const useCartStore = defineStore('cart', () => {
  const items = ref(loadGuestCart())
  const isSyncing = ref(false)

  const authStore = useAuthStore()

  // --------------------------------------------------
  // Persist: DB row per item for a logged-in user, localStorage
  // for a guest (same behaviour the storefront always had).
  // --------------------------------------------------

  const persistGuest = () => saveGuestCart(items.value)

  const loadFromServer = async () => {
    if (!authStore.user) return

    const { data, error } = await supabase
      .from('cart_items')
      .select('quantity, product_id, products(title, price, image, stock)')
      .eq('user_id', authStore.user.id)

    if (error) return
    items.value = (data || []).map(mapRow)
  }

  // Merge any guest-cart items into the DB the moment someone logs in,
  // then clear the local copy — so items added before signing in aren't lost.
  const mergeGuestCartIntoServer = async () => {
    const guestItems = loadGuestCart()
    if (guestItems.length === 0) return

    for (const item of guestItems) {
      await supabase.from('cart_items').upsert(
        { user_id: authStore.user.id, product_id: item.id, quantity: item.quantity },
        { onConflict: 'user_id,product_id', ignoreDuplicates: false },
      )
    }

    localStorage.removeItem(CART_STORAGE_KEY)
  }

  watch(
    () => authStore.user?.id,
    async (userId, prevUserId) => {
      if (userId && !prevUserId) {
        isSyncing.value = true
        await mergeGuestCartIntoServer()
        await loadFromServer()
        isSyncing.value = false
      } else if (!userId) {
        items.value = loadGuestCart()
      }
    },
  )

  // --------------------------------------------------
  // Add product
  // --------------------------------------------------

  const addToCart = async (product, quantity = 1) => {
    if (authStore.user) {
      const existing = items.value.find((item) => item.id === product.id)
      const nextQty = Math.min((existing?.quantity || 0) + quantity, product.stock)

      const { error } = await supabase
        .from('cart_items')
        .upsert(
          { user_id: authStore.user.id, product_id: product.id, quantity: nextQty },
          { onConflict: 'user_id,product_id' },
        )

      if (!error) await loadFromServer()
      return
    }

    const existingItem = items.value.find((item) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += quantity
      if (existingItem.quantity > product.stock) existingItem.quantity = product.stock
    } else {
      items.value.push({
        id: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
        stock: product.stock,
        quantity,
      })
    }

    persistGuest()
  }

  // --------------------------------------------------
  // Remove product
  // --------------------------------------------------

  const removeFromCart = async (productId) => {
    if (authStore.user) {
      await supabase.from('cart_items').delete().eq('user_id', authStore.user.id).eq('product_id', productId)
      items.value = items.value.filter((item) => item.id !== productId)
      return
    }

    items.value = items.value.filter((item) => item.id !== productId)
    persistGuest()
  }

  // --------------------------------------------------
  // Increase / decrease quantity
  // --------------------------------------------------

  const setQuantity = async (productId, quantity) => {
    const item = items.value.find((item) => item.id === productId)
    if (!item) return

    item.quantity = quantity

    if (authStore.user) {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', authStore.user.id)
        .eq('product_id', productId)
    } else {
      persistGuest()
    }
  }

  const increaseQuantity = (productId) => {
    const item = items.value.find((item) => item.id === productId)
    if (!item) return
    if (item.quantity < item.stock) setQuantity(productId, item.quantity + 1)
  }

  const decreaseQuantity = (productId) => {
    const item = items.value.find((item) => item.id === productId)
    if (!item) return
    if (item.quantity > 1) setQuantity(productId, item.quantity - 1)
  }

  // --------------------------------------------------
  // Totals
  // --------------------------------------------------

  const totalItems = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const totalPrice = computed(() => items.value.reduce((total, item) => total + item.price * item.quantity, 0))

  // --------------------------------------------------
  // Clear cart (e.g. after a successful order)
  // --------------------------------------------------

  const clearCart = async () => {
    if (authStore.user) {
      await supabase.from('cart_items').delete().eq('user_id', authStore.user.id)
    }
    items.value = []
    persistGuest()
  }

  return {
    items,
    isSyncing,
    loadFromServer,
    addToCart,
    removeFromCart,
    increaseQuantity,
    decreaseQuantity,
    totalItems,
    totalPrice,
    clearCart,
  }
})
