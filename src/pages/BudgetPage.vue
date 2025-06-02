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
          <BudgetCategoryList />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import BudgetHeader from '@/components/budget/BudgetHeader.vue'
import { useBudgetStore } from '@/stores/budget.store'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { MainDataService } from '@/services/common/mainData.service'
import { useAccountStore } from '@/stores/account.store'
import { useCategoryStore } from '@/stores/category.store'
import { useTransactionStore } from '@/stores/transaction.store'
import BudgetCategoryList from '@/components/budget/BudgetCategoryList.vue'

const route = useRoute()
const router = useRouter()
const budgetStore = useBudgetStore()
const accountStore = useAccountStore()
const categoryStore = useCategoryStore()
const transactionStore = useTransactionStore()
const budgetId = route.params.budgetId as string

onMounted(async () => {
  budgetStore.setIsLoading(true)

  try {
    const mainData = await MainDataService.getMainData(route.params.budgetId as string)
    if (mainData?.budget) {
      budgetStore.setCurrentBudget(mainData.budget)
    }
    if (mainData?.accounts?.length) {
      accountStore.setAccounts(mainData.accounts)
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
      budgetStore.setReadyToAssign(mainData.readyToAssign)
    }
    if (mainData?.transactions?.length) {
      transactionStore.setTransactions(mainData.transactions)
    }

    // Set loading to false for both stores
    budgetStore.setIsLoading(false)
    categoryStore.setIsLoading(false)
  } catch (error) {
    console.error("Error fetching main data:", error)
    budgetStore.reset()
    categoryStore.reset()
    await router.push('/dashboard')
  }
})
</script>
