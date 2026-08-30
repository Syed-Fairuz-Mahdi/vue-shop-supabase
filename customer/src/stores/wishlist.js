import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'

const WISHLIST_STORAGE_KEY = 'vue-shop-wishlist'

const loadGuestWishlist = () => {
  const saved = localStorage.getItem(WISHLIST_STORAGE_KEY)
  if (!saved) return []
  try {
    return JSON.parse(saved)
  } catch {
    return []
  }
}

const saveGuestWishlist = (items) => {
  localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(items))
}

const mapRow = (row) => ({
  id: row.product_id,
  title: row.products?.title,
  price: Number(row.products?.price ?? 0),
  originalPrice: row.products?.original_price === null || row.products?.original_price === undefined ? null : Number(row.products.original_price),
  image: row.products?.image,
  badge: row.products?.badge,
})

export const useWishlistStore = defineStore('wishlist', () => {
  const items = ref(loadGuestWishlist())
  const authStore = useAuthStore()

  const persistGuest = () => saveGuestWishlist(items.value)

  const loadFromServer = async () => {
    if (!authStore.user) return

    const { data, error } = await supabase
      .from('wishlist_items')
      .select('product_id, products(title, price, original_price, image, badge)')
      .eq('user_id', authStore.user.id)

    if (error) return
    items.value = (data || []).map(mapRow)
  }

  const mergeGuestWishlistIntoServer = async () => {
    const guestItems = loadGuestWishlist()
    if (guestItems.length === 0) return

    for (const item of guestItems) {
      await supabase
        .from('wishlist_items')
        .upsert({ user_id: authStore.user.id, product_id: item.id }, { onConflict: 'user_id,product_id', ignoreDuplicates: true })
    }

    localStorage.removeItem(WISHLIST_STORAGE_KEY)
  }

  watch(
    () => authStore.user?.id,
    async (userId, prevUserId) => {
      if (userId && !prevUserId) {
        await mergeGuestWishlistIntoServer()
        await loadFromServer()
      } else if (!userId) {
        items.value = loadGuestWishlist()
      }
    },
  )

  // --------------------------------------------------
  // Check if product is in wishlist
  // --------------------------------------------------

  const isInWishlist = (productId) => items.value.some((item) => item.id === productId)

  // --------------------------------------------------
  // Add product
  // --------------------------------------------------

  const addToWishlist = async (product) => {
    if (isInWishlist(product.id)) return

    if (authStore.user) {
      const { error } = await supabase.from('wishlist_items').insert({ user_id: authStore.user.id, product_id: product.id })
      if (!error) await loadFromServer()
      return
    }

    items.value.push({
      id: product.id,
      title: product.title,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.image,
      badge: product.badge,
    })

    persistGuest()
  }

  // --------------------------------------------------
  // Remove product
  // --------------------------------------------------

  const removeFromWishlist = async (productId) => {
    if (authStore.user) {
      await supabase.from('wishlist_items').delete().eq('user_id', authStore.user.id).eq('product_id', productId)
      items.value = items.value.filter((item) => item.id !== productId)
      return
    }

    items.value = items.value.filter((item) => item.id !== productId)
    persistGuest()
  }

  // --------------------------------------------------
  // Toggle wishlist
  // --------------------------------------------------

  const toggleWishlist = (product) => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id)
    } else {
      addToWishlist(product)
    }
  }

  const totalItems = computed(() => items.value.length)

  const clearWishlist = async () => {
    if (authStore.user) {
      await supabase.from('wishlist_items').delete().eq('user_id', authStore.user.id)
    }
    items.value = []
    persistGuest()
  }

  return {
    items,
    loadFromServer,
    isInWishlist,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    totalItems,
    clearWishlist,
  }
})
