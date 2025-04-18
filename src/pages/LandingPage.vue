<template>
  <div class="min-h-screen bg-background text-foreground">
    <!-- Theme Toggle -->
    <div class="flex justify-start mt-4 ml-4">
      <ThemeToggle size="sm"/>
    </div>
    
    <!-- Hero Section -->
    <Section class="text-center">
      <h1 class="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
        Budget Friendly Budget
      </h1>
      <p class="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
        Take control of your finances with our simple, intuitive budgeting tool
      </p>
      <!-- Add Login/Sign Up Buttons -->
      <div class="flex flex-wrap justify-center gap-4" v-if="!user">
        <Button @click="handleLogin" variant="default" size="lg">
          Login
        </Button>
        <Button @click="handleSignUp" variant="secondary" size="lg">
          Sign Up
        </Button>
      </div>
      <div v-else class="text-lg text-foreground">
        <div>
          Welcome back, {{ user?.email }}! 🎉
        </div>
        <div class="mt-4">
          <Button @click="router.push('/dashboard')" size="lg">
            Go To Dashboard
          </Button>
        </div>
      </div>
    </Section>

    <!-- Features Section -->
    <Section variant="muted">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Why Choose BFB?</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <Card>
          <CardHeader>
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <PlusIcon class="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Easy Budgeting</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">Create custom budget categories and track your spending with just a few clicks.</p>
          </CardContent>
        </Card>
        
        <!-- Feature 2 -->
        <Card>
          <CardHeader>
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <PencilIcon class="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Financial Goals</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">Set and track your financial goals to help you save for what matters most.</p>
          </CardContent>
        </Card>
        
        <!-- Feature 3 -->
        <Card>
          <CardHeader>
            <div class="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <HeadphonesIcon class="h-6 w-6 text-primary" />
            </div>
            <CardTitle>24/7 Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p class="text-muted-foreground">Our team is always available to help you manage your finances better.</p>
          </CardContent>
        </Card>
      </div>
    </Section>

    <!-- How It Works Section -->
    <Section>
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">How It Works</h2>
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Step 1 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">1</div>
          <h3 class="text-xl font-semibold mb-2 text-foreground">Create Your Budget</h3>
          <p class="text-muted-foreground">Set up your income, expenses, and savings goals in minutes.</p>
        </div>
        
        <!-- Step 2 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">2</div>
          <h3 class="text-xl font-semibold mb-2 text-foreground">Track Spending</h3>
          <p class="text-muted-foreground">Log your transactions and see where your money is going.</p>
        </div>
        
        <!-- Step 3 -->
        <div class="flex flex-col items-center text-center">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">3</div>
          <h3 class="text-xl font-semibold mb-2 text-foreground">Reach Your Goals</h3>
          <p class="text-muted-foreground">Watch your savings grow as you stay on track with your budget.</p>
        </div>
      </div>
    </Section>

    <!-- CTA Section -->
    <Section variant="primary">
      <div class="text-center">
        <h2 class="text-3xl md:text-4xl font-bold mb-6">Ready to Take Control of Your Finances?</h2>
        <p class="text-xl max-w-2xl mx-auto mb-8 text-primary-foreground/90">Join thousands of users who have transformed their financial future with BFB.</p>
        <Button 
          @click="handleSignUp" 
          variant="outline" 
          size="lg"
          class="bg-background/10 backdrop-blur-sm hover:bg-background/20 border-primary-foreground/20"
        >
          Start Budgeting Now
        </Button>
      </div>
    </Section>

    <!-- Footer -->
    <footer class="bg-card border-t border-border py-10">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <p class="font-bold text-lg text-card-foreground">Budget Friendly Budget</p>
            <p class="text-muted-foreground text-sm">© 2023 BFB. All rights reserved.</p>
          </div>
          <div class="flex space-x-4">
            <a href="#" class="text-muted-foreground hover:text-foreground transition-colors">Terms</a>
            <a href="#" class="text-muted-foreground hover:text-foreground transition-colors">Privacy</a>
            <a href="#" class="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
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

// Import shadcn components
import Button from '@/components/shadcn-ui/button.vue'
import Card from '@/components/shadcn-ui/card.vue'
import CardHeader from '@/components/shadcn-ui/card-header.vue'
import CardTitle from '@/components/shadcn-ui/card-title.vue'
import CardContent from '@/components/shadcn-ui/card-content.vue'
import Section from '@/components/shadcn-ui/section.vue'

const router = useRouter()
const user = ref<User | null>(null)

onMounted(async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  user.value = authUser
})

const handleLogin = () => {
  router.push('/login')
}

const handleSignUp = () => {
  router.push('/signup')
}
</script>