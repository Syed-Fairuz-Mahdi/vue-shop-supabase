import { defineStore } from 'pinia'
import { ref } from 'vue'

import { supabase } from '@/lib/supabase'
import { slugify } from '@/stores/products'

const mapCategory = (row) => ({ id: row.id, title: row.title, icon: row.icon || '' })

export const useCategoriesStore = defineStore('categories', () => {
  const categories = ref([])
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // --------------------------------------------------
  // Fetch (public)
  // --------------------------------------------------

  const fetchCategories = async ({ force = false } = {}) => {
    if (isLoaded.value && !force) return

    isLoading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase.from('categories').select('*').order('title', { ascending: true })
      if (err) throw err
      categories.value = (data || []).map(mapCategory)
      isLoaded.value = true
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  // --------------------------------------------------
  // Create (admin — RLS enforces this server-side too)
  // --------------------------------------------------

  const addCategory = async (category) => {
    const { data, error: err } = await supabase
      .from('categories')
      .insert({ title: category.title, slug: slugify(category.title), icon: category.icon || '🛍️' })
      .select('*')
      .single()

    if (err) throw err

    const newCategory = mapCategory(data)
    categories.value.push(newCategory)
    return newCategory
  }

  // --------------------------------------------------
  // Update (admin)
  // --------------------------------------------------

  const updateCategory = async (id, updates) => {
    const patch = {}
    if (updates.title !== undefined) {
      patch.title = updates.title
      patch.slug = slugify(updates.title)
    }
    if (updates.icon !== undefined) patch.icon = updates.icon

    const { data, error: err } = await supabase.from('categories').update(patch).eq('id', id).select('*').single()
    if (err) throw err

    const updated = mapCategory(data)
    const index = categories.value.findIndex((category) => category.id === id)
    if (index !== -1) categories.value[index] = updated
    return updated
  }

  // --------------------------------------------------
  // Delete (admin)
  // --------------------------------------------------

  const deleteCategory = async (id) => {
    const { error: err } = await supabase.from('categories').delete().eq('id', id)
    if (err) throw err
    categories.value = categories.value.filter((category) => category.id !== id)
  }

  return {
    categories,
    isLoaded,
    isLoading,
    error,
    fetchCategories,
    addCategory,
    updateCategory,
    deleteCategory,
  }
})
