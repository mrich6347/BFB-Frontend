<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4 transition-opacity"
      :class="isClosing ? 'opacity-0' : 'opacity-100'"
      @click="handleCancel"
    >
      <!-- Dialog -->
      <div
        class="bg-background rounded-2xl shadow-lg max-w-sm w-full transition-all duration-300"
        :class="isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'"
        @click.stop
        style="padding-bottom: max(1rem, calc(1rem + env(safe-area-inset-bottom)));"
      >
        <!-- Content -->
        <div class="p-6 text-center">
          <div v-if="icon" class="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-4" :class="iconBgClass">
            <component :is="icon" class="h-6 w-6" :class="iconColorClass" />
          </div>
          
          <h3 class="text-lg font-semibold mb-2">{{ title }}</h3>
          <p class="text-sm text-muted-foreground">{{ message }}</p>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 px-6 pb-6">
          <button
            @click="handleCancel"
            class="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
          >
            {{ cancelText }}
          </button>
          <button
            @click="handleConfirm"
            class="flex-1 px-4 py-3 rounded-lg font-medium transition-colors"
            :class="confirmButtonClass"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { AlertTriangleIcon, TrashIcon, InfoIcon, CheckCircleIcon } from 'lucide-vue-next'
import type { Component } from 'vue'

type DialogVariant = 'danger' | 'warning' | 'info' | 'success'

const props = withDefaults(defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: DialogVariant
  showIcon?: boolean
}>(), {
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'danger',
  showIcon: true
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const isClosing = ref(false)

const icon = computed<Component | null>(() => {
  if (!props.showIcon) return null
  
  switch (props.variant) {
    case 'danger':
      return TrashIcon
    case 'warning':
      return AlertTriangleIcon
    case 'info':
      return InfoIcon
    case 'success':
      return CheckCircleIcon
    default:
      return AlertTriangleIcon
  }
})

const iconBgClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-500/10'
    case 'warning':
      return 'bg-amber-500/10'
    case 'info':
      return 'bg-blue-500/10'
    case 'success':
      return 'bg-green-500/10'
    default:
      return 'bg-red-500/10'
  }
})

const iconColorClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'text-red-500'
    case 'warning':
      return 'text-amber-500'
    case 'info':
      return 'text-blue-500'
    case 'success':
      return 'text-green-500'
    default:
      return 'text-red-500'
  }
})

const confirmButtonClass = computed(() => {
  switch (props.variant) {
    case 'danger':
      return 'bg-red-500 text-white hover:bg-red-600'
    case 'warning':
      return 'bg-amber-500 text-white hover:bg-amber-600'
    case 'info':
      return 'bg-blue-500 text-white hover:bg-blue-600'
    case 'success':
      return 'bg-green-500 text-white hover:bg-green-600'
    default:
      return 'bg-red-500 text-white hover:bg-red-600'
  }
})

const handleConfirm = () => {
  isClosing.value = true
  setTimeout(() => {
    emit('confirm')
    resetState()
  }, 200)
}

const handleCancel = () => {
  isClosing.value = true
  setTimeout(() => {
    emit('cancel')
    resetState()
  }, 200)
}

const resetState = () => {
  setTimeout(() => {
    isClosing.value = false
  }, 100)
}

// Reset closing state when dialog opens
watch(() => props.show, (newValue) => {
  if (newValue) {
    isClosing.value = false
  }
})
</script>

