<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <button 
        @click="authService.logout()" 
        class="bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-lg font-medium transition duration-200"
      >
        Logout
      </button>
    </div>
    <p v-if="loading">Loading...</p>
    <div v-else>
      <h2>Budgets</h2>
      <ul>
        <li v-for="budget in budgetStore.budgets" :key="budget.id">
          {{ budget.name }}
        </li> 
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budgetStore'
import { authService } from '@/services/common/authService'

const loading = ref(true)
const budgetStore = useBudgetStore()


onMounted(async () => {
  try {
    await budgetStore.fetchAllBudgets()
  } finally {
    loading.value = false
  }
})
</script>

