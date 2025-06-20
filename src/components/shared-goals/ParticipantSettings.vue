<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between">
      <h3 class="text-lg font-semibold">Your Contribution Settings</h3>
      <button
        v-if="!isEditing"
        @click="startEditing"
        class="px-3 py-1 text-sm text-primary hover:text-primary/80 border border-primary rounded-md hover:bg-primary/10"
      >
        {{ hasSettings ? 'Edit' : 'Set Up' }}
      </button>
    </div>

    <div v-if="!isEditing && hasSettings" class="space-y-2">
      <!-- Current settings display -->
      <div class="p-4 bg-muted/50 rounded-lg">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-muted-foreground">Category</label>
            <p class="text-sm">{{ selectedCategoryName || 'Not selected' }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-muted-foreground">Monthly Contribution</label>
            <p class="text-sm">{{ formatCurrency(participant?.monthly_contribution || 0) }}</p>
          </div>
        </div>
        <div v-if="selectedCategoryBalance !== null" class="mt-2 pt-2 border-t border-border">
          <label class="text-sm font-medium text-muted-foreground">Current Balance</label>
          <p class="text-sm font-semibold" :class="selectedCategoryBalance >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(selectedCategoryBalance) }}
          </p>
        </div>
      </div>
    </div>

    <div v-if="isEditing || !hasSettings" class="space-y-4">
      <!-- Category selection -->
      <CategorySelector
        v-model="selectedCategoryId"
        :available-categories="availableCategories"
        label="Select Category to Track"
        placeholder="Choose a category..."
        :error="categoryError"
        @select="handleCategorySelect"
      />

      <!-- Monthly contribution input -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Monthly Contribution (Optional)</label>
        <div class="relative">
          <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
          <input
            v-model="monthlyContribution"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            class="w-full pl-8 pr-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
            :class="{ 'border-red-500': contributionError }"
          />
        </div>
        <p v-if="contributionError" class="text-sm text-red-500">{{ contributionError }}</p>
        <p class="text-xs text-muted-foreground">
          This helps calculate projected completion dates. Leave blank if you prefer not to set a target.
        </p>
      </div>

      <!-- Selected category balance display -->
      <div v-if="selectedCategoryBalance !== null" class="p-3 bg-muted/30 rounded-md">
        <div class="flex justify-between items-center">
          <span class="text-sm font-medium">Current Balance:</span>
          <span class="text-sm font-semibold" :class="selectedCategoryBalance >= 0 ? 'text-green-600' : 'text-red-600'">
            {{ formatCurrency(selectedCategoryBalance) }}
          </span>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2">
        <button
          @click="saveSettings"
          :disabled="!canSave || isLoading"
          class="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ isLoading ? 'Saving...' : 'Save Settings' }}
        </button>
        <button
          v-if="hasSettings"
          @click="cancelEditing"
          class="px-4 py-2 text-sm font-medium text-muted-foreground border border-border rounded-md hover:bg-accent"
        >
          Cancel
        </button>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import CategorySelector from '../shared/CategorySelector.vue'
import { useGoalProgress } from '../../composables/shared-goals/useGoalProgress'
import { useCategoryStore } from '../../stores/category.store'
import { useSharedGoalsStore } from '../../stores/shared-goals.store'
import type { GoalParticipantResponse } from '../../types/DTO/shared-goal.dto'
import type { CategoryResponse } from '../../types/DTO/category.dto'

interface Props {
  participant: GoalParticipantResponse | null
  goalId: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'updated'): void
}>()

const categoryStore = useCategoryStore()
const sharedGoalsStore = useSharedGoalsStore()
const { updateParticipant, loadGoalProgress, isLoading, formatCurrency } = useGoalProgress()

// Reactive state
const isEditing = ref(false)
const selectedCategoryId = ref<string | null>(null)
const monthlyContribution = ref<string>('')
const categoryError = ref('')
const contributionError = ref('')

// Computed properties
const hasSettings = computed(() => {
  return props.participant?.category_id || props.participant?.monthly_contribution
})

const availableCategories = computed(() => {
  return categoryStore.categories.filter(cat => !cat.name.toLowerCase().includes('hidden'))
})

const selectedCategoryName = computed(() => {
  if (!props.participant?.category_id) return null
  const category = availableCategories.value.find(cat => cat.id === props.participant?.category_id)
  return category?.name || 'Unknown Category'
})

const selectedCategoryBalance = computed(() => {
  if (!selectedCategoryId.value && !props.participant?.category_id) return null

  const categoryId = selectedCategoryId.value || props.participant?.category_id
  const balance = categoryStore.categoryBalances.find(bal => bal.category_id === categoryId)
  return balance?.available || 0
})

const canSave = computed(() => {
  return selectedCategoryId.value && !categoryError.value && !contributionError.value
})

// Initialize form data
const initializeForm = () => {
  selectedCategoryId.value = props.participant?.category_id || null
  monthlyContribution.value = props.participant?.monthly_contribution?.toString() || ''
}

// Event handlers
const startEditing = () => {
  isEditing.value = true
  initializeForm()
}

const cancelEditing = () => {
  isEditing.value = false
  initializeForm()
  clearErrors()
}

const handleCategorySelect = async (category: CategoryResponse | null) => {
  if (category) {
    selectedCategoryId.value = category.id
    categoryError.value = ''

    // Immediately call progress calculation to show updated progress
    // This provides instant feedback when user selects a category
    try {
      const progressData = await loadGoalProgress(props.goalId)
      if (progressData) {
        // Update the specific goal in the store with new progress data
        sharedGoalsStore.updateGoalProgress(props.goalId, progressData.goal)
      }
    } catch (error) {
      console.error('Failed to refresh goal progress after category selection:', error)
      // Don't show error to user since this is just for immediate feedback
    }
  }
}

const validateContribution = () => {
  contributionError.value = ''

  if (monthlyContribution.value) {
    const amount = parseFloat(monthlyContribution.value)
    if (isNaN(amount) || amount < 0) {
      contributionError.value = 'Please enter a valid amount'
      return false
    }
    if (amount > 999999.99) {
      contributionError.value = 'Amount is too large'
      return false
    }
  }

  return true
}

const saveSettings = async () => {
  clearErrors()

  if (!selectedCategoryId.value) {
    categoryError.value = 'Please select a category'
    return
  }

  if (!validateContribution()) {
    return
  }

  const updateData = {
    category_id: selectedCategoryId.value,
    monthly_contribution: monthlyContribution.value ? parseFloat(monthlyContribution.value) : undefined
  }

  const success = await updateParticipant(props.goalId, updateData)
  if (success) {
    isEditing.value = false

    // Immediately update the goal progress to reflect the new category contribution
    try {
      const progressData = await loadGoalProgress(props.goalId)
      if (progressData) {
        // Update the specific goal in the store with new progress data
        sharedGoalsStore.updateGoalProgress(props.goalId, progressData.goal)
      }
    } catch (error) {
      console.error('Failed to refresh goal progress after participant update:', error)
      // Don't show error to user since the update was successful
    }

    emit('updated')
  }
}

const clearErrors = () => {
  categoryError.value = ''
  contributionError.value = ''
}

// Watch for prop changes
watch(() => props.participant, () => {
  if (!isEditing.value) {
    initializeForm()
  }
  // Auto-start editing if no settings exist
  if (!hasSettings.value && !isEditing.value) {
    isEditing.value = true
  }
}, { immediate: true })

// Watch monthly contribution for validation
watch(monthlyContribution, () => {
  if (contributionError.value) {
    validateContribution()
  }
})
</script>
