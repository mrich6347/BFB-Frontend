<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
  variant?: 'default' | 'muted' | 'primary' | 'secondary'
}>()

const getVariantClasses = () => {
  switch (props.variant) {
    case 'muted':
      return 'bg-muted'
    case 'primary':
      return 'bg-primary text-primary-foreground'
    case 'secondary':
      return 'bg-secondary text-secondary-foreground'
    default:
      return 'bg-background'
  }
}
</script>

<template>
  <section :class="cn('py-16 md:py-24', getVariantClasses(), props.class)">
    <div class="container mx-auto px-4">
      <slot />
    </div>
  </section>
</template> 