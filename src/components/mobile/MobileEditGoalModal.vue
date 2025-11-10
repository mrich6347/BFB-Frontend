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
        class="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-lg transition-transform duration-300 max-h-[90vh] overflow-y-auto"
        :class="isClosing ? 'translate-y-full' : 'translate-y-0'"
        @click.stop
        style="padding-bottom: max(2rem, calc(2rem + env(safe-area-inset-bottom)));"
      >
        <!-- Header -->
        <div class="sticky top-0 bg-background px-4 py-4 border-b border-border z-10">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">Edit Goal</h3>
            <button @click="handleClose" class="p-2 hover:bg-accent rounded-md">
              <XIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
          <!-- Goal Name Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium">Goal Name</label>
            <input
              v-model="formData.name"
              type="text"
              placeholder="Enter goal name"
              class="w-full px-4 py-3 border border-input rounded-md bg-background text-lg"
            />
          </div>

          <!-- Description Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium">Description (Optional)</label>
            <textarea
              v-model="formData.description"
              placeholder="Enter description"
              rows="3"
              class="w-full px-4 py-3 border border-input rounded-md bg-background"
            />
          </div>

          <!-- Target Amount Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium">Target Amount</label>
            <div class="relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
              <input
                v-model="targetAmountInput"
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                class="w-full pl-8 pr-4 py-3 border border-input rounded-md bg-background text-lg"
                @input="handleTargetAmountInput"
              />
            </div>
          </div>

          <!-- Target Date Input -->
          <div class="space-y-2">
            <label class="text-sm font-medium">Target Date (Optional)</label>
            <input
              v-model="formData.target_date"
              type="date"
              class="w-full px-4 py-3 border border-input rounded-md bg-background"
            />
          </div>

          <!-- Participants Section (only if user is creator) -->
          <div v-if="goal && isGoalCreator" class="space-y-3 pt-4 border-t border-border">
            <h4 class="text-sm font-semibold">Participant Contributions</h4>
            <div
              v-for="participant in goal.participants"
              :key="participant.id"
              class="space-y-2 p-3 bg-muted/50 rounded-lg"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm font-medium">
                  {{ participant.user_profile?.display_name || 'Unknown' }}
                </span>
                <span v-if="participant.user_profile_id === currentUserProfileId" class="text-xs text-muted-foreground">
                  (You)
                </span>
              </div>
              <div class="space-y-1">
                <label class="text-xs text-muted-foreground">Monthly Contribution</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                  <input
                    v-model="participantContributions[participant.id]"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="w-full pl-7 pr-3 py-2 border border-input rounded-md bg-background text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Save Button -->
          <button
            @click="handleSave"
            :disabled="!isFormValid || isLoading"
            class="w-full py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isLoading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { XIcon } from 'lucide-vue-next'
import { useSharedGoalOperations } from '../../composables/shared-goals/useSharedGoalOperations'
import { useUserProfileStore } from '../../stores/user-profile.store'
import { SharedGoalsService } from '../../services/shared-goals.service'
import type { SharedGoalResponse, UpdateSharedGoalDto } from '../../types/DTO/shared-goal.dto'

const props = defineProps<{
  show: boolean
  goal: SharedGoalResponse | null
}>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const { updateGoal } = useSharedGoalOperations()
const userProfileStore = useUserProfileStore()

const isLoading = ref(false)
const isClosing = ref(false)
const targetAmountInput = ref('')
const participantContributions = ref<Record<string, string>>({})

const formData = ref<{
  name: string
  description: string
  target_amount: number
  target_date: string
}>({
  name: '',
  description: '',
  target_amount: 0,
  target_date: ''
})

const currentUserProfileId = computed(() => userProfileStore.currentProfile?.id)
const isGoalCreator = computed(() => props.goal?.created_by === currentUserProfileId.value)

const isFormValid = computed(() => {
  return formData.value.name && formData.value.name.trim().length > 0 && formData.value.target_amount > 0
})

// Initialize form when goal changes
watch(() => props.goal, (goal) => {
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

    // Initialize participant contributions
    if (goal.participants) {
      const contributions: Record<string, string> = {}
      goal.participants.forEach(participant => {
        contributions[participant.id] = participant.monthly_contribution?.toString() || '0'
      })
      participantContributions.value = contributions
    }
  }
}, { immediate: true })

// Reset closing state when modal opens
watch(() => props.show, (newValue) => {
  if (newValue) {
    isClosing.value = false
  }
})

const handleTargetAmountInput = () => {
  const value = parseFloat(targetAmountInput.value)
  if (!isNaN(value) && value > 0) {
    formData.value.target_amount = value
  }
}

const handleClose = () => {
  if (isLoading.value) return
  
  isClosing.value = true
  setTimeout(() => {
    emit('close')
  }, 300)
}

const handleSave = async () => {
  if (!props.goal || !isFormValid.value || isLoading.value) return

  isLoading.value = true

  try {
    // Update goal details
    const submitData: UpdateSharedGoalDto = {
      name: formData.value.name.trim(),
      description: formData.value.description?.trim() || undefined,
      target_amount: formData.value.target_amount,
      target_date: formData.value.target_date || undefined
    }

    const updatedGoal = await updateGoal(props.goal.id, submitData)
    
    if (updatedGoal && isGoalCreator.value && props.goal.participants) {
      // Update participant contributions if user is the creator
      const updatePromises = props.goal.participants.map(async (participant) => {
        const newContribution = parseFloat(participantContributions.value[participant.id] || '0')
        const oldContribution = participant.monthly_contribution || 0
        
        // Only update if the value changed
        if (newContribution !== oldContribution) {
          try {
            await SharedGoalsService.updateParticipantByCreator(
              props.goal!.id,
              participant.id,
              { monthly_contribution: newContribution }
            )
          } catch (error) {
            console.error(`Failed to update contribution for participant ${participant.id}:`, error)
          }
        }
      })

      await Promise.all(updatePromises)
    }

    emit('updated')
    
    // Close modal with animation
    isClosing.value = true
    setTimeout(() => {
      emit('close')
    }, 300)
  } catch (error) {
    console.error('Failed to update goal:', error)
  } finally {
    isLoading.value = false
  }
}
</script>

