<template>
  <div class="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
    <div class="container mx-auto px-2 py-2 flex flex-col md:flex-row justify-between items-center">
      <!-- Month Navigation -->
      <div class="flex items-center space-x-1 md:w-1/4 justify-start">
        <button class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronLeft class="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
        <div class="flex flex-col items-start">
          <div class="flex items-center">
            <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ currentMonth }}</h2>
            <ChevronDown class="w-3.5 h-3.5 ml-1 text-gray-500 dark:text-gray-400" />
          </div>
          <span class="text-xs text-gray-500 dark:text-gray-500">Enter a note...</span>
        </div>
        <button class="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ChevronRight class="w-4 h-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      <!-- Ready to Assign Section - Cleaner Design -->
      <div class="flex items-center mt-2 md:mt-0 md:w-2/4 justify-center">
        <div class="flex items-stretch rounded-lg shadow-sm border border-green-200 dark:border-green-800 overflow-hidden max-w-full">
          <div class="flex flex-col justify-center px-4 py-1.5 bg-green-50 dark:bg-green-900/30">
            <div class="text-xs font-medium text-green-700 dark:text-green-400">Ready to Assign</div>
            <div class="text-base font-bold text-green-700 dark:text-green-400 whitespace-nowrap">${{ formattedAmount }}</div>
          </div>
          <div class="w-px bg-green-200 dark:bg-green-800"></div>
          <button class="flex items-center px-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-800/50 text-green-700 dark:text-green-400 font-medium transition-colors whitespace-nowrap">
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
          'px-2.5 py-0.5 text-sm rounded-md transition-colors',
          selectedFilter === filter.id 
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' 
            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
        ]"
        @click="selectedFilter = filter.id"
      >
        {{ filter.name }}
      </button>
      <button class="p-0.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <HelpCircle class="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronLeft, ChevronRight, ChevronDown, HelpCircle } from 'lucide-vue-next'

// Mock data with a large dollar amount to test display
const readyToAssign = ref(1754329.87)
const selectedFilter = ref('all')

const filters = [
  { id: 'all', name: 'All' },
  { id: 'snoozed', name: 'Snoozed' },
  { id: 'underfunded', name: 'Underfunded' },
  { id: 'overfunded', name: 'Overfunded' },
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