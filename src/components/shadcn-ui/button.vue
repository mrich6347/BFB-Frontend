<script setup lang="ts">
import { computed } from 'vue'
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground cursor-pointer',
        destructive: 'bg-destructive text-destructive-foreground cursor-pointer',
        outline: 'border border-input bg-background cursor-pointer',
        secondary: 'bg-secondary text-secondary-foreground cursor-pointer',
        ghost: 'cursor-pointer',
        link: 'text-primary underline-offset-4 hover:underline cursor-pointer',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

const props = defineProps<{
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  class?: string
}>()

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const classes = computed(() => {
  return cn(buttonVariants({ variant: props.variant, size: props.size }), props.class)
})
</script>

<template>
  <button :class="classes" @click="(event) => emit('click', event)">
    <slot />
  </button>
</template> 