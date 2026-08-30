import { defineStore } from 'pinia'
import { reactive, ref } from 'vue'

import { supabase } from '@/lib/supabase'
import { useProductsStore } from '@/stores/products'
import { useAuthStore } from '@/stores/auth'

const mapReview = (row) => ({
  id: row.id,
  productId: row.product_id,
  name: row.reviewer_name,
  rating: row.rating,
  comment: row.comment || '',
  date: row.created_at,
  productTitle: row.products?.title,
})

export const useReviewsStore = defineStore('reviews', () => {
  // Reviews for a single product, keyed by productId — populated on demand
  // when a product page is visited.
  const reviewsByProduct = reactive({})

  // Every review across the whole site — only populated for admin moderation.
  const allReviews = ref([])
  const isLoadingAll = ref(false)

  // --------------------------------------------------
  // Fetch reviews for one product (public)
  // --------------------------------------------------

  const fetchReviewsForProduct = async (productId, { force = false } = {}) => {
    if (reviewsByProduct[productId] && !force) {
      return reviewsByProduct[productId]
    }

    const { data, error: err } = await supabase
      .from('reviews')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })

    if (err) throw err

    const mapped = (data || []).map(mapReview)
    reviewsByProduct[productId] = mapped
    return mapped
  }

  const getReviewsForProduct = (productId) => {
    return reviewsByProduct[productId] || []
  }

  // --------------------------------------------------
  // Fetch every review (admin moderation — RLS only returns
  // everything when the signed-in user's profile role is 'admin')
  // --------------------------------------------------

  const fetchAllReviews = async () => {
    isLoadingAll.value = true

    try {
      const { data, error: err } = await supabase
        .from('reviews')
        .select('*, products(title)')
        .order('created_at', { ascending: false })

      if (err) throw err
      allReviews.value = (data || []).map(mapReview)
    } finally {
      isLoadingAll.value = false
    }
  }

  // --------------------------------------------------
  // Add a review — requires a signed-in customer (RLS ties the row
  // to auth.uid()). Also refreshes the product's live rating/reviewCount.
  // --------------------------------------------------

  const addReview = async ({ productId, name, rating, comment }) => {
    const authStore = useAuthStore()

    if (!authStore.isLoggedIn) {
      throw new Error('Please sign in to leave a review.')
    }

    const { data, error: err } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        user_id: authStore.user.id,
        reviewer_name: name,
        rating,
        comment: comment || '',
      })
      .select('*')
      .single()

    if (err) {
      if (err.code === '23505') throw new Error('You already reviewed this product.')
      throw err
    }

    const newReview = mapReview(data)

    if (!reviewsByProduct[productId]) {
      reviewsByProduct[productId] = []
    }
    reviewsByProduct[productId].unshift(newReview)

    const productsStore = useProductsStore()
    await productsStore.refreshProduct(productId)

    return newReview
  }

  // --------------------------------------------------
  // Delete a review (admin moderation, or the review's own author)
  // --------------------------------------------------

  const deleteReview = async (id) => {
    const review = allReviews.value.find((item) => item.id === id) || Object.values(reviewsByProduct).flat().find((item) => item.id === id)

    const { error: err } = await supabase.from('reviews').delete().eq('id', id)
    if (err) throw err

    allReviews.value = allReviews.value.filter((item) => item.id !== id)

    if (review && reviewsByProduct[review.productId]) {
      reviewsByProduct[review.productId] = reviewsByProduct[review.productId].filter((item) => item.id !== id)
    }

    const productsStore = useProductsStore()
    if (review) {
      await productsStore.refreshProduct(review.productId)
    }
  }

  return {
    allReviews,
    isLoadingAll,
    fetchReviewsForProduct,
    getReviewsForProduct,
    fetchAllReviews,
    addReview,
    deleteReview,
  }
})
