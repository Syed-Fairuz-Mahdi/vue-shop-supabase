<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from "vue";
import ProductCard from "@/components/products/ProductCard.vue";
import { useProductsStore } from "@/stores/products";
import { useSettingsStore } from "@/stores/settings";

const productsStore = useProductsStore();
const settingsStore = useSettingsStore();

const flashSaleProducts = computed(() => {
  return productsStore.products.filter((product) => product.flashSale);
});

const timeLeft = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0,
});

// Admin can set an exact end date/time from Admin > Design. If that isn't
// set (or is invalid), fall back to 2 days from whenever this loads.
const resolveSaleEnd = () => {
  const configured = settingsStore.settings.flashSaleEndsAt;

  if (configured) {
    const parsed = new Date(configured);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  const fallback = new Date();
  fallback.setDate(fallback.getDate() + 2);
  return fallback;
};

let saleEnd = resolveSaleEnd();
let timer = null;

const updateCountdown = () => {
  const now = new Date();
  const diff = saleEnd - now;

  if (diff <= 0) {
    timeLeft.value = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    clearInterval(timer);
    return;
  }

  timeLeft.value = {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
};

const restartCountdown = () => {
  saleEnd = resolveSaleEnd();
  clearInterval(timer);
  updateCountdown();
  timer = setInterval(updateCountdown, 1000);
};

// If the admin changes the flash sale end time while this is mounted
// (e.g. saved from another tab), pick it up without a page reload.
watch(() => settingsStore.settings.flashSaleEndsAt, restartCountdown);

onMounted(() => {
  restartCountdown();
});

onUnmounted(() => {
  clearInterval(timer);
});
</script>

<template>
  <section v-if="flashSaleProducts.length > 0" class="max-w-7xl mx-auto px-6 py-20">
    <div class="flex flex-col lg:flex-row justify-between items-center mb-10">
      <div>
        <h2 class="text-4xl font-bold">
          Flash Sale
        </h2>

        <p class="text-gray-500 mt-2">
          Hurry! These deals won't last long.
        </p>
      </div>

      <div class="flex gap-4 mt-6 lg:mt-0">
        <div
          v-for="(value, label) in timeLeft"
          :key="label"
          class="bg-blue-600 text-white rounded-xl px-5 py-3 text-center min-w-20"
        >
          <div class="text-2xl font-bold">
            {{ value }}
          </div>

          <div class="text-xs uppercase">
            {{ label }}
          </div>
        </div>
      </div>
    </div>

    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <ProductCard
        v-for="product in flashSaleProducts"
        :key="product.id"
        :product="product"
      />
    </div>
  </section>
</template>
