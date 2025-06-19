<template>
  <div class="space-y-1">
    <!-- Loading State -->
    <div v-if="categoryStore.isLoading" class="flex justify-center items-center min-h-[200px]">
      <div class="text-muted-foreground">Loading categories...</div>
    </div>

    <!-- Empty State -->
    <div v-else-if="sortedCategoryGroups.length === 0" class="flex flex-col items-center justify-center min-h-[200px] p-4">
      <div class="text-muted-foreground mb-4 text-center">
        <p class="text-lg font-medium mb-2">No categories found</p>
        <p class="mb-4">Start by creating a category group, then add categories to it.</p>
      </div>
      <button
        class="flex items-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        @click="openCreateCategoryGroupModal"
      >
        <PlusIcon class="h-4 w-4" />
        Add Category Group
      </button>
    </div>

    <div v-else>
      <!-- Header Row -->
      <div class="grid grid-cols-[2fr_150px_150px_150px] gap-10 text-xs font-medium text-muted-foreground px-2 py-1 border-b">
        <div class="flex items-center gap-1">
          CATEGORY
          <PlusIcon
            class="h-4 w-4 cursor-pointer hover:text-primary bg-primary/20 rounded-full p-0.5"
            @click="openCreateCategoryGroupModal"
          />
        </div>
        <div class="text-right">ASSIGNED</div>
        <div class="text-right">ACTIVITY</div>
        <div class="text-right">AVAILABLE</div>
      </div>

      <!-- Regular Category Groups -->
      <draggable
        v-model="categoryGroupsList"
        item-key="id"
        :animation="150"
        handle=".group-drag-handle"
        ghost-class="ghost-item"
        chosen-class="sortable-chosen"
        drag-class="sortable-drag"
        @change="onGroupChange"
        class="category-group-list"
      >
        <template #item="{ element: group }">
          <div :key="group.id" class="border-b last:border-b-0 category-group-item" :data-group-id="group.id">
            <!-- Group Header -->
            <div
              class="group grid grid-cols-[2fr_150px_150px_150px] gap-10 font-semibold px-2 py-1.5 cursor-pointer hover:bg-muted/50"
              @click="toggleGroup(group.id)"
            >
              <div class="flex items-center truncate">
                <GripVertical
                  v-if="!group.is_system_group"
                  class="h-4 w-4 mr-1 text-muted-foreground cursor-grab group-drag-handle opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <div v-else class="h-4 w-4 mr-1"></div> <!-- Spacer for system groups -->
                <ChevronDownIcon v-if="expandedGroups.has(group.id)" class="h-4 w-4 mr-1 flex-shrink-0" />
                <ChevronRightIcon v-else class="h-4 w-4 mr-1 flex-shrink-0" />
                <span class="flex items-center gap-1 truncate">
                  {{ group.name }}
                  <PlusIcon
                    v-if="!group.is_system_group"
                    class="h-4 w-4 cursor-pointer hover:text-primary bg-primary/20 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="openCreateCategoryModal(group.id)"
                  />
                  <Edit
                    v-if="!group.is_system_group"
                    class="h-4 w-4 cursor-pointer hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                    @click.stop="openEditCategoryGroupModal(group)"
                  />
                  <span
                    v-if="group.is_system_group"
                    class="text-xs text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="System-managed category group"
                  >
                    (System)
                  </span>
                </span>
              </div>
              <div class="text-right text-sm">{{ formatCurrency(getGroupTotals(group.id).assigned) }}</div>
              <div class="text-right text-sm">{{ formatCurrency(getGroupTotals(group.id).activity) }}</div>
              <div class="text-right text-sm">
                  {{ formatCurrency(getGroupTotals(group.id).available) }}
              </div>
            </div>

            <!-- Categories within Group -->
            <div v-if="expandedGroups.has(group.id)">
              <draggable
                v-model="categoryLists[group.id]"
                item-key="id"
                :animation="150"
                handle=".drag-handle"
                ghost-class="ghost-item"
                chosen-class="sortable-chosen"
                drag-class="sortable-drag"
                @change="onChange($event, group.id)"
                class="category-list"
              >
                <template #item="{ element: category }">
                  <div
                    class="group grid grid-cols-[2fr_150px_150px_150px] gap-10 text-sm pl-8 pr-2 py-1.5 hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0 category-item"
                    :data-category-id="category.id"
                  >
                    <div class="flex items-center truncate">
                      <GripVertical
                        class="h-3.5 w-3.5 mr-2 text-muted-foreground cursor-grab drag-handle opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <span class="truncate">{{ category.name }}</span>
                      <Edit
                        class="h-3.5 w-3.5 cursor-pointer hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                        @click="openEditCategoryModal(category)"
                      />
                    </div>
                    <div class="text-right text-xs">
                      <CalculationInput
                        :model-value="category.assigned"
                        @update:model-value="(value) => updateCategoryAssigned(category.id, value)"
                        class="text-muted-foreground hover:text-primary"
                      />
                    </div>
                    <div class="text-right text-xs text-muted-foreground">{{ formatCurrency(category.activity) }}</div>
                    <div class="text-right">
                      <Badge
                        :variant="getBadgeVariant(category.available)"
                        class="cursor-pointer"
                        @click="handleAvailableClick(category, $event)"
                      >
                        {{ formatCurrency(category.available) }}
                      </Badge>
                    </div>
                  </div>
                </template>
              </draggable>
            </div>
          </div>
        </template>
      </draggable>

      <!-- Hidden Categories Section -->
      <div v-if="hasHiddenCategories && hiddenCategoriesGroup" class="border-t-2 border-muted mt-4">
        <div class="border-b last:border-b-0 category-group-item opacity-75" :data-group-id="hiddenCategoriesGroup.id">
          <!-- Hidden Group Header -->
          <div
            class="group grid grid-cols-[2fr_150px_150px_150px] gap-10 font-semibold px-2 py-1.5 cursor-pointer hover:bg-muted/30 bg-muted/10"
            @click="toggleGroup(hiddenCategoriesGroup.id)"
          >
            <div class="flex items-center truncate">
              <ChevronDownIcon v-if="expandedGroups.has(hiddenCategoriesGroup.id)" class="h-4 w-4 mr-1 flex-shrink-0 text-muted-foreground" />
              <ChevronRightIcon v-else class="h-4 w-4 mr-1 flex-shrink-0 text-muted-foreground" />
              <span class="flex items-center gap-1 truncate text-muted-foreground">
                {{ hiddenCategoriesGroup.name }}
                <span class="text-xs text-muted-foreground ml-2">
                  (Hidden)
                </span>
              </span>
            </div>
            <div class="text-right text-sm text-muted-foreground">{{ formatCurrency(getGroupTotals(hiddenCategoriesGroup.id).assigned) }}</div>
            <div class="text-right text-sm text-muted-foreground">{{ formatCurrency(getGroupTotals(hiddenCategoriesGroup.id).activity) }}</div>
            <div class="text-right text-sm text-muted-foreground">
                {{ formatCurrency(getGroupTotals(hiddenCategoriesGroup.id).available) }}
            </div>
          </div>

          <!-- Hidden Categories within Group -->
          <div v-if="expandedGroups.has(hiddenCategoriesGroup.id)">
            <draggable
              v-model="categoryLists[hiddenCategoriesGroup.id]"
              item-key="id"
              :animation="150"
              handle=".drag-handle"
              ghost-class="ghost-item"
              chosen-class="sortable-chosen"
              drag-class="sortable-drag"
              @change="onChange($event, hiddenCategoriesGroup.id)"
              class="category-list"
            >
              <template #item="{ element: category }">
                <div
                  class="group grid grid-cols-[2fr_150px_150px_150px] gap-10 text-sm pl-8 pr-2 py-1.5 hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0 category-item opacity-75"
                  :data-category-id="category.id"
                >
                  <div class="flex items-center truncate">
                    <GripVertical
                      class="h-3.5 w-3.5 mr-2 text-muted-foreground cursor-grab drag-handle opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <span class="truncate text-muted-foreground">{{ category.name }}</span>
                    <button
                      class="h-3.5 w-3.5 cursor-pointer hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-xs px-1 py-0.5 bg-primary/20 rounded text-primary"
                      @click="openUnhideCategoryModal(category)"
                      title="Unhide category"
                    >
                      ↑
                    </button>
                  </div>
                  <div class="text-right text-xs text-muted-foreground">{{ formatCurrency(category.assigned) }}</div>
                  <div class="text-right text-xs text-muted-foreground">{{ formatCurrency(category.activity) }}</div>
                  <div class="text-right">
                    <Badge
                      variant="neutral"
                      class="opacity-75"
                    >
                      {{ formatCurrency(category.available) }}
                    </Badge>
                  </div>
                </div>
              </template>
            </draggable>
          </div>
        </div>
      </div>

    </div>
  </div>

  <!-- Modals -->
  <CategoryGroupModal
    :is-open="showCategoryGroupModal"
    :mode="modalMode"
    :category-group="selectedCategoryGroup"
    :budget-id="budgetStore.currentBudget?.id || ''"
    @close="showCategoryGroupModal = false"
    @created="handleCategoryGroupCreated"
    @updated="handleCategoryGroupUpdated"
    @deleted="handleCategoryGroupDeleted"
  />

  <CategoryModal
    :is-open="showCategoryModal"
    :mode="modalMode"
    :category="selectedCategory"
    :category-group-id="selectedGroupId"
    :budget-id="budgetStore.currentBudget?.id || ''"
    @close="showCategoryModal = false"
    @created="handleCategoryCreated"
    @updated="handleCategoryUpdated"
    @hidden="handleCategoryHidden"
  />

  <MoveMoneyModal
    :is-open="showMoveMoneyModal"
    :source-category="selectedSourceCategory"
    :available-categories="availableDestinationCategories"
    :position="moveMoneyModalPosition"
    @close="showMoveMoneyModal = false"
    @move="handleMoveMoney"
    @move-to-ready-to-assign="handleMoveToReadyToAssign"
  />

  <PullMoneyModal
    :is-open="showPullMoneyModal"
    :destination-category="selectedDestinationCategory"
    :available-categories="availableSourceCategories"
    :position="pullMoneyModalPosition"
    @close="showPullMoneyModal = false"
    @pull="handlePullMoney"
    @pull-from-ready-to-assign="handlePullFromReadyToAssign"
  />

  <UnhideCategoryModal
    :is-open="showUnhideCategoryModal"
    :category-id="selectedCategoryToUnhide?.id || ''"
    :category-name="selectedCategoryToUnhide?.name || ''"
    @close="showUnhideCategoryModal = false"
    @unhidden="handleCategoryUnhidden"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, watch } from 'vue'
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, Edit, GripVertical } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import Badge from '@/components/shadcn-ui/Badge.vue'
import { useCategoryStore } from '@/stores/category.store'
import { useCategoryOperations } from '@/composables/categories/useCategoryOperations'
import { useBudgetStore } from '@/stores/budget.store'
import { useAccountStore } from '@/stores/account.store'
import type { CategoryGroupResponse } from '@/types/DTO/category-group.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import CategoryGroupModal from './CategoryGroupModal.vue'
import CategoryModal from './CategoryModal.vue'
import MoveMoneyModal from './MoveMoneyModal.vue'
import PullMoneyModal from './PullMoneyModal.vue'
import UnhideCategoryModal from './UnhideCategoryModal.vue'
import CalculationInput from './CalculationInput.vue'
import draggable from 'vuedraggable'
import { saveExpandedGroups, loadExpandedGroups } from '@/utils/expandedGroupsStorage'

const categoryStore = useCategoryStore()
const {
  moveMoney,
  moveMoneyToReadyToAssign,
  pullFromReadyToAssign,
  reorderCategoryGroups,
  reorderCategories,
  updateCategoryBalance
} = useCategoryOperations()
const budgetStore = useBudgetStore()
const accountStore = useAccountStore()

const expandedGroups = ref<Set<string>>(new Set())
const categoryLists = reactive<Record<string, CategoryResponse[]>>({})
const categoryGroupsList = ref<CategoryGroupResponse[]>([])

// Computed property to get visible category groups (filtered based on credit card accounts)
const sortedCategoryGroups = computed(() => {
  return categoryStore.visibleCategoryGroups
})

// Computed property to separate regular groups from hidden categories group
const regularCategoryGroups = computed(() => {
  return sortedCategoryGroups.value.filter(group =>
    !(group.name === 'Hidden Categories' && group.is_system_group)
  )
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

// Update categoryGroupsList when regularCategoryGroups changes
watch(() => regularCategoryGroups.value, (newGroups) => {
  categoryGroupsList.value = [...newGroups]
}, { immediate: true })

// Get categories for a specific group
const getCategoriesForGroup = (groupId: string) => {
  return categoryStore.getCategoriesByGroupWithBalances(groupId)
}

// Get categories from the reactive categoryLists
const getReactiveCategoriesForGroup = (groupId: string) => {
  if (!categoryLists[groupId]) {
    categoryLists[groupId] = [...getCategoriesForGroup(groupId)]
  }
  return categoryLists[groupId]
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

// Watch for changes in categories and update the categoryLists
watch(() => categoryStore.getCategoriesWithBalances, (newCategories) => {
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
    // Load expanded groups from local storage for the new budget
    const savedExpandedGroups = loadExpandedGroups(newBudgetId)

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
})

// Initialize category lists and load expanded groups from local storage
onMounted(() => {
  initializeCategoryLists()

  // Get the current budget ID
  const budgetId = budgetStore.currentBudget?.id
  if (budgetId) {
    // Load expanded groups from local storage
    const savedExpandedGroups = loadExpandedGroups(budgetId)

    // If we have saved state (even if empty), use it
    if (savedExpandedGroups !== null) {
      // Clear the current set and add the saved groups
      expandedGroups.value.clear()
      savedExpandedGroups.forEach(groupId => {
        // Only add if the group still exists
        if (sortedCategoryGroups.value.some(group => group.id === groupId)) {
          expandedGroups.value.add(groupId)
        }
      })
    } else {
      // If no saved state, expand all groups by default
      sortedCategoryGroups.value.forEach(group => expandedGroups.value.add(group.id))
    }
  } else {
    // If no budget ID, expand all groups by default
    sortedCategoryGroups.value.forEach(group => expandedGroups.value.add(group.id))
  }
})

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

// Handle change event from category group draggable
const onGroupChange = async (event: any) => {
  // Only process if this is a moved event
  if (!event.moved) {
    console.log('Not a group move event, ignoring', event)
    return
  }

  // Prevent reordering of system groups
  const movedGroup = event.moved.element
  if (movedGroup.is_system_group) {
    console.log('Cannot reorder system groups')
    // Revert the change by resetting the list
    categoryGroupsList.value = [...sortedCategoryGroups.value]
    return
  }

  console.log('Group drag event detected:', event)

  // Get the category group IDs in the new order
  const groupIds = categoryGroupsList.value.map(group => group.id)
  console.log('New category group order:', groupIds)

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
    console.log('Calling reorderCategoryGroups in composable')
    await reorderCategoryGroups(validGroupIds)
    console.log('Group reorder completed successfully')
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
    console.log('Not a move event, ignoring', event)
    return
  }

  // Categories can be reordered freely now

  console.log('Drag event detected:', event)

  // Get the category IDs in the new order
  const categoryIds = categoryLists[groupId].map(category => category.id)
  console.log('New category order:', categoryIds)

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
    console.log('Calling reorderCategories in composable')
    await reorderCategories(validCategoryIds)
    console.log('Reorder completed successfully')
  } catch (error) {
    console.error('Failed to reorder categories:', error)
    // Reset to original order if there's an error
    categoryLists[groupId] = [...getCategoriesForGroup(groupId)]
  }
}

const getBadgeVariant = (amount: number | undefined | null): 'positive' | 'negative' | 'neutral' => {
  // Handle null, undefined, or NaN values
  if (amount === null || amount === undefined || isNaN(amount)) {
    amount = 0
  }

  if (amount < 0) return 'negative'
  if (amount === 0) return 'neutral'
  return 'positive'
}



// Modal states
const showCategoryGroupModal = ref(false)
const showCategoryModal = ref(false)
const showMoveMoneyModal = ref(false)
const showPullMoneyModal = ref(false)
const showUnhideCategoryModal = ref(false)
const selectedCategoryGroup = ref<CategoryGroupResponse | undefined>(undefined)
const selectedCategory = ref<CategoryResponse | undefined>(undefined)
const selectedSourceCategory = ref<CategoryResponse | null>(null)
const selectedDestinationCategory = ref<CategoryResponse | null>(null)
const selectedCategoryToUnhide = ref<CategoryResponse | null>(null)
const modalMode = ref<'create' | 'edit'>('create')
const selectedGroupId = ref<string>('')
const moveMoneyModalPosition = ref({ x: 0, y: 0 })
const pullMoneyModalPosition = ref({ x: 0, y: 0 })

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



// Handle modal events
const handleCategoryGroupCreated = (categoryGroup: CategoryGroupResponse) => {
  // Add the new group to expandedGroups
  expandedGroups.value.add(categoryGroup.id)
  showCategoryGroupModal.value = false

  // Save the updated expanded groups to local storage
  const budgetId = budgetStore.currentBudget?.id
  if (budgetId) {
    saveExpandedGroups(budgetId, Array.from(expandedGroups.value))
  }
}

const handleCategoryGroupUpdated = (categoryGroup: CategoryGroupResponse) => {
  showCategoryGroupModal.value = false
}

const handleCategoryGroupDeleted = (categoryGroupId: string) => {
  // Remove the deleted group from expandedGroups
  expandedGroups.value.delete(categoryGroupId)
  showCategoryGroupModal.value = false

  // Save the updated expanded groups to local storage
  const budgetId = budgetStore.currentBudget?.id
  if (budgetId) {
    saveExpandedGroups(budgetId, Array.from(expandedGroups.value))
  }
}

const handleCategoryCreated = (category: CategoryResponse) => {
  // Ensure the category group is expanded
  expandedGroups.value.add(category.category_group_id)
  showCategoryModal.value = false

  // Save the updated expanded groups to local storage
  const budgetId = budgetStore.currentBudget?.id
  if (budgetId) {
    saveExpandedGroups(budgetId, Array.from(expandedGroups.value))
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

// Method to flash categories with green background when money is assigned
const flashCategoriesWithMoney = (categoryIds: string[]) => {
  categoryIds.forEach((categoryId, index) => {
    // Stagger the animations slightly for a nice effect
    setTimeout(() => {
      const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`)
      if (categoryElement) {
        categoryElement.classList.add('flash-money-added')

        // Remove the class after animation completes
        setTimeout(() => {
          categoryElement.classList.remove('flash-money-added')
        }, 1000)
      }
    }, index * 100) // 100ms delay between each category flash
  })
}

// Expose the flash method to parent components
defineExpose({
  flashCategoriesWithMoney
})

const handleCategoryUpdated = (category: CategoryResponse) => {
  showCategoryModal.value = false
  // Optimistic updates in the store will handle UI updates automatically
}

const handleCategoryHidden = (categoryId: string) => {
  showCategoryModal.value = false
  // Store hide operation will handle UI updates automatically
}

const openUnhideCategoryModal = (category: CategoryResponse) => {
  selectedCategoryToUnhide.value = category
  showUnhideCategoryModal.value = true
}

const handleCategoryUnhidden = (categoryId: string) => {
  showUnhideCategoryModal.value = false
  selectedCategoryToUnhide.value = null
  // Store unhide operation will handle UI updates automatically
}

const updateCategoryAssigned = async (categoryId: string, assignedValue: number) => {
  try {
    await updateCategoryBalance(categoryId, assignedValue)
  } catch (error) {
    console.error('Failed to update category assigned value:', error)
  }
}

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

  try {
    await moveMoney(
      selectedSourceCategory.value.id,
      destinationCategoryId,
      amount
    )
    showMoveMoneyModal.value = false
  } catch (error) {
    console.error('Failed to move money:', error)
  }
}

const handleMoveToReadyToAssign = async (amount: number) => {
  if (!selectedSourceCategory.value) return

  try {
    await moveMoneyToReadyToAssign(
      selectedSourceCategory.value.id,
      amount
    )
    showMoveMoneyModal.value = false
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

  try {
    await pullFromReadyToAssign(
      selectedDestinationCategory.value.id,
      amount
    )
    showPullMoneyModal.value = false
  } catch (error) {
    console.error('Failed to pull money from Ready to Assign:', error)
  }
}

</script>

<style scoped>
.category-group-list,
.category-list {
  width: 100%;
}

.category-group-item,
.category-item {
  transition: background-color 0.2s, border 0.2s;
}

.category-group-item.sortable-chosen,
.category-item.sortable-chosen {
  background-color: var(--muted);
  cursor: grabbing;
  border: 1px solid var(--primary);
}

.ghost-item {
  opacity: 0.7;
  border: 1px dashed var(--primary);
}

.group-drag-handle,
.drag-handle {
  cursor: grab;
}

.group-drag-handle:active,
.drag-handle:active {
  cursor: grabbing;
}

@keyframes highlight {
  0% {
    border-color: transparent;
  }
  50% {
    border-color: var(--primary);
    border-width: 1px;
  }
  100% {
    border-color: transparent;
  }
}

@keyframes flashMoneyAdded {
  0% {
    background-color: transparent;
  }
  30% {
    background-color: rgba(34, 197, 94, 0.3); /* green-500 with opacity */
  }
  100% {
    background-color: transparent;
  }
}

.highlight-new {
  animation: highlight 2s ease-in-out;
}

.flash-money-added {
  animation: flashMoneyAdded 1s ease-in-out;
}
</style>
