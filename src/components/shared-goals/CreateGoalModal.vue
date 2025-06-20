<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Shared Goal</DialogTitle>
        <DialogDescription>
          Create a new goal that you can share with others to work towards together.
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
            placeholder="Describe your goal (optional)"
            rows="3"
            class="block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none"
            :class="{ 'border-destructive': errors.description }"
            maxlength="500"
            @input="validateDescription"
          />
          <p v-if="errors.description" class="mt-1 text-sm text-destructive">
            {{ errors.description }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            {{ formData.description?.length || 0 }}/500 characters
          </p>
        </div>

        <!-- Target Amount -->
        <div>
          <label for="target_amount" class="block text-sm font-medium text-foreground mb-1">
            Target Amount <span class="text-destructive">*</span>
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span class="text-muted-foreground">$</span>
            </div>
            <input
              id="target_amount"
              v-model="targetAmountInput"
              type="text"
              placeholder="0.00"
              class="block w-full pl-8 pr-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
              :class="{ 'border-destructive': errors.target_amount }"
              required
              @input="validateTargetAmount"
              @blur="formatTargetAmount"
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
            class="block w-full px-3 py-2 border border-input rounded-md shadow-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            :class="{ 'border-destructive': errors.target_date }"
            :min="minDate"
            @input="validateTargetDate"
          />
          <p v-if="errors.target_date" class="mt-1 text-sm text-destructive">
            {{ errors.target_date }}
          </p>
          <p class="mt-1 text-xs text-muted-foreground">
            Optional: Set a target completion date
          </p>
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

        <!-- Form Actions -->
        <div class="flex justify-end space-x-3 pt-4">
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
          >
            <span v-if="isSubmitting">Creating...</span>
            <span v-else>Create Goal</span>
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
import type { CreateSharedGoalDto, SharedGoalResponse } from '../../types/DTO/shared-goal.dto'

interface Props {
  isOpen: boolean
}

interface Emits {
  (e: 'update:isOpen', value: boolean): void
  (e: 'goalCreated', goal: SharedGoalResponse): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { createGoal, error, clearError } = useSharedGoalOperations()

const isSubmitting = ref(false)
const targetAmountInput = ref('')

const formData = ref<CreateSharedGoalDto>({
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
  return formData.value.name.length > 0 &&
         formData.value.target_amount > 0 &&
         !errors.value.name &&
         !errors.value.description &&
         !errors.value.target_amount &&
         !errors.value.target_date
})

// Validation methods
const validateName = () => {
  const name = formData.value.name
  if (name.length === 0) {
    errors.value.name = ''
    return
  }
  if (name.length > 100) {
    errors.value.name = 'Goal name must be at most 100 characters long'
    return
  }
  errors.value.name = ''
}

const validateDescription = () => {
  const description = formData.value.description || ''
  if (description.length > 500) {
    errors.value.description = 'Description must be at most 500 characters long'
    return
  }
  errors.value.description = ''
}

const validateTargetAmount = () => {
  const input = targetAmountInput.value.replace(/[^0-9.]/g, '')
  const amount = parseFloat(input)

  if (isNaN(amount) || amount <= 0) {
    errors.value.target_amount = 'Target amount must be greater than 0'
    formData.value.target_amount = 0
    return
  }

  if (amount > 999999999.99) {
    errors.value.target_amount = 'Target amount is too large'
    return
  }

  formData.value.target_amount = amount
  errors.value.target_amount = ''
}

const formatTargetAmount = () => {
  if (formData.value.target_amount > 0) {
    targetAmountInput.value = formData.value.target_amount.toFixed(2)
  }
}

const validateTargetDate = () => {
  const date = formData.value.target_date
  if (!date) {
    errors.value.target_date = ''
    return
  }

  const selectedDate = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (selectedDate < today) {
    errors.value.target_date = 'Target date cannot be in the past'
    return
  }

  errors.value.target_date = ''
}

const resetForm = () => {
  formData.value = {
    name: '',
    description: '',
    target_amount: 0,
    target_date: ''
  }
  targetAmountInput.value = ''
  errors.value = {
    name: '',
    description: '',
    target_amount: '',
    target_date: ''
  }
  clearError()
}

const handleSubmit = async () => {
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
    const submitData: CreateSharedGoalDto = {
      ...formData.value,
      description: formData.value.description || undefined,
      target_date: formData.value.target_date || undefined
    }

    const newGoal = await createGoal(submitData)
    if (newGoal) {
      emit('goalCreated', newGoal)
      handleClose()
    }
  } catch (error) {
    console.error('Failed to create goal:', error)
  } finally {
    isSubmitting.value = false
  }
}

const handleClose = () => {
  emit('update:isOpen', false)
}

// Watch for modal open/close to reset form
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    resetForm()
  }
})
</script>
