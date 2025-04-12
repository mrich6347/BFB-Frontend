<template>
  <div class="min-h-screen bg-background">
    <!-- Theme Toggle -->
    <div class="fixed top-4 left-4 z-50">
      <ThemeToggle />
    </div>
    <!-- Hero Section -->
    <section class="container mx-auto px-4 py-20 md:py-32 flex flex-col items-center text-center">
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight text-primary mb-6">
        Budget Friendly Budget
      </h1>
      <p class="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-10">
        Take control of your finances with our simple, intuitive budgeting tool
      </p>
      <!-- Add Login/Sign Up Buttons -->
      <div class="flex space-x-4" v-if="!user">
        <button @click="handleLogin" class="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium">
          Login
        </button>
        <button @click="handleSignUp" class="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-6 py-2 rounded-lg font-medium">
          Sign Up
        </button>
      </div>
      <div v-else class="text-lg text-muted-foreground">
        <div>
          Welcome back, {{ user?.email }}! 🎉
        </div>
        <div>
          <button @click="router.push('/dashboard')" class="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-lg font-medium mt-4">
          Go To Dashboard
        </button>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="bg-muted py-20">
      <div class="container mx-auto px-4">
        <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">Why Choose BFB?</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="bg-card p-6 rounded-xl shadow">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <PlusIcon class="h-6 w-6 text-primary" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Easy Budgeting</h3>
            <p class="text-muted-foreground">Create custom budget categories and track your spending with just a few clicks.</p>
          </div>
          
          <!-- Feature 2 -->
          <div class="bg-card p-6 rounded-xl shadow">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <PencilIcon class="h-6 w-6 text-primary" />
            </div>
            <h3 class="text-xl font-semibold mb-2">Financial Goals</h3>
            <p class="text-muted-foreground">Set and track your financial goals to help you save for what matters most.</p>
          </div>
          
          <!-- Feature 3 -->
          <div class="bg-card p-6 rounded-xl shadow">
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <HeadphonesIcon class="h-6 w-6 text-primary" />
            </div>
            <h3 class="text-xl font-semibold mb-2">24/7 Support</h3>
            <p class="text-muted-foreground">Our team is always available to help you manage your finances better.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works Section -->
    <section class="container mx-auto px-4 py-20">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Step 1 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">1</div>
          <h3 class="text-xl font-semibold mb-2">Create Your Budget</h3>
          <p class="text-muted-foreground">Set up your income, expenses, and savings goals in minutes.</p>
        </div>
        
        <!-- Step 2 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">2</div>
          <h3 class="text-xl font-semibold mb-2">Track Spending</h3>
          <p class="text-muted-foreground">Log your transactions and see where your money is going.</p>
        </div>
        
        <!-- Step 3 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">3</div>
          <h3 class="text-xl font-semibold mb-2">Reach Your Goals</h3>
          <p class="text-muted-foreground">Watch your savings grow as you stay on track with your budget.</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="bg-primary text-primary-foreground py-20">
      <div class="container mx-auto px-4 text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">Ready to Take Control of Your Finances?</h2>
        <p class="text-xl max-w-2xl mx-auto mb-8">Join thousands of users who have transformed their financial future with BFB.</p>
        <button class="bg-background text-foreground hover:bg-background/90 px-8 py-3 rounded-lg font-medium">
          Start Budgeting Now
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-background border-t border-border py-10">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <p class="font-bold text-lg">Budget Friendly Budget</p>
            <p class="text-muted-foreground text-sm">© 2023 BFB. All rights reserved.</p>
          </div>

        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { PlusIcon, PencilIcon, HeadphonesIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { onMounted, ref } from 'vue'
import type { User } from '@supabase/supabase-js'

const router = useRouter()
const user = ref<User | null>(null)

onMounted(async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  user.value = authUser
})

// Placeholder functions for button clicks
const handleLogin = () => {
  router.push('/login')
}

const handleSignUp = () => {
  router.push('/signup')
}
</script>

<style scoped>
/* Additional styles can be added here if needed */
</style>
