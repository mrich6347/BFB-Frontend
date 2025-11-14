<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-black/50 transition-opacity"
      :class="isClosing ? 'opacity-0' : 'opacity-100'"
      @click="handleClose"
    >
      <!-- Modal that slides up from bottom -->
      <div
        class="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-lg transition-transform duration-300 max-h-[80vh] flex flex-col"
        :class="isClosing ? 'translate-y-full' : 'translate-y-0'"
        @click.stop
        style="padding-bottom: max(1rem, calc(1rem + env(safe-area-inset-bottom)));"
      >
        <!-- Header -->
        <div class="px-4 py-4 border-b border-border flex-shrink-0">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Auto-Assign</h3>
              <p class="text-xs text-muted-foreground mt-0.5">Apply saved configurations</p>
            </div>
            <div class="flex items-center gap-2">
              <button
                @click="handleCreateNew"
                class="p-2 hover:bg-accent rounded-md text-primary"
              >
                <PlusIcon class="h-5 w-5" />
              </button>
              <button @click="handleClose" class="p-2 hover:bg-accent rounded-md">
                <XIcon class="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-3">
          <!-- Loading State -->
          <div v-if="isApplying" class="flex flex-col items-center justify-center py-12 space-y-3">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p class="text-sm text-muted-foreground">{{ applyingMessage }}</p>
          </div>

          <!-- Empty State -->
          <div v-else-if="!configurations || configurations.length === 0" class="flex flex-col items-center justify-center py-12 space-y-3">
            <div class="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <ZapIcon class="h-8 w-8 text-muted-foreground" />
            </div>
            <div class="text-center">
              <p class="font-medium text-foreground">No Configurations</p>
              <p class="text-sm text-muted-foreground mt-1">Create auto-assign configurations on desktop</p>
            </div>
          </div>

          <!-- Configuration List -->
          <div v-else class="space-y-2" @click="closeAllSwipes">
            <div
              v-for="config in configurations"
              :key="config.name"
              class="relative overflow-hidden rounded-lg"
            >
              <!-- Edit/Delete buttons (revealed on swipe) -->
              <div class="absolute inset-y-0 right-0 flex items-center">
                <button
                  @click.stop="handleEdit(config)"
                  class="h-full px-6 bg-blue-500 text-white font-medium flex items-center justify-center"
                >
                  Edit
                </button>
                <button
                  @click.stop="handleDelete(config)"
                  class="h-full px-6 bg-red-500 text-white font-medium flex items-center justify-center"
                >
                  Delete
                </button>
              </div>

              <!-- Swipeable configuration content -->
              <div
                :ref="el => setConfigRef(config.name, el)"
                class="w-full bg-card border border-border touch-pan-y"
                :class="[
                  { 'transition-transform duration-200 ease-out': !isSwiping(config.name) },
                  (isApplying || readyToAssign < config.total_amount) ? 'cursor-not-allowed' : 'cursor-pointer'
                ]"
                :style="{ transform: `translateX(${getSwipeOffset(config.name)}px)` }"
                @touchstart="handleTouchStart($event, config.name)"
                @touchmove="handleTouchMove($event, config.name)"
                @touchend="handleTouchEnd(config.name)"
                @click="handleConfigClick(config)"
              >
                <div
                  class="flex items-start justify-between gap-3 px-4 py-4"
                  :class="(isApplying || readyToAssign < config.total_amount) ? 'opacity-50' : ''"
                >
                  <div class="flex-1 min-w-0">
                    <div class="font-medium text-foreground truncate">{{ config.name }}</div>
                    <div class="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{{ config.item_count }} {{ config.item_count === 1 ? 'category' : 'categories' }}</span>
                      <span>•</span>
                      <span>{{ formatCurrency(config.total_amount) }}</span>
                    </div>
                    <div v-if="readyToAssign < config.total_amount" class="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Insufficient funds
                    </div>
                  </div>
                  <div class="flex-shrink-0">
                    <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <ZapIcon class="h-5 w-5 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Edit/Create Modal -->
    <MobileAutoAssignConfigModal
      :show="showEditModal"
      :configuration="editingConfig"
      :is-edit-mode="!!editingConfig"
      @close="handleCloseEditModal"
      @save="handleSaveConfiguration"
    />

    <!-- Delete Confirmation Dialog -->
    <MobileConfirmDialog
      :show="showDeleteConfirm"
      title="Delete Configuration?"
      :message="`Are you sure you want to delete &quot;${configToDelete?.name}&quot;? This action cannot be undone.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      variant="danger"
      @confirm="handleConfirmDelete"
      @cancel="handleCancelDelete"
    />

    <!-- Apply Confirmation Dialog -->
    <MobileConfirmDialog
      :show="showApplyConfirm"
      title="Apply Configuration?"
      :message="`Apply &quot;${configToApply?.name}&quot; and assign ${formatCurrency(configToApply?.total_amount || 0)} to ${configToApply?.item_count || 0} ${configToApply?.item_count === 1 ? 'category' : 'categories'}?`"
      confirm-text="Apply"
      cancel-text="Cancel"
      variant="info"
      @confirm="handleConfirmApply"
      @cancel="handleCancelApply"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XIcon, ZapIcon, PlusIcon } from 'lucide-vue-next'
