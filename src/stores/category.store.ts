import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type { CategoryGroupResponse } from '@/types/DTO/category-group.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import type { CategoryBalanceResponse } from '@/types/DTO/category-balance.dto'

export const useCategoryStore = defineStore('categoryStore', () => {
  // State
  const categoryGroups = ref<CategoryGroupResponse[]>([])
  const categories = ref<CategoryResponse[]>([])
  const categoryBalances = ref<CategoryBalanceResponse[]>([])
  const isLoading = ref(true)

  // Getters
  const getCategoryGroupById = computed(() => (id: string) => {
    return categoryGroups.value.find(group => group.id === id)
  })

  const getCategoriesByGroupId = computed(() => (groupId: string) => {
    return categories.value.filter(category => category.category_group_id === groupId)
      .sort((a, b) => a.display_order - b.display_order)
  })

  const categoryGroupExistsByName = computed(() => (name: string, budgetId: string) => {
    return categoryGroups.value.find(
      group => group.name.toLowerCase() === name.toLowerCase() && group.budget_id === budgetId
    )
  })

  const categoryExistsByName = computed(() => (name: string, groupId: string) => {
    return categories.value.find(
      category => category.name.toLowerCase() === name.toLowerCase() && category.category_group_id === groupId
    )
  })

  const categoryExistsByNameInBudget = computed(() => (name: string, budgetId: string) => {
    return categories.value.find(
      category => category.name.toLowerCase() === name.toLowerCase() && category.budget_id === budgetId
    )
  })

  const getTotalAssigned = computed(() => {
    return categories.value.reduce((sum, category) => sum + (category.assigned || 0), 0)
  })

  const getTotalActivity = computed(() => {
    return categories.value.reduce((sum, category) => sum + (category.activity || 0), 0)
  })

  const getTotalAvailable = computed(() => {
    return categories.value.reduce((sum, category) => sum + (category.available || 0), 0)
  })

  const getGroupTotals = computed(() => (groupId: string) => {
    const groupCategories = categories.value.filter(category => category.category_group_id === groupId)

    return {
      assigned: groupCategories.reduce((sum, category) => sum + (category.assigned || 0), 0),
      activity: groupCategories.reduce((sum, category) => sum + (category.activity || 0), 0),
      available: groupCategories.reduce((sum, category) => sum + (category.available || 0), 0)
    }
  })

  const sortedCategoryGroups = computed(() => {
    return [...categoryGroups.value].sort((a, b) => a.display_order - b.display_order)
  })

  // Show all category groups including Credit Card Payments system group
  const visibleCategoryGroups = computed(() => {
    return categoryGroups.value
      .sort((a, b) => a.display_order - b.display_order)
  })

  // State mutations
  const setCategoryGroups = (newCategoryGroups: CategoryGroupResponse[]) => {
    categoryGroups.value = newCategoryGroups
  }

  const addCategoryGroup = (group: CategoryGroupResponse) => {
    // Update display_order for existing groups in the same budget
    categoryGroups.value.forEach(existingGroup => {
      if (existingGroup.budget_id === group.budget_id) {
        existingGroup.display_order += 1
      }
    })

    // Add the new group with display_order 0 (at the top)
    categoryGroups.value.push({ ...group, display_order: 0 })
  }

  const updateCategoryGroup = (id: string, updates: Partial<CategoryGroupResponse>) => {
    const index = categoryGroups.value.findIndex(group => group.id === id)
    if (index !== -1) {
      categoryGroups.value[index] = { ...categoryGroups.value[index], ...updates }
    }
  }

  const removeCategoryGroup = (id: string, movedCategories?: CategoryResponse[]) => {
    categoryGroups.value = categoryGroups.value.filter(group => group.id !== id)

    // Update categories with the moved categories from the response
    if (movedCategories && movedCategories.length > 0) {
      // Remove the old categories and add the updated ones
      categories.value = categories.value.filter(category =>
        !movedCategories.some(moved => moved.id === category.id)
      )
      categories.value.push(...movedCategories)
    } else {
      // Fallback: remove all categories in this group if no moved categories returned
      categories.value = categories.value.filter(category => category.category_group_id !== id)
    }
  }

  const hideCategoryGroup = (id: string, movedCategories?: CategoryResponse[]) => {
    // Remove the hidden group
    categoryGroups.value = categoryGroups.value.filter(group => group.id !== id)

    // Update categories with the moved categories from the response
    if (movedCategories && movedCategories.length > 0) {
      // Remove the old categories and add the updated ones
      categories.value = categories.value.filter(category =>
        !movedCategories.some(moved => moved.id === category.id)
      )
      categories.value.push(...movedCategories)
    } else {
      // Fallback: remove all categories in this group if no moved categories returned
      categories.value = categories.value.filter(category => category.category_group_id !== id)
    }
  }

  const setCategories = (newCategories: CategoryResponse[]) => {
    categories.value = newCategories
  }

  const addCategory = (category: CategoryResponse) => {
    // Update display_order for existing categories in the same group
    categories.value.forEach(existingCategory => {
      if (existingCategory.category_group_id === category.category_group_id) {
        existingCategory.display_order += 1
      }
    })

    // Add the new category with display_order 0 (at the top)
    categories.value.push({ ...category, display_order: 0 })
  }

  const updateCategory = (id: string, updates: Partial<CategoryResponse>) => {
    const index = categories.value.findIndex(category => category.id === id)
    if (index !== -1) {
      categories.value[index] = { ...categories.value[index], ...updates }
    }
  }

  const hideCategory = (id: string) => {
    // Find the Hidden Categories group
    const hiddenGroup = categoryGroups.value.find(group =>
      group.name === 'Hidden Categories' && group.is_system_group
    )
    if (!hiddenGroup) {
      throw new Error('Hidden Categories group not found')
    }

    // Move category to Hidden Categories group
    const categoryIndex = categories.value.findIndex(cat => cat.id === id)
    if (categoryIndex !== -1) {
      categories.value[categoryIndex] = {
        ...categories.value[categoryIndex],
        category_group_id: hiddenGroup.id
      }
    }
  }

  const unhideCategory = (id: string, targetGroupId: string) => {
    // Move category to target group
    const categoryIndex = categories.value.findIndex(cat => cat.id === id)
    if (categoryIndex !== -1) {
      categories.value[categoryIndex] = {
        ...categories.value[categoryIndex],
        category_group_id: targetGroupId
      }
    }
  }

  const reorderCategoryGroups = (groupIds: string[]) => {
    // Update local display_order values
    groupIds.forEach((id, index) => {
      const groupIndex = categoryGroups.value.findIndex(group => group.id === id)
      if (groupIndex !== -1) {
        categoryGroups.value[groupIndex].display_order = index
      }
    })
  }

  const reorderCategories = (categoryIds: string[]) => {
    // Update local display_order values immediately
    categoryIds.forEach((id, index) => {
      const categoryIndex = categories.value.findIndex(category => category.id === id)
      if (categoryIndex !== -1) {
        categories.value[categoryIndex].display_order = index
      }
    })
  }

  const setCategoryBalances = (newCategoryBalances: CategoryBalanceResponse[]) => {
    categoryBalances.value = newCategoryBalances
  }

  const updateCategoryBalance = (categoryId: string, updatedBalance: CategoryBalanceResponse) => {
    const index = categoryBalances.value.findIndex(balance => balance.category_id === categoryId)
    if (index !== -1) {
      // Replace with server data and mark as not optimistic
      categoryBalances.value[index] = {
        ...updatedBalance,
        is_optimistic: false
      }
    } else {
      // Category balance doesn't exist yet - add it (this happens when a new category balance is created)
      categoryBalances.value.push({
        ...updatedBalance,
        is_optimistic: false
      })
    }
  }

  const setIsLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const reset = () => {
    categoryGroups.value = []
    categories.value = []
    categoryBalances.value = []
    isLoading.value = true
  }

  // Helper methods to get categories with balances
  const getCategoriesWithBalances = computed(() => {
    return categories.value.map(category => {
      // Find balance for this category
      const balance = categoryBalances.value.find(b => b.category_id === category.id)

      return {
        ...category,
        assigned: balance?.assigned || 0,
        activity: balance?.activity || 0,
        available: balance?.available || 0
      }
    })
  })

  const getCategoriesByGroupWithBalances = computed(() => (groupId: string) => {
    return getCategoriesWithBalances.value
      .filter(category => category.category_group_id === groupId)
      .sort((a, b) => a.display_order - b.display_order)
  })

  const getGroupTotalsWithBalances = computed(() => (groupId: string) => {
    const groupCategories = getCategoriesByGroupWithBalances.value(groupId)

    return {
      assigned: groupCategories.reduce((sum, category) => sum + (category.assigned || 0), 0),
      activity: groupCategories.reduce((sum, category) => sum + (category.activity || 0), 0),
      available: groupCategories.reduce((sum, category) => sum + (category.available || 0), 0)
    }
  })

  return {
    // State (readonly)
    categoryGroups: readonly(categoryGroups),
    categories: readonly(categories),
    categoryBalances: readonly(categoryBalances),
    isLoading: readonly(isLoading),

    // Getters
    getCategoryGroupById,
    getCategoriesByGroupId,
    categoryGroupExistsByName,
    categoryExistsByName,
    categoryExistsByNameInBudget,
    getTotalAssigned,
    getTotalActivity,
    getTotalAvailable,
    getGroupTotals,
    sortedCategoryGroups,
    visibleCategoryGroups,
    getCategoriesWithBalances,
    getCategoriesByGroupWithBalances,
    getGroupTotalsWithBalances,

    // Mutations
    setCategoryGroups,
    addCategoryGroup,
    updateCategoryGroup,
    removeCategoryGroup,
    hideCategoryGroup,
    setCategories,
    addCategory,
    updateCategory,
    hideCategory,
    unhideCategory,
    reorderCategoryGroups,
    reorderCategories,
    setCategoryBalances,
    updateCategoryBalance,
    setIsLoading,
    reset
  }
})
