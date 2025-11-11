<template>
  <div class="space-y-2">
    <label v-if="label" class="text-sm font-medium">{{ label }}</label>
    <input
      ref="inputRef"
      :value="displayValue"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      type="text"
      inputmode="decimal"
      :placeholder="placeholder"
      :class="inputClass"
      :autofocus="autofocus"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: number | null
  label?: string
  placeholder?: string
  inputClass?: string
  autofocus?: boolean
}>(), {
  placeholder: '0.00',
  inputClass: 'w-full px-4 py-3 border border-input rounded-md bg-background text-lg',
  autofocus: false
})

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

const inputRef = ref<HTMLInputElement | null>(null)
const internalValue = ref('000') // Store as cents (e.g., "000" = $0.00, "1234" = $12.34)
const isFocused = ref(false)

// Format the internal value (cents) as a currency display string
const formatAsCurrency = (centsString: string): string => {
  // Ensure we have at least 3 digits (for 0.00)
  const padded = centsString.padStart(3, '0')
  
  // Split into dollars and cents
  const dollars = padded.slice(0, -2)
  const cents = padded.slice(-2)
  
  // Remove leading zeros from dollars, but keep at least one digit
  const dollarsFormatted = dollars.replace(/^0+/, '') || '0'
  
  return `${dollarsFormatted}.${cents}`
}

// Display value shown in the input
const displayValue = computed(() => {
  if (isFocused.value) {
    return formatAsCurrency(internalValue.value)
  } else {
    // When not focused, show the actual model value formatted
    if (props.modelValue === null || props.modelValue === undefined) {
      return ''
    }
    return props.modelValue.toFixed(2)
  }
})

// Initialize internal value from modelValue
const initializeFromModelValue = () => {
  if (props.modelValue !== null && props.modelValue !== undefined) {
    // Convert to cents and store as string
    const cents = Math.round(props.modelValue * 100)
    internalValue.value = cents.toString().padStart(3, '0')
  } else {
    internalValue.value = '000'
  }
}

// Watch for external changes to modelValue
watch(() => props.modelValue, () => {
  if (!isFocused.value) {
    initializeFromModelValue()
  }
}, { immediate: true })

const handleInput = (event: Event) => {
  const input = event.target as HTMLInputElement
  const newChar = input.value.slice(-1)
  
  // Only allow digits
  if (!/^\d$/.test(newChar) && newChar !== '') {
    // If not a digit, restore the previous value
    input.value = formatAsCurrency(internalValue.value)
    return
  }
  
  // Extract only digits from the input
  const digits = input.value.replace(/\D/g, '')
  
  if (digits.length === 0) {
    internalValue.value = '000'
  } else {
    // Limit to reasonable number of digits (e.g., 10 digits = $99,999,999.99)
    const limitedDigits = digits.slice(-10)
    internalValue.value = limitedDigits.padStart(3, '0')
  }
  
  // Update the display
  input.value = formatAsCurrency(internalValue.value)
  
  // Move cursor to end
  setTimeout(() => {
    input.setSelectionRange(input.value.length, input.value.length)
  }, 0)
}

const handleFocus = () => {
  isFocused.value = true
  
  // Select all on focus for easy clearing
  setTimeout(() => {
    if (inputRef.value) {
      inputRef.value.setSelectionRange(0, inputRef.value.value.length)
    }
  }, 0)
}

const handleBlur = () => {
  isFocused.value = false
  
  // Convert internal value (cents) to decimal and emit
  const cents = parseInt(internalValue.value, 10)
  const decimal = cents / 100
  
  // Only emit if value changed
  if (decimal !== props.modelValue) {
    emit('update:modelValue', decimal)
  }
}

// Public method to focus the input
const focus = () => {
  inputRef.value?.focus()
}

defineExpose({
  focus
})
</script>