import MobileAutoAssignConfigModal from './MobileAutoAssignConfigModal.vue'
import MobileConfirmDialog from './MobileConfirmDialog.vue'
import { formatCurrency } from '@/utils/currencyUtil'
import { useBudgetStore } from '@/stores/budget.store'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import { useCategoryStore } from '@/stores/category.store'
import { useApplyAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useApplyAutoAssignConfiguration'
import { useDeleteAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useDeleteAutoAssignConfiguration'
import { useCreateAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useCreateAutoAssignConfiguration'
import { useUpdateAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-write/useUpdateAutoAssignConfiguration'
import type { AutoAssignConfigurationSummary, AutoAssignConfigurationItem } from '@/services/auto-assign.service'

const props = defineProps<{
  show: boolean
}>()

const emit = defineEmits<{
  close: []
  applied: [categoryIds: string[]]
}>()

const budgetStore = useBudgetStore()
const autoAssignStore = useAutoAssignStore()
const categoryStore = useCategoryStore()
const { applyConfiguration } = useApplyAutoAssignConfiguration()
const { deleteConfiguration: deleteConfigurationOp } = useDeleteAutoAssignConfiguration()
const { createConfiguration } = useCreateAutoAssignConfiguration()
const { updateConfiguration } = useUpdateAutoAssignConfiguration()

const isClosing = ref(false)
const isApplying = ref(false)
const applyingMessage = ref('')
const editingConfig = ref<AutoAssignConfigurationSummary | null>(null)
const showEditModal = ref(false)
const showDeleteConfirm = ref(false)
const configToDelete = ref<AutoAssignConfigurationSummary | null>(null)
const showApplyConfirm = ref(false)
const configToApply = ref<AutoAssignConfigurationSummary | null>(null)

// Computed properties
const configurations = computed(() => autoAssignStore.configurations)
const readyToAssign = computed(() => budgetStore.readyToAssign)

// Swipe state management
const swipeStates = ref<Record<string, { offset: number, startX: number, startTime: number, isSwiping: boolean }>>({})
const configRefs = ref<Record<string, HTMLElement>>({})
const SWIPE_THRESHOLD = -180 // Wider to show both edit and delete buttons fully
const SWIPE_VELOCITY_THRESHOLD = 0.3

const setConfigRef = (id: string, el: any) => {
  if (el) {
    configRefs.value[id] = el
  }
}

const getSwipeOffset = (id: string) => {
  return swipeStates.value[id]?.offset || 0
}

const isSwiping = (id: string) => {
  return swipeStates.value[id]?.isSwiping || false
}

const closeOtherSwipes = (exceptId?: string) => {
  Object.keys(swipeStates.value).forEach(id => {
    if (id !== exceptId) {
      swipeStates.value[id] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }
    }
  })
}

const closeAllSwipes = () => {
  closeOtherSwipes()
}

const handleTouchStart = (event: TouchEvent, id: string) => {
  closeOtherSwipes(id)

  const touch = event.touches[0]
  swipeStates.value[id] = {
    offset: swipeStates.value[id]?.offset || 0,
    startX: touch.clientX,
    startTime: Date.now(),
    isSwiping: true
  }
}

const handleTouchMove = (event: TouchEvent, id: string) => {
  const state = swipeStates.value[id]
  if (!state) return

  const touch = event.touches[0]
  const deltaX = touch.clientX - state.startX
  const currentOffset = state.offset || 0

  // Only allow swiping left (negative direction)
  const newOffset = Math.min(0, Math.max(SWIPE_THRESHOLD, currentOffset + deltaX))

  swipeStates.value[id] = {
    ...state,
    offset: newOffset,
    startX: touch.clientX,
    isSwiping: true
  }
}

const handleTouchEnd = (id: string) => {
  const state = swipeStates.value[id]
  if (!state) return

  const duration = Date.now() - state.startTime
  const distance = state.offset
  const velocity = Math.abs(distance) / duration

  // Snap to open or closed based on threshold or velocity
  if (state.offset < SWIPE_THRESHOLD / 2 || velocity > SWIPE_VELOCITY_THRESHOLD) {
    // Snap to open (reveal edit/delete buttons)
    swipeStates.value[id] = { ...state, offset: SWIPE_THRESHOLD, isSwiping: false }
  } else {
    // Snap to closed
    swipeStates.value[id] = { ...state, offset: 0, isSwiping: false }
  }
}

const handleConfigClick = (config: AutoAssignConfigurationSummary) => {
  // If the config is swiped open, close it instead of applying
  if (swipeStates.value[config.name]?.offset !== 0) {
    swipeStates.value[config.name] = {
      ...swipeStates.value[config.name],
      offset: 0,
      isSwiping: false
    }
    return
  }

  // Check if disabled
  if (isApplying.value || readyToAssign.value < config.total_amount) {
    return
  }

  // Show confirmation dialog
  configToApply.value = config
  showApplyConfirm.value = true
}

const handleEdit = (config: AutoAssignConfigurationSummary) => {
  // Close the swipe
  swipeStates.value[config.name] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }

  // Set editing config and show modal
  editingConfig.value = config
  showEditModal.value = true
}

const handleDelete = (config: AutoAssignConfigurationSummary) => {
  // Close the swipe
  swipeStates.value[config.name] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }

  // Show confirm dialog
  configToDelete.value = config
  showDeleteConfirm.value = true
}

const handleConfirmDelete = async () => {
  if (!configToDelete.value) return

  try {
    await deleteConfigurationOp(budgetStore.currentBudget!.id, configToDelete.value.name)
    showDeleteConfirm.value = false
    configToDelete.value = null
  } catch (error) {
    console.error('Failed to delete configuration:', error)
    alert('Failed to delete configuration')
  }
}

const handleCancelDelete = () => {
  showDeleteConfirm.value = false
  configToDelete.value = null
}

const handleCreateNew = () => {
  editingConfig.value = null
  showEditModal.value = true
}

const handleCloseEditModal = () => {
  showEditModal.value = false
  editingConfig.value = null
}

const handleSaveConfiguration = async (data: { name: string; items: AutoAssignConfigurationItem[] }) => {
  try {
    if (editingConfig.value) {
      // Update existing configuration
      await updateConfiguration(
        budgetStore.currentBudget!.id,
        editingConfig.value.name,
        {
          name: data.name,
          items: data.items
        }
      )
    } else {
      // Create new configuration
      await createConfiguration({
        budget_id: budgetStore.currentBudget!.id,
        name: data.name,
        items: data.items
      })
    }

    handleCloseEditModal()
  } catch (error) {
    console.error('Failed to save configuration:', error)
    alert('Failed to save configuration')
  }
}

// Reset state when modal opens
watch(() => props.show, (newValue) => {
  if (newValue) {
    isClosing.value = false
    isApplying.value = false
  }
})

const handleClose = () => {
  if (isApplying.value) return
  
  isClosing.value = true
  setTimeout(() => {
    emit('close')
  }, 300)
}

const handleConfirmApply = async () => {
  if (!configToApply.value) return

  const configName = configToApply.value.name

  // Close the confirmation dialog immediately
  showApplyConfirm.value = false
  configToApply.value = null

  try {
    isApplying.value = true
    applyingMessage.value = `Applying ${configName}...`

    const result = await applyConfiguration({
      name: configName,
      budget_id: budgetStore.currentBudget!.id
    })

    // Update category balances
    if (result.appliedCategories && result.appliedCategories.length > 0) {
      // Refresh category balances to show updated values
      const categoryIds = result.appliedCategories.map(c => c.category_id)

      // Update each category balance optimistically
      result.appliedCategories.forEach(({ category_id, amount }) => {
        const currentBalance = categoryStore.categoryBalances.find(b => b.category_id === category_id)
        if (currentBalance) {
          categoryStore.updateCategoryBalance(category_id, {
            ...currentBalance,
            assigned: (currentBalance.assigned || 0) + amount,
            available: (currentBalance.available || 0) + amount
          })
        }
      })

      // Emit event for flash animation
      emit('applied', categoryIds)
    }

    // Reset state
    isApplying.value = false

    // Close the sheet
    handleClose()

  } catch (error) {
    console.error('Failed to apply configuration:', error)
    applyingMessage.value = 'Failed to apply configuration'
    await new Promise(resolve => setTimeout(resolve, 1500))
    isApplying.value = false
  }
}

const handleCancelApply = () => {
  showApplyConfirm.value = false
  configToApply.value = null
}
</script>

