<template>
  <div class="min-h-screen bg-background">
    <!-- Top Navigation Bar - Made sticky -->
    <div class="top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between items-center h-16">
          <div class="flex items-center gap-4">
            <ThemeToggle />
            <h1 class="text-2xl font-bold text-foreground">BFB</h1>
          </div>
          <Button variant="ghost" @click="authService.logout()">
            <LogOut class="h-5 w-5 mr-2" />
            Logout
          </Button>
        </div>
      </div>
    </div>

    <!-- Main Content - Adjusted top padding -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
        <LoadingSpinner>
          <p class="text-muted-foreground">Loading your budgets...</p>
        </LoadingSpinner>
      </div>

      <div v-else>
        <!-- Budgets List - Adjusted margin for tighter spacing -->
        <Section class="mt-0">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-xl font-semibold text-foreground">Your Budgets</h3>
            <div class="flex items-center gap-2">
              <Button @click="showCreateModal = true">
                <Plus class="h-5 w-5 mr-2" />
                New Budget
            </Button>
            <!-- TODO: unhide this button when YNAB import is implemented -->
            <Button variant="outline" class="ml-2" @click="showImportModal = true" v-if="false">
              <Import class="h-5 w-5 mr-2" />
              Import From YNAB
            </Button>
            </div>
          </div>

          <div v-if="budgetStore.budgets?.length === 0" class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center">
            <div class="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <Inbox class="h-10 w-10 text-muted-foreground mb-4" />
              <h3 class="text-lg font-semibold text-foreground">No budgets created</h3>
              <p class="text-sm text-muted-foreground mt-2">You haven't created any budgets yet. Start by creating your first budget.</p>
            </div>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card
              v-for="budget in budgetStore.budgets"
              :key="budget.id"
              @click="goToBudget(budget.id)"
              class="hover:shadow-md transition-all duration-200 cursor-pointer relative group"
              :style="{ opacity: loadingBudgetId === budget.id ? 0.5 : 1, pointerEvents: loadingBudgetId === budget.id ? 'none' : 'auto' }"
            >
              <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <Button
                  variant="ghost"
                  size="icon"
                  class="h-8 w-8"
                  @click.stop="openEditModal(budget)"
                >
                  <Edit class="h-4 w-4" />
                </Button>
              </div>
              <CardHeader>
                <CardTitle class="truncate">{{ budget.name }}</CardTitle>
              </CardHeader>
              <CardContent>
                <div v-if="loadingBudgetId === budget.id" class="flex items-center justify-center py-4">
                  <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span class="ml-2 text-sm text-muted-foreground">Loading...</span>
                </div>
                <p v-else class="text-sm text-muted-foreground">
                  Last Used On: {{ formatDate(budget.updated_at, budget.date_format) }}
                </p>
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
import { formatDate } from '@/utils/dateFormatUtil'

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

const handleBudgetImported = () => {
  showImportModal.value = false
}
</script>

