import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'

import { useAdminAuthStore } from '@/stores/adminAuth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

const adminAuthStore = useAdminAuthStore()
adminAuthStore.init().finally(() => {
  app.mount('#app')
})
