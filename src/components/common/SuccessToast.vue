<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="isVisible"
        class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] pointer-events-none"
      >
        <div class="bg-green-600 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-2 min-w-[200px] justify-center">
          <CheckCircle class="w-5 h-5" />
          <span class="font-medium">{{ message }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { CheckCircle } from 'lucide-vue-next'

const props = defineProps<{
  show: boolean
  message: string
  duration?: number
}>()

const emit = defineEmits<{
  hidden: []
}>()

const isVisible = ref(false)
let hideTimeout: ReturnType<typeof setTimeout> | null = null

watch(() => props.show, (newValue) => {
  if (newValue) {
    isVisible.value = true
    
    // Clear any existing timeout
    if (hideTimeout) {
      clearTimeout(hideTimeout)
    }
    
    // Auto-hide after duration
    hideTimeout = setTimeout(() => {
      isVisible.value = false
      setTimeout(() => {
        emit('hidden')
      }, 200) // Wait for exit animation
    }, props.duration || 2000)
  } else {
    isVisible.value = false
  }
})
</script>

