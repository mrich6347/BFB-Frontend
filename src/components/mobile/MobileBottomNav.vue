<template>
  <div 
    class="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40"
    style="padding-bottom: env(safe-area-inset-bottom);"
  >
    <div class="grid grid-cols-2">
      <!-- Budget Tab -->
      <button
        @click="$emit('navigate', 'budget')"
        :class="[
          'flex flex-col items-center justify-center py-3 transition-colors',
          activeTab === 'budget'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <WalletIcon :class="['h-6 w-6 mb-1', activeTab === 'budget' ? 'fill-primary' : '']" />
        <span class="text-xs font-medium">Budget</span>
      </button>

      <!-- Accounts Tab -->
      <button
        @click="$emit('navigate', 'accounts')"
        :class="[
          'flex flex-col items-center justify-center py-3 transition-colors',
          activeTab === 'accounts'
            ? 'text-primary'
            : 'text-muted-foreground hover:text-foreground'
        ]"
      >
        <CreditCardIcon :class="['h-6 w-6 mb-1', activeTab === 'accounts' ? 'fill-primary' : '']" />
        <span class="text-xs font-medium">Accounts</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WalletIcon, CreditCardIcon } from 'lucide-vue-next'

defineProps<{
  activeTab: 'budget' | 'accounts'
}>()

defineEmits<{
  navigate: [tab: 'budget' | 'accounts']
}>()
</script>

