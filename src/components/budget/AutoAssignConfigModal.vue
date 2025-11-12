<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-border">
        <h2 class="text-xl font-semibold">
          {{ isEditMode ? 'Edit Configuration' : 'Create Configuration' }}
        </h2>
        <Button variant="ghost" size="icon" @click="close">
          <X class="h-4 w-4" />
        </Button>
      </div>

      <!-- Content -->
      <div class="flex-1 overflow-auto p-6">
        <!-- Configuration Name -->
        <div class="mb-6">
          <label class="block text-sm font-medium mb-2">Configuration Name</label>
          <input
            v-model="configName"
            type="text"
            placeholder="e.g., Monthly Bills"
            class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            :class="{ 'border-destructive': nameError }"
          />
          <p v-if="nameError" class="text-sm text-destructive mt-1">{{ nameError }}</p>
        </div>

        <!-- Add Category Section (Inline) -->
        <div class="mb-6">
          <label class="block text-sm font-medium mb-3">Add Categories</label>

          <div class="relative">
            <!-- Category Search Input -->
            <div class="relative">
              <input
                ref="categorySearchInput"
                v-model="categorySearchQuery"
                type="text"
                placeholder="Search and select a category..."
                class="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                @focus="showCategoryDropdown = true"
                @blur="handleCategoryBlur"
                @keydown.down.prevent="navigateDropdown(1)"
                @keydown.up.prevent="navigateDropdown(-1)"
                @keydown.enter.prevent="selectHighlightedCategory"
                @keydown.escape="showCategoryDropdown = false"
              />
            </div>

            <!-- Category Dropdown -->
            <div
              v-if="showCategoryDropdown && filteredAvailableCategories.length > 0"
              class="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
            >
              <div
                v-for="(category, index) in filteredAvailableCategories"
                :key="category.id"
                @mousedown.prevent="selectCategory(category)"
                @mouseenter="highlightedIndex = index"
                class="p-3 cursor-pointer transition-colors"
                :class="{
                  'bg-muted': highlightedIndex === index,
                  'hover:bg-muted/50': highlightedIndex !== index
                }"
              >
                <p class="font-medium text-sm">{{ category.name }}</p>
                <p class="text-xs text-muted-foreground">{{ getCategoryGroupName(category.id) }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Selected Categories List -->
        <div class="mb-6">
          <label class="block text-sm font-medium mb-3">Selected Categories</label>

          <div v-if="selectedCategories.length === 0" class="text-center py-8 border border-dashed border-border rounded-lg text-muted-foreground">
            <p class="text-sm">No categories added yet</p>
            <p class="text-xs mt-1">Search and select categories above to get started</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="(item, index) in selectedCategories"
              :key="item.category_id"
              class="flex items-center gap-3 p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
            >
              <div class="flex-1 min-w-0">
                <p class="font-medium text-sm truncate">{{ getCategoryName(item.category_id) }}</p>
                <p class="text-xs text-muted-foreground truncate">{{ getCategoryGroupName(item.category_id) }}</p>
              </div>

              <div class="flex items-center gap-2 flex-shrink-0">
                <div class="flex items-center">
                  <span class="text-sm text-muted-foreground mr-1">$</span>
                  <input
                    v-model.number="item.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    class="w-24 px-2 py-1.5 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary text-right"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  @click="removeCategory(index)"
                  class="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Total Amount -->
          <div v-if="selectedCategories.length > 0" class="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div class="flex justify-between items-center">
              <span class="font-medium text-sm">Total Amount:</span>
              <span class="font-semibold text-lg">{{ formatCurrency(totalAmount) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end space-x-3 p-6 border-t border-border">
        <Button variant="outline" @click="close">Cancel</Button>
        <Button @click="save" :disabled="!canSave">
          {{ isEditMode ? 'Update' : 'Create' }}
        </Button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import Button from '@/components/shadcn-ui/button.vue'
import { X, Trash2 } from 'lucide-vue-next'
import { useCategoryStore } from '@/stores/category.store'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import { useFetchAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-read/useFetchAutoAssignConfiguration'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AutoAssignConfigurationSummary, AutoAssignConfigurationItem } from '@/services/auto-assign.service'
import type { CategoryResponse } from '@/types/DTO/category.dto'

interface Props {
  isOpen: boolean
  configuration?: AutoAssignConfigurationSummary | null
  isEditMode: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'save', data: { name: string; items: AutoAssignConfigurationItem[] }): void
}>()

const categoryStore = useCategoryStore()
const autoAssignStore = useAutoAssignStore()
const { fetchConfiguration } = useFetchAutoAssignConfiguration()

const configName = ref('')
const selectedCategories = ref<AutoAssignConfigurationItem[]>([])
const nameError = ref('')
const categorySearchQuery = ref('')
const showCategoryDropdown = ref(false)
const highlightedIndex = ref(0)
const categorySearchInput = ref<HTMLInputElement | null>(null)

const totalAmount = computed(() => {
  return selectedCategories.value.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const canSave = computed(() => {
  return configName.value.trim() !== '' &&
         selectedCategories.value.length > 0 &&
         selectedCategories.value.every(item => item.amount > 0) &&
         !nameError.value
})

const availableCategories = computed(() => {
  // Get the Hidden Categories group
  const hiddenGroup = categoryStore.categoryGroups.find(group =>
    group.name === 'Hidden Categories' && group.is_system_group
  )

  return categoryStore.categories.filter(category =>
    !selectedCategories.value.some(selected => selected.category_id === category.id) &&
    (!hiddenGroup || category.category_group_id !== hiddenGroup.id) // Exclude hidden categories
  )
})

const filteredAvailableCategories = computed(() => {
  const query = categorySearchQuery.value.toLowerCase().trim()

  if (!query) {
    // Show all available categories when no search query
    return availableCategories.value.slice(0, 50) // Limit to 50 for performance
  }

  return availableCategories.value.filter(category =>
    category.name.toLowerCase().includes(query) ||
    getCategoryGroupName(category.id).toLowerCase().includes(query)
  )
})

const getCategoryName = (categoryId: string) => {
  const category = categoryStore.categories.find(c => c.id === categoryId)
  return category?.name || 'Unknown Category'
}

const getCategoryGroupName = (categoryId: string) => {
  const category = categoryStore.categories.find(c => c.id === categoryId)
  if (!category) return 'Unknown Group'

  const group = categoryStore.categoryGroups.find(g => g.id === category.category_group_id)
  return group?.name || 'Unknown Group'
}

const selectCategory = (category: CategoryResponse) => {
  selectedCategories.value.push({
    category_id: category.id,
    amount: 0
  })
  categorySearchQuery.value = ''
  showCategoryDropdown.value = false
  highlightedIndex.value = 0

  // Focus back on the search input
  nextTick(() => {
    categorySearchInput.value?.focus()
  })
}

const selectHighlightedCategory = () => {
  if (filteredAvailableCategories.value.length > 0 && highlightedIndex.value >= 0) {
    const category = filteredAvailableCategories.value[highlightedIndex.value]
    if (category) {
      selectCategory(category)
    }
  }
}

const navigateDropdown = (direction: number) => {
  if (!showCategoryDropdown.value) {
    showCategoryDropdown.value = true
    return
  }

  const maxIndex = filteredAvailableCategories.value.length - 1
  highlightedIndex.value = Math.max(0, Math.min(maxIndex, highlightedIndex.value + direction))
}

const handleCategoryBlur = () => {
  // Delay to allow click events to fire
  setTimeout(() => {
    showCategoryDropdown.value = false
    highlightedIndex.value = 0
  }, 200)
}

const removeCategory = (index: number) => {
  selectedCategories.value.splice(index, 1)
}

// Reset highlighted index when search query changes
watch(categorySearchQuery, () => {
  highlightedIndex.value = 0
  if (categorySearchQuery.value.trim()) {
    showCategoryDropdown.value = true
  }
})

const validateName = () => {
  nameError.value = ''

  if (!configName.value.trim()) {
    nameError.value = 'Configuration name is required'
    return false
  }

  // Check for duplicate names (only if not editing the same configuration)
  const existingConfig = autoAssignStore.configurations.find(config =>
    config.name.toLowerCase() === configName.value.toLowerCase() &&
    (!props.isEditMode || config.name !== props.configuration?.name)
  )

  if (existingConfig) {
    nameError.value = 'A configuration with this name already exists'
    return false
  }

  return true
}

const close = () => {
  emit('close')
}

const save = () => {
  if (!validateName()) return

  emit('save', {
    name: configName.value.trim(),
    items: selectedCategories.value.filter(item => item.amount > 0)
  })
}

// Load configuration data when editing
const loadConfigurationData = async () => {
  if (props.isEditMode && props.configuration) {
    configName.value = props.configuration.name

    // Load full configuration details
    const fullConfig = await fetchConfiguration(
      props.configuration.budget_id,
      props.configuration.name
    )

    if (fullConfig) {
      selectedCategories.value = fullConfig.items.map(item => ({
        category_id: item.category_id,
        amount: item.amount
      }))
    }
  }
}

// Watch for configuration changes
watch(() => props.configuration, loadConfigurationData, { immediate: true })

// Watch name changes for validation
watch(configName, validateName)

onMounted(() => {
  if (props.isEditMode) {
    loadConfigurationData()
  }
})
</script>
