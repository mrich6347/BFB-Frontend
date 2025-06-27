import { ref, computed, reactive, watch, onMounted } from 'vue'
import type { Ref } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CategoryGroupResponse } from '@/types/DTO/category-group.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import { saveExpandedGroups, loadExpandedGroups } from '@/utils/expandedGroupsStorage'

export function useCategoryListState(activeFilter?: Ref<string | undefined> | string) {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()

  // Convert activeFilter to a reactive ref if it's not already
  const filterRef = computed(() => {
    if (typeof activeFilter === 'string') {
      return activeFilter
    }
    return activeFilter?.value
  })

  // State
  const expandedGroups = ref<Set<string>>(new Set())
  const categoryLists = reactive<Record<string, CategoryResponse[]>>({})
  const categoryGroupsList = ref<CategoryGroupResponse[]>([])

  // Computed property to get visible category groups (filtered based on credit card accounts)
  const sortedCategoryGroups = computed(() => {
    return categoryStore.visibleCategoryGroups
  })

  // Computed property to separate regular groups from hidden categories group
  // Also filters out groups that have no visible categories when a filter is applied
  const regularCategoryGroups = computed(() => {
    return sortedCategoryGroups.value.filter(group => {
      // Always exclude Hidden Categories system group
      if (group.name === 'Hidden Categories' && group.is_system_group) {
        return false
      }

      // If no filter is applied, show all groups
      if (!filterRef.value || filterRef.value === 'all') {
        return true
      }

      // Check if this group has any categories that match the current filter
      const categoriesInGroup = getCategoriesForGroup(group.id)
      return categoriesInGroup.length > 0
    })
  })

  const hiddenCategoriesGroup = computed(() => {
    return sortedCategoryGroups.value.find(group =>
      group.name === 'Hidden Categories' && group.is_system_group
    )
  })

  // Check if hidden categories group has any categories
  const hasHiddenCategories = computed(() => {
    if (!hiddenCategoriesGroup.value) return false
    const hiddenCategories = getCategoriesForGroup(hiddenCategoriesGroup.value.id)
    return hiddenCategories.length > 0
  })

  // Get categories for a specific group with filtering applied
  const getCategoriesForGroup = (groupId: string) => {
    const categories = categoryStore.getCategoriesByGroupWithBalances(groupId)

    // Apply filter if specified
    if (!filterRef.value || filterRef.value === 'all') {
      return categories
    }

    if (filterRef.value === 'overspent') {
      return categories.filter(category => category.available < 0)
    }

    if (filterRef.value === 'moneyAvailable') {
      return categories.filter(category => category.available > 0)
    }

    return categories
  }

  // Get totals for a specific group
  const getGroupTotals = (groupId: string) => {
    return categoryStore.getGroupTotalsWithBalances(groupId)
  }

  // Initialize category lists for each group
  const initializeCategoryLists = () => {
    sortedCategoryGroups.value.forEach(group => {
      const newCategoriesForGroup = getCategoriesForGroup(group.id)

      if (categoryLists[group.id]) {
        // Update existing array in place to maintain reactivity
        categoryLists[group.id].splice(0, categoryLists[group.id].length, ...newCategoriesForGroup)
      } else {
        // Create new array if it doesn't exist
        categoryLists[group.id] = [...newCategoriesForGroup]
      }
    })
  }

  // Helper function to load expanded groups for a budget
  const loadExpandedGroupsForBudget = (budgetId: string) => {
    const savedExpandedGroups = loadExpandedGroups(budgetId)

    // Clear the current set
    expandedGroups.value.clear()

    // If we have saved state (even if empty), use it
    if (savedExpandedGroups !== null) {
      savedExpandedGroups.forEach(groupId => {
        // Only add if the group exists in the current budget
        if (sortedCategoryGroups.value.some(group => group.id === groupId)) {
          expandedGroups.value.add(groupId)
        }
      })
    } else {
      // If no saved state, expand all groups by default
      sortedCategoryGroups.value.forEach(group => expandedGroups.value.add(group.id))
    }
  }

  const toggleGroup = (groupId: string) => {
    if (expandedGroups.value.has(groupId)) {
      expandedGroups.value.delete(groupId)
    } else {
      expandedGroups.value.add(groupId)
    }

    // Save the updated expanded groups to local storage
    const budgetId = budgetStore.currentBudget?.id
    if (budgetId) {
      saveExpandedGroups(budgetId, Array.from(expandedGroups.value))
    }
  }

  // Update categoryGroupsList when regularCategoryGroups changes
  watch(() => regularCategoryGroups.value, (newGroups) => {
    categoryGroupsList.value = [...newGroups]
  }, { immediate: true })

  // Watch for changes in categories and update the categoryLists
  watch(() => categoryStore.getCategoriesWithBalances, () => {
    // Update existing arrays in place to maintain reactivity with draggable components
    sortedCategoryGroups.value.forEach(group => {
      const newCategoriesForGroup = getCategoriesForGroup(group.id)

      if (categoryLists[group.id]) {
        // Update existing array in place
        categoryLists[group.id].splice(0, categoryLists[group.id].length, ...newCategoriesForGroup)
      } else {
        // Create new array if it doesn't exist
        categoryLists[group.id] = [...newCategoriesForGroup]
      }
    })
  }, { deep: true })

  // Watch for changes in budget month and update the categoryLists
  watch(() => [budgetStore.currentYear, budgetStore.currentMonth], () => {
    // Update existing arrays in place to maintain reactivity with draggable components
    sortedCategoryGroups.value.forEach(group => {
      const newCategoriesForGroup = getCategoriesForGroup(group.id)

      if (categoryLists[group.id]) {
        // Update existing array in place
        categoryLists[group.id].splice(0, categoryLists[group.id].length, ...newCategoriesForGroup)
      } else {
        // Create new array if it doesn't exist
        categoryLists[group.id] = [...newCategoriesForGroup]
      }
    })
  }, { deep: true })

  // Watch for changes in category groups and update the categoryLists
  watch(() => sortedCategoryGroups.value, (newGroups) => {
    newGroups.forEach(group => {
      if (!categoryLists[group.id]) {
        categoryLists[group.id] = [...getCategoriesForGroup(group.id)]
      }
    })
  }, { immediate: true })

  // Watch for changes in the current budget ID to load the appropriate expanded groups
  watch(() => budgetStore.currentBudget?.id, (newBudgetId) => {
    if (newBudgetId) {
      loadExpandedGroupsForBudget(newBudgetId)
    }
  })

  // Watch for changes in category groups to ensure expansion state is set
  watch(() => sortedCategoryGroups.value, (newGroups) => {
    const budgetId = budgetStore.currentBudget?.id
    if (budgetId && newGroups.length > 0) {
      // If we don't have any expanded groups set yet, load them
      if (expandedGroups.value.size === 0) {
        loadExpandedGroupsForBudget(budgetId)
      }
    }
  }, { immediate: true })

  // Initialize on mount
  onMounted(() => {
    initializeCategoryLists()

    // Get the current budget ID
    const budgetId = budgetStore.currentBudget?.id
    if (budgetId) {
      loadExpandedGroupsForBudget(budgetId)
    } else {
      // If no budget ID, expand all groups by default
      sortedCategoryGroups.value.forEach(group => expandedGroups.value.add(group.id))
    }
  })

  return {
    // State
    expandedGroups,
    categoryLists,
    categoryGroupsList,

    // Computed
    sortedCategoryGroups,
    regularCategoryGroups,
    hiddenCategoriesGroup,
    hasHiddenCategories,

    // Methods
    getCategoriesForGroup,
    getGroupTotals,
    initializeCategoryLists,
    toggleGroup,
    loadExpandedGroupsForBudget
  }
}
