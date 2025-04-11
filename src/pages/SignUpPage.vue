<template>
  <div class="min-h-screen flex bg-white dark:bg-gray-900">
    <!-- Left side: Brand messaging -->
    <div class="hidden md:flex md:w-1/2 bg-gradient-to-br from-primary/90 to-primary/70 text-white flex-col justify-center items-center p-12">
      <div class="max-w-md mx-auto space-y-8">
        <h1 class="text-5xl font-bold">Budget Friendly Budget</h1>
        <p class="text-xl opacity-90">Take control of your finances with our simple yet powerful budgeting tools.</p>
        <div class="h-1 w-20 bg-white/50 rounded-full"></div>
        <p class="text-white/80">Manage expenses, track spending habits, and achieve your financial goals all in one place.</p>
      </div>
    </div>
    
    <!-- Right side: Form -->
    <div class="w-full md:w-1/2 flex items-center justify-center p-6">
      <div class="w-full max-w-md space-y-6">
        <div class="text-center space-y-2">
          <div class="flex justify-center mb-4">
            <h1 class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/80">BFB</h1>
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">Create an account</h2>
          <p class="text-gray-500 dark:text-gray-400">Enter your details to get started</p>
        </div>
      
        <!-- Error Message Display -->
        <div v-if="errorMessage" class="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-sm animate-in fade-in">
          {{ errorMessage }}
        </div>
        <!-- Success Message Display -->
        <div v-if="successMessage" class="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 p-4 rounded-xl text-sm animate-in fade-in">
          {{ successMessage }}
        </div>
        
        <form @submit.prevent="handleSignUp" :disabled="!!successMessage" class="space-y-5">
          <div class="space-y-2">
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input 
              type="email" 
              id="email" 
              v-model="email" 
              required
              placeholder="your@email.com" 
              class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div class="space-y-2">
            <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
              required
              placeholder="••••••••" 
              class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>
          
          <div class="space-y-2">
            <label for="confirmPassword" class="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
            <input 
              type="password" 
              id="confirmPassword" 
              v-model="confirmPassword" 
              required
              placeholder="••••••••" 
              class="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
            />
          </div>

          <button 
            type="submit"
            class="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!!successMessage"
          >
            Create account
          </button>
        </form>
        
        <div class="text-center pt-4">
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Already have an account? 
            <router-link to="/login" class="text-primary font-medium hover:underline">Sign in</router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { AuthError } from '@supabase/supabase-js'
import { useTheme } from '@/composables/common/useTheme'

useTheme()

const router = useRouter()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

const handleSignUp = async () => {
  errorMessage.value = null
  successMessage.value = null

  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords don't match"
    return
  }

  console.log('Attempting sign up with:', email.value)
  try {
    const { data, error } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    })
    if (error) throw error

    console.log('Sign up attempt response:', data)

    if (data.user && data.user.identities && data.user.identities.length === 0) {
      successMessage.value = 'Sign up successful! Please check your email to confirm your account.'
      setTimeout(() => router.push('/login'), 5000)
    } else if (data.session) {
        console.log('Sign up successful and user logged in:', data.session)
        successMessage.value = 'Sign up successful! Redirecting...'
        router.push('/dashboard')
    } else {
        successMessage.value = 'Sign up successful! Please check your email to confirm your account.'
         setTimeout(() => router.push('/login'), 5000)
    }

    email.value = ''
    password.value = ''
    confirmPassword.value = ''

  } catch (error) {
    console.error('Sign up failed:', error)
    if (error instanceof AuthError) {
      errorMessage.value = `Sign up failed: ${error.message}`
    } else if (error instanceof Error) {
        errorMessage.value = `An error occurred: ${error.message}`;
    } else {
      errorMessage.value = 'An unexpected error occurred during sign up.'
    }
  }
}
</script>

<style scoped>
/* Add any additional styles if needed */
</style> 