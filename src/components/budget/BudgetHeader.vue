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
        :disabled="!filter.enabled"
        :class="[
          'px-2.5 py-0.5 text-sm rounded-md transition-colors',
          filter.enabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50',
          selectedFilter === filter.id && filter.enabled
            ? 'bg-primary/15 text-primary'
            : filter.enabled
            ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            : 'bg-secondary/50 text-secondary-foreground/50'
        ]"
        @click="handleFilterClick(filter)"
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
import { useUpdateCategoryBalance } from '@/composables/categories/category-write/useUpdateCategoryBalance'
import AssignMoneyModal from './AssignMoneyModal.vue'
import type { CategoryResponse } from '@/types/DTO/category.dto'

// Define emits
const emit = defineEmits<{
  filterChanged: [filter: string]
}>()

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const { updateCategoryBalance } = useUpdateCategoryBalance()

const selectedFilter = ref('all')

// Computed properties to check if filters should be enabled
const hasOverspentCategories = computed(() => {
  return categoryStore.getCategoriesWithBalances.some(category => category.available < 0)
})

const hasMoneyAvailableCategories = computed(() => {
  return categoryStore.getCategoriesWithBalances.some(category => category.available > 0)
})

const filters = computed(() => [
  { id: 'all', name: 'All', enabled: true },
  { id: 'overspent', name: 'Overspent', enabled: hasOverspentCategories.value },
  { id: 'moneyAvailable', name: 'Money Available', enabled: hasMoneyAvailableCategories.value }
])

// Assign money modal state
const showAssignModal = ref(false)
const assignModalPosition = ref({ x: 0, y: 0 })

// Computed property for available categories
const availableCategories = computed((): CategoryResponse[] => {
  return categoryStore.categories as CategoryResponse[]
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
const handleFilterClick = (filter: { id: string; name: string; enabled: boolean }) => {
  if (!filter.enabled) return

  selectedFilter.value = filter.id
  emit('filterChanged', filter.id)
}

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
