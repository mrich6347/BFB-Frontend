import { ref } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type { CategoryGroupResponse } from '@/types/DTO/category-group.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import { saveExpandedGroups } from '@/utils/expandedGroupsStorage'

export function useCategoryModals(
  expandedGroups: Ref<Set<string>>,
  budgetId: ComputedRef<string | undefined>,
  initializeCategoryLists: () => void
) {
  // Modal states
  const showCategoryGroupModal = ref(false)
  const showCategoryModal = ref(false)
  const showUnhideCategoryModal = ref(false)
  const selectedCategoryGroup = ref<CategoryGroupResponse | undefined>(undefined)
  const selectedCategory = ref<CategoryResponse | undefined>(undefined)
  const selectedCategoryToUnhide = ref<CategoryResponse | null>(null)
  const modalMode = ref<'create' | 'edit'>('create')
  const selectedGroupId = ref<string>('')

  // Open modals
  const openCreateCategoryGroupModal = () => {
    modalMode.value = 'create'
    selectedCategoryGroup.value = undefined
    showCategoryGroupModal.value = true
  }

  const openEditCategoryGroupModal = (group: CategoryGroupResponse) => {
    modalMode.value = 'edit'
    selectedCategoryGroup.value = group
    showCategoryGroupModal.value = true
  }

  const openCreateCategoryModal = (groupId: string) => {
    modalMode.value = 'create'
    selectedCategory.value = undefined
    selectedGroupId.value = groupId
    showCategoryModal.value = true
  }

  const openEditCategoryModal = (category: CategoryResponse) => {
    modalMode.value = 'edit'
    selectedCategory.value = category
    selectedGroupId.value = category.category_group_id
    showCategoryModal.value = true
  }

  const openUnhideCategoryModal = (category: CategoryResponse) => {
    selectedCategoryToUnhide.value = category
    showUnhideCategoryModal.value = true
  }

  // Handle modal events
  const handleCategoryGroupCreated = (categoryGroup: CategoryGroupResponse) => {
    // Add the new group to expandedGroups
    expandedGroups.value.add(categoryGroup.id)
    showCategoryGroupModal.value = false

    // Save the updated expanded groups to local storage
    const currentBudgetId = budgetId.value
    if (currentBudgetId) {
      saveExpandedGroups(currentBudgetId, Array.from(expandedGroups.value))
    }
  }

  const handleCategoryGroupUpdated = () => {
    showCategoryGroupModal.value = false
  }

  const handleCategoryGroupDeleted = (categoryGroupId: string) => {
    // Remove the deleted group from expandedGroups
    expandedGroups.value.delete(categoryGroupId)
    showCategoryGroupModal.value = false

    // Save the updated expanded groups to local storage
    const currentBudgetId = budgetId.value
    if (currentBudgetId) {
      saveExpandedGroups(currentBudgetId, Array.from(expandedGroups.value))
    }
  }

  const handleCategoryCreated = (category: CategoryResponse) => {
    // Ensure the category group is expanded
    expandedGroups.value.add(category.category_group_id)
    showCategoryModal.value = false

    // Save the updated expanded groups to local storage
    const currentBudgetId = budgetId.value
    if (currentBudgetId) {
      saveExpandedGroups(currentBudgetId, Array.from(expandedGroups.value))
    }

    // Update the category lists
    initializeCategoryLists()

    // Add highlight animation to the new category
    setTimeout(() => {
      const categoryElement = document.querySelector(`[data-category-id="${category.id}"]`)
      if (categoryElement) {
        categoryElement.classList.add('highlight-new')

        // Remove the class after animation completes
        setTimeout(() => {
          categoryElement.classList.remove('highlight-new')
        }, 2000)
      }
    }, 100)
  }

  const handleCategoryUpdated = () => {
    showCategoryModal.value = false
    // Optimistic updates in the store will handle UI updates automatically
  }

  const handleCategoryHidden = () => {
    showCategoryModal.value = false
    // Store hide operation will handle UI updates automatically
  }

  const handleCategoryUnhidden = () => {
    showUnhideCategoryModal.value = false
    selectedCategoryToUnhide.value = null
    // Store unhide operation will handle UI updates automatically
  }

  return {
    // Modal states
    showCategoryGroupModal,
    showCategoryModal,
    showUnhideCategoryModal,
    selectedCategoryGroup,
    selectedCategory,
    selectedCategoryToUnhide,
    modalMode,
    selectedGroupId,

    // Modal actions
    openCreateCategoryGroupModal,
    openEditCategoryGroupModal,
    openCreateCategoryModal,
    openEditCategoryModal,
    openUnhideCategoryModal,

    // Modal event handlers
    handleCategoryGroupCreated,
    handleCategoryGroupUpdated,
    handleCategoryGroupDeleted,
    handleCategoryCreated,
    handleCategoryUpdated,
    handleCategoryHidden,
    handleCategoryUnhidden
  }
}
