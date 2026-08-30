<template>
  <div
    class="bg-white rounded-2xl shadow hover:shadow-xl transition duration-300 p-6 text-center cursor-pointer hover:-translate-y-2"
  >
    <div class="text-5xl mb-4">
      {{ icon }}
    </div>

    <h3 class="text-xl font-bold">
      {{ title }}
    </h3>

    <p class="text-gray-500 mt-2">
      {{ items }} Items
    </p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  icon: String,
  items: Number,
});
</script>
