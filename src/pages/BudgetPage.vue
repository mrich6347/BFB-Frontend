<template>
  <div class="flex h-screen">
    <Sidebar :budgetId="budgetId" />
    <div class="flex-1 flex flex-col">
      <!-- Sticky Budget Header -->
      <div class="sticky top-0 z-10">
        <BudgetHeader @filter-changed="handleFilterChanged" />
      </div>
      <!-- Scrollable Category List -->
      <div class="flex-1 overflow-auto p-4">
        <BudgetCategoryList ref="categoryListRef" :active-filter="activeFilter" />
      </div>
    </div>
    <AutoAssignPanel @categories-assigned="handleCategoriesAssigned" />
  </div>
</template>


<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import BudgetHeader from '@/components/budget/BudgetHeader.vue'
import { useBudgetStore } from '@/stores/budget.store'
import { useBudgetOperations } from '@/composables/budgets/useBudgetOperations'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'
import BudgetCategoryList from '@/components/budget/BudgetCategoryList.vue'
import AutoAssignPanel from '@/components/budget/AutoAssignPanel.vue'

const route = useRoute()
const router = useRouter()
const budgetStore = useBudgetStore()
const { ensureCurrentMonth } = useBudgetOperations()
const { ensureDataLoaded } = useMainDataOperations()
const budgetId = route.params.budgetId as string

// Reference to the category list component
const categoryListRef = ref<InstanceType<typeof BudgetCategoryList> | null>(null)

// Filter state
const activeFilter = ref('all')

onMounted(async () => {
  // Ensure we're showing the current month
  ensureCurrentMonth()

  // Ensure data is loaded for this budget (will be no-op if already loaded by App.vue)
  const success = await ensureDataLoaded(budgetId)

  if (!success) {
    // If data loading failed, redirect to dashboard
    await router.push('/dashboard')
  }
})

// Handle filter change from BudgetHeader
const handleFilterChanged = (filter: string) => {
  activeFilter.value = filter
}

// Handle categories assigned event from AutoAssignPanel
const handleCategoriesAssigned = (categoryIds: string[]) => {
  // Trigger flash animation on the category list
  if (categoryListRef.value) {
    categoryListRef.value.flashCategoriesWithMoney(categoryIds)
  }
}
</script>
