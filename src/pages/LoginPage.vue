<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-background">
    <Card class="w-full max-w-md md:max-w-4xl overflow-hidden flex flex-col md:flex-row">
      <!-- Left section with branding and background -->
      <div class="w-full md:w-1/2 relative text-white p-8 sm:p-12 bg-gradient-to-br from-primary/90 to-primary/70">
        <!-- Animated Blobs -->
        <div class="absolute inset-0 overflow-hidden z-0">
          <div class="blob blob1"></div>
          <div class="blob blob2"></div>
        </div>

        <!-- Content -->
        <div class="relative z-10 flex justify-between items-start">
          <h2 class="text-2xl font-bold">BFB</h2>
          <Button @click="router.push('/')" variant="outline" size="sm" class="text-white border-white/30 bg-white/10 hover:bg-white/20">
            <ArrowLeft class="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>

        <div class="relative z-10 mt-auto max-w-md space-y-4">
          <h1 class="text-4xl md:text-5xl font-bold tracking-tight mt-10">Budget Friendly Budget</h1>
          <p class="text-lg opacity-80">Your finances, simplified and visualized.</p>
          <div class="h-1 w-16 bg-white/50 rounded-full"></div>
          <p class="text-white/80">Manage expenses, track spending habits, and achieve your financial goals all in one place.</p>
        </div>
      </div>

      <!-- Right section with login form -->
      <CardContent class="w-full md:w-1/2 p-6 sm:p-10 md:p-12 bg-card">
        <div class="w-full space-y-6">
          <div class="text-left space-y-2">
            <h2 class="text-3xl font-bold text-foreground">Welcome Back</h2>
            <p class="text-muted-foreground">
              Ready to manage your budget?
              <span class="text-primary font-medium">Log in below.</span>
            </p>
          </div>

          <div v-if="errorMessage" class="bg-destructive/10 border border-destructive/30 text-destructive p-4 rounded-lg text-sm flex items-center space-x-3 animate-in fade-in">
            <AlertCircle class="h-5 w-5 flex-shrink-0" />
            <span>{{ errorMessage }}</span>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-5">
            <div class="space-y-1.5">
              <label for="email" class="block text-sm font-medium text-foreground">Email Address</label>
              <input
                type="email"
                id="email"
                v-model="email"
                required
                placeholder="you@example.com"
                class="w-full px-4 py-2.5 rounded-md border border-input bg-background text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div class="space-y-1.5">
              <div class="flex items-center justify-between">
                <label for="password" class="block text-sm font-medium text-foreground">Password</label>
                <a href="#" class="text-xs text-primary hover:underline font-medium">Forgot password?</a>
              </div>
              <input
                type="password"
                id="password"
                v-model="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-2.5 rounded-md border border-input bg-background text-foreground shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <Button 
              type="submit" 
              class="w-full"
            >
              Sign In
            </Button>
          </form>

          <div class="text-center pt-4 border-t border-border">
            <p class="text-sm text-muted-foreground">
              Don't have an account?
              <router-link to="/signup" class="text-primary font-medium hover:underline">Create one here</router-link>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { AuthError } from '@supabase/supabase-js'
import { ArrowLeft, AlertCircle } from 'lucide-vue-next'
import Card from '@/components/shadcn-ui/card.vue'
import CardContent from '@/components/shadcn-ui/card-content.vue'
import Button from '@/components/shadcn-ui/button.vue'

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
  opacity: 0.3;
  will-change: transform;
  animation: pulse 15s infinite ease-in-out alternate;
}

.blob1 {
  width: 300px;
  height: 300px;
  background-color: rgba(255, 255, 255, 0.3);
  top: -50px;
  left: -80px;
  animation-delay: 0s;
}

.blob2 {
  width: 250px;
  height: 250px;
  background-color: rgba(255, 255, 255, 0.2);
  bottom: -50px;
  right: -60px;
  animation-delay: -5s;
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
</style> 