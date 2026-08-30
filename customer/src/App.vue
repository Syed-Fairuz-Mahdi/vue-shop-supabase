<script setup>
import { onMounted, watch } from "vue";

import Navbar from "@/components/layout/navbar.vue";
import Footer from "@/components/layout/footer.vue";
import { useSettingsStore } from "@/stores/settings";
import { useCategoriesStore } from "@/stores/categories";
import { useProductsStore } from "@/stores/products";
import { useAuthStore } from "@/stores/auth";
import { useCartStore } from "@/stores/cart";
import { useWishlistStore } from "@/stores/wishlist";
import { applySiteFont, applyBaseFontSize } from "@/lib/design";

const settingsStore = useSettingsStore();
const categoriesStore = useCategoriesStore();
const productsStore = useProductsStore();
const authStore = useAuthStore();
const cartStore = useCartStore();
const wishlistStore = useWishlistStore();

onMounted(async () => {
  // Fire these together — they're independent and each view will simply
  // reflect the store as soon as its data arrives.
  settingsStore.fetchSettings();
  categoriesStore.fetchCategories();
  productsStore.fetchProducts();

  // authStore.init() already ran in main.js before mount — if a
  // session exists, pull the logged-in user's cart/wishlist from Supabase.
  await authStore.init();
  if (authStore.isLoggedIn) {
    cartStore.loadFromServer();
    wishlistStore.loadFromServer();
  }
});

watch(
  () => settingsStore.settings.siteName,
  (siteName) => {
    document.title = siteName || "Online Store";
  },
  { immediate: true },
);

// Site-wide typography, controlled from Admin > Design.
watch(
  () => settingsStore.settings.fontFamily,
  (fontFamily) => applySiteFont(fontFamily),
  { immediate: true },
);

watch(
  () => settingsStore.settings.baseFontSize,
  (baseFontSize) => applyBaseFontSize(baseFontSize),
  { immediate: true },
);
</script>

<template>
  <Navbar />

  <RouterView />

  <Footer />
</template>
