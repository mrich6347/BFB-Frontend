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
            <LogOut class="h-5 w-5 mr-2" />
            Logout
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner>
          <p class="text-muted-foreground">Loading your budgets...</p>
        </LoadingSpinner>
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
              <Plus class="h-5 w-5 mr-2" />
              New Budget
            </button>
          </div>

          <div v-if="budgetStore.budgets.length === 0" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <Inbox class="h-10 w-10 text-muted-foreground mb-4" />
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
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useRouter } from 'vue-router'
import { LogOut, Plus, Inbox } from 'lucide-vue-next'

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

