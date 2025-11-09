<template>
  <span>{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'

const props = defineProps<{
  value: number
  duration?: number // Animation duration in ms
  format?: (value: number) => string
}>()

const displayValue = ref(props.format ? props.format(0) : '0')
let animationFrame: number | null = null

const animate = (start: number, end: number, duration: number) => {
  const startTime = performance.now()
  
  const step = (currentTime: number) => {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4)
    const current = start + (end - start) * easeOutQuart
    
    displayValue.value = props.format ? props.format(current) : current.toFixed(2)
    
    if (progress < 1) {
      animationFrame = requestAnimationFrame(step)
    }
  }
  
  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
  }
  
  animationFrame = requestAnimationFrame(step)
}

watch(() => props.value, (newValue, oldValue) => {
  const duration = props.duration || 800
  const startValue = oldValue || 0
  animate(startValue, newValue, duration)
})

onMounted(() => {
  // Animate from 0 to initial value on mount
  const duration = props.duration || 800
  animate(0, props.value, duration)
})
</script>

