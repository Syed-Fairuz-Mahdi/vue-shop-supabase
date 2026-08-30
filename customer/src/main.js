import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import './assets/main.css'

import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Restore any existing Supabase session before the router's first
// navigation guard runs, so a page refresh on a protected route
// doesn't briefly look logged-out.
const authStore = useAuthStore()
authStore.init().finally(() => {
  app.mount('#app')
})
