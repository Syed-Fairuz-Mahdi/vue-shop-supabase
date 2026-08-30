import { defineStore } from 'pinia'
import { ref } from 'vue'

import { supabase } from '@/lib/supabase'

const mapReview = (row) => ({
  id: row.id,
  productId: row.product_id,
  productTitle: row.products?.title || '',
  name: row.reviewer_name,
  rating: row.rating,
  comment: row.comment || '',
  date: row.created_at,
  isApproved: row.is_approved,
})

export const useReviewsStore = defineStore('reviews', () => {
  const allReviews = ref([])
  const isLoading = ref(false)

  // RLS lets an admin profile read every review, not just approved
  // ones or their own — see reviews_select_approved_or_own_or_admin.
  const fetchAllReviews = async () => {
    isLoading.value = true

    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*, products(title)')
        .order('created_at', { ascending: false })

      if (error) throw error
      allReviews.value = (data || []).map(mapReview)
    } finally {
      isLoading.value = false
    }
  }

  const deleteReview = async (id) => {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) throw error
    allReviews.value = allReviews.value.filter((review) => review.id !== id)
  }

  // Hide a review from the public storefront without deleting it —
  // reviews_update_own_or_admin lets an admin do this.
  const setApproval = async (id, isApproved) => {
    const { error } = await supabase.from('reviews').update({ is_approved: isApproved }).eq('id', id)
    if (error) throw error
    const review = allReviews.value.find((review) => review.id === id)
    if (review) review.isApproved = isApproved
  }

  return {
    allReviews,
    isLoading,
    fetchAllReviews,
    deleteReview,
    setApproval,
  }
})
