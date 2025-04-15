import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { plugin, defaultConfig } from '@formkit/vue'


import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/authStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(plugin, defaultConfig)

const initializeApp = async () => {
  const authStore = useAuthStore(pinia)
  try {
    await authStore.initialize()
    app.mount('#app')
  } catch (error) {
    console.error('Failed to initialize auth store:', error)
    app.mount('#app')
  }
}

initializeApp()
