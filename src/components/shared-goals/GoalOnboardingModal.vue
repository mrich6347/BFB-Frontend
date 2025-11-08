<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ currentStepTitle }}</DialogTitle>
        <DialogDescription>
          {{ currentStepDescription }}
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4">
        <!-- Step 1: Category Selection -->
        <div v-if="currentStep === 1" class="space-y-4">
          <div class="bg-muted/50 border border-border rounded-md p-4">
            <p class="text-sm text-foreground mb-2">
              <strong>How it works:</strong>
            </p>
            <p class="text-sm text-muted-foreground">
              Link a category to this goal. Money in that category will count toward your contribution to the goal.
            </p>
          </div>

          <div>
            <CategorySelector
              v-model="selectedCategoryId"
              :available-categories="availableCategories"
              label="Select Category"
              placeholder="Search categories..."
              :error="categoryError"
              @select="handleCategorySelect"
            />
          </div>

          <div v-if="selectedCategoryId" class="bg-muted/30 border border-border rounded-md p-3">
            <div class="flex items-center justify-between">
              <span class="text-sm text-muted-foreground">Current Balance:</span>
              <span class="text-sm font-medium text-foreground">
                {{ formatCurrency(selectedCategoryBalance) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Step 2: Monthly Contribution -->
        <div v-if="currentStep === 2" class="space-y-4">
          <div class="bg-muted/50 border border-border rounded-md p-4">
            <p class="text-sm text-foreground mb-2">
              <strong>Optional:</strong>
            </p>
            <p class="text-sm text-muted-foreground">
              Set how much you plan to contribute each month. This helps estimate when the goal will be reached.
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-foreground mb-2">
              Monthly Contribution
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-muted-foreground">$</span>
              </div>
              <input
                v-model="monthlyContribution"
                type="text"
                placeholder="0.00"
                class="block w-full pl-8 pr-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
                :class="{ 'border-destructive': contributionError }"
                @input="validateContribution"
                @blur="formatContribution"
              />
            </div>
            <p v-if="contributionError" class="mt-1 text-sm text-destructive">
              {{ contributionError }}
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              You can skip this and set it later
            </p>
          </div>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <div class="flex">
            <div class="flex-shrink-0">
              <AlertCircleIcon class="h-4 w-4 text-destructive" />
            </div>
            <div class="ml-2">
              <p class="text-sm text-destructive">{{ error }}</p>
            </div>
          </div>
        </div>

        <!-- Navigation Buttons -->
        <div class="flex items-center justify-between pt-4">
          <Button
            v-if="currentStep > 1"
            @click="previousStep"
            variant="outline"
            :disabled="isSubmitting"
          >
            Back
          </Button>
          <div v-else></div>

          <div class="flex items-center space-x-2">
            <Button
              v-if="currentStep < totalSteps"
              @click="nextStep"
              :disabled="!canProceed || isSubmitting"
            >
              Next
            </Button>
            <Button
              v-else
              @click="handleComplete"
              :disabled="!canProceed || isSubmitting"
            >
              {{ isSubmitting ? 'Saving...' : 'Complete' }}
            </Button>
          </div>
        </div>

        <!-- Step Indicator -->
        <div class="flex items-center justify-center space-x-2 pt-2">
          <div
            v-for="step in totalSteps"
            :key="step"
            class="h-2 w-2 rounded-full transition-colors"
            :class="step === currentStep ? 'bg-primary' : 'bg-muted'"
          ></div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AlertCircleIcon } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../shadcn-ui'
import Button from '../shadcn-ui/button.vue'
import CategorySelector from '../categories/CategorySelector.vue'
import { useGoalInvitations } from '../../composables/shared-goals/useGoalInvitations'
import { useCategoryStore } from '../../stores/category.store'
import type { CategoryResponse } from '../../types/DTO/category.dto'

interface Props {
  isOpen: boolean
  goalId: string
  goalName: string
  budgetId: string
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'completed'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { updateParticipant } = useGoalInvitations()
const categoryStore = useCategoryStore()

const currentStep = ref(1)
const totalSteps = 2
const selectedCategoryId = ref<string | null>(null)
const monthlyContribution = ref('')
const categoryError = ref('')
const contributionError = ref('')
const error = ref('')
const isSubmitting = ref(false)

// Get available categories (exclude hidden categories)
const availableCategories = computed(() => {
  return categoryStore.categories.filter(cat => {
    const group = categoryStore.getCategoryGroupById(cat.category_group_id)
    return group?.name !== 'Hidden Categories'
  })
})

// Computed
const currentStepTitle = computed(() => {
  switch (currentStep.value) {
    case 1:
      return 'Link a Category'
    case 2:
      return 'Set Monthly Contribution'
    default:
      return ''
  }
})

const currentStepDescription = computed(() => {
  switch (currentStep.value) {
    case 1:
      return `Choose which category to link to "${props.goalName}"`
    case 2:
      return 'How much do you plan to contribute each month?'
    default:
      return ''
  }
})

const selectedCategoryBalance = computed(() => {
  if (!selectedCategoryId.value) return 0
  const balance = categoryStore.categoryBalances.find(bal => bal.category_id === selectedCategoryId.value)
  return balance?.available || 0
})

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return selectedCategoryId.value !== null && !categoryError.value
  }
  if (currentStep.value === 2) {
    return !contributionError.value
  }
  return false
})

// Methods
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const handleCategorySelect = (category: CategoryResponse | null) => {
  if (category) {
    selectedCategoryId.value = category.id
    categoryError.value = ''
  } else {
    selectedCategoryId.value = null
  }
}

const validateContribution = () => {
  contributionError.value = ''

  if (monthlyContribution.value) {
    const amount = parseFloat(monthlyContribution.value.replace(/[^0-9.]/g, ''))
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

const formatContribution = () => {
  if (monthlyContribution.value) {
    const amount = parseFloat(monthlyContribution.value.replace(/[^0-9.]/g, ''))
    if (!isNaN(amount)) {
      monthlyContribution.value = amount.toFixed(2)
    }
  }
}

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++
  }
}

const previousStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

const handleComplete = async () => {
  if (!selectedCategoryId.value) {
    categoryError.value = 'Please select a category'
    return
  }

  if (!validateContribution()) {
    return
  }

  try {
    isSubmitting.value = true
    error.value = ''

    const updateData = {
      category_id: selectedCategoryId.value,
      monthly_contribution: monthlyContribution.value ? parseFloat(monthlyContribution.value) : undefined
    }

    const success = await updateParticipant(props.goalId, updateData)
    if (success) {
      emit('completed')
      handleClose()
    }
  } catch (err: any) {
    error.value = err.message || 'Failed to save settings'
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  emit('update:isOpen', false)
}

const resetForm = () => {
  currentStep.value = 1
  selectedCategoryId.value = null
  monthlyContribution.value = ''
  categoryError.value = ''
  contributionError.value = ''
  error.value = ''
}

// Watch for modal open/close to reset form
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>

