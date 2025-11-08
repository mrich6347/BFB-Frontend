<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Goal</DialogTitle>
        <DialogDescription>
          Update your shared goal details.
        </DialogDescription>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Goal Name -->
        <div>
          <label for="name" class="block text-sm font-medium text-foreground mb-1">
            Goal Name <span class="text-destructive">*</span>
          </label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            placeholder="Enter goal name"
            class="block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            :class="{ 'border-destructive': errors.name }"
            required
            maxlength="100"
            @input="validateName"
          />
          <p v-if="errors.name" class="mt-1 text-sm text-destructive">
            {{ errors.name }}
          </p>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium text-foreground mb-1">
            Description
          </label>
          <textarea
            id="description"
            v-model="formData.description"
            placeholder="Optional description"
            rows="3"
            class="block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none"
            :class="{ 'border-destructive': errors.description }"
            maxlength="500"
            @input="validateDescription"
          ></textarea>
          <p v-if="errors.description" class="mt-1 text-sm text-destructive">
            {{ errors.description }}
          </p>
        </div>

        <!-- Target Amount -->
        <div>
          <label for="target_amount" class="block text-sm font-medium text-foreground mb-1">
            Target Amount <span class="text-destructive">*</span>
          </label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">$</span>
            <input
              id="target_amount"
              v-model="targetAmountInput"
              type="text"
              placeholder="0.00"
              class="block w-full pl-8 pr-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
              :class="{ 'border-destructive': errors.target_amount }"
              required
              @input="validateTargetAmount"
            />
          </div>
          <p v-if="errors.target_amount" class="mt-1 text-sm text-destructive">
            {{ errors.target_amount }}
          </p>
        </div>

        <!-- Target Date -->
        <div>
          <label for="target_date" class="block text-sm font-medium text-foreground mb-1">
            Target Date
          </label>
          <input
            id="target_date"
            v-model="formData.target_date"
            type="date"
            :min="minDate"
            class="block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            :class="{ 'border-destructive': errors.target_date }"
            @input="validateTargetDate"
          />
          <p v-if="errors.target_date" class="mt-1 text-sm text-destructive">
            {{ errors.target_date }}
          </p>
        </div>

        <!-- Error Display -->
        <div v-if="error" class="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <AlertCircleIcon class="h-4 w-4 text-destructive flex-shrink-0" />
          <p class="text-sm text-destructive">{{ error }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            @click="handleClose"
            :disabled="isSubmitting"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="!isFormValid || isSubmitting"
            class="min-w-[100px]"
          >
            <span v-if="isSubmitting">Updating...</span>
            <span v-else>Update Goal</span>
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AlertCircleIcon } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../shadcn-ui'
import Button from '../shadcn-ui/button.vue'
import { useSharedGoalOperations } from '../../composables/shared-goals/useSharedGoalOperations'
import type { UpdateSharedGoalDto, SharedGoalResponse } from '../../types/DTO/shared-goal.dto'

interface Props {
  isOpen: boolean
  goal: SharedGoalResponse | null
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'goalUpdated', goal: SharedGoalResponse): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { updateGoal, error, clearError } = useSharedGoalOperations()

const isSubmitting = ref(false)
const targetAmountInput = ref('')

const formData = ref<UpdateSharedGoalDto>({
  name: '',
  description: '',
  target_amount: 0,
  target_date: ''
})

const errors = ref({
  name: '',
  description: '',
  target_amount: '',
  target_date: ''
})

// Computed
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

const isFormValid = computed(() => {
  return formData.value.name && formData.value.name.length > 0 &&
         formData.value.target_amount && formData.value.target_amount > 0 &&
         !errors.value.name &&
         !errors.value.description &&
         !errors.value.target_amount &&
         !errors.value.target_date
})

// Initialize form when goal changes
watch(
  () => props.goal,
  (goal) => {
    if (goal) {
      // Parse target_date properly to avoid timezone issues
      let targetDateString = ''
      if (goal.target_date) {
        const dateStr = typeof goal.target_date === 'string' ? goal.target_date : goal.target_date.toISOString()
        targetDateString = dateStr.split('T')[0]
      }

      formData.value = {
        name: goal.name,
        description: goal.description || '',
        target_amount: goal.target_amount,
        target_date: targetDateString
      }
      targetAmountInput.value = goal.target_amount.toString()
    }
  },
  { immediate: true }
)

// Watch for modal open/close to clear errors
watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen) {
      clearError()
      clearErrors()
    }
  }
)

// Validation methods
const validateName = () => {
  errors.value.name = ''
  if (!formData.value.name || formData.value.name.trim().length === 0) {
    errors.value.name = 'Goal name is required'
  } else if (formData.value.name.length > 100) {
    errors.value.name = 'Goal name must be at most 100 characters'
  }
}

const validateDescription = () => {
  errors.value.description = ''
  if (formData.value.description && formData.value.description.length > 500) {
    errors.value.description = 'Description must be at most 500 characters'
  }
}

const validateTargetAmount = () => {
  errors.value.target_amount = ''
  
  if (!targetAmountInput.value) {
    errors.value.target_amount = 'Target amount is required'
    formData.value.target_amount = 0
    return
  }

  const amount = parseFloat(targetAmountInput.value.replace(/[^0-9.]/g, ''))
  
  if (isNaN(amount) || amount <= 0) {
    errors.value.target_amount = 'Please enter a valid amount greater than 0'
    formData.value.target_amount = 0
  } else if (amount > 999999999.99) {
    errors.value.target_amount = 'Amount is too large'
    formData.value.target_amount = 0
  } else {
    formData.value.target_amount = amount
    targetAmountInput.value = amount.toFixed(2)
  }
}

const validateTargetDate = () => {
  errors.value.target_date = ''
  if (formData.value.target_date) {
    const selectedDate = new Date(formData.value.target_date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      errors.value.target_date = 'Target date cannot be in the past'
    }
  }
}

const clearErrors = () => {
  errors.value = {
    name: '',
    description: '',
    target_amount: '',
    target_date: ''
  }
}

const handleSubmit = async () => {
  if (!props.goal) return

  try {
    isSubmitting.value = true

    // Final validation
    validateName()
    validateDescription()
    validateTargetAmount()
    validateTargetDate()

    if (!isFormValid.value) {
      return
    }

    // Prepare data for submission
    const submitData: UpdateSharedGoalDto = {
      name: formData.value.name,
      description: formData.value.description || undefined,
      target_amount: formData.value.target_amount,
      target_date: formData.value.target_date || undefined
    }

    const updatedGoal = await updateGoal(props.goal.id, submitData)
    if (updatedGoal) {
      emit('goalUpdated', updatedGoal)
      handleClose()
    }
  } catch (error) {
    console.error('Failed to update goal:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  emit('update:isOpen', false)
}
</script>
