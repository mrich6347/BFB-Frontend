<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-300 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] px-4 w-full max-w-sm"
        style="bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));"
      >
        <div class="bg-card border border-border rounded-lg shadow-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-medium text-muted-foreground">{{ categoryName }}</span>
          </div>
          <div class="flex items-center gap-3">
            <div class="flex-1 text-center">
              <div class="text-xs text-muted-foreground mb-1">Previous</div>
              <div
                class="text-lg font-semibold tabular-nums transition-all duration-500"
                :class="getBalanceColor(oldBalance)"
              >
                {{ formatCurrency(oldBalance) }}
              </div>
            </div>
            <div class="text-muted-foreground">→</div>
            <div class="flex-1 text-center">
              <div class="text-xs text-muted-foreground mb-1">New</div>
              <div
                class="text-lg font-semibold tabular-nums transition-all duration-500"
                :class="[getBalanceColor(displayBalance), isAnimating ? 'scale-110' : 'scale-100']"
              >
                {{ formatCurrency(displayBalance) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { formatCurrency } from '@/utils/currencyUtil'

const isVisible = ref(false)
const isAnimating = ref(false)
const categoryName = ref('')
const oldBalance = ref(0)
const newBalance = ref(0)
const displayBalance = ref(0)

let hideTimeout: ReturnType<typeof setTimeout> | null = null
let animationTimeout: ReturnType<typeof setTimeout> | null = null

const getBalanceColor = (balance: number) => {
  if (balance > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (balance < 0) return 'text-destructive'
  return 'text-muted-foreground'
}

const show = (category: string, oldBal: number, newBal: number) => {
  // Clear any existing timeouts
  if (hideTimeout) clearTimeout(hideTimeout)
  if (animationTimeout) clearTimeout(animationTimeout)

  // Set initial values
  categoryName.value = category
  oldBalance.value = oldBal
  newBalance.value = newBal
  displayBalance.value = oldBal
  isAnimating.value = false

  // Show the toast
  isVisible.value = true

  // Animate the balance change after a brief delay
  animationTimeout = setTimeout(() => {
    isAnimating.value = true
    displayBalance.value = newBal
    
    // Remove animation class after animation completes
    setTimeout(() => {
      isAnimating.value = false
    }, 500)
  }, 300)

  // Hide after 3 seconds
  hideTimeout = setTimeout(() => {
    isVisible.value = false
  }, 3000)
}

const hide = () => {
  if (hideTimeout) clearTimeout(hideTimeout)
  if (animationTimeout) clearTimeout(animationTimeout)
  isVisible.value = false
}

// Cleanup on unmount
watch(() => isVisible.value, (visible) => {
  if (!visible) {
    if (hideTimeout) clearTimeout(hideTimeout)
    if (animationTimeout) clearTimeout(animationTimeout)
  }
})

defineExpose({
  show,
  hide
})
</script>

