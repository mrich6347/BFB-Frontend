<template>
  <div class="relative min-h-screen">
    <div v-if="budgetStore.isLoading" class="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-50">
      <Loader class="w-8 h-8 animate-spin text-blue-500" />
    </div>
    <div v-else>
      <Sidebar />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { useBudgetStore } from '@/stores/budgetStore'
import { Loader } from 'lucide-vue-next'
import { MainDataService } from '@/services/common/mainDataService'

const route = useRoute()
const router = useRouter()
const budgetStore = useBudgetStore()

onMounted(async () => {
  budgetStore.setIsLoading(true)

  try { 
    const mainData = await MainDataService.getMainData(route.params.id as string)
    if (mainData.budget) {
      budgetStore.setCurrentBudget(mainData.budget)
    }
  } catch (error) {
    budgetStore.setIsLoading(false)
    console.error("Error fetching main data:", error)
    router.push('/dashboard')
  }

  budgetStore.setIsLoading(false)

})
</script>
