<template>
  <div class="auto-assign-panel bg-background border-l border-border h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-center p-4 border-b border-border">
      <h3 class="text-lg font-semibold">Auto-Assign</h3>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Applying Animation Overlay -->
      <div v-if="isApplying" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-sm">
        <div class="bg-background border border-border rounded-xl shadow-2xl p-8 max-w-lg mx-4 min-w-[400px] w-full max-h-[80vh] transform transition-all duration-300 ease-out">
          <div class="text-center">
            <!-- Enhanced Loading Spinner -->
            <div class="relative mb-6">
              <div class="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary mx-auto"></div>
              <div class="absolute inset-0 rounded-full h-12 w-12 border-4 border-transparent border-t-primary/30 animate-ping mx-auto"></div>
            </div>

            <!-- Title with better typography -->
            <h3 class="text-xl font-bold mb-3 text-foreground">Applying Configuration</h3>
            <p class="text-sm text-muted-foreground mb-6 leading-relaxed">{{ applyingMessage }}</p>

            <!-- Applied Categories List -->
            <div v-if="appliedCategories.length > 0" class="space-y-3 max-h-64 overflow-y-auto custom-scrollbar">
              <div
                v-for="(category, index) in appliedCategories"
                :key="category.category_id"
                class="flex items-center justify-between text-sm p-3 rounded-lg transition-all duration-300 ease-in-out success-item"
                :style="{ animationDelay: `${index * 100}ms` }"
                :class="{ 'animate-slideInUp': true }"
              >
                <span class="font-medium text-foreground truncate mr-2">{{ getCategoryName(category.category_id) }}</span>
                <span class="font-bold whitespace-nowrap success-amount">+{{ formatCurrency(category.amount) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div v-else class="flex-1 flex flex-col overflow-hidden">
        <!-- Create New Configuration Button -->
        <div class="p-4 border-b border-border">
          <Button @click="showCreateModal = true" class="w-full" size="sm">
            <Plus class="h-4 w-4 mr-2" />
            New Configuration
          </Button>
        </div>

        <!-- Configurations List -->
        <div class="flex-1 overflow-auto">
          <div v-if="autoAssignStore.configurations.length === 0" class="p-4 text-center">
            <p class="text-sm text-muted-foreground">
              No configurations yet. Create your first one to get started!
            </p>
          </div>

          <div v-else class="space-y-3 p-4">
            <div
              v-for="config in autoAssignStore.configurations"
              :key="config.name"
              :class="[
                'relative group overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-background/95 via-muted/30 to-background shadow-[0_8px_22px_rgba(15,23,42,0.08)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(15,23,42,0.12)] focus-within:ring-2 focus-within:ring-primary/40',
                budgetStore.readyToAssign < config.total_amount ? 'opacity-70 grayscale-[15%]' : ''
              ]"
            >
              <span class="absolute inset-y-3 left-3 w-1 rounded-full bg-primary/70 transition-all duration-300 group-hover:bg-primary group-hover:w-1.5"></span>
              <div class="relative flex flex-col gap-4 px-6 py-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-start gap-3">
                    <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary/15">
                      <Sparkles class="h-4 w-4" />
                    </div>
                    <div>
                      <h4 class="text-sm font-semibold text-foreground">{{ config.name }}</h4>
                      <p class="mt-1 text-xs text-muted-foreground">
                        {{ config.item_count }} categories • {{ formatCurrency(config.total_amount) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="editConfiguration(config)"
                    class="h-6 w-6"
                  >
                    <Edit class="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    @click="deleteConfiguration(config)"
                    class="h-6 w-6 text-destructive hover:text-destructive"
                  >
                    <Trash2 class="h-3 w-3" />
                  </Button>
                </div>
              </div>

                <div class="flex flex-col gap-2">
                  <Button
                    @click="applyConfiguration(config)"
                    variant="outline"
                    size="sm"
                    class="w-full justify-center font-medium transform transition-all duration-300 hover:-translate-y-[1px] hover:shadow-md"
                    :disabled="budgetStore.readyToAssign < config.total_amount"
                  >
                    <Play class="h-3 w-3 mr-2" />
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Configuration Modal -->
    <AutoAssignConfigModal
      v-if="showCreateModal || showEditModal"
      :is-open="showCreateModal || showEditModal"
      :configuration="editingConfiguration"
      :is-edit-mode="showEditModal"
      @close="closeModals"
      @save="handleSaveConfiguration"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import Button from '@/components/shadcn-ui/button.vue'
import { Plus, Edit, Trash2, Play, Sparkles } from 'lucide-vue-next'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import { useDeleteAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useDeleteAutoAssignConfiguration'
import { useApplyAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useApplyAutoAssignConfiguration'
import { useCreateAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useCreateAutoAssignConfiguration'
import { useUpdateAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useUpdateAutoAssignConfiguration'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { useFetchCategoryBalances } from '@/composables/categories/category-read/useFetchCategoryBalances'
import { formatCurrency } from '@/utils/currencyUtil'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import AutoAssignConfigModal from './AutoAssignConfigModal.vue'
import type { AutoAssignConfigurationSummary } from '@/services/auto-assign.service'

// Define emits
const emit = defineEmits<{
  'categories-assigned': [categoryIds: string[]]
}>()

const autoAssignStore = useAutoAssignStore()
const { deleteConfiguration: deleteConfigurationOp, isLoading: deleteLoading, error: deleteError } = useDeleteAutoAssignConfiguration()
const { applyConfiguration: applyConfigurationOp, isLoading: applyLoading, error: applyError } = useApplyAutoAssignConfiguration()
const { createConfiguration: createConfigurationOp, isLoading: createLoading, error: createError } = useCreateAutoAssignConfiguration()
const { updateConfiguration: updateConfigurationOp, isLoading: updateLoading, error: updateError } = useUpdateAutoAssignConfiguration()
const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const { fetchCategoryBalances } = useFetchCategoryBalances()

const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingConfiguration = ref<AutoAssignConfigurationSummary | null>(null)
const isApplying = ref(false)
const applyingMessage = ref('')
const appliedCategories = ref<{ category_id: string; amount: number }[]>([])

const editConfiguration = async (config: AutoAssignConfigurationSummary) => {
  editingConfiguration.value = config
  showEditModal.value = true
}

const deleteConfiguration = async (config: AutoAssignConfigurationSummary) => {
  if (confirm(`Are you sure you want to delete "${config.name}"?`)) {
    try {
      await deleteConfigurationOp(budgetStore.currentBudget!.id, config.name)
    } catch (error) {
      console.error('Failed to delete configuration:', error)
      alert('Failed to delete configuration. Please try again.')
    }
  }
}

const applyConfiguration = async (config: AutoAssignConfigurationSummary) => {
  if (budgetStore.readyToAssign < config.total_amount) {
    alert('Insufficient Ready to Assign balance to apply this configuration.')
    return
  }

  isApplying.value = true
  applyingMessage.value = `Applying "${config.name}"...`
  appliedCategories.value = []

  try {
    const result = await applyConfigurationOp({
      name: config.name,
      budget_id: budgetStore.currentBudget!.id
    })

    if (result.success) {
      // Show applied categories with animation
      appliedCategories.value = result.appliedCategories
      applyingMessage.value = `Successfully applied to ${result.appliedCount} categories!`

      // Refresh category data to show updated balances first
      await fetchCategoryBalances(budgetStore.currentBudget!.id)

      // THEN emit event to trigger flash animation on category rows (after server responds)
      const categoryIds = result.appliedCategories.map(cat => cat.category_id)
      emit('categories-assigned', categoryIds)

      // Wait a bit to show the success animation
      await new Promise(resolve => setTimeout(resolve, 2000))
    } else {
      applyingMessage.value = 'Failed to apply configuration'
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  } catch (error) {
    console.error('Failed to apply configuration:', error)
    applyingMessage.value = 'Failed to apply configuration'
    await new Promise(resolve => setTimeout(resolve, 1500))
  } finally {
    isApplying.value = false
    appliedCategories.value = []
  }
}

const handleSaveConfiguration = async (configData: any) => {
  try {
    if (showEditModal.value && editingConfiguration.value) {
      await updateConfigurationOp(
        budgetStore.currentBudget!.id,
        editingConfiguration.value.name,
        configData
      )
    } else {
      await createConfigurationOp({
        ...configData,
        budget_id: budgetStore.currentBudget!.id
      })
    }
    closeModals()
  } catch (error) {
    console.error('Failed to save configuration:', error)
    alert('Failed to save configuration. Please try again.')
  }
}

const closeModals = () => {
  showCreateModal.value = false
  showEditModal.value = false
  editingConfiguration.value = null
}

const getCategoryName = (categoryId: string): string => {
  const category = categoryStore.categories.find(c => c.id === categoryId)
  return category?.name || 'Unknown Category'
}

onMounted(() => {
  // Configurations are now loaded from main data, no separate loading needed
})
</script>

<style scoped>
.auto-assign-panel {
  width: 360px;
  min-width: 360px;
}

/* Custom animations for the applying modal */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-slideInUp {
  animation: slideInUp 0.4s ease-out forwards;
}

/* Success styling using CSS custom properties */
.success-item {
  background-color: color-mix(in srgb, var(--success) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--success) 20%, transparent);
}

.success-amount {
  color: var(--success);
}

/* Enhanced backdrop blur effect */
.backdrop-blur-sm {
  backdrop-filter: blur(4px);
}

/* Custom scrollbar for the applied categories list */
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--muted);
  border-radius: 3px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--muted-foreground);
}


</style>
