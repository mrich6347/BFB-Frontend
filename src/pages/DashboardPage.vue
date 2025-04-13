<template>
  <div class="min-h-screen bg-background">
    <!-- Top Navigation Bar -->
    <div class="border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
            <ThemeToggle />
            <h1 class="text-2xl font-bold text-foreground">BFB</h1>
          </div>
          <button 
            @click="authService.logout()" 
            class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring h-9 px-4 py-2 hover:bg-accent hover:text-accent-foreground"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
        <div class="flex flex-col items-center gap-4">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p class="text-muted-foreground">Loading your budgets...</p>
        </div>
      </div>

      <div v-else>

        <!-- Budgets List -->
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-semibold text-foreground">Your Budgets</h3>
            <button 
              @click="showCreateModal = true"
              class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Budget
            </button>
          </div>

          <div v-if="budgetStore.budgets.length === 0" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 class="text-lg font-semibold text-foreground">No budgets created</h3>
              <p class="text-sm text-muted-foreground mt-2">You haven't created any budgets yet. Start by creating your first budget.</p>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div 
              v-for="budget in budgetStore.budgets" 
              :key="budget.id"
              @click="goToBudget(budget.id)"
              class="group rounded-xl border bg-card p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <h4 class="text-lg font-semibold text-card-foreground">{{ budget.name }}</h4>
                  <p class="text-sm text-muted-foreground">
                    Last Used On: {{ new Date(budget.updated_at).toLocaleDateString() }}
                  </p>
                </div>
            
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Budget Modal -->
    <CreateBudgetModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budgetStore'
import { authService } from '@/services/common/authService'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import CreateBudgetModal from '@/components/budget/CreateBudgetModal.vue'
import { useRouter } from 'vue-router'

const loading = ref(true)
const showCreateModal = ref(false)
const budgetStore = useBudgetStore()
const router = useRouter()

onMounted(async () => {
  try {
    await budgetStore.fetchAllBudgets()
  } finally {
    loading.value = false
  }
})

const goToBudget = (budgetId: string) => {
  router.push(`/budget/${budgetId}`)
}

</script>

