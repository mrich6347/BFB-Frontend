<template>
  <div class="w-full bg-background border-b border-border">
    <div class="container mx-auto px-2 py-2 flex flex-col md:flex-row justify-between items-center">
      <!-- Current Month Display -->
      <div class="flex items-center md:w-1/4 justify-start">
        <div class="flex flex-col items-center px-2">
          <div class="flex items-center justify-center w-full">
            <h2 class="text-lg font-semibold text-foreground text-center">{{ budgetStore.currentMonthName }}</h2>
          </div>
        </div>
      </div>

      <!-- Ready to Assign Section - Cleaner Design -->
      <div class="flex items-center mt-2 md:mt-0 md:w-2/4 justify-center">
        <div class="flex items-stretch rounded-lg shadow-sm overflow-hidden max-w-full">
          <div :class="[
            'flex flex-col justify-center px-4 py-1.5',
            readyToAssignColorClass
          ]">
            <div class="text-xs font-medium text-white">Ready to Assign</div>
            <div class="text-base font-bold text-white whitespace-nowrap">{{ formatCurrency(budgetStore.readyToAssign) }}</div>
          </div>
          <div :class="['w-px', readyToAssignColorClass]"></div>
          <button
            @click="handleAssignClick"
            :disabled="budgetStore.readyToAssign <= 0"
            :class="[
              'flex items-center px-4 cursor-pointer text-white font-medium transition-colors whitespace-nowrap',
              readyToAssignColorClass,
              budgetStore.readyToAssign <= 0 ? 'opacity-50 cursor-not-allowed' : ''
            ]">
            Assign
            <ChevronDown class="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      <!-- Empty div for spacing -->
      <div class="md:w-1/4"></div>
    </div>

    <!-- Filter Tags -->
    <div class="container mx-auto px-2 pb-2 flex flex-wrap items-center gap-1.5">
      <button
        v-for="filter in filters"
        :key="filter.id"
        :class="[
          'px-2.5 py-0.5 text-sm rounded-md transition-colors cursor-pointer',
          selectedFilter === filter.id
            ? 'bg-primary/15 text-primary'
            : 'bg-secondary text-secondary-foreground'
        ]"
        @click="selectedFilter = filter.id"
      >
        {{ filter.name }}
      </button>
    </div>
  </div>

  <!-- Assign Money Modal -->
  <AssignMoneyModal
    :is-open="showAssignModal"
    :available-categories="availableCategories"
    :position="assignModalPosition"
    :max-amount="budgetStore.readyToAssign"
    @close="showAssignModal = false"
    @assign="handleAssignMoney"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown } from 'lucide-vue-next'
import { formatCurrency } from '../../utils/currencyUtil'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { useCategoryOperations } from '@/composables/categories/useCategoryOperations'
import AssignMoneyModal from './AssignMoneyModal.vue'
import type { CategoryResponse } from '@/types/DTO/category.dto'

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const { updateCategoryBalance } = useCategoryOperations()

const selectedFilter = ref('all')

const filters = [
  { id: 'all', name: 'All' },
  { id: 'overspent', name: 'Overspent' },
  { id: 'moneyAvailable', name: 'Money Available' }
]

// Assign money modal state
const showAssignModal = ref(false)
const assignModalPosition = ref({ x: 0, y: 0 })

// Computed property for available categories
const availableCategories = computed(() => {
  return categoryStore.categories
})

// Computed property for Ready to Assign color based on value
const readyToAssignColorClass = computed(() => {
  const amount = budgetStore.readyToAssign
  if (amount === 0) {
    return 'bg-gray-500' // Grey for zero
  } else if (amount < 0) {
    return 'bg-red-600' // Red for negative
  } else {
    return 'bg-green-600' // Green for positive
  }
})

// Event handlers
const handleAssignClick = (event: MouseEvent) => {
  if (budgetStore.readyToAssign <= 0) return

  // Get the position of the clicked element for modal positioning
  const rect = (event.target as HTMLElement).getBoundingClientRect()
  assignModalPosition.value = {
    x: rect.left + rect.width / 2,
    y: rect.bottom
  }

  showAssignModal.value = true
}

const handleAssignMoney = async (categoryId: string, amount: number) => {
  // Close modal immediately for optimistic update
  showAssignModal.value = false

  try {
    // Get current month
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // Find the current assigned amount for this category in current month
    const existingBalance = categoryStore.categoryBalances.find(b =>
      b.category_id === categoryId &&
      b.year === year &&
      b.month === month
    )

    const currentAssigned = existingBalance?.assigned || 0
    const newTotalAssigned = currentAssigned + amount

    await updateCategoryBalance(categoryId, newTotalAssigned)
  } catch (error) {
    console.error('Failed to assign money:', error)
    // Note: Error handling for optimistic updates is handled in the composable
    // The UI will automatically rollback if the server operation fails
  }
}

</script>
