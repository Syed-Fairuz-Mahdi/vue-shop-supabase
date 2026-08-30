<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Upload, X, PlusCircle, Loader2 } from 'lucide-vue-next'

import { useProductsStore, slugify } from '@/stores/products'
import { useCategoriesStore } from '@/stores/categories'
import { uploadImage } from '@/lib/storage'

const route = useRoute()
const router = useRouter()
const productsStore = useProductsStore()
const categoriesStore = useCategoriesStore()

const isEditing = computed(() => route.name === 'product-edit')
const productId = computed(() => Number(route.params.id))

onMounted(async () => {
  await Promise.all([
    productsStore.fetchProducts({ force: true }),
    categoriesStore.fetchCategories(),
  ])
})

const existingProduct = computed(() => {
  return isEditing.value ? productsStore.getById(productId.value) : null
})

// --------------------------------------------------
// Form state
// --------------------------------------------------

const form = reactive({
  title: '',
  slug: '',
  brand: '',
  category: '',
  price: '',
  originalPrice: '',
  stock: '',
  badgeOption: 'NONE',
  customBadge: '',
  featured: false,
  flashSale: false,
  description: '',
  image: '',
  images: [],
})

const badgeOptions = ['NONE', 'HOT', 'SALE', 'NEW', 'CUSTOM']

watch(
  existingProduct,
  (product) => {
    if (!product) return

    const knownBadges = ['HOT', 'SALE', 'NEW']

    form.title = product.title
    form.slug = product.slug
    form.brand = product.brand
    form.category = product.category
    form.price = product.price
    form.originalPrice = product.originalPrice ?? ''
    form.stock = product.stock
    form.badgeOption = !product.badge ? 'NONE' : knownBadges.includes(product.badge) ? product.badge : 'CUSTOM'
    form.customBadge = !knownBadges.includes(product.badge) ? product.badge : ''
    form.featured = product.featured
    form.flashSale = product.flashSale
    form.description = product.description
    form.image = product.image
    form.images = [...product.images]
  },
  { immediate: true },
)

// --------------------------------------------------
// Auto-slug from title (only if untouched, when adding)
// --------------------------------------------------

const slugManuallyEdited = ref(false)

watch(
  () => form.title,
  (title) => {
    if (!isEditing.value && !slugManuallyEdited.value) {
      form.slug = slugify(title)
    }
  },
)

// --------------------------------------------------
// Image upload — sends the file to our API, which forwards
// it to Cloudinary and returns a hosted URL.
// --------------------------------------------------

const isUploadingMain = ref(false)
const isUploadingGallery = ref(false)
const uploadError = ref('')

const onMainImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  isUploadingMain.value = true
  uploadError.value = ''

  try {
    form.image = await uploadImage(file)
  } catch (error) {
    uploadError.value = error.message || 'Image upload failed.'
  } finally {
    isUploadingMain.value = false
    event.target.value = ''
  }
}

const onGalleryImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  isUploadingGallery.value = true
  uploadError.value = ''

  try {
    form.images.push(await uploadImage(file))
  } catch (error) {
    uploadError.value = error.message || 'Image upload failed.'
  } finally {
    isUploadingGallery.value = false
    event.target.value = ''
  }
}

const addGalleryUrl = () => {
  form.images.push('')
}

const removeGalleryImage = (index) => {
  form.images.splice(index, 1)
}

// --------------------------------------------------
// Submit
// --------------------------------------------------

const errorMessage = ref('')
const isSaving = ref(false)

