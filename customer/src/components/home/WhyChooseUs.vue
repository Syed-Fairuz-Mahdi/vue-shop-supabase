<script setup>
import FeatureCard from "@/components/ui/FeatureCard.vue";

import {
  Truck,
  ShieldCheck,
  RotateCcw,
  Headset,
} from "lucide-vue-next";

const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free shipping on orders over $50.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "Your payments are protected with industry-standard encryption.",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "Return products within 30 days with no hassle.",
  },
  {
    icon: Headset,
    title: "24/7 Support",
    description: "Our support team is here whenever you need help.",
  },
];
</script>

<template>
  <section class="bg-gray-50 py-20">
    <div class="max-w-7xl mx-auto px-6">

      <div class="text-center mb-14">
        <h2 class="text-4xl font-bold">
          Why Shop With Us?
        </h2>

        <p class="text-gray-500 mt-4">
          We focus on quality products and an exceptional shopping experience.
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        <FeatureCard
          v-for="feature in features"
          :key="feature.title"
          :feature="feature"
        />
      </div>

    </div>
  </section>
</template>
