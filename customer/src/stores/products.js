import { defineStore } from 'pinia'
import { ref } from 'vue'

import { supabase } from '@/lib/supabase'

export const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}

// --------------------------------------------------
// DB row -> the exact camelCase shape every existing component
// (ProductCard, ShopView, ProductView, admin views, cart, wishlist...)
// already expects. Keeping this mapping in one place means none of
// those components had to change.
// --------------------------------------------------
const mapProduct = (row) => ({
  id: row.id,
  slug: row.slug,
  title: row.title,
  brand: row.brand || '',
  category: row.categories?.title ?? row.category ?? '',
  categoryId: row.category_id,
  price: Number(row.price),
  originalPrice: row.original_price === null || row.original_price === undefined ? null : Number(row.original_price),
  stock: row.stock,
  badge: row.badge || '',
  featured: row.featured,
  flashSale: row.flash_sale,
  description: row.description || '',
  image: row.image || '',
  images:
    row.product_images && row.product_images.length > 0
      ? row.product_images.sort((a, b) => a.position - b.position).map((img) => img.url)
      : row.image
        ? [row.image]
        : [],
  rating: Number(row.rating) || 0,
  reviewCount: row.review_count || 0,
  isDummy: row.is_dummy,
})

const PRODUCT_SELECT = '*, categories(title), product_images(url, position)'

// The existing AdminProductFormView.vue sends { category: 'Audio', ... }
// (a title string, exactly like the old fake API) rather than an id —
// resolving that to category_id here means that form didn't need to change.
const resolveCategoryId = async (title) => {
  if (!title) return null
  const { data, error: err } = await supabase.from('categories').select('id').eq('title', title).maybeSingle()
  if (err) throw err
  return data?.id ?? null
}

export const useProductsStore = defineStore('products', () => {
  const products = ref([])
  const isLoaded = ref(false)
  const isLoading = ref(false)
  const error = ref(null)

  // --------------------------------------------------
  // Fetch all (public)
  // --------------------------------------------------

  const fetchProducts = async ({ force = false } = {}) => {
    if (isLoaded.value && !force) return

    isLoading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('products')
        .select(PRODUCT_SELECT)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

      if (err) throw err

      products.value = (data || []).map(mapProduct)
      isLoaded.value = true
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  // --------------------------------------------------
  // Fetch a single product fresh from the server (accurate rating)
  // and merge it into the cached list.
  // --------------------------------------------------

  const refreshProduct = async (idOrSlug) => {
    const isUuid = /^[0-9a-f-]{36}$/i.test(idOrSlug)

    const query = supabase.from('products').select(PRODUCT_SELECT)

    const { data, error: err } = await (isUuid ? query.eq('id', idOrSlug) : query.eq('slug', idOrSlug)).single()

    if (err) throw err

    const fresh = mapProduct(data)
    const index = products.value.findIndex((product) => product.id === fresh.id)

    if (index !== -1) {
      products.value[index] = fresh
    } else {
      products.value.push(fresh)
    }

    return fresh
  }

  // --------------------------------------------------
  // Lookups (from cache — call fetchProducts first)
  // --------------------------------------------------

  const getById = (id) => {
    return products.value.find((product) => product.id === id)
  }

  const getBySlug = (slug) => {
    return products.value.find((product) => product.slug === slug)
  }

  // --------------------------------------------------
  // Create (admin — RLS additionally enforces this server-side)
  // --------------------------------------------------

  const addProduct = async (productData) => {
    const categoryId = productData.categoryId ?? (await resolveCategoryId(productData.category))

    const { data, error: err } = await supabase
      .from('products')
      .insert({
        slug: productData.slug || slugify(productData.title),
        title: productData.title,
        brand: productData.brand || '',
        category_id: categoryId,
        price: Number(productData.price) || 0,
        original_price:
          productData.originalPrice === '' || productData.originalPrice == null ? null : Number(productData.originalPrice),
        stock: Number(productData.stock) || 0,
        badge: productData.badge || '',
        featured: Boolean(productData.featured),
        flash_sale: Boolean(productData.flashSale),
        description: productData.description || '',
        image: productData.image || (productData.images && productData.images[0]) || '',
      })
      .select(PRODUCT_SELECT)
      .single()

    if (err) throw err

    if (Array.isArray(productData.images) && productData.images.length > 0) {
      await supabase
        .from('product_images')
        .insert(productData.images.map((url, position) => ({ product_id: data.id, url, position })))
    }

    const newProduct = mapProduct(data)
    products.value.push(newProduct)
    return newProduct
  }

  // --------------------------------------------------
  // Update (admin)
  // --------------------------------------------------

  const updateProduct = async (id, productData) => {
    const patch = {}
    if (productData.title !== undefined) patch.title = productData.title
    if (productData.title !== undefined) patch.slug = productData.slug || slugify(productData.title)
    if (productData.brand !== undefined) patch.brand = productData.brand
    if (productData.categoryId !== undefined) {
      patch.category_id = productData.categoryId
    } else if (productData.category !== undefined) {
      patch.category_id = await resolveCategoryId(productData.category)
    }
    if (productData.price !== undefined) patch.price = Number(productData.price)
    if (productData.originalPrice !== undefined)
      patch.original_price = productData.originalPrice === '' || productData.originalPrice === null ? null : Number(productData.originalPrice)
    if (productData.stock !== undefined) patch.stock = Number(productData.stock)
    if (productData.badge !== undefined) patch.badge = productData.badge
    if (productData.featured !== undefined) patch.featured = Boolean(productData.featured)
    if (productData.flashSale !== undefined) patch.flash_sale = Boolean(productData.flashSale)
    if (productData.description !== undefined) patch.description = productData.description
    if (productData.image !== undefined) patch.image = productData.image

    const { data, error: err } = await supabase.from('products').update(patch).eq('id', id).select(PRODUCT_SELECT).single()

    if (err) throw err

    if (Array.isArray(productData.images)) {
      await supabase.from('product_images').delete().eq('product_id', id)
      if (productData.images.length > 0) {
        await supabase
          .from('product_images')
          .insert(productData.images.map((url, position) => ({ product_id: id, url, position })))
      }
    }

    const updated = mapProduct(data)
    const index = products.value.findIndex((product) => product.id === id)
    if (index !== -1) products.value[index] = updated
    return updated
  }

  // --------------------------------------------------
  // Delete (admin)
  // --------------------------------------------------

  const deleteProduct = async (id) => {
    const { error: err } = await supabase.from('products').delete().eq('id', id)
    if (err) throw err
    products.value = products.value.filter((product) => product.id !== id)
  }

  return {
    products,
    isLoaded,
    isLoading,
    error,
    fetchProducts,
    refreshProduct,
    getById,
    getBySlug,
    addProduct,
    updateProduct,
    deleteProduct,
  }
})