const submit = async () => {
  errorMessage.value = ''

  if (!form.title || !form.category || form.price === '' || form.stock === '') {
    errorMessage.value = 'Please fill in title, category, price, and stock.'
    return
  }

  const badge = form.badgeOption === 'NONE' ? '' : form.badgeOption === 'CUSTOM' ? form.customBadge : form.badgeOption

  const images = form.images.filter((img) => img && img.trim() !== '')

  const payload = {
    title: form.title,
    slug: form.slug,
    brand: form.brand,
    category: form.category,
    price: form.price,
    originalPrice: form.originalPrice === '' ? null : form.originalPrice,
    stock: form.stock,
    badge,
    featured: form.featured,
    flashSale: form.flashSale,
    description: form.description,
    image: form.image || images[0] || '',
    images: images.length > 0 ? images : form.image ? [form.image] : [],
  }

  isSaving.value = true

  try {
    if (isEditing.value) {
      await productsStore.updateProduct(productId.value, payload)
    } else {
      await productsStore.addProduct(payload)
    }

    router.push('/products')
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong saving this product.'
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <RouterLink to="/products" class="inline-flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-6">
      <ArrowLeft class="w-5 h-5" />
      Back to Products
    </RouterLink>

    <h1 class="text-3xl font-bold mb-8">{{ isEditing ? 'Edit Product' : 'Add Product' }}</h1>

    <div v-if="isEditing && !existingProduct" class="bg-white rounded-2xl shadow-md p-8 text-center text-gray-500">
      Product not found.
    </div>

    <form v-else @submit.prevent="submit" class="bg-white rounded-2xl shadow-md p-8 space-y-6">
      <div v-if="errorMessage" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
        {{ errorMessage }}
      </div>

      <div v-if="uploadError" class="bg-red-50 text-red-600 text-sm rounded-lg px-4 py-3">
        {{ uploadError }}
      </div>

      <!-- Title -->
      <div>
        <label class="block text-sm font-medium mb-2">Title *</label>
        <input v-model="form.title" type="text" placeholder="e.g. Bluetooth Speaker"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <!-- Slug -->
      <div>
        <label class="block text-sm font-medium mb-2">URL Slug</label>
        <input v-model="form.slug" @input="slugManuallyEdited = true" type="text"
          class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div class="grid sm:grid-cols-2 gap-6">
        <!-- Brand -->
        <div>
          <label class="block text-sm font-medium mb-2">Brand</label>
          <input v-model="form.brand" type="text" placeholder="e.g. JBL"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Category -->
        <div>
          <label class="block text-sm font-medium mb-2">Category *</label>
          <select v-model="form.category"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 bg-white">
            <option value="" disabled>Select category</option>
            <option v-for="category in categoriesStore.categories" :key="category.id" :value="category.title">
              {{ category.title }}
            </option>
          </select>
          <RouterLink to="/categories" class="text-xs text-blue-600 hover:underline mt-2 inline-block">
            + Manage categories
          </RouterLink>
        </div>
      </div>

      <div class="grid sm:grid-cols-3 gap-6">
        <!-- Price -->
        <div>
          <label class="block text-sm font-medium mb-2">Price *</label>
          <input v-model="form.price" type="number" step="0.01" min="0"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Original price -->
        <div>
          <label class="block text-sm font-medium mb-2">Offer / Original Price</label>
          <input v-model="form.originalPrice" type="number" step="0.01" min="0" placeholder="Optional"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>

        <!-- Stock -->
        <div>
          <label class="block text-sm font-medium mb-2">Stock *</label>
          <input v-model="form.stock" type="number" min="0"
            class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      <!-- Badge -->
      <div>
        <label class="block text-sm font-medium mb-2">Badge</label>
        <div class="flex flex-wrap gap-3">
          <label v-for="option in badgeOptions" :key="option" class="flex items-center gap-2 cursor-pointer">
            <input v-model="form.badgeOption" type="radio" :value="option" class="accent-blue-600" />
            <span>{{ option === 'NONE' ? 'None' : option === 'CUSTOM' ? 'Custom...' : option }}</span>
          </label>
        </div>

        <input
          v-if="form.badgeOption === 'CUSTOM'"
          v-model="form.customBadge"
          type="text"
          placeholder="e.g. LIMITED, BESTSELLER, ECO-FRIENDLY"
          class="mt-3 w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Flags -->
      <div class="flex flex-wrap gap-6">
        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="form.featured" type="checkbox" class="w-4 h-4 accent-blue-600" />
          Show in Featured Products
        </label>

        <label class="flex items-center gap-2 cursor-pointer">
          <input v-model="form.flashSale" type="checkbox" class="w-4 h-4 accent-blue-600" />
          Show in Flash Sale
        </label>
      </div>

      <!-- Description -->
      <div>
        <label class="block text-sm font-medium mb-2">Description</label>
        <textarea v-model="form.description" rows="4" placeholder="Describe this product..."
          class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"></textarea>
      </div>

      <!-- Main image -->
      <div>
        <label class="block text-sm font-medium mb-2">Main Image</label>

        <div class="flex items-start gap-4">
          <img v-if="form.image" :src="form.image" class="w-24 h-24 rounded-lg object-cover bg-gray-100 shrink-0" />

          <div class="flex-1 space-y-2">
            <input v-model="form.image" type="text" placeholder="Image URL"
              class="w-full border border-gray-300 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500" />

            <label class="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer">
              <Loader2 v-if="isUploadingMain" class="w-4 h-4 animate-spin" />
              <Upload v-else class="w-4 h-4" />
              {{ isUploadingMain ? 'Uploading...' : 'Upload from device' }}
              <input type="file" accept="image/*" class="hidden" :disabled="isUploadingMain" @change="onMainImageUpload" />
            </label>
          </div>
        </div>
      </div>

      <!-- Gallery images -->
      <div>
        <label class="block text-sm font-medium mb-2">Additional Images</label>

        <div class="space-y-3">
          <div v-for="(image, index) in form.images" :key="index" class="flex items-center gap-3">
            <img v-if="image" :src="image" class="w-12 h-12 rounded-lg object-cover bg-gray-100 shrink-0" />

            <input v-model="form.images[index]" type="text" placeholder="Image URL"
              class="flex-1 border border-gray-300 rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500" />

            <button type="button" @click="removeGalleryImage(index)" class="p-2 text-red-600 hover:bg-red-50 rounded-lg">
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div class="flex items-center gap-4 mt-3">
          <button type="button" @click="addGalleryUrl" class="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <PlusCircle class="w-4 h-4" />
            Add image URL
          </button>

          <label class="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline cursor-pointer">
            <Loader2 v-if="isUploadingGallery" class="w-4 h-4 animate-spin" />
            <Upload v-else class="w-4 h-4" />
            {{ isUploadingGallery ? 'Uploading...' : 'Upload from device' }}
            <input type="file" accept="image/*" class="hidden" :disabled="isUploadingGallery" @change="onGalleryImageUpload" />
          </label>
        </div>
      </div>

      <!-- Submit -->
      <div class="flex gap-4 pt-4">
        <button type="submit" :disabled="isSaving" class="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60">
          {{ isSaving ? 'Saving...' : isEditing ? 'Save Changes' : 'Add Product' }}
        </button>

        <RouterLink to="/products" class="px-8 py-3 rounded-lg border border-gray-300">
          Cancel
        </RouterLink>
      </div>
    </form>
  </div>
</template>
