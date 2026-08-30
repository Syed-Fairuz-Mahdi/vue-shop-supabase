<script setup>
import { computed, onMounted, ref } from 'vue'
import { Star, Trash2 } from 'lucide-vue-next'

import { useReviewsStore } from '@/stores/reviews'

const reviewsStore = useReviewsStore()

onMounted(() => {
  reviewsStore.fetchAllReviews()
})

const confirmDeleteId = ref(null)

const sortedReviews = computed(() => {
  return [...reviewsStore.allReviews].sort((a, b) => new Date(b.date) - new Date(a.date))
})

const formatDate = (date) => {
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const confirmDelete = async (id) => {
  await reviewsStore.deleteReview(id)
  confirmDeleteId.value = null
}
</script>

<template>
  <div>
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Reviews</h1>
      <p class="text-gray-500 mt-1">
        {{ reviewsStore.allReviews.length }} customer reviews across all products.
      </p>
    </div>

    <div class="bg-white rounded-2xl shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left">
          <thead class="bg-gray-50 text-gray-500 text-sm">
            <tr>
              <th class="px-5 py-4">Product</th>
              <th class="px-5 py-4">Reviewer</th>
              <th class="px-5 py-4">Rating</th>
              <th class="px-5 py-4">Comment</th>
              <th class="px-5 py-4">Date</th>
              <th class="px-5 py-4 text-right">Actions</th>
            </tr>
          </thead>

          <tbody class="divide-y">
            <tr v-for="review in sortedReviews" :key="review.id" class="hover:bg-gray-50">
              <td class="px-5 py-4 font-medium">{{ review.productTitle }}</td>
              <td class="px-5 py-4 text-gray-600">{{ review.name }}</td>

              <td class="px-5 py-4">
                <span class="inline-flex items-center gap-1">
                  <Star class="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {{ review.rating }}
                </span>
              </td>

              <td class="px-5 py-4 text-gray-600 max-w-sm truncate">{{ review.comment }}</td>
              <td class="px-5 py-4 text-gray-400 text-sm">{{ formatDate(review.date) }}</td>

              <td class="px-5 py-4 text-right">
                <button @click="confirmDeleteId = review.id" class="p-2 rounded-lg hover:bg-red-50 text-red-600">
                  <Trash2 class="w-4 h-4" />
                </button>
              </td>
            </tr>

            <tr v-if="sortedReviews.length === 0">
              <td colspan="6" class="px-5 py-12 text-center text-gray-400">No reviews yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Delete confirmation -->

    <div
      v-if="confirmDeleteId !== null"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
    >
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold">Delete this review?</h3>
        <p class="text-gray-500 mt-2">This action cannot be undone.</p>

        <div class="flex gap-3 mt-6">
          <button @click="confirmDeleteId = null" class="flex-1 border border-gray-300 py-3 rounded-lg">
            Cancel
          </button>
          <button
            @click="confirmDelete(confirmDeleteId)"
            class="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
