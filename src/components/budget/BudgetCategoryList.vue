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

      <!-- Category Groups -->
      <div v-for="group in sortedCategoryGroups" :key="group.id" class="border-b last:border-b-0">
        <!-- Group Header -->
        <div
          class="group grid grid-cols-[2fr_150px_150px_150px] gap-10 font-semibold px-2 py-1.5 cursor-pointer hover:bg-muted/50"
          @click="toggleGroup(group.id)"
        >
          <div class="flex items-center truncate">
            <ChevronDownIcon v-if="expandedGroups.has(group.id)" class="h-4 w-4 mr-1 flex-shrink-0" />
            <ChevronRightIcon v-else class="h-4 w-4 mr-1 flex-shrink-0" />
            <span class="flex items-center gap-1 truncate">
              {{ group.name }}
              <PlusIcon
                class="h-4 w-4 cursor-pointer hover:text-primary bg-primary/20 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                @click.stop="openCreateCategoryModal(group.id)"
              />
              <Edit
                class="h-4 w-4 cursor-pointer hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                @click.stop="openEditCategoryGroupModal(group)"
              />
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
          <div
            v-for="category in getCategoriesForGroup(group.id)"
            :key="category.id"
            class="group grid grid-cols-[2fr_150px_150px_150px] gap-10 text-sm pl-8 pr-2 py-1.5 hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0"
          >
            <div class="flex items-center truncate">
              <span class="truncate">{{ category.name }}</span>
              <Edit
                class="h-3.5 w-3.5 cursor-pointer hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-1"
                @click="openEditCategoryModal(category)"
              />
            </div>
            <div
              class="text-right text-xs text-muted-foreground cursor-pointer hover:text-primary"
              @click="openAssignModal(category)"
            >
              {{ formatCurrency(category.assigned) }}
            </div>
            <div class="text-right text-xs text-muted-foreground">{{ formatCurrency(category.activity) }}</div>
            <div class="text-right">
              <Badge :variant="getBadgeVariant(category.available)" class="cursor-pointer">
                {{ formatCurrency(category.available) }}
              </Badge>
            </div>
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
    @deleted="handleCategoryDeleted"
  />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ChevronRightIcon, ChevronDownIcon, PlusIcon, Edit } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import Badge from '@/components/shadcn-ui/Badge.vue'
import { useCategoryStore } from '@/stores/category.store'
import { useBudgetStore } from '@/stores/budget.store'
import type { CategoryGroupResponse } from '@/types/DTO/category-group.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'
import CategoryGroupModal from './CategoryGroupModal.vue'
import CategoryModal from './CategoryModal.vue'

const categoryStore = useCategoryStore()
const budgetStore = useBudgetStore()

const expandedGroups = ref<Set<string>>(new Set())

// Computed property to get sorted category groups
const sortedCategoryGroups = computed(() => {
  return categoryStore.sortedCategoryGroups
})

// Get categories for a specific group
const getCategoriesForGroup = (groupId: string) => {
  return categoryStore.getCategoriesByGroupId(groupId)
}

// Get totals for a specific group
const getGroupTotals = (groupId: string) => {
  return categoryStore.getGroupTotals(groupId)
}

// Add all group IDs to expandedGroups initially
onMounted(() => {
  sortedCategoryGroups.value.forEach(group => expandedGroups.value.add(group.id))
})

const toggleGroup = (groupId: string) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

const getBadgeVariant = (amount: number): 'positive' | 'negative' | 'neutral' => {
  if (amount < 0) return 'negative'
  if (amount === 0) return 'neutral'
  return 'positive'
}



// Modal states
const showCategoryGroupModal = ref(false)
const showCategoryModal = ref(false)
const showAssignModal = ref(false)
const selectedCategoryGroup = ref<CategoryGroupResponse | null>(null)
const selectedCategory = ref<CategoryResponse | null>(null)
const modalMode = ref<'create' | 'edit'>('create')
const selectedGroupId = ref<string>('')

// Open modals
const openCreateCategoryGroupModal = () => {
  modalMode.value = 'create'
  selectedCategoryGroup.value = null
  showCategoryGroupModal.value = true
}

const openEditCategoryGroupModal = (group: CategoryGroupResponse) => {
  modalMode.value = 'edit'
  selectedCategoryGroup.value = group
  showCategoryGroupModal.value = true
}

const openCreateCategoryModal = (groupId: string) => {
  modalMode.value = 'create'
  selectedCategory.value = null
  selectedGroupId.value = groupId
  showCategoryModal.value = true
}

const openEditCategoryModal = (category: CategoryResponse) => {
  modalMode.value = 'edit'
  selectedCategory.value = category
  selectedGroupId.value = category.category_group_id
  showCategoryModal.value = true
}

const openAssignModal = (category: CategoryResponse) => {
  selectedCategory.value = category
  modalMode.value = 'edit'
  selectedGroupId.value = category.category_group_id
  showCategoryModal.value = true
}

// Handle modal events
const handleCategoryGroupCreated = (categoryGroup: CategoryGroupResponse) => {
  // Add the new group to expandedGroups
  expandedGroups.value.add(categoryGroup.id)
  showCategoryGroupModal.value = false
}

const handleCategoryGroupUpdated = (categoryGroup: CategoryGroupResponse) => {
  showCategoryGroupModal.value = false
}

const handleCategoryGroupDeleted = (categoryGroupId: string) => {
  // Remove the deleted group from expandedGroups
  expandedGroups.value.delete(categoryGroupId)
  showCategoryGroupModal.value = false
}

const handleCategoryCreated = (category: CategoryResponse) => {
  // Ensure the category group is expanded
  expandedGroups.value.add(category.category_group_id)
  showCategoryModal.value = false
}

const handleCategoryUpdated = (category: CategoryResponse) => {
  showCategoryModal.value = false
}

const handleCategoryDeleted = (categoryId: string) => {
  showCategoryModal.value = false
}

</script>

<style scoped>
/* Component-specific styles */
</style>
