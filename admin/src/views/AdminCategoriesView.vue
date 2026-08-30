<script setup>
import { onMounted, reactive, ref } from 'vue'
import { PlusCircle, Pencil, Trash2, X } from 'lucide-vue-next'

import { useCategoriesStore } from '@/stores/categories'
import { useProductsStore } from '@/stores/products'

const categoriesStore = useCategoriesStore()
const productsStore = useProductsStore()

onMounted(() => {
  categoriesStore.fetchCategories({ force: true })
  productsStore.fetchProducts()
})

const productCountFor = (title) => {
  return productsStore.products.filter((product) => product.category === title).length
}

// --------------------------------------------------
// Form (add / edit)
// --------------------------------------------------

const showForm = ref(false)
const editingId = ref(null)
const formError = ref('')
const isSaving = ref(false)

const form = reactive({
  title: '',
  icon: '🛍️',
})

const resetForm = () => {
  form.title = ''
  form.icon = '🛍️'
  editingId.value = null
  formError.value = ''
}

const openAddForm = () => {
  resetForm()
  showForm.value = true
}

const openEditForm = (category) => {
  form.title = category.title
  form.icon = category.icon
  editingId.value = category.id
  showForm.value = true
}

const closeForm = () => {
  showForm.value = false
  resetForm()
}

const submitForm = async () => {
  if (!form.title.trim()) return

  isSaving.value = true
  formError.value = ''

  try {
    if (editingId.value !== null) {
      await categoriesStore.updateCategory(editingId.value, { title: form.title, icon: form.icon })
    } else {
      await categoriesStore.addCategory({ title: form.title, icon: form.icon })
    }

    closeForm()
  } catch (error) {
    formError.value = error.message || 'Something went wrong saving this category.'
  } finally {
    isSaving.value = false
  }
}

// --------------------------------------------------
// Delete
// --------------------------------------------------

const confirmDeleteId = ref(null)

const confirmDelete = async (id) => {
  await categoriesStore.deleteCategory(id)
  confirmDeleteId.value = null
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between flex-wrap gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-bold">Categories & Filters</h1>
        <p class="text-gray-500 mt-1">
          These power the homepage category cards and the shop filter list.
        </p>
      </div>

      <button
        @click="openAddForm"
        class="flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
      >
        <PlusCircle class="w-5 h-5" />
        Add Category
      </button>
    </div>

    <!-- Add / Edit form -->

    <div v-if="showForm" class="bg-white rounded-2xl shadow-md p-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-bold">{{ editingId !== null ? 'Edit Category' : 'New Category' }}</h2>
        <button @click="closeForm" class="text-gray-400 hover:text-gray-700">
          <X class="w-5 h-5" />
        </button>
      </div>

      <form @submit.prevent="submitForm" class="grid sm:grid-cols-[1fr_120px_auto] gap-4 items-end">
        <div v-if="formError" class="sm:col-span-3 bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
          {{ formError }}
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Category Name</label>
          <input
            v-model="form.title"
            type="text"
            placeholder="e.g. Laptops"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label class="block text-sm font-medium mb-2">Icon (emoji)</label>
          <input
            v-model="form.icon"
            type="text"
            placeholder="💻"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 text-center"
          />
        </div>

        <button
          type="submit"
          :disabled="isSaving"
          class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
        >
          {{ isSaving ? 'Saving...' : editingId !== null ? 'Save' : 'Add' }}
        </button>
      </form>
    </div>

    <!-- List -->

    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div
        v-for="category in categoriesStore.categories"
        :key="category.id"
        class="bg-white rounded-2xl shadow-md p-6 flex items-center gap-4"
      >
        <div class="text-4xl">{{ category.icon }}</div>

        <div class="flex-1 min-w-0">
          <p class="font-bold truncate">{{ category.title }}</p>
          <p class="text-sm text-gray-500">{{ productCountFor(category.title) }} products</p>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button @click="openEditForm(category)" class="p-2 rounded-lg hover:bg-blue-50 text-blue-600">
            <Pencil class="w-4 h-4" />
          </button>
          <button @click="confirmDeleteId = category.id" class="p-2 rounded-lg hover:bg-red-50 text-red-600">
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <div v-if="categoriesStore.categories.length === 0" class="text-gray-400 col-span-full text-center py-12">
        No categories yet.
      </div>
    </div>

    <!-- Delete confirmation -->

    <div
      v-if="confirmDeleteId !== null"
      class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6"
    >
      <div class="bg-white rounded-2xl p-6 max-w-sm w-full">
        <h3 class="text-lg font-bold">Delete this category?</h3>
        <p class="text-gray-500 mt-2">
          Products already assigned to it will keep the category name but it will no longer appear as a filter.
        </p>

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
