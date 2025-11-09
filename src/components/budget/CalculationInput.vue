<template>
  <div class="relative">
    <input
      ref="inputRef"
      v-model="displayValue"
      @focus="handleFocus"
      @click="handleClick"
      @blur="handleBlur"
      @keydown="handleKeydown"
      @input="handleInput"
      :class="inputClasses"
      type="text"
      :placeholder="placeholder"
    />
    <div
      v-if="showCalculation && calculationResult !== null"
      class="absolute top-full right-0 mt-1 px-2 py-1 bg-popover border border-border rounded text-xs text-muted-foreground z-10"
    >
      = {{ formatCurrency(calculationResult) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { formatCurrency } from '@/utils/currencyUtil'

interface Props {
  modelValue: number
  placeholder?: string
  class?: string
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: '0.00',
  class: ''
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: number): void
}>()

const inputRef = ref<HTMLInputElement>()
const displayValue = ref('')
const isFocused = ref(false)
const showCalculation = ref(false)
const calculationResult = ref<number | null>(null)

const inputClasses = computed(() => {
  const baseClasses = 'w-full text-right bg-transparent border-none outline-none transition-all duration-200'
  const unfocusedClasses = 'text-sm px-1 py-0.5'
  const focusedClasses = 'text-sm px-2 py-1.5 bg-primary/10 border border-primary rounded-md shadow-sm ring-2 ring-primary/30 font-medium'

  const stateClasses = isFocused.value ? focusedClasses : unfocusedClasses

  return `${baseClasses} ${stateClasses} ${props.class}`
})

// Initialize display value
const updateDisplayValue = () => {
  if (isFocused.value) {
    // When focused, show the raw input value
    return
  }
  // When not focused, show formatted currency
  displayValue.value = formatCurrency(props.modelValue)
}

// Watch for prop changes
const updateFromProps = () => {
  if (!isFocused.value) {
    updateDisplayValue()
  }
}

// Call initially and when props change
updateFromProps()

const handleFocus = () => {
  isFocused.value = true
  // Show the numeric value for editing
  displayValue.value = props.modelValue.toString()

  nextTick(() => {
    if (inputRef.value) {
      // Set cursor at the end instead of selecting all text
      const length = inputRef.value.value.length
      inputRef.value.setSelectionRange(length, length)
    }
  })
}

const handleClick = () => {
  // Always position cursor at the end when clicking
  nextTick(() => {
    if (inputRef.value) {
      const length = inputRef.value.value.length
      inputRef.value.setSelectionRange(length, length)
    }
  })
}

const handleBlur = () => {
  isFocused.value = false
  showCalculation.value = false
  calculationResult.value = null

  // Process the input and emit the result
  const result = evaluateExpression(displayValue.value)
  if (result !== null) {
    emit('update:modelValue', result)
  }

  // Update display to formatted currency
  updateDisplayValue()
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    inputRef.value?.blur()
  } else if (event.key === 'Escape') {
    // Reset to original value
    displayValue.value = props.modelValue.toString()
    inputRef.value?.blur()
  }
}

const handleInput = () => {
  if (!isFocused.value) return

  // Try to evaluate the expression for preview
  const result = evaluateExpression(displayValue.value)
  if (result !== null && result !== props.modelValue) {
    showCalculation.value = true
    calculationResult.value = result
  } else {
    showCalculation.value = false
    calculationResult.value = null
  }
}

const evaluateExpression = (expression: string): number | null => {
  try {
    // Clean the expression
    const cleaned = expression.trim()
    if (!cleaned) return props.modelValue

    // If it's just a number, return it
    const simpleNumber = parseFloat(cleaned)
    if (!isNaN(simpleNumber) && cleaned === simpleNumber.toString()) {
      return simpleNumber
    }

    // Check if this is a relative operation (starts with +, -, *, / but is NOT a negative number)
    // A relative operation should be like "+50", "-50", "*2", "/2"
    // But NOT "-350-50" (which is a full expression with a negative number)
    const relativeOperatorMatch = cleaned.match(/^([+\-*/])(.+)$/)
    if (relativeOperatorMatch) {
      const operator = relativeOperatorMatch[1]
      const operand = relativeOperatorMatch[2].trim()

      // Check if the operand is a simple number (no additional operators)
      // This distinguishes "+50" (relative) from "-350-50" (full expression)
      if (/^[0-9.]+$/.test(operand)) {
        const fullExpression = `${props.modelValue}${operator}${operand}`
        return evaluateBasicMath(fullExpression)
      }
    }

    // Handle full expressions (including negative numbers with additional operations)
    return evaluateBasicMath(cleaned)
  } catch {
    return null
  }
}

const evaluateBasicMath = (expression: string): number | null => {
  try {
    // Only allow numbers, operators, parentheses, and decimal points
    if (!/^[0-9+\-*/.() ]+$/.test(expression)) {
      return null
    }

    // Use Function constructor for safe evaluation (more secure than eval)
    const result = new Function(`"use strict"; return (${expression})`)()

    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return Math.round(result * 100) / 100 // Round to 2 decimal places
    }

    return null
  } catch {
    return null
  }
}

// Watch for external prop changes
watch(() => props.modelValue, () => {
  updateFromProps()
})

// Set up a watcher for prop changes
defineExpose({
  focus: () => inputRef.value?.focus()
})
</script>
