<template>
  <div class="auto-assign-panel bg-background border-l border-border h-full flex flex-col">
    <!-- Header -->
    <div class="flex items-center justify-center p-4 border-b border-border">
      <h3 class="text-lg font-semibold">Auto-Assign</h3>
    </div>

    <!-- Content -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <!-- Loading State -->
      <div v-if="autoAssignStore.isLoading" class="flex-1 flex items-center justify-center">
        <LoadingSpinner />
      </div>

      <!-- Applying Animation Overlay -->
      <div v-if="isApplying" class="absolute inset-0 bg-black/50 z-50 flex items-center justify-center">
        <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 class="text-lg font-semibold mb-2">Applying Configuration</h3>
            <p class="text-sm text-gray-600 mb-4">{{ applyingMessage }}</p>
            <div class="space-y-2">
              <div
                v-for="category in appliedCategories"
                :key="category.category_id"
                class="flex items-center justify-between text-sm p-2 bg-green-50 rounded border-l-4 border-green-400 animate-pulse"
              >
                <span class="font-medium">{{ getCategoryName(category.category_id) }}</span>
                <span class="text-green-600 font-semibold">+{{ formatCurrency(category.amount) }}</span>
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

          <div v-else class="space-y-2 p-4">
            <div
              v-for="config in autoAssignStore.configurations"
              :key="config.name"
              class="border border-border rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium text-sm truncate">{{ config.name }}</h4>
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

              <div class="text-xs text-muted-foreground mb-3">
                {{ config.item_count }} categories • {{ formatCurrency(config.total_amount) }}
              </div>

              <Button
                @click="applyConfiguration(config)"
                variant="outline"
                size="sm"
                class="w-full"
                :disabled="budgetStore.readyToAssign < config.total_amount"
              >
                <Play class="h-3 w-3 mr-2" />
                Apply
              </Button>

              <div v-if="budgetStore.readyToAssign < config.total_amount" class="text-xs text-destructive mt-1">
                Insufficient Ready to Assign
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
import { Plus, Edit, Trash2, Play } from 'lucide-vue-next'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { formatCurrency } from '@/utils/currencyUtil'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import AutoAssignConfigModal from './AutoAssignConfigModal.vue'
import type { AutoAssignConfigurationSummary } from '@/services/auto-assign.service'

// Define emits
const emit = defineEmits<{
  'categories-assigned': [categoryIds: string[]]
}>()

const autoAssignStore = useAutoAssignStore()
const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()

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
      await autoAssignStore.deleteConfiguration(budgetStore.currentBudget!.id, config.name)
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
    const result = await autoAssignStore.applyConfiguration({
      name: config.name,
      budget_id: budgetStore.currentBudget!.id
    })

    if (result.success) {
      // Show applied categories with animation
      appliedCategories.value = result.appliedCategories
      applyingMessage.value = `Successfully applied to ${result.appliedCount} categories!`

      // Emit event to trigger flash animation on category rows
      const categoryIds = result.appliedCategories.map(cat => cat.category_id)
      emit('categories-assigned', categoryIds)

      // Wait a bit to show the success animation
      await new Promise(resolve => setTimeout(resolve, 2000))

      // Refresh category data to show updated balances
      await categoryStore.fetchCategoryBalances(budgetStore.currentBudget!.id)
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
      await autoAssignStore.updateConfiguration(
        budgetStore.currentBudget!.id,
        editingConfiguration.value.name,
        configData
      )
    } else {
      await autoAssignStore.createConfiguration({
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
  width: 320px;
  min-width: 320px;
}
</style>
