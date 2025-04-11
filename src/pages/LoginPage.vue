<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-900">
    <div class="flex flex-col md:flex-row w-full max-w-5xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
      <!-- Left side: Brand messaging & Image -->
      <div class="w-full md:w-1/2 relative text-white flex flex-col justify-between p-8 sm:p-12 bg-cover bg-center" style="background-image: url('/path/to/your/dune-image.jpg');">
        <!-- Dark overlay -->
        <div class="absolute inset-0 bg-gray-900/20 dark:bg-black/50 z-0"></div>

        <!-- Animated Blobs -->
        <div class="absolute inset-0 overflow-hidden z-0">
          <div class="blob blob1"></div>
          <div class="blob blob2"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 flex justify-between items-start">
          <h2 class="text-2xl font-bold">BFB</h2>
          <a @click="router.push('/')" class="text-sm bg-white/20 dark:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-lg hover:bg-white/30 dark:hover:bg-black/40 transition-colors">&larr; Back to website</a>
        </div>

        <div class="relative z-10 mt-auto max-w-md space-y-4">
          <h1 class="text-4xl md:text-5xl font-bold tracking-tight">Capturing Moments, Creating Memories</h1>
          <p class="text-lg opacity-80">Your finances, simplified and visualized.</p>
          <div class="h-1 w-16 bg-white/50 rounded-full"></div>
        </div>
      </div>

      <!-- Right side: Form -->
      <div class="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-10 md:p-12 bg-white dark:bg-gray-800">
        <div class="w-full max-w-md space-y-6">
          <div class="text-left space-y-2">
            <h2 class="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
            <p class="text-gray-600 dark:text-gray-400">
              Ready to manage your budget?
              <span class="text-primary font-medium">Log in below.</span>
            </p>
          </div>

          <div v-if="errorMessage" class="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700/50 text-red-700 dark:text-red-200 p-4 rounded-lg text-sm flex items-center space-x-3 animate-in fade-in">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0 text-red-500 dark:text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div class="space-y-1.5">
              <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
              <input
                type="email"
                id="email"
                v-model="email"
                required
                placeholder="you@example.com"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 transition duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <a href="#" class="text-xs text-primary hover:underline font-medium">Forgot password?</a>
              </div>
              <input
                type="password"
                id="password"
                v-model="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-gray-100 transition duration-200 ease-in-out placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>

            <button
              type="submit"
              class="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-semibold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-gray-800 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-md"
            >
              Sign In
            </button>
          </form>

          <div class="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?
              <router-link to="/signup" class="text-primary font-medium hover:underline">Create one here</router-link>
            </p>
          </div>
          <!-- Placeholder for Social Logins -->
          <!-- <div class="relative my-4">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">Or continue with</span>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <button class="inline-flex w-full justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">Google</button>
            <button class="inline-flex w-full justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">Apple</button>
          </div> -->
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { AuthError } from '@supabase/supabase-js'

const router = useRouter()
const route = useRoute()
const email = ref('')
const password = ref('')
const errorMessage = ref<string | null>(null)

onMounted(() => {
  // Check for error message in query params (e.g., from ban redirect)
  if (route.query.error) {
    errorMessage.value = route.query.error as string
  }
})

const handleLogin = async () => {
  errorMessage.value = null
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })
    if (error) throw error
    router.push('/dashboard')
  } catch (error) {
    console.error('Login failed:', error)
    if (error instanceof AuthError) {
      errorMessage.value = `Login failed: ${error.message}`
    } else if (error instanceof Error) {
        errorMessage.value = `An error occurred: ${error.message}`;
    } else {
      errorMessage.value = 'An unexpected error occurred during login.'
    }
  }
}
</script>

<style scoped>
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0.3; /* Lower opacity */
  will-change: transform;
  animation: pulse 15s infinite ease-in-out alternate;
}

.blob1 {
  width: 300px;
  height: 300px;
  background-color: rgba(168, 85, 247, 0.5); /* Purple, adjusted alpha */
  top: -50px;
  left: -80px;
  animation-delay: 0s;
}

.blob2 {
  width: 250px;
  height: 250px;
  background-color: rgba(99, 102, 241, 0.5); /* Indigo, adjusted alpha */
  bottom: -50px;
  right: -60px;
  animation-delay: -5s; /* Offset animation timing */
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.2;
  }
  50% {
    transform: scale(1.3) rotate(20deg);
    opacity: 0.4;
  }
}

/* Ensure content stays above blobs */
.relative.z-10 {
  position: relative;
  z-index: 10;
}
</style> 