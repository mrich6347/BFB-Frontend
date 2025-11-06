import type { Ref, ComputedRef } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useReorderCategoryGroups } from '@/composables/categories/category-write/useReorderCategoryGroups'
import { useReorderCategories } from '@/composables/categories/category-write/useReorderCategories'
import type { CategoryGroupResponse } from '@/types/DTO/category-group.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'

export function useCategoryDragAndDrop(
  categoryGroupsList: Ref<CategoryGroupResponse[]>,
  categoryLists: Record<string, CategoryResponse[]>,
  sortedCategoryGroups: ComputedRef<CategoryGroupResponse[]>,
  getCategoriesForGroup: (groupId: string) => CategoryResponse[]
) {
  const categoryStore = useCategoryStore()
  const { reorderCategoryGroups } = useReorderCategoryGroups()
  const { reorderCategories } = useReorderCategories()

  // Check if a category is a credit card payment category (non-editable)
  const isCreditCardPaymentCategory = (category: CategoryResponse): boolean => {
    const categoryGroup = categoryStore.getCategoryGroupById(category.category_group_id)
    return categoryGroup?.name === 'Credit Card Payments' && categoryGroup?.is_system_group === true
  }

  // Handle change event from category group draggable
  const onGroupChange = async (event: any) => {
    // Only process if this is a moved event
    if (!event.moved) {
      return
    }

    // Allow reordering of all groups, including system groups like Credit Card Payments

    // Get the category group IDs in the new order
    const groupIds = categoryGroupsList.value.map(group => group.id)

    // Validate that all group IDs are valid UUIDs
    const validGroupIds = groupIds.filter(id => id && typeof id === 'string' && id.trim() !== '')
    if (validGroupIds.length !== groupIds.length) {
      console.error('Invalid group IDs detected:', groupIds)
      // Reset to original order
      categoryGroupsList.value = [...sortedCategoryGroups.value]
      return
    }

    try {
      // Call composable to handle the reorder
      await reorderCategoryGroups(validGroupIds)
    } catch (error) {
      console.error('Failed to reorder category groups:', error)
      // Reset to original order if there's an error
      categoryGroupsList.value = [...sortedCategoryGroups.value]
    }
  }

  // Handle change event from category draggable
  const onChange = async (event: any, groupId: string) => {
    // Only process if this is a moved event
    if (!event.moved) {
      return
    }

    // Get the category IDs in the new order
    const categoryIds = categoryLists[groupId].map(category => category.id)

    // Validate that all category IDs are valid UUIDs
    const validCategoryIds = categoryIds.filter(id => id && typeof id === 'string' && id.trim() !== '')
    if (validCategoryIds.length !== categoryIds.length) {
      console.error('Invalid category IDs detected:', categoryIds)
      // Reset to original order
      categoryLists[groupId] = [...getCategoriesForGroup(groupId)]
      return
    }

    try {
      // Call composable to handle the reorder
      await reorderCategories(validCategoryIds)
    } catch (error) {
      console.error('Failed to reorder categories:', error)
      // Reset to original order if there's an error
      categoryLists[groupId] = [...getCategoriesForGroup(groupId)]
    }
  }

  return {
    // Methods
    onGroupChange,
    onChange,
    isCreditCardPaymentCategory
  }
}
