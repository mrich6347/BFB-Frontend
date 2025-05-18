<template>
  <div class="relative w-full h-64 md:h-80 flex items-center justify-center">
    <!-- Icon cluster -->
    <div class="relative w-56 h-56 md:w-72 md:h-72">
      <component
        v-for="(icon, idx) in icons"
        :key="idx"
        :is="icon.component"
        class="absolute text-primary drop-shadow-md"
        :class="icon.class"
        ref="iconRefs"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { animate, stagger } from 'motion'
import {
  DollarSign as DollarSignIcon,
  TrendingUp as TrendingUpIcon,
  Wallet as WalletIcon,
  PiggyBank as PiggyBankIcon,
  Banknote as BanknoteIcon
} from 'lucide-vue-next'

interface PositionedIcon {
  component: any
  class: string
}

const icons: PositionedIcon[] = [
  { component: WalletIcon, class: 'size-12 md:size-16 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2' },
  { component: DollarSignIcon, class: 'size-10 md:size-14 text-accent left-4 top-4 rotate-6' },
  { component: PiggyBankIcon, class: 'size-10 md:size-14 text-chart-3 right-4 top-6 -rotate-6' },
  { component: BanknoteIcon, class: 'size-10 md:size-14 text-chart-2 left-6 bottom-6 rotate-3' },
  { component: TrendingUpIcon, class: 'size-10 md:size-14 text-destructive right-6 bottom-8 -rotate-3' }
]

const iconRefs = ref<HTMLElement[]>([])

onMounted(() => {
  // Fade & float each icon
  if (iconRefs.value.length) {
    animate(
      iconRefs.value as any,
      { opacity: [0, 1], y: [10, 0] } as any,
      { delay: stagger(0.1), duration: 0.8, easing: 'ease-out' } as any
    )

    // Subtle floating motion loop
    iconRefs.value.forEach((el, i) => {
      animate(
        el as any,
        { y: [0, -6, 0] } as any,
        { duration: 4 + i, easing: 'ease-in-out', repeat: Infinity } as any
      )
    })
  }
})
</script> 