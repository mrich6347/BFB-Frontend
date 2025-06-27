import { ref, computed } from 'vue'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import { useCategoryStore } from '@/stores/category.store'
import { useMoveMoneyBetweenCategories } from '@/composables/categories/category-write/useMoveMoneyBetweenCategories'
import { useMoveMoneyToReadyToAssign } from '@/composables/categories/category-write/useMoveMoneyToReadyToAssign'
import { usePullFromReadyToAssign } from '@/composables/categories/category-write/usePullFromReadyToAssign'
import { useUpdateCategoryBalance } from '@/composables/categories/category-write/useUpdateCategoryBalance'

export function useMoneyMovement() {
  const categoryStore = useCategoryStore()
  const { moveMoney } = useMoveMoneyBetweenCategories()
  const { moveMoneyToReadyToAssign } = useMoveMoneyToReadyToAssign()
  const { pullFromReadyToAssign } = usePullFromReadyToAssign()
  const { updateCategoryBalance } = useUpdateCategoryBalance()

  // Modal states for money movement
  const showMoveMoneyModal = ref(false)
  const showPullMoneyModal = ref(false)
  const selectedSourceCategory = ref<CategoryResponse | null>(null)
  const selectedDestinationCategory = ref<CategoryResponse | null>(null)
  const moveMoneyModalPosition = ref({ x: 0, y: 0 })
  const pullMoneyModalPosition = ref({ x: 0, y: 0 })

  // Move money functionality
  const availableDestinationCategories = computed(() => {
    if (!selectedSourceCategory.value) return []

    // Get the Hidden Categories group
    const hiddenGroup = categoryStore.categoryGroups.find(group =>
      group.name === 'Hidden Categories' && group.is_system_group
    )

    return categoryStore.getCategoriesWithBalances.filter(category =>
      category.id !== selectedSourceCategory.value?.id &&
      (!hiddenGroup || category.category_group_id !== hiddenGroup.id) // Exclude hidden categories
    )
  })

  // Pull money functionality
  const availableSourceCategories = computed(() => {
    if (!selectedDestinationCategory.value) return []

    // Get the Hidden Categories group
    const hiddenGroup = categoryStore.categoryGroups.find(group =>
      group.name === 'Hidden Categories' && group.is_system_group
    )

    return categoryStore.getCategoriesWithBalances.filter(category =>
      category.id !== selectedDestinationCategory.value?.id &&
      category.available &&
      category.available > 0 &&
      (!hiddenGroup || category.category_group_id !== hiddenGroup.id) // Exclude hidden categories
    )
  })

  const handleAvailableClick = (category: CategoryResponse, event: MouseEvent) => {
    // Handle positive balances - move money out
    if (category.available && category.available > 0) {
      selectedSourceCategory.value = category

      // Get the position of the clicked element for modal positioning
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      moveMoneyModalPosition.value = {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      }

      showMoveMoneyModal.value = true
      return
    }

    // Handle negative balances - pull money in
    if (category.available && category.available < 0) {
      selectedDestinationCategory.value = category

      // Get the position of the clicked element for modal positioning
      const rect = (event.target as HTMLElement).getBoundingClientRect()
      pullMoneyModalPosition.value = {
        x: rect.left + rect.width / 2,
        y: rect.bottom + 8
      }

      showPullMoneyModal.value = true
      return
    }
  }

  const handleMoveMoney = async (destinationCategoryId: string, amount: number) => {
    if (!selectedSourceCategory.value) return

    showMoveMoneyModal.value = false

    try {
      await moveMoney(
        selectedSourceCategory.value.id,
        destinationCategoryId,
        amount
      )
    } catch (error) {
      console.error('Failed to move money:', error)
    }
  }

  const handleMoveToReadyToAssign = async (amount: number) => {
    if (!selectedSourceCategory.value) return
    showMoveMoneyModal.value = false

    try {
      await moveMoneyToReadyToAssign(
        selectedSourceCategory.value.id,
        amount
      )
    } catch (error) {
      console.error('Failed to move money to Ready to Assign:', error)
    }
  }

  const handlePullMoney = async (sourceCategoryId: string, amount: number) => {
    if (!selectedDestinationCategory.value) return

    try {
      await moveMoney(
        sourceCategoryId,
        selectedDestinationCategory.value.id,
        amount
      )
      showPullMoneyModal.value = false
    } catch (error) {
      console.error('Failed to pull money:', error)
    }
  }

  const handlePullFromReadyToAssign = async (amount: number) => {
    if (!selectedDestinationCategory.value) return

    // Close modal immediately for optimistic update
    showPullMoneyModal.value = false

    try {
      await pullFromReadyToAssign(
        selectedDestinationCategory.value.id,
        amount
      )
    } catch (error) {
      console.error('Failed to pull money from Ready to Assign:', error)
      // Note: Error handling for optimistic updates is handled in the composable
      // The UI will automatically rollback if the server operation fails
    }
  }

  const updateCategoryAssigned = async (categoryId: string, assignedValue: number) => {
    try {
      await updateCategoryBalance(categoryId, assignedValue)
    } catch (error) {
      console.error('Failed to update category assigned value:', error)
    }
  }

  return {
    // Modal states
    showMoveMoneyModal,
    showPullMoneyModal,
    selectedSourceCategory,
    selectedDestinationCategory,
    moveMoneyModalPosition,
    pullMoneyModalPosition,

    // Computed
    availableDestinationCategories,
    availableSourceCategories,

    // Methods
    handleAvailableClick,
    handleMoveMoney,
    handleMoveToReadyToAssign,
    handlePullMoney,
    handlePullFromReadyToAssign,
    updateCategoryAssigned
  }
}
