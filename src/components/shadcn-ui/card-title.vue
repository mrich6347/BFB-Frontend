<script setup lang="ts">
import { cn } from '@/lib/utils'

const props = defineProps<{
  class?: string
}>()
</script>

<template>
  <h3 :class="cn('text-xl font-semibold', props.class)">
    <slot />
  </h3>
</template> 