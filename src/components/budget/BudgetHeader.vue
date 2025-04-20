<template>
  <div class="w-full bg-background border-b border-border">
    <div class="container mx-auto px-2 py-2 flex flex-col md:flex-row justify-between items-center">
      <!-- Month Navigation -->
      <div class="flex items-center space-x-1 md:w-1/4 justify-start">
        <button class="p-1.5 rounded-full transition-colors">
          <ChevronLeft class="w-4 h-4 text-muted-foreground" />
        </button>
        <div class="flex flex-col items-start">
          <div class="flex items-center">
            <h2 class="text-lg font-semibold text-foreground">{{ currentMonth }}</h2>
          </div>
        </div>
        <button class="p-1.5 rounded-full transition-colors">
          <ChevronRight class="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      <!-- Ready to Assign Section - Cleaner Design -->
      <div class="flex items-center mt-2 md:mt-0 md:w-2/4 justify-center">
        <div class="flex items-stretch rounded-lg shadow-sm border border-primary/20 overflow-hidden max-w-full">
          <div class="flex flex-col justify-center px-4 py-1.5 bg-green-600">
            <div class="text-xs font-medium text-white">Ready to Assign</div>
            <div class="text-base font-bold text-white whitespace-nowrap">${{ formattedAmount }}</div>
          </div>
          <div class="w-px bg-green-600"></div>
          <button class="flex items-center px-4 bg-green-600  text-white font-medium transition-colors whitespace-nowrap">
            Assign
            <ChevronDown class="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>

      <!-- Empty div for spacing -->
      <div class="md:w-1/4"></div>
    </div>

    <!-- Filter Tags -->
    <div class="container mx-auto px-2 pb-2 flex flex-wrap items-center gap-1.5">
      <button 
        v-for="filter in filters" 
        :key="filter.id"
        :class="[
          'px-2.5 py-0.5 text-sm rounded-md transition-colors cursor-pointer',
          selectedFilter === filter.id 
            ? 'bg-primary/15 text-primary' 
            : 'bg-secondary text-secondary-foreground'
        ]"
        @click="selectedFilter = filter.id"
      >
        {{ filter.name }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next'

// Mock data with a large dollar amount to test display
const readyToAssign = ref(1754329.87)
const selectedFilter = ref('all')

const filters = [
  { id: 'all', name: 'All' },
  { id: 'overspent', name: 'Overspent' },
  { id: 'moneyAvailable', name: 'Money Available' }
]

// For now, use a static month value since we don't have a month property in the budget model
const currentMonth = computed(() => {
  return 'Apr 2025'
})

// Format currency with commas for thousands
const formattedAmount = computed(() => {
  return readyToAssign.value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
})
</script> 