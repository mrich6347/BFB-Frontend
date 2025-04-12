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
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import { useBudgetStore } from '@/stores/budgetStore'
import { Loader } from 'lucide-vue-next'
import { MainDataService } from '@/services/common/mainDataService'

const router = useRoute()
const budgetStore = useBudgetStore()

onMounted(async () => {
  budgetStore.setIsLoading(true)
  const mainData = await MainDataService.getMainData(router.params.id as string)
  if (mainData.budget) {
    budgetStore.setCurrentBudget(mainData.budget)
    budgetStore.setIsLoading(false)
  }
})
</script>
