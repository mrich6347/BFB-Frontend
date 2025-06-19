import { ref, readonly } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import CategoryGroupService from '@/services/category-group.service'
import CategoryService from '@/services/category.service'
import { MainDataService } from '@/services/common/mainData.service'
import type { CreateCategoryGroupDto, UpdateCategoryGroupDto } from '@/types/DTO/category-group.dto'
import type { CreateCategoryDto, UpdateCategoryDto } from '@/types/DTO/category.dto'

export const useCategoryOperations = () => {
  const categoryStore = useCategoryStore()
  const budgetStore = useBudgetStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const fetchCategoryGroups = async (budgetId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const categoryGroups = await CategoryGroupService.getAllCategoryGroups(budgetId)
      categoryStore.setCategoryGroups(categoryGroups)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load category groups'
      console.error('Error loading category groups:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchCategories = async (budgetId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const categories = await CategoryService.getCategoriesByBudget(budgetId)
      categoryStore.setCategories(categories)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load categories'
      console.error('Error loading categories:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchAllCategoryData = async (budgetId: string) => {
    isLoading.value = true
    error.value = null

    try {
      const [categoryGroups, categories] = await Promise.all([
        CategoryGroupService.getAllCategoryGroups(budgetId),
        CategoryService.getCategoriesByBudget(budgetId)
      ])

      categoryStore.setCategoryGroups(categoryGroups)
      categoryStore.setCategories(categories)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load category data'
      console.error('Error loading category data:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchCategoryBalances = async (budgetId: string) => {
    if (!budgetId) {
      error.value = 'Cannot fetch category balances: budgetId is undefined'
      console.error('Cannot fetch category balances: budgetId is undefined')
      return
    }

    isLoading.value = true
    error.value = null

    try {
      // Use the main data service to get fresh category balances
      const mainData = await MainDataService.getMainData(budgetId)
      if (mainData?.categoryBalances) {
        categoryStore.setCategoryBalances(mainData.categoryBalances)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch category balances'
      console.error('Failed to fetch category balances:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createCategoryGroup = async (formData: CreateCategoryGroupDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Format/validate data before sending
      const requestData = {
        ...formData,
        name: formData.name.trim(),
        display_order: 0 // Always add to top
      }

      // Call service to get data
      const response = await CategoryGroupService.createCategoryGroup(requestData)

      // Store responsibility: Know HOW to add the group to state
      categoryStore.addCategoryGroup(response)

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create category group'
      console.error('Error creating category group:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateCategoryGroup = async (id: string, formData: UpdateCategoryGroupDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Prep the data
      const requestData = {
        ...formData,
        name: formData.name?.trim()
      }

      // Call service
      const response = await CategoryGroupService.updateCategoryGroup(id, requestData)

      // Store responsibility: Know HOW to find and update the correct group
      categoryStore.updateCategoryGroup(id, response)

      return response
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category group'
      console.error('Error updating category group:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteCategoryGroup = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await CategoryGroupService.deleteCategoryGroup(id)

      // Store responsibility: Know HOW to remove the group and handle moved categories
      categoryStore.removeCategoryGroup(id, response.movedCategories)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete category group'
      console.error('Error deleting category group:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const hideCategoryGroup = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await CategoryGroupService.hideCategoryGroup(id)

      // Store responsibility: Know HOW to hide the group and handle moved categories
      categoryStore.hideCategoryGroup(id, response.movedCategories)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to hide category group'
      console.error('Error hiding category group:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const createCategory = async (formData: CreateCategoryDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Format/validate data before sending
      const requestData = {
        ...formData,
        name: formData.name.trim(),
        display_order: 0 // Always add to top
      }

      // Call service to get data
      const response = await CategoryService.createCategory(requestData)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign in budget store
      budgetStore.setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to add the category to state
      categoryStore.addCategory(response.category)

      return response.category
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create category'
      console.error('Error creating category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateCategory = async (id: string, formData: UpdateCategoryDto) => {
    isLoading.value = true
    error.value = null

    try {
      // Composable responsibility: Prep the data
      const requestData = {
        ...formData,
        name: formData.name?.trim()
      }

      // Call service
      const response = await CategoryService.updateCategory(id, requestData)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign in budget store if needed
      if (response.readyToAssign !== undefined) {
        budgetStore.setReadyToAssign(response.readyToAssign)
      }

      // Store responsibility: Know HOW to find and update the correct category
      categoryStore.updateCategory(id, response.category)

      return response.category
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category'
      console.error('Error updating category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const hideCategory = async (id: string) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      const response = await CategoryService.hideCategory(id)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign with the accurate value from the backend
      budgetStore.setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to hide the category
      categoryStore.hideCategory(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to hide category'
      console.error('Error hiding category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const unhideCategory = async (id: string, targetGroupId?: string) => {
    isLoading.value = true
    error.value = null

    try {
      // If no target group specified, use the first non-system group
      let targetGroup = targetGroupId
      if (!targetGroup) {
        const firstGroup = categoryStore.categoryGroups.find(group => !group.is_system_group)
        if (!firstGroup) {
          throw new Error('No available category group to move to')
        }
        targetGroup = firstGroup.id
      }

      // Call service
      const response = await CategoryService.unhideCategory(id, targetGroup)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign with the accurate value from the backend
      budgetStore.setReadyToAssign(response.readyToAssign)

      // Store responsibility: Know HOW to unhide the category
      categoryStore.unhideCategory(id, targetGroup)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to unhide category'
      console.error('Error unhiding category:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const reorderCategoryGroups = async (groupIds: string[]) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service
      await CategoryGroupService.reorderCategoryGroups({ group_ids: groupIds })

      // Store responsibility: Know HOW to update display orders
      categoryStore.reorderCategoryGroups(groupIds)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder category groups'
      console.error('Error reordering category groups:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const reorderCategories = async (categoryIds: string[]) => {
    isLoading.value = true
    error.value = null

    try {
      // Call service first
      await CategoryService.reorderCategories({ category_ids: categoryIds })

      // Store responsibility: Update display orders after successful API call
      categoryStore.reorderCategories(categoryIds)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to reorder categories'
      console.error('Error reordering categories:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const updateCategoryBalance = async (categoryId: string, assigned: number) => {
    isLoading.value = true
    error.value = null

    try {
      // Get current month
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      // Send update to backend - only update assigned, let backend calculate available
      const response = await CategoryService.updateCategoryBalance(categoryId, { assigned }, year, month)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign in budget store
      budgetStore.setReadyToAssign(response.readyToAssign)

      // Refresh category balances to get updated data
      await fetchCategoryBalances(categoryStore.categories.find(c => c.id === categoryId)?.budget_id || '')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update category balance'
      console.error('Error updating category balance:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const moveMoney = async (sourceCategoryId: string, destinationCategoryId: string, amount: number) => {
    isLoading.value = true
    error.value = null

    try {
      // Get current month
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      // Send update to backend
      await CategoryService.moveMoney(sourceCategoryId, destinationCategoryId, amount, year, month)

      // Refresh category balances to get updated data
      const budgetId = categoryStore.categories.find(c => c.id === sourceCategoryId)?.budget_id
      if (budgetId) {
        await fetchCategoryBalances(budgetId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to move money'
      console.error('Error moving money:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const moveMoneyToReadyToAssign = async (sourceCategoryId: string, amount: number) => {
    isLoading.value = true
    error.value = null

    try {
      // Get current month
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      // Send update to backend
      await CategoryService.moveMoneyToReadyToAssign(sourceCategoryId, amount, year, month)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign in budget store
      budgetStore.setReadyToAssign(budgetStore.readyToAssign + amount)

      // Refresh category balances to get updated data
      const budgetId = categoryStore.categories.find(c => c.id === sourceCategoryId)?.budget_id
      if (budgetId) {
        await fetchCategoryBalances(budgetId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to move money to Ready to Assign'
      console.error('Error moving money to Ready to Assign:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const pullFromReadyToAssign = async (destinationCategoryId: string, amount: number) => {
    isLoading.value = true
    error.value = null

    try {
      // Validate that Ready to Assign has enough money
      if (budgetStore.readyToAssign < amount) {
        throw new Error('Insufficient Ready to Assign balance')
      }

      // Get current month
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1

      // Send update to backend
      await CategoryService.pullFromReadyToAssign(destinationCategoryId, amount, year, month)

      // Composable responsibility: Coordinate cross-store updates
      // Update Ready to Assign
      budgetStore.setReadyToAssign(budgetStore.readyToAssign - amount)

      // Refresh category balances to get updated data
      const budgetId = categoryStore.categories.find(c => c.id === destinationCategoryId)?.budget_id
      if (budgetId) {
        await fetchCategoryBalances(budgetId)
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to pull money from Ready to Assign'
      console.error('Error pulling money from Ready to Assign:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const setIsLoading = (loading: boolean) => {
    categoryStore.setIsLoading(loading)
  }

  const resetCategoryData = () => {
    categoryStore.reset()
  }

  return {
    // State
    isLoading: readonly(isLoading),
    error: readonly(error),

    // Operations
    fetchCategoryGroups,
    fetchCategories,
    fetchAllCategoryData,
    fetchCategoryBalances,
    createCategoryGroup,
    updateCategoryGroup,
    deleteCategoryGroup,
    hideCategoryGroup,
    createCategory,
    updateCategory,
    hideCategory,
    unhideCategory,
    reorderCategoryGroups,
    reorderCategories,
    updateCategoryBalance,
    moveMoney,
    moveMoneyToReadyToAssign,
    pullFromReadyToAssign,
    setIsLoading,
    resetCategoryData
  }
}
