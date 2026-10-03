<script setup>
import { computed } from "vue";

import FeatureCard from "@/components/ui/FeatureCard.vue";
import { useSettingsStore } from "@/stores/settings";
import { getWhyChooseUsIcon } from "@/lib/design";

const settingsStore = useSettingsStore();

const heading = computed(() => settingsStore.settings.whyChooseUsHeading);
const subtitle = computed(() => settingsStore.settings.whyChooseUsSubtitle);

// Features are stored as { id, icon (string id), title, description } so
// they survive JSON storage in settings.data — resolve the icon string to
// an actual component here for rendering.
const features = computed(() =>
  (settingsStore.settings.whyChooseUsFeatures || []).map((feature) => ({
    ...feature,
    icon: getWhyChooseUsIcon(feature.icon),
  }))
);
</script>

<template>
  <section v-if="features.length" class="bg-gray-50 py-20">
    <div class="max-w-7xl mx-auto px-6">

      <div class="text-center mb-14">
        <h2 class="text-4xl font-bold">
          {{ heading }}
        </h2>

        <p v-if="subtitle" class="text-gray-500 mt-4">
          {{ subtitle }}
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <FeatureCard
          v-for="feature in features"
          :key="feature.id"
          :feature="feature"
        />
      </div>

    </div>
  </section>
</template>
