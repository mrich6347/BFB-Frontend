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
        class="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-lg transition-transform duration-300 max-h-[80vh] flex flex-col"
        :class="isClosing ? 'translate-y-full' : 'translate-y-0'"
        @click.stop
        style="padding-bottom: max(1rem, calc(1rem + env(safe-area-inset-bottom)));"
      >
        <!-- Header -->
        <div class="px-4 py-4 border-b border-border flex-shrink-0">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Auto-Assign</h3>
              <p class="text-xs text-muted-foreground mt-0.5">Apply saved configurations</p>
            </div>
            <button @click="handleClose" class="p-2 hover:bg-accent rounded-md">
              <XIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <!-- Loading State -->
          <div v-if="isApplying" class="flex flex-col items-center justify-center py-12 space-y-3">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p class="text-sm text-muted-foreground">{{ applyingMessage }}</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="!configurations || configurations.length === 0" class="flex flex-col items-center justify-center py-12 space-y-3">
            <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <ZapIcon class="h-8 w-8 text-muted-foreground" />
            </div>
            <div class="text-center">
              <p class="font-medium text-foreground">No Configurations</p>
              <p class="text-sm text-muted-foreground mt-1">Create auto-assign configurations on desktop</p>
            </div>
          </div>

          <!-- Configuration List -->
          <div v-else class="space-y-2">
            <button
              v-for="config in configurations"
              :key="config.name"
              @click="handleApplyConfiguration(config)"
              :disabled="isApplying || readyToAssign < config.total_amount"
              class="w-full px-4 py-4 bg-card rounded-lg border border-border hover:bg-accent transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-foreground truncate">{{ config.name }}</div>
                  <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>{{ config.item_count }} {{ config.item_count === 1 ? 'category' : 'categories' }}</span>
                    <span>•</span>
                    <span>{{ formatCurrency(config.total_amount) }}</span>
                  </div>
                  <div v-if="readyToAssign < config.total_amount" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                    Insufficient funds
                  </div>
                </div>
                <div class="flex-shrink-0">
                  <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <ZapIcon class="h-5 w-5 text-primary" />
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        <!-- Success Toast -->
        <Teleport to="body">
          <div
            v-if="showSuccessToast"
            class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] transition-all duration-300"
            :class="showSuccessToast ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'"
          >
            <div class="bg-emerald-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2">
              <CheckCircleIcon class="h-5 w-5" />
              <span class="font-medium">Configuration Applied!</span>
            </div>
          </div>
        </Teleport>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XIcon, ZapIcon, CheckCircleIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import { useBudgetStore } from '@/stores/budget.store'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import { useCategoryStore } from '@/stores/category.store'
import { useApplyAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useApplyAutoAssignConfiguration'
import type { AutoAssignConfigurationSummary } from '@/services/auto-assign.service'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  applied: [categoryIds: string[]]
}>()

const budgetStore = useBudgetStore()
const autoAssignStore = useAutoAssignStore()
const categoryStore = useCategoryStore()
const { applyConfiguration } = useApplyAutoAssignConfiguration()

const isClosing = ref(false)
const isApplying = ref(false)
const applyingMessage = ref('')
const showSuccessToast = ref(false)

// Computed properties
const configurations = computed(() => autoAssignStore.configurations)
const readyToAssign = computed(() => budgetStore.readyToAssign)

// Reset state when modal opens
watch(() => props.show, (newValue) => {
  if (newValue) {
    isClosing.value = false
    isApplying.value = false
    showSuccessToast.value = false
  }
})

const handleClose = () => {
  if (isApplying.value) return
  
  isClosing.value = true
  setTimeout(() => {
    emit('close')
  }, 300)
}

const handleApplyConfiguration = async (config: AutoAssignConfigurationSummary) => {
  if (isApplying.value || readyToAssign.value < config.total_amount) return

  try {
    isApplying.value = true
    applyingMessage.value = `Applying ${config.name}...`

    const result = await applyConfiguration({
      name: config.name,
      budget_id: budgetStore.currentBudget!.id
    })

    // Update category balances
    if (result.appliedCategories && result.appliedCategories.length > 0) {
      // Refresh category balances to show updated values
      const categoryIds = result.appliedCategories.map(c => c.category_id)
      
      // Update each category balance optimistically
      result.appliedCategories.forEach(({ category_id, amount }) => {
        const currentBalance = categoryStore.categoryBalances.find(b => b.category_id === category_id)
        if (currentBalance) {
          categoryStore.updateCategoryBalance(category_id, {
            ...currentBalance,
            assigned: (currentBalance.assigned || 0) + amount,
            available: (currentBalance.available || 0) + amount
          })
        }
      })

      // Emit event for flash animation
      emit('applied', categoryIds)
    }

    // Show success toast
    showSuccessToast.value = true
    setTimeout(() => {
      showSuccessToast.value = false
    }, 2000)

    // Close modal after a brief delay
    setTimeout(() => {
      handleClose()
    }, 1500)

  } catch (error) {
    console.error('Failed to apply configuration:', error)
    applyingMessage.value = 'Failed to apply configuration'
    await new Promise(resolve => setTimeout(resolve, 1500))
    isApplying.value = false
  }
}
</script>

