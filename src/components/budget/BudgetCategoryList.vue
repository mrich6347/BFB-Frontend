<template>
  <div class="space-y-1 pb-16">
    <!-- Empty State -->
    <div v-if="sortedCategoryGroups.length === 0" class="flex flex-col items-center justify-center min-h-[200px] p-4">
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
      <div class="grid grid-cols-[minmax(0,3fr)_minmax(0,130px)_minmax(0,130px)_minmax(0,130px)] gap-6 text-xs font-medium text-muted-foreground px-2 py-1 border-b">
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
              class="group grid grid-cols-[minmax(0,3fr)_minmax(0,130px)_minmax(0,130px)_minmax(0,130px)] gap-6 font-semibold px-2 py-1.5 cursor-pointer hover:bg-muted/50"
              @click="toggleGroup(group.id)"
            >
              <div class="flex items-center truncate">
                <GripVertical
                  class="h-4 w-4 mr-1 text-muted-foreground cursor-grab group-drag-handle opacity-0 group-hover:opacity-100 transition-opacity"
                />
                <ChevronDownIcon v-if="expandedGroups.has(group.id)" class="h-4 w-4 mr-1 flex-shrink-0" />
                <ChevronRightIcon v-else class="h-4 w-4 mr-1 flex-shrink-0" />
                <span class="flex items-center gap-1 truncate">
                  <span
                    @click.stop="!group.is_system_group && openEditCategoryGroupModal(group)"
                    :class="[
                      !group.is_system_group ? 'cursor-pointer hover:bg-primary/10 hover:text-primary px-1 -mx-1 rounded transition-colors' : ''
                    ]"
                    :title="!group.is_system_group ? 'Click to edit' : ''"
                  >
                    {{ group.name }}
                  </span>
                  <PlusIcon
                    v-if="!group.is_system_group"
                    class="h-4 w-4 cursor-pointer hover:text-primary bg-primary/20 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop="openCreateCategoryModal(group.id)"
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
                    class="group grid grid-cols-[minmax(0,3fr)_minmax(0,130px)_minmax(0,130px)_minmax(0,130px)] gap-6 text-sm pl-8 pr-2 py-1.5 hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0 category-item"
                    :data-category-id="category.id"
                  >
                    <div class="flex items-center truncate">
                      <GripVertical
                        class="h-3.5 w-3.5 mr-2 text-muted-foreground cursor-grab drag-handle opacity-0 group-hover:opacity-100 transition-opacity"
                      />
                      <span
                        class="truncate"
                        :class="[
                          !isCreditCardPaymentCategory(category) ? 'cursor-pointer hover:bg-primary/10 hover:text-primary px-1 -mx-1 rounded transition-colors' : ''
                        ]"
                        :title="!isCreditCardPaymentCategory(category) ? 'Click to edit' : ''"
                        @click="!isCreditCardPaymentCategory(category) && openEditCategoryModal(category)"
                      >
                        {{ category.name }}
                      </span>
                    </div>
                    <div class="text-right text-sm">
                      <CalculationInput
                        :model-value="category.assigned"
                        @update:model-value="(value) => updateCategoryAssigned(category.id, value)"
                        class="text-muted-foreground hover:text-primary"
                      />
                    </div>
                    <div class="text-right text-sm text-muted-foreground">{{ formatCurrency(category.activity) }}</div>
                    <div class="text-right">
                      <Badge
                        :variant="getBadgeVariant(category.available)"
                        :class="[
                          'cursor-pointer transition-all duration-200 transform',
                          category.available > 0 && 'hover:bg-emerald-400 hover:text-emerald-950 hover:border-emerald-600 hover:shadow-md hover:shadow-emerald-400/60 hover:scale-[1.03]'
                        ]"
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
            class="group grid grid-cols-[minmax(0,3fr)_minmax(0,130px)_minmax(0,130px)_minmax(0,130px)] gap-6 font-semibold px-2 py-1.5 cursor-pointer hover:bg-muted/30 bg-muted/10"
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
                  class="group grid grid-cols-[minmax(0,3fr)_minmax(0,130px)_minmax(0,130px)_minmax(0,130px)] gap-6 text-sm pl-8 pr-2 py-1.5 hover:bg-muted/30 transition-colors border-b border-border/40 last:border-b-0 category-item opacity-75"
                  :data-category-id="category.id"
                >
                  <div class="flex items-center truncate">
                    <GripVertical
                      class="h-3.5 w-3.5 mr-2 text-muted-foreground cursor-grab drag-handle opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                    <span
                      class="truncate text-muted-foreground cursor-pointer hover:bg-primary/10 hover:text-primary px-1 -mx-1 rounded transition-colors"
                      title="Click to edit"
                      @click="openEditCategoryModal(category)"
                    >
                      {{ category.name }}
                    </span>
                    <button
                      class="h-3.5 w-3.5 cursor-pointer hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-xs px-1 py-0.5 bg-primary/20 rounded text-primary"
                      @click="openUnhideCategoryModal(category)"
                      title="Unhide category"
                    >
                      ↑
                    </button>
                  </div>
                  <div class="text-right text-sm text-muted-foreground">{{ formatCurrency(category.assigned) }}</div>
                  <div class="text-right text-sm text-muted-foreground">{{ formatCurrency(category.activity) }}</div>
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
import { computed } from 'vue'
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, Edit, GripVertical } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import Badge from '@/components/shadcn-ui/Badge.vue'
import { useBudgetStore } from '@/stores/budget.store'
import type { CategoryGroupResponse } from '@/types/DTO/category-group.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import CategoryGroupModal from './CategoryGroupModal.vue'
import CategoryModal from './CategoryModal.vue'
import MoveMoneyModal from './MoveMoneyModal.vue'
import PullMoneyModal from './PullMoneyModal.vue'
import UnhideCategoryModal from './UnhideCategoryModal.vue'
import CalculationInput from './CalculationInput.vue'
import draggable from 'vuedraggable'

