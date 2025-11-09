<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-black/50 transition-opacity"
      :class="isClosing ? 'opacity-0' : 'opacity-100'"
      @click="handleClose"
    >
      <!-- Modal that slides up from bottom -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-lg transition-transform duration-300"
        :class="isClosing ? 'translate-y-full' : 'translate-y-0'"
        @click.stop
        style="padding-bottom: max(1rem, env(safe-area-inset-bottom));"
      >
        <!-- Header -->
        <div class="px-4 py-4 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ category?.name }}</h3>
            <button @click="handleClose" class="p-2 hover:bg-accent rounded-md">
              <XIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
          <!-- Currently Available -->
          <div class="text-center">
            <div class="text-sm text-muted-foreground mb-1">Currently Available</div>
            <div class="text-3xl font-bold" :class="getAvailableColorClass(category?.available || 0)">
              {{ formatCurrency(category?.available || 0) }}
            </div>
          </div>

          <!-- Add/Subtract Toggle -->
          <div class="grid grid-cols-2 gap-3">
            <button
              @click="mode = 'add'"
              :class="[
                'py-4 rounded-lg font-semibold text-2xl transition-all border-2',
                'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
                mode === 'add'
                  ? 'border-emerald-600 dark:border-emerald-400'
                  : 'border-transparent'
              ]"
            >
              +
            </button>
            <button
              @click="mode = 'subtract'"
              :class="[
                'py-4 rounded-lg font-semibold text-2xl transition-all border-2',
                'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20',
                mode === 'subtract'
                  ? 'border-red-600 dark:border-red-400'
                  : 'border-transparent'
              ]"
            >
              −
            </button>
          </div>

          <!-- Amount Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium">
              {{ mode === 'add' ? 'Amount to Add' : 'Amount to Subtract' }}
            </label>
            <input
              v-model="amount"
              type="number"
              inputmode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              class="w-full px-4 py-3 border border-input rounded-md bg-background text-lg"
            />
          </div>

          <!-- Save Button -->
          <button
            @click="handleSave"
            :disabled="!amount || amount <= 0 || isLoading"
            class="w-full py-3 bg-primary text-primary-foreground rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isLoading" class="inline-block animate-spin">⏳</span>
            <span v-else>Save Changes</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import type { CategoryResponse } from '@/types/DTO/category.dto'

const props = defineProps<{
  show: boolean
  category: CategoryResponse | null
}>()

const emit = defineEmits<{
  close: []
  save: [categoryId: string, newAssigned: number]
}>()

const mode = ref<'add' | 'subtract'>('add')
const amount = ref<number | null>(null)
const isLoading = ref(false)
const isClosing = ref(false)

const getAvailableColorClass = (available: number) => {
  if (available > 0) {
    return 'text-emerald-600 dark:text-emerald-400 font-semibold'
  } else if (available < 0) {
    return 'text-red-600 dark:text-red-400 font-semibold'
  }
  return 'text-muted-foreground'
}

const handleClose = async () => {
  isClosing.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  isClosing.value = false
  emit('close')
}

const handleSave = async () => {
  if (!props.category || !amount.value || amount.value <= 0 || isLoading.value) return

  isLoading.value = true

  try {
    const currentAssigned = props.category.assigned || 0
    const changeAmount = mode.value === 'add' ? amount.value : -amount.value
    const newAssigned = Math.max(0, currentAssigned + changeAmount)

    emit('save', props.category.id, newAssigned)

    // Keep loading state briefly for feedback
    await new Promise(resolve => setTimeout(resolve, 300))

    // Animate close
    await handleClose()
  } finally {
    isLoading.value = false
  }
}

// Reset when category changes
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    mode.value = 'add'
    amount.value = null
    isClosing.value = false
  }
}, { immediate: true })
</script>

