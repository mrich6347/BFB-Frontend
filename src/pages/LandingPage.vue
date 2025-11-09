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
    <section class="relative overflow-hidden pt-24 pb-32 md:pb-40">
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
            Budget <span class="text-primary">Friendly</span> Budget
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

    <!-- ================= FEATURES OVERVIEW ================= -->
    <section class="py-16 md:py-20">
      <div class="container mx-auto px-4">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            Everything You Need to Master Your Money
          </h2>
          <p class="text-lg text-muted-foreground max-w-2xl mx-auto">
            BFB combines powerful budgeting tools with collaborative features to help you achieve your financial goals faster than ever before.
          </p>
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-5 gap-8 max-w-7xl mx-auto">
          <!-- Feature 1 -->
          <div class="text-center group">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <div class="w-8 h-8 bg-primary rounded-lg"></div>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-foreground">Smart Budgeting</h3>
            <p class="text-muted-foreground">Organize your budget with intelligent category management and real-time balance tracking.</p>
          </div>

          <!-- Feature 2 -->
          <div class="text-center group">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <div class="w-8 h-8 bg-primary rounded-lg"></div>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-foreground">Investment Tracking</h3>
            <p class="text-muted-foreground">Track your investments and watch your portfolio grow with detailed analytics.</p>
          </div>

          <!-- Feature 3 -->
          <div class="text-center group">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <div class="w-8 h-8 bg-primary rounded-lg"></div>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-foreground">Retirement Planning</h3>
            <p class="text-muted-foreground">Plan your future with powerful retirement calculators and projection tools.</p>
          </div>

          <!-- Feature 4 -->
          <div class="text-center group">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <div class="w-8 h-8 bg-primary rounded-lg"></div>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-foreground">Shared Goals</h3>
            <p class="text-muted-foreground">Collaborate with family and friends on shared financial goals and savings targets.</p>
          </div>

          <!-- Feature 5 -->
          <div class="text-center group">
            <div class="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary/20 transition-colors">
              <div class="w-8 h-8 bg-primary rounded-lg"></div>
            </div>
            <h3 class="text-xl font-semibold mb-3 text-foreground">Net Worth Tracking</h3>
            <p class="text-muted-foreground">Monitor your complete financial picture with comprehensive net worth tracking and insights.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CATEGORY BUDGETING FEATURE ================= -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row items-center gap-16">
          <!-- Content -->
          <div class="flex-1 text-center lg:text-left">
            <h2 class="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Smart Category <span class="text-primary">Budgeting</span>
            </h2>
            <p class="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Organize your finances with intuitive category-based budgeting. Assign every dollar a purpose and watch your financial goals come to life with our clean, modern interface.
            </p>
            <div class="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Custom Categories</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Real-time Tracking</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Ready to Assign</span>
              </div>
            </div>
          </div>

          <!-- Image Showcase -->
          <div class="flex-1 relative">
            <div class="relative max-w-2xl mx-auto">
              <!-- Main Image (Dark Mode) -->
              <img
                src="/v2/main-budget-page.png"
                alt="Main Budget Interface - Dark Mode"
                class="w-full rounded-2xl shadow-2xl border border-border/50"
              />
              <!-- Light Mode Comparison (Floating) -->
              <div class="absolute -bottom-4 -right-4 w-1/2 opacity-90">
                <img
                  src="/v2/main-budget-page-light.png"
                  alt="Main Budget Interface - Light Mode"
                  class="w-full rounded-xl shadow-xl border border-border/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= INVESTMENT TRACKING FEATURE ================= -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row-reverse items-center gap-16">
          <!-- Content -->
          <div class="flex-1 text-center lg:text-left">
            <h2 class="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Track Your <span class="text-primary">Investments</span>
            </h2>
            <p class="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Monitor your investment portfolio with ease. Track stocks, bonds, and other assets, visualize performance over time, and make data-driven decisions to grow your wealth.
            </p>
            <div class="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Portfolio Tracking</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Performance Analytics</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Asset Allocation</span>
              </div>
            </div>
          </div>

          <!-- Image Showcase -->
          <div class="flex-1 relative">
            <div class="relative max-w-2xl mx-auto">
              <img
                src="/v2/track-investments-page.png"
                alt="Investment Tracking Interface"
                class="w-full rounded-2xl shadow-2xl border border-border/50"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= RETIREMENT PLANNING FEATURE ================= -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row items-center gap-16">
          <!-- Content -->
          <div class="flex-1 text-center lg:text-left">
            <h2 class="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Plan Your <span class="text-primary">Retirement</span>
            </h2>
            <p class="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Visualize your retirement future with powerful planning tools. Set your retirement age, track contributions, and see how compound interest works in your favor with interactive charts and projections.
            </p>
            <div class="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Retirement Calculator</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Growth Projections</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Visual Charts</span>
              </div>
            </div>
          </div>

          <!-- Image Showcase -->
          <div class="flex-1 relative">
            <div class="relative max-w-2xl mx-auto">
              <img
                src="/v2/retirement-planner-page.png"
                alt="Retirement Planning Interface"
                class="w-full rounded-2xl shadow-2xl border border-border/50"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= SHARED GOALS FEATURE ================= -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row-reverse items-center gap-16">
          <!-- Content -->
          <div class="flex-1 text-center lg:text-left">
            <h2 class="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Collaborative <span class="text-primary">Shared Goals</span>
            </h2>
            <p class="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Team up with family and friends to achieve financial goals together. Track progress, share contributions, and celebrate milestones as a group with our innovative shared savings feature.
            </p>
            <div class="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Group Savings</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Progress Tracking</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Team Collaboration</span>
              </div>
            </div>
          </div>

          <!-- Image Showcase -->
          <div class="flex-1 relative">
            <div class="relative max-w-2xl mx-auto">
              <img
                src="/shared-goals.png"
                alt="Shared Goals Interface"
                class="w-full rounded-2xl shadow-2xl border border-border/50"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= TRANSACTIONS FEATURE ================= -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row items-center gap-16">
          <!-- Content -->
          <div class="flex-1 text-center lg:text-left">
            <h2 class="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Effortless <span class="text-primary">Transaction Tracking</span>
            </h2>
            <p class="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Keep tabs on every penny with our comprehensive transaction management system. Categorize expenses, track income, and maintain a clear financial history with ease.
            </p>
            <div class="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Quick Entry</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Auto Categorization</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Detailed History</span>
              </div>
            </div>
          </div>

          <!-- Image Showcase -->
          <div class="flex-1 relative">
            <div class="relative max-w-2xl mx-auto">
              <img
                src="/transactions.png"
                alt="Transaction Management Interface"
                class="w-full rounded-2xl shadow-2xl border border-border/50"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= NET WORTH TRACKING FEATURE ================= -->
    <section class="py-16 md:py-24">
      <div class="container mx-auto px-4">
        <div class="flex flex-col lg:flex-row-reverse items-center gap-16">
          <!-- Content -->
          <div class="flex-1 text-center lg:text-left">
            <h2 class="text-3xl md:text-5xl font-bold mb-6 text-foreground">
              Complete <span class="text-primary">Net Worth</span> Tracking
            </h2>
            <p class="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
              Get a complete picture of your financial health. Track all your assets and liabilities in one place, visualize your net worth over time, and make informed decisions about your financial future.
            </p>
            <div class="flex flex-wrap justify-center lg:justify-start gap-4 mb-8">
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Asset Tracking</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Liability Management</span>
              </div>
              <div class="flex items-center gap-2 text-muted-foreground">
                <div class="w-2 h-2 bg-primary rounded-full"></div>
                <span>Visual Analytics</span>
              </div>
            </div>
          </div>

          <!-- Image Showcase -->
          <div class="flex-1 relative">
            <div class="relative max-w-2xl mx-auto">
              <img
                src="/v2/net-worth-page.png"
                alt="Net Worth Tracking Interface"
                class="w-full rounded-2xl shadow-2xl border border-border/50"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ================= CTA SECTION ================= -->
    <section class="py-16 md:py-24 relative overflow-hidden">
      <!-- Background Glow -->
      <div class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 h-[400px] w-[400px] rounded-full bg-primary/10 blur-3xl opacity-60"></div>

      <div class="container mx-auto px-4">
        <div class="text-center relative z-10 max-w-4xl mx-auto">
          <h2 class="text-3xl md:text-5xl font-bold mb-6 text-foreground">
            Ready to Take Control of Your <span class="text-primary">Finances?</span>
          </h2>
          <div class="flex flex-wrap justify-center gap-4">
            <Button size="lg" @click="handleSignUp" v-if="!user">
              Get Started Free
            </Button>
            <Button size="lg" variant="outline" @click="handleLogin" v-if="!user">
              Login
            </Button>
            <Button size="lg" @click="router.push('/dashboard')" v-else>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-border/20 py-10">
      <div class="container mx-auto px-4">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="mb-4 md:mb-0">
            <div class="flex items-center gap-2 mb-2">
              <WalletIcon class="h-5 w-5 text-primary" />
              <p class="font-bold text-lg text-foreground">Budget Friendly Budget</p>
            </div>
            <p class="text-muted-foreground text-sm">© 2024 BFB. All rights reserved.</p>
          </div>
          <div class="flex space-x-6">
            <a href="#" class="text-muted-foreground hover:text-primary transition-colors text-sm">Terms</a>
            <a href="#" class="text-muted-foreground hover:text-primary transition-colors text-sm">Privacy</a>
            <a href="#" class="text-muted-foreground hover:text-primary transition-colors text-sm">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { WalletIcon } from 'lucide-vue-next'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'
import { onMounted, ref } from 'vue'
import type { User } from '@supabase/supabase-js'
import { animate } from 'motion'

// Import shadcn components
import Button from '@/components/shadcn-ui/button.vue'

// Landing additions
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

/* Removed hover effects on images for better UX */

/* Smooth scrolling for the entire page */
html {
  scroll-behavior: smooth;
}

/* Feature section spacing */
section {
  scroll-margin-top: 2rem;
}
</style>
