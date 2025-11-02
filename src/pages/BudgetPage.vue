<template>
  <div v-if="isLoading" class="flex h-screen items-center justify-center">
    <LoadingSpinner />
  </div>
  <div v-else class="flex h-screen">
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
import BudgetCategoryList from '@/components/budget/BudgetCategoryList.vue'
import AutoAssignPanel from '@/components/budget/AutoAssignPanel.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'

const route = useRoute()
const router = useRouter()
const budgetId = route.params.budgetId as string

// Reference to the category list component
const categoryListRef = ref<InstanceType<typeof BudgetCategoryList> | null>(null)
const activeFilter = ref('all')

const { ensureDataLoaded, isLoading } = useMainDataOperations()

// Ensure data is loaded when the component mounts
onMounted(async () => {
  try {
    // Save this budget as the last visited
    localStorage.setItem('lastVisitedBudgetId', budgetId)
    
    const success = await ensureDataLoaded(budgetId)
    if (!success) {
      console.error('Failed to load budget data')
      // Redirect back to dashboard if data loading fails
      router.push('/dashboard')
    }
  } catch (error) {
    console.error('Error loading budget data:', error)
    router.push('/dashboard')
  }
})

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
