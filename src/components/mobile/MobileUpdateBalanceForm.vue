<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
      <button @click="$emit('close')" class="p-2">
        <ChevronLeftIcon class="h-5 w-5" />
      </button>
      <h2 class="text-lg font-semibold">Update Balance</h2>
      <div class="w-[60px]"></div>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-auto p-4 space-y-4" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">

      <!-- Account Name -->
      <div class="text-center py-4">
        <div class="text-sm text-muted-foreground mb-1">{{ accountName }}</div>
        <div class="text-2xl font-bold">Current: {{ formatCurrency(currentBalance) }}</div>
      </div>

      <!-- New Balance -->
      <MobileCurrencyInput
        v-model="newBalance"
        label="New Balance"
        :autofocus="true"
      />

      <!-- Info -->
      <div class="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        Enter the current balance of this account as shown in your bank or institution.
      </div>

      <!-- Save Button -->
      <div class="pt-4">
        <button
          @click="handleSubmit"
          :disabled="!isValid || isLoading"
          class="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          :class="isLoading ? 'animate-pulse' : 'hover:bg-primary/90'"
        >
          {{ isLoading ? 'Saving...' : 'Save' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeftIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import MobileCurrencyInput from './MobileCurrencyInput.vue'

const props = defineProps<{
  accountId: string
  accountName: string
  currentBalance: number
}>()

const emit = defineEmits<{
  close: []
  save: [accountId: string, newBalance: number]
}>()

const newBalance = ref<number | null>(props.currentBalance)
const isLoading = ref(false)

const isValid = computed(() => {
  return newBalance.value !== null && newBalance.value !== props.currentBalance
})

const handleSubmit = async () => {
  if (!isValid.value || isLoading.value) return

  isLoading.value = true
  
  try {
    emit('save', props.accountId, newBalance.value!)
    
    // Keep loading state until parent closes the form
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoading.value = false
  }
}
</script>