// Import new composables
import { useCategoryListState } from '@/composables/categories/category-ui/useCategoryListState'
import { useCategoryDragAndDrop } from '@/composables/categories/category-ui/useCategoryDragAndDrop'
import { useCategoryModals } from '@/composables/categories/category-ui/useCategoryModals'
import { useMoneyMovement } from '@/composables/categories/category-ui/useMoneyMovement'
import { useCategoryAnimations } from '@/composables/categories/category-ui/useCategoryAnimations'

// Props
const props = defineProps<{
  activeFilter?: string
}>()

const budgetStore = useBudgetStore()

// Use composables
const {
  expandedGroups,
  categoryLists,
  categoryGroupsList,
  sortedCategoryGroups,
  hiddenCategoriesGroup,
  hasHiddenCategories,
  getCategoriesForGroup,
  getGroupTotals,
  initializeCategoryLists,
  toggleGroup
} = useCategoryListState(computed(() => props.activeFilter))

const {
  onGroupChange,
  onChange,
  isCreditCardPaymentCategory
} = useCategoryDragAndDrop(
  categoryGroupsList,
  categoryLists,
  sortedCategoryGroups,
  getCategoriesForGroup
)

const budgetId = computed(() => budgetStore.currentBudget?.id)

const {
  showCategoryGroupModal,
  showCategoryModal,
  showUnhideCategoryModal,
  selectedCategoryGroup,
  selectedCategory,
  selectedCategoryToUnhide,
  modalMode,
  selectedGroupId,
  openCreateCategoryGroupModal,
  openEditCategoryGroupModal,
  openCreateCategoryModal,
  openEditCategoryModal,
  openUnhideCategoryModal,
  handleCategoryGroupCreated,
  handleCategoryGroupUpdated,
  handleCategoryGroupDeleted,
  handleCategoryCreated,
  handleCategoryUpdated,
  handleCategoryHidden,
  handleCategoryUnhidden
} = useCategoryModals(expandedGroups, budgetId, initializeCategoryLists)

const {
  showMoveMoneyModal,
  showPullMoneyModal,
  selectedSourceCategory,
  selectedDestinationCategory,
  moveMoneyModalPosition,
  pullMoneyModalPosition,
  availableDestinationCategories,
  availableSourceCategories,
  handleAvailableClick,
  handleMoveMoney,
  handleMoveToReadyToAssign,
  handlePullMoney,
  handlePullFromReadyToAssign,
  updateCategoryAssigned
} = useMoneyMovement()

const { flashCategoriesWithMoney, getBadgeVariant } = useCategoryAnimations()

// Expose the flash method to parent components
defineExpose({
  flashCategoriesWithMoney
})

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
