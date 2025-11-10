<template>
  <div
    class="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40"
    style="padding-bottom: env(safe-area-inset-bottom);"
  >
    <div class="grid grid-cols-6">
      <!-- Budget Tab -->
      <button
        @click="$emit('navigate', 'budget')"
        :class="[
          'flex flex-col items-center justify-center py-2.5 transition-colors',
          activeTab === 'budget'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <WalletIcon :class="['h-5 w-5 mb-0.5', activeTab === 'budget' ? 'fill-primary' : '']" />
        <span class="text-[10px] font-medium">Budget</span>
      </button>

      <!-- Accounts Tab -->
      <button
        @click="$emit('navigate', 'accounts')"
        :class="[
          'flex flex-col items-center justify-center py-2.5 transition-colors',
          activeTab === 'accounts'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <CreditCardIcon :class="['h-5 w-5 mb-0.5', activeTab === 'accounts' ? 'fill-primary' : '']" />
        <span class="text-[10px] font-medium">Accounts</span>
      </button>

      <!-- Goals Tab -->
      <button
        @click="$emit('navigate', 'goals')"
        :class="[
          'flex flex-col items-center justify-center py-2.5 transition-colors',
          activeTab === 'goals'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <TargetIcon :class="['h-5 w-5 mb-0.5', activeTab === 'goals' ? 'fill-primary' : '']" />
        <span class="text-[10px] font-medium">Goals</span>
      </button>

      <!-- Calendar Tab -->
      <button
        @click="$emit('navigate', 'calendar')"
        :class="[
          'flex flex-col items-center justify-center py-2.5 transition-colors',
          activeTab === 'calendar'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <CalendarIcon :class="['h-5 w-5 mb-0.5', activeTab === 'calendar' ? 'fill-primary' : '']" />
        <span class="text-[10px] font-medium">Calendar</span>
      </button>

      <!-- Retirement Tab -->
      <button
        @click="$emit('navigate', 'retirement')"
        :class="[
          'flex flex-col items-center justify-center py-2.5 transition-colors',
          activeTab === 'retirement'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <PiggyBankIcon :class="['h-5 w-5 mb-0.5', activeTab === 'retirement' ? 'fill-primary' : '']" />
        <span class="text-[10px] font-medium">Retire</span>
      </button>

      <!-- Net Worth Tab -->
      <button
        @click="$emit('navigate', 'networth')"
        :class="[
          'flex flex-col items-center justify-center py-2.5 transition-colors',
          activeTab === 'networth'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <TrendingUpIcon :class="['h-5 w-5 mb-0.5', activeTab === 'networth' ? 'fill-primary' : '']" />
        <span class="text-[10px] font-medium">Worth</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WalletIcon, CreditCardIcon, TargetIcon, PiggyBankIcon, TrendingUpIcon, CalendarIcon } from 'lucide-vue-next'

defineProps<{
  activeTab: 'budget' | 'accounts' | 'goals' | 'retirement' | 'networth' | 'calendar'
}>()

defineEmits<{
  navigate: [tab: 'budget' | 'accounts' | 'goals' | 'retirement' | 'networth' | 'calendar']
}>()
</script>

