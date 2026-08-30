<script setup>
import { onMounted, watch } from 'vue'

import { useSettingsStore } from '@/stores/settings'

const settingsStore = useSettingsStore()

onMounted(() => {
  settingsStore.fetchSettings()
})

watch(
  () => settingsStore.settings.siteName,
  (siteName) => {
    document.title = siteName ? `${siteName} Admin` : 'Admin'
  },
  { immediate: true },
)
</script>

<template>
  <RouterView />
</template>
