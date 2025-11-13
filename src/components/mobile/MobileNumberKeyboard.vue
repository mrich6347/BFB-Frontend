<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-x-0 bottom-0 bg-background border-t border-border z-[9999]"
      style="padding-bottom: env(safe-area-inset-bottom);"
    >
      <!-- Keyboard -->
      <div class="grid grid-cols-3 gap-px bg-border pt-2">
        <!-- Number buttons 1-9 -->
        <button
          v-for="num in [1, 2, 3, 4, 5, 6, 7, 8, 9]"
          :key="num"
          @click="handleNumberPress(num.toString())"
          class="bg-background hover:bg-accent active:bg-accent/80 py-6 text-2xl font-semibold transition-colors"
        >
          {{ num }}
        </button>

        <!-- Bottom row: decimal, 0, backspace -->
        <button
          @click="handleDecimalPress"
          class="bg-background hover:bg-accent active:bg-accent/80 py-6 text-2xl font-semibold transition-colors"
        >
          .
        </button>
        
        <button
          @click="handleNumberPress('0')"
          class="bg-background hover:bg-accent active:bg-accent/80 py-6 text-2xl font-semibold transition-colors"
        >
          0
        </button>
        
        <button
          @click="handleBackspace"
          class="bg-background hover:bg-accent active:bg-accent/80 py-6 text-2xl font-semibold transition-colors"
        >
          ⌫
        </button>
      </div>

      <!-- Action buttons -->
      <div class="grid grid-cols-2 gap-2 p-4 bg-background">
        <button
          @click="handleCancel"
          class="py-3 bg-muted text-foreground rounded-md font-medium hover:bg-muted/80 transition-colors"
        >
          Cancel
        </button>
        <button
          @click="handleDone"
          class="py-3 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors"
        >
          Done
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  show: boolean
  modelValue: string // The cents value as a string (e.g., "000", "1234")
  color?: 'red' | 'green' | 'blue'
}>(), {
  color: 'blue'
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'done': []
  'cancel': []
}>()

const internalValue = ref(props.modelValue)

// Watch for external changes
watch(() => props.modelValue, (newValue) => {
  internalValue.value = newValue
})

// Watch for show changes to sync internal value
watch(() => props.show, (isShown) => {
  if (isShown) {
    internalValue.value = props.modelValue
  }
})



const handleNumberPress = (digit: string) => {
  // Append digit and limit to 10 digits total
  const newValue = internalValue.value + digit
  if (newValue.length <= 10) {
    internalValue.value = newValue
    emit('update:modelValue', internalValue.value)
  }
}

const handleDecimalPress = () => {
  // Decimal is just visual - we're always working in cents
  // This button doesn't do anything functionally but provides familiar UX
}

const handleBackspace = () => {
  if (internalValue.value.length > 0) {
    internalValue.value = internalValue.value.slice(0, -1)
    if (internalValue.value.length === 0) {
      internalValue.value = '000'
    }
    emit('update:modelValue', internalValue.value)
  }
}

const handleDone = () => {
  emit('done')
}

const handleCancel = () => {
  emit('cancel')
}
</script>

