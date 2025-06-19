<template>
  <div class="relative min-h-screen">
    <div v-if="budgetStore.isLoading" class="flex justify-center items-center min-h-[400px]">
      <LoadingSpinner>
      </LoadingSpinner>
    </div>
    <div v-else class="flex h-screen">
      <Sidebar :budgetId="budgetId" />
      <div class="flex-1 overflow-auto">
        <BudgetHeader />
        <div class="p-4">
          <!-- Budget content goes here -->
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
import { MainDataService } from '@/services/common/mainData.service'
import { useAccountStore } from '@/stores/account.store'
import { useAccountOperations } from '@/composables/accounts/useAccountOperations'
import { useCategoryStore } from '@/stores/category.store'
import { useTransactionStore } from '@/stores/transaction.store'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import BudgetCategoryList from '@/components/budget/BudgetCategoryList.vue'
import AutoAssignPanel from '@/components/budget/AutoAssignPanel.vue'
import { saveLastVisitedBudget } from '@/utils/lastVisitedBudgetStorage'

const route = useRoute()
const router = useRouter()
const budgetStore = useBudgetStore()
const { setCurrentBudget, setReadyToAssign, ensureCurrentMonth, resetBudgetData, setLoading } = useBudgetOperations()
const accountStore = useAccountStore()
const { setAccounts } = useAccountOperations()
const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()
const autoAssignStore = useAutoAssignStore()
const budgetId = route.params.budgetId as string

// Reference to the category list component
const categoryListRef = ref<InstanceType<typeof BudgetCategoryList> | null>(null)

onMounted(async () => {
  setLoading(true)

  // Ensure we're showing the current month
  ensureCurrentMonth()

  try {
    const mainData = await MainDataService.getMainData(route.params.budgetId as string)
    if (mainData?.budget) {
      setCurrentBudget(mainData.budget)
    }
    if (mainData?.accounts?.length) {
      setAccounts(mainData.accounts)
    }
    if (mainData?.categoryGroups) {
      categoryStore.setCategoryGroups(mainData.categoryGroups)
    }
    if (mainData?.categories) {
      categoryStore.setCategories(mainData.categories)
    }
    if (mainData?.categoryBalances) {
      categoryStore.setCategoryBalances(mainData.categoryBalances)
    }
    if (mainData?.readyToAssign !== undefined) {
      setReadyToAssign(mainData.readyToAssign)
    }
    if (mainData?.transactions?.length) {
      transactionStore.setTransactions(mainData.transactions)
    }
    if (mainData?.autoAssignConfigurations) {
      autoAssignStore.setConfigurations(mainData.autoAssignConfigurations)
    }

    // Set loading to false for both stores
    setLoading(false)
    categoryStore.setIsLoading(false)

    // Save this budget as the last visited budget
    saveLastVisitedBudget(budgetId)
  } catch (error) {
    console.error("Error fetching main data:", error)
    resetBudgetData()
    categoryStore.reset()
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
