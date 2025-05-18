<template>
  <div class="min-h-screen flex flex-col bg-background text-foreground overflow-hidden">

    <!-- ================= NAVBAR ================= -->
    <header class="w-full py-4 z-20">
      <div class="container mx-auto px-4 flex items-center justify-between">
        <!-- Brand -->
        <button class="flex items-center gap-2 font-bold text-lg" @click="router.push('/')">
          <WalletIcon class="h-6 w-6 text-primary" /> BFB
        </button>

        <!-- Actions -->
        <div class="flex items-center gap-4">
          <ThemeToggle size="sm" />
          <template v-if="!user">
            <Button variant="ghost" size="sm" @click="handleLogin">Login</Button>
            <Button size="sm" @click="handleSignUp">Sign&nbsp;Up</Button>
          </template>
          <template v-else>
            <Button size="sm" @click="router.push('/dashboard')">Dashboard</Button>
          </template>
        </div>
      </div>
    </header>

    <!-- ================= HERO ================= -->
    <section class="relative overflow-hidden pt-24 pb-48 md:pb-56">
      <!-- Animated Glow Background -->
      <div ref="heroGlow" class="absolute left-1/2 top-0 -translate-x-1/2 -z-10 h-[600px] w-[600px] rounded-full bg-primary/20 blur-3xl opacity-60"></div>

      <div class="container mx-auto px-4 flex flex-col-reverse md:flex-row items-center gap-16">
        <!-- Illustration -->
        <div class="flex-1 w-full max-w-lg md:max-w-none">
          <FinanceIllustration />
        </div>

        <!-- Headline & CTA -->
        <div class="flex-1 text-center md:text-left">
          <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 animate-fade-in-up">
            Take&nbsp;Charge of <span class="text-primary">Every&nbsp;Dollar</span>
          </h1>
          <p class="text-xl md:text-2xl text-muted-foreground mb-10 max-w-xl mx-auto md:mx-0 animate-fade-in-up animation-delay-200">
            Plan, track and smash your financial goals with BFB's effortless budgeting experience.
          </p>

          <div class="flex flex-wrap justify-center md:justify-start gap-4 animate-fade-in-up animation-delay-400">
            <Button size="lg" @click="handleSignUp" v-if="!user">Get&nbsp;Started&nbsp;Free</Button>
            <Button size="lg" variant="secondary" @click="handleLogin" v-if="!user">Login</Button>
            <Button size="lg" @click="router.push('/dashboard')" v-else>Go&nbsp;to&nbsp;Dashboard</Button>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= STATS ================= -->
    <section class="relative -mt-24 md:-mt-32 z-10">
      <div class="container mx-auto px-4">
        <StatsSection />
      </div>
    </section>

    <!-- Features Section -->
    <Section variant="muted">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">Why Choose BFB?</h2>
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Feature 1 -->
        <Card class="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl">
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
        <Card class="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl">
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
        <Card class="transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-xl">
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
    <Section class="overflow-hidden">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">How It Works</h2>
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Step 1 -->
        <div class="flex flex-col items-center text-center animate-fade-in-up">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">1</div>
          <h3 class="text-xl font-semibold mb-2 text-foreground">Create Your Budget</h3>
          <p class="text-muted-foreground">Set up your income, expenses, and savings goals in minutes.</p>
        </div>
        
        <!-- Step 2 -->
        <div class="flex flex-col items-center text-center animate-fade-in-up animation-delay-200">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">2</div>
          <h3 class="text-xl font-semibold mb-2 text-foreground">Track Spending</h3>
          <p class="text-muted-foreground">Log your transactions and see where your money is going.</p>
        </div>
        
        <!-- Step 3 -->
        <div class="flex flex-col items-center text-center animate-fade-in-up animation-delay-400">
          <div class="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold mb-4">3</div>
          <h3 class="text-xl font-semibold mb-2 text-foreground">Reach Your Goals</h3>
          <p class="text-muted-foreground">Watch your savings grow as you stay on track with your budget.</p>
        </div>
      </div>
    </Section>

    <!-- Testimonials Section -->
    <Section variant="muted" class="overflow-hidden">
      <TestimonialsSection />
    </Section>

    <!-- CTA Section -->
    <Section variant="primary" class="relative overflow-hidden">
      <div class="text-center relative z-10">
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
import { PlusIcon, PencilIcon, HeadphonesIcon, WalletIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { onMounted, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { animate } from 'motion'

// Import shadcn components
import Button from '@/components/shadcn-ui/button.vue'
import Card from '@/components/shadcn-ui/card.vue'
import CardHeader from '@/components/shadcn-ui/card-header.vue'
import CardTitle from '@/components/shadcn-ui/card-title.vue'
import CardContent from '@/components/shadcn-ui/card-content.vue'
import Section from '@/components/shadcn-ui/section.vue'

// Landing additions
import StatsSection from '@/components/landing/StatsSection.vue'
import TestimonialsSection from '@/components/landing/TestimonialsSection.vue'
import FinanceIllustration from '@/components/landing/FinanceIllustration.vue'

const router = useRouter()
const user = ref<User | null>(null)
const heroGlow = ref<HTMLElement | null>(null)

onMounted(async () => {
  const { data: { user: authUser } } = await supabase.auth.getUser()
  user.value = authUser

  // Animate the hero glow background
  if (heroGlow.value) {
    animate(
      heroGlow.value as any,
      { scale: [1, 1.3, 1], rotate: [0, 45, 0] } as any,
      { duration: 20, easing: 'ease-in-out', repeat: Infinity } as any
    )
  }
})

const handleLogin = () => {
  router.push('/login')
}

const handleSignUp = () => {
  router.push('/signup')
}
</script>

<style scoped>
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fadeInUp 0.8s ease-out forwards;
  opacity: 0; /* Start hidden */
}

/* Simple utility classes for animation delay */
.animation-delay-200 {
  animation-delay: 200ms;
}

.animation-delay-400 {
  animation-delay: 400ms;
}
</style>