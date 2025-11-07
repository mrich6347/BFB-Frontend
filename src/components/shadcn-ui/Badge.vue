<script setup lang="ts">
import type { PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { Primitive } from 'reka-ui'
import { computed, type HTMLAttributes } from 'vue'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        positive: 'border-emerald-600 bg-emerald-300 text-emerald-950 font-semibold text-sm px-3 py-1 shadow-none',
        negative: 'border-transparent bg-red-600 text-white',
        neutral: 'border-gray-600 bg-transparent text-gray-600',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  },
)

type BadgeVariants = VariantProps<typeof badgeVariants>

const props = defineProps<PrimitiveProps & {
  variant?: BadgeVariants['variant']
  class?: HTMLAttributes['class']
}>()

const delegatedProps = computed(() => {
  const { class: _, ...delegated } = props
  return delegated
})
</script>

<template>
  <Primitive
    data-slot="badge"
    :class="cn(badgeVariants({ variant }), props.class)"
    v-bind="delegatedProps"
  >
    <slot />
  </Primitive>
</template>
