<script setup>
defineProps({
  feature: {
    type: Object,
    required: true,
  },
});
</script>

<template>
  <div
    class="bg-white rounded-2xl shadow-md p-8 text-center hover:-translate-y-2 hover:shadow-xl transition duration-300"
  >
    <div
      class="w-16 h-16 mx-auto rounded-full bg-blue-100 flex items-center justify-center mb-6"
    >
      <component
        :is="feature.icon"
        class="w-8 h-8 text-blue-600"
      />
    </div>

    <h3 class="text-xl font-bold">
      {{ feature.title }}
    </h3>

    <p class="text-gray-500 mt-3">
      {{ feature.description }}
    </p>
  </div>
</template>
