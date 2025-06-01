<template>
  <div class="w-full bg-background border-b border-border">
    <div class="container mx-auto px-2 py-2 flex flex-col md:flex-row justify-between items-center">
      <!-- Month Navigation -->
      <div class="flex items-center space-x-1 md:w-1/4 justify-start">
        <button
          @click="budgetStore.navigateMonth('prev')"
          :disabled="!budgetStore.canNavigatePrev"
          :class="[
            'p-2 rounded-lg transition-all duration-200 ease-in-out',
            budgetStore.canNavigatePrev
              ? 'hover:scale-110 cursor-pointer'
              : 'opacity-40 cursor-not-allowed'
          ]"
        >
          <ChevronLeft :class="[
            'w-4 h-4 transition-colors duration-200',
            budgetStore.canNavigatePrev ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground'
          ]" />
        </button>
        <div class="flex flex-col items-center px-2 w-48">
          <div class="flex items-center justify-center w-full">
            <h2 class="text-lg font-semibold text-foreground text-center">{{ budgetStore.currentMonthName }}</h2>
          </div>
        </div>
        <button
          @click="budgetStore.navigateMonth('next')"
          :disabled="!budgetStore.canNavigateNext"
          :class="[
            'p-2 rounded-lg transition-all duration-200 ease-in-out',
            budgetStore.canNavigateNext
              ? 'hover:scale-110 cursor-pointer'
              : 'opacity-40 cursor-not-allowed'
          ]"
        >
          <ChevronRight :class="[
            'w-4 h-4 transition-colors duration-200',
            budgetStore.canNavigateNext ? 'text-muted-foreground hover:text-foreground' : 'text-muted-foreground'
          ]" />
        </button>
      </div>

      <!-- Ready to Assign Section - Cleaner Design -->
      <div class="flex items-center mt-2 md:mt-0 md:w-2/4 justify-center">
        <div class="flex items-stretch rounded-lg shadow-sm overflow-hidden max-w-full">
          <div class="flex flex-col justify-center px-4 py-1.5 bg-green-600">
            <div class="text-xs font-medium text-white">Ready to Assign</div>
            <div class="text-base font-bold text-white whitespace-nowrap">{{ formatCurrency(budgetStore.readyToAssign) }}</div>
          </div>
          <div class="w-px bg-green-600"></div>
          <button class="flex items-center px-4 bg-green-600 cursor-pointer  text-white font-medium transition-colors whitespace-nowrap">
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
import { ref } from 'vue'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { formatCurrency } from '../../utils/currencyUtil'
import { useBudgetStore } from '@/stores/budget.store'

const budgetStore = useBudgetStore()

const selectedFilter = ref('all')

const filters = [
  { id: 'all', name: 'All' },
  { id: 'overspent', name: 'Overspent' },
  { id: 'moneyAvailable', name: 'Money Available' }
]

</script>
