<template>
  <nav
    class="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    :class="[
      scrolled ? 'py-2 bg-background/80 backdrop-blur-lg shadow-md' : 'py-4 bg-transparent',
      'dark:border-border/20'
    ]"
  >
    <div class="container mx-auto px-4 flex items-center justify-between">
      <!-- Logo -->
      <div class="flex items-center">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold mr-2">
          B
        </div>
        <span class="text-xl font-bold text-foreground">BFB</span>
      </div>

      <!-- Desktop Navigation -->
      <div class="hidden md:flex items-center space-x-8">
        <a
          v-for="(item, index) in navItems"
          :key="index"
          href="#"
          class="text-foreground/80 hover:text-foreground transition-colors relative group"
          @click.prevent="scrollToSection(item.target)"
        >
          {{ item.label }}
          <span class="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
        </a>
      </div>

      <!-- Right Side Actions -->
      <div class="flex items-center space-x-4">
        <ThemeToggle size="sm" />

        <div class="hidden md:block">
          <Button
            v-if="!user"
            @click="handleLogin"
            variant="ghost"
            size="sm"
            class="mr-2"
          >
            Login
          </Button>

          <Button
            v-if="!user"
            @click="handleSignUp"
            variant="default"
            size="sm"
          >
            Sign Up
          </Button>

          <Button
            v-else
            @click="router.push('/dashboard')"
            variant="default"
            size="sm"
          >
            Dashboard
          </Button>
        </div>

        <!-- Mobile Menu Button -->
        <button
          class="md:hidden text-foreground"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <MenuIcon v-if="!mobileMenuOpen" class="h-6 w-6" />
          <XIcon v-else class="h-6 w-6" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden absolute top-full left-0 right-0 bg-background/95 backdrop-blur-lg border-b border-border/20 shadow-lg"
      ref="mobileMenu"
    >
      <div class="container mx-auto px-4 py-4">
        <div class="flex flex-col space-y-4">
          <a
            v-for="(item, index) in navItems"
            :key="index"
            href="#"
            class="text-foreground py-2 border-b border-border/10"
            @click.prevent="scrollToSection(item.target); mobileMenuOpen = false"
          >
            {{ item.label }}
          </a>

          <div class="pt-2 flex flex-col space-y-2">
            <Button
              v-if="!user"
              @click="handleLogin"
              variant="outline"
              class="w-full"
            >
              Login
            </Button>

            <Button
              v-if="!user"
              @click="handleSignUp"
              variant="default"
              class="w-full"
            >
              Sign Up
            </Button>

            <Button
              v-else
              @click="router.push('/dashboard')"
              variant="default"
              class="w-full"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { MenuIcon, XIcon } from 'lucide-vue-next'
import { animate } from 'motion'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import Button from '@/components/shadcn-ui/button.vue'

const props = defineProps<{
  user: User | null
}>()

const router = useRouter()
const scrolled = ref(false)
const mobileMenuOpen = ref(false)
const mobileMenu = ref(null)

const navItems = [
  { label: 'Features', target: 'features' },
  { label: 'How It Works', target: 'how-it-works' },
  { label: 'Get Started', target: 'cta' }
]

const handleScroll = () => {
  scrolled.value = window.scrollY > 20
}

const scrollToSection = (id: string) => {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' })
  }
}

const handleLogin = () => {
  router.push('/login')
}

const handleSignUp = () => {
  router.push('/signup')
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  // Animation for mobile menu
  watch(mobileMenuOpen, (isOpen) => {
    if (isOpen && mobileMenu.value) {
      animate(
        mobileMenu.value,
        { opacity: [0, 1], y: [-20, 0] },
        { duration: 0.3, easing: 'ease-out' }
      )
    }
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Any additional styles can go here */
</style>
