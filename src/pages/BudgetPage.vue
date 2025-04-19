<template>
  <div class="relative min-h-screen">
    <div v-if="budgetStore.isLoading" class="flex justify-center items-center min-h-[400px]">
      <LoadingSpinner>
        <p class="text-muted-foreground">Loading budget data...</p>
      </LoadingSpinner>
    </div>
    <div v-else class="flex h-screen">
      <Sidebar :budgetId="budgetId" />
      <div class="flex-1 overflow-auto">
        <BudgetHeader />
        <div class="p-4">
          <!-- Budget content goes here -->
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

const route = useRoute()
const router = useRouter()
const budgetStore = useBudgetStore()
const accountStore = useAccountStore()
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
    budgetStore.setIsLoading(false)
  } catch (error) {
    console.error("Error fetching main data:", error)
    budgetStore.reset()
    await router.push('/dashboard')
  }
})
</script>
