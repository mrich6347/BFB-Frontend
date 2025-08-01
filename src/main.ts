import './assets/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { plugin, defaultConfig } from '@formkit/vue'
import ToastPlugin from 'vue-toast-notification'
import 'vue-toast-notification/dist/theme-sugar.css'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth.store'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(plugin, defaultConfig)
app.use(ToastPlugin)

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
