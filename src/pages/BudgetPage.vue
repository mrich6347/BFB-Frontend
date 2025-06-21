<template>
  <div class="relative min-h-screen">
    <div v-if="isLoading" class="flex justify-center items-center min-h-screen">
      <LoadingSpinner />
    </div>
    <div v-else class="flex h-screen">
      <Sidebar :budgetId="budgetId" />
      <div class="flex-1 flex flex-col">
        <!-- Sticky Budget Header -->
        <div class="sticky top-0 z-10">
          <BudgetHeader />
        </div>
        <!-- Scrollable Category List -->
        <div class="flex-1 overflow-auto p-4">
          <BudgetCategoryList ref="categoryListRef" />
        </div>
      </div>
      <AutoAssignPanel @categories-assigned="handleCategoriesAssigned" />
    </div>
  </div>
</template>


<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted, ref } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import BudgetHeader from '@/components/budget/BudgetHeader.vue'
import { useBudgetStore } from '@/stores/budget.store'
import { useBudgetOperations } from '@/composables/budgets/useBudgetOperations'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'
import BudgetCategoryList from '@/components/budget/BudgetCategoryList.vue'
import AutoAssignPanel from '@/components/budget/AutoAssignPanel.vue'

const route = useRoute()
const router = useRouter()
const budgetStore = useBudgetStore()
const { ensureCurrentMonth } = useBudgetOperations()
const { ensureDataLoaded, isLoading } = useMainDataOperations()
const budgetId = route.params.budgetId as string

// Reference to the category list component
const categoryListRef = ref<InstanceType<typeof BudgetCategoryList> | null>(null)

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

// Handle categories assigned event from AutoAssignPanel
const handleCategoriesAssigned = (categoryIds: string[]) => {
  // Trigger flash animation on the category list
  if (categoryListRef.value) {
    categoryListRef.value.flashCategoriesWithMoney(categoryIds)
  }
}
</script>
