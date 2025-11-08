<template>
  <div class="min-h-screen bg-background">
    <!-- Simple Header -->
    <div class="sticky top-0 z-10 bg-background border-b border-border">
      <div class="px-4 py-3">
        <h1 class="text-lg font-semibold text-foreground">{{ budgetStore.currentBudget?.name }}</h1>
        <p class="text-sm text-muted-foreground">{{ budgetStore.currentMonthName }}</p>
      </div>
    </div>

    <!-- Category List -->
    <div class="p-4 space-y-6">
      <div
        v-for="group in visibleGroupsWithCategories"
        :key="group.id"
        class="space-y-2"
      >
        <!-- Group Header -->
        <div class="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md">
          <h2 class="text-sm font-medium text-muted-foreground">{{ group.name }}</h2>
          <span class="text-sm font-semibold" :class="getAvailableColorClass(getGroupTotal(group.id))">
            {{ formatCurrency(getGroupTotal(group.id)) }}
          </span>
        </div>

        <!-- Categories in Group -->
        <div class="space-y-1">
          <div
            v-for="category in getCategoriesForGroup(group.id)"
            :key="category.id"
            class="flex items-center justify-between px-4 py-3 bg-card rounded-md border border-border"
          >
            <span class="text-sm text-foreground">{{ category.name }}</span>
            <span class="text-sm font-semibold" :class="getAvailableColorClass(category.available)">
              {{ formatCurrency(category.available) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="visibleGroupsWithCategories.length === 0" class="flex flex-col items-center justify-center min-h-[200px] p-4">
        <p class="text-muted-foreground text-center">No categories found</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { formatCurrency } from '@/utils/currencyUtil'

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()

// Get categories for a specific group with balances
const getCategoriesForGroup = (groupId: string) => {
  return categoryStore.getCategoriesByGroupWithBalances(groupId)
}

// Get visible groups (excluding Hidden Categories system group)
const visibleGroupsWithCategories = computed(() => {
  return categoryStore.visibleCategoryGroups
    .filter(group => {
      // Exclude Hidden Categories system group
      if (group.name === 'Hidden Categories' && group.is_system_group) {
        return false
      }

      const categories = getCategoriesForGroup(group.id)
      return categories.length > 0
    })
})

// Get total available for a group
const getGroupTotal = (groupId: string) => {
  const categories = getCategoriesForGroup(groupId)
  return categories.reduce((sum, cat) => sum + cat.available, 0)
}

// Get color class based on available amount
const getAvailableColorClass = (amount: number) => {
  if (amount > 0) {
    return 'text-emerald-600 dark:text-emerald-400'
  } else if (amount < 0) {
    return 'text-red-600 dark:text-red-400'
  }
  return 'text-muted-foreground'
}
</script>

