<template>
  <div class="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
    <!-- Top Navigation Bar - Made sticky -->
    <div class="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
            <ThemeToggle />
            <h1 class="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">BFB</h1>
          </div>
          <Button variant="ghost" @click="authService.logout()" class="hover:bg-accent/50">
            <LogOut class="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content - Adjusted top padding -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- Welcome Header -->
      <div class="mb-8">
        <h2 class="text-3xl font-bold text-foreground mb-2">Welcome back!</h2>
        <p class="text-muted-foreground">Manage your budgets and take control of your finances.</p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner>
          <p class="text-muted-foreground">Loading your budgets...</p>
        </LoadingSpinner>
      </div>

      <div v-else>
        <!-- Budgets List - Adjusted margin for tighter spacing -->
        <Section class="mt-0">
          <div class="flex items-center justify-between mb-6">
            <div>
              <h3 class="text-2xl font-semibold text-foreground mb-1">Your Budgets</h3>
              <p class="text-sm text-muted-foreground">{{ budgetStore.budgets?.length || 0 }} {{ budgetStore.budgets?.length === 1 ? 'budget' : 'budgets' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <Button @click="showCreateModal = true" class="shadow-md hover:shadow-lg transition-shadow">
                <Plus class="h-5 w-5 mr-2" />
                New Budget
            </Button>
            <!-- TODO: unhide this button when YNAB import is implemented -->
            <Button variant="outline" class="ml-2 shadow-sm hover:shadow-md transition-shadow" @click="showImportModal = true" v-if="false">
              <Import class="h-5 w-5 mr-2" />
              Import From YNAB
            </Button>
            </div>
          </div>

          <div v-if="budgetStore.budgets?.length === 0" class="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-accent/20 p-12 text-center backdrop-blur-sm">
            <div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <div class="mb-4 rounded-full bg-accent/50 p-4">
                <Inbox class="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 class="text-xl font-semibold text-foreground mb-2">No budgets created</h3>
              <p class="text-sm text-muted-foreground mb-6">You haven't created any budgets yet. Start by creating your first budget to take control of your finances.</p>
              <Button @click="showCreateModal = true" size="lg" class="shadow-lg hover:shadow-xl transition-shadow">
                <Plus class="h-5 w-5 mr-2" />
                Create Your First Budget
              </Button>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              v-for="budget in budgetStore.budgets"
              :key="budget.id"
              @click="goToBudget(budget.id)"
              class="hover:shadow-xl hover:scale-[1.02] hover:border-primary/50 transition-all duration-300 cursor-pointer relative group overflow-hidden border-2 bg-gradient-to-br from-card to-card/50"
              :style="{ opacity: loadingBudgetId === budget.id ? 0.5 : 1, pointerEvents: loadingBudgetId === budget.id ? 'none' : 'auto' }"
            >
              <!-- Gradient overlay on hover -->
              <div class="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

              <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-9 w-9 bg-background/80 backdrop-blur-sm hover:bg-accent shadow-md"
                  @click.stop="openEditModal(budget)"
                >
                  <Edit class="h-4 w-4" />
                </Button>
              </div>

              <CardHeader class="relative">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md flex-shrink-0">
                    <span class="text-primary-foreground font-bold text-lg">{{ budget.name.charAt(0).toUpperCase() }}</span>
                  </div>
                  <div class="flex-1 min-w-0">
                    <CardTitle class="truncate text-lg">{{ budget.name }}</CardTitle>
                    <p class="text-xs text-muted-foreground mt-1">{{ budget.currency }}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent class="relative">
                <div v-if="loadingBudgetId === budget.id" class="flex items-center justify-center py-6">
                  <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <span class="ml-3 text-sm text-muted-foreground font-medium">Loading...</span>
                </div>
                <div v-else class="pt-2">
                  <div class="flex items-center text-sm text-primary font-medium group-hover:translate-x-1 transition-transform duration-300">
                    <span>Open budget</span>
                    <svg class="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </Section>
      </div>
    </div>

    <!-- Create Budget Modal -->
    <CreateBudgetModal
      :is-open="showCreateModal"
      @close="showCreateModal = false"
    />

    <!-- Edit Budget Modal -->
    <EditBudgetModal
      v-if="selectedBudget"
      :is-open="showEditModal"
      :budget="selectedBudget"
      @close="closeEditModal"
      @updated="handleBudgetUpdated"
      @deleted="handleBudgetDeleted"
    />

    <!-- YNAB Import Modal -->
    <YnabImportModal
      :is-open="showImportModal"
      @close="showImportModal = false"
      @imported="handleBudgetImported"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import { authService } from '@/services/common/auth.service'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import CreateBudgetModal from '@/components/budget/CreateBudgetModal.vue'
import YnabImportModal from '@/components/budget/YnabImportModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { useRouter } from 'vue-router'
import { LogOut, Plus, Inbox, Import, Edit } from 'lucide-vue-next'

// Import ShadCN components
import Button from '@/components/shadcn-ui/button.vue'
import Card from '@/components/shadcn-ui/card.vue'
import CardHeader from '@/components/shadcn-ui/card-header.vue'
import CardTitle from '@/components/shadcn-ui/card-title.vue'
import CardContent from '@/components/shadcn-ui/card-content.vue'
import Section from '@/components/shadcn-ui/section.vue'
import EditBudgetModal from '@/components/budget/EditBudgetModal.vue'
import type { BudgetResponse } from '@/types/DTO/budget.dto'

import { useFetchBudgets } from '@/composables/budgets/budget-read/useFetchBudgets'
import { useBudgetUtils } from '@/composables/budgets/budget-read/useBudgetUtils'
import { useMainDataOperations } from '@/composables/common/useMainDataOperations'

const loading = ref(true)
const showCreateModal = ref(false)
const showEditModal = ref(false)
const showImportModal = ref(false)
const selectedBudget = ref<BudgetResponse | null>(null)
const budgetStore = useBudgetStore()
const { fetchBudgets } = useFetchBudgets()
const { resetBudgetData } = useBudgetUtils()
const { ensureDataLoaded } = useMainDataOperations()
const router = useRouter()

// Loading state for when user clicks a budget
const loadingBudgetId = ref<string | null>(null)

onMounted(async () => {
  try {
    resetBudgetData()
    await fetchBudgets()
  } finally {
    loading.value = false
  }
})

const goToBudget = async (budgetId: string) => {
  try {
    // Show loading state for this specific budget
    loadingBudgetId.value = budgetId

    // Load all data for this budget
    const success = await ensureDataLoaded(budgetId)

    if (success) {
      router.push(`/budget/${budgetId}`)
    } else {
      console.error('Failed to load budget data')
    }
  } catch (error) {
    console.error('Error loading budget:', error)
  } finally {
    loadingBudgetId.value = null
  }
}

const openEditModal = (budget: BudgetResponse) => {
  selectedBudget.value = budget
  showEditModal.value = true
}

const closeEditModal = () => {
  showEditModal.value = false
  selectedBudget.value = null
}

const handleBudgetUpdated = async () => {
  await fetchBudgets()
}

const handleBudgetDeleted = async () => {
  await fetchBudgets()
}

const handleBudgetImported = () => {
  showImportModal.value = false
}
</script>

