<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-[60] bg-black/50 transition-opacity"
      :class="isClosing ? 'opacity-0' : 'opacity-100'"
      @click="handleClose"
    >
      <!-- Full screen modal for mobile -->
      <div
        class="absolute inset-0 bg-background transition-transform duration-300 flex flex-col"
        :class="isClosing ? 'translate-y-full' : 'translate-y-0'"
        @click.stop
        style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: max(1rem, calc(1rem + env(safe-area-inset-bottom)));"
      >
        <!-- Header -->
        <div class="px-4 py-4 border-b border-border flex-shrink-0">
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">{{ isEditMode ? 'Edit Configuration' : 'New Configuration' }}</h3>
              <p class="text-xs text-muted-foreground mt-0.5">Auto-assign categories</p>
            </div>
            <button @click="handleClose" class="p-2 hover:bg-accent rounded-md">
              <XIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <!-- Configuration Name -->
          <div>
            <label class="block text-sm font-medium mb-2">Name</label>
            <input
              v-model="configName"
              type="text"
              placeholder="e.g., Monthly Bills"
              class="w-full px-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-base"
              :class="{ 'border-destructive': nameError }"
            />
            <p v-if="nameError" class="text-sm text-destructive mt-1">{{ nameError }}</p>
          </div>

          <!-- Add Category Section -->
          <div>
            <label class="block text-sm font-medium mb-2">Add Categories</label>
            <div class="relative">
              <input
                ref="categorySearchInput"
                v-model="categorySearchQuery"
                type="text"
                placeholder="Search categories..."
                class="w-full px-3 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-base"
                @focus="showCategoryDropdown = true"
                @blur="handleCategoryBlur"
              />

              <!-- Category Dropdown -->
              <div
                v-if="showCategoryDropdown && filteredAvailableCategories.length > 0"
                class="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-auto"
              >
                <button
                  v-for="category in filteredAvailableCategories"
                  :key="category.id"
                  @mousedown.prevent="selectCategory(category)"
                  class="w-full p-3 text-left hover:bg-accent transition-colors border-b border-border last:border-b-0"
                >
                  <p class="font-medium text-sm">{{ category.name }}</p>
                  <p class="text-xs text-muted-foreground">{{ getCategoryGroupName(category.id) }}</p>
                </button>
              </div>
            </div>
          </div>

          <!-- Selected Categories List -->
          <div>
            <label class="block text-sm font-medium mb-2">Selected Categories</label>

            <div v-if="visibleSelectedCategories.length === 0" class="text-center py-8 border border-dashed border-border rounded-lg text-muted-foreground">
              <p class="text-sm">No categories added yet</p>
              <p class="text-xs mt-1">Search and select categories above</p>
            </div>

            <div v-else class="space-y-2">
              <div
                v-for="item in visibleSelectedCategories"
                :key="item.category_id"
                class="flex items-center gap-3 p-3 border border-border rounded-lg bg-card"
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
                      class="w-24 px-2 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-right bg-background"
                    />
                  </div>

                  <button
                    @click="removeCategoryByItem(item)"
                    class="p-2 text-muted-foreground hover:text-destructive rounded-md hover:bg-accent"
                  >
                    <TrashIcon class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Total Amount -->
            <div v-if="visibleSelectedCategories.length > 0" class="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="font-medium text-sm">Total Amount:</span>
                <span class="font-semibold text-lg">{{ formatCurrency(totalAmount) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex items-center gap-3 p-4 border-t border-border flex-shrink-0">
          <button
            @click="handleClose"
            class="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            @click="save"
            :disabled="!canSave"
            class="flex-1 px-4 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isEditMode ? 'Update' : 'Create' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { XIcon, TrashIcon } from 'lucide-vue-next'
import { useCategoryStore } from '@/stores/category.store'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
import { useFetchAutoAssignConfiguration } from '@/composables/auto-assign/auto-assign-read/useFetchAutoAssignConfiguration'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AutoAssignConfigurationSummary, AutoAssignConfigurationItem } from '@/services/auto-assign.service'
import type { CategoryResponse } from '@/types/DTO/category.dto'

const props = defineProps<{
  show: boolean
  configuration?: AutoAssignConfigurationSummary | null
  isEditMode: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: { name: string; items: AutoAssignConfigurationItem[] }]
}>()

const categoryStore = useCategoryStore()
const autoAssignStore = useAutoAssignStore()
const { fetchConfiguration } = useFetchAutoAssignConfiguration()

const isClosing = ref(false)
const configName = ref('')
const selectedCategories = ref<AutoAssignConfigurationItem[]>([])
const nameError = ref('')
const categorySearchQuery = ref('')
const showCategoryDropdown = ref(false)
const categorySearchInput = ref<HTMLInputElement | null>(null)

// Get all categories excluding hidden ones and CC Payment categories
const availableCategories = computed(() => {
  return categoryStore.categories.filter(cat =>
    !cat.is_hidden && !cat.name.endsWith('CC Payment')
  )
})

// Filter categories based on search query and exclude already selected
const filteredAvailableCategories = computed(() => {
  const query = categorySearchQuery.value.toLowerCase().trim()
  const selectedIds = new Set(selectedCategories.value.map(item => item.category_id))

  return availableCategories.value
    .filter(cat => !selectedIds.has(cat.id))
    .filter(cat => {
      if (!query) return true
      return cat.name.toLowerCase().includes(query) ||
             getCategoryGroupName(cat.id).toLowerCase().includes(query)
    })
    .slice(0, 50) // Limit results for performance
})

// Filter out hidden categories from selected list
const visibleSelectedCategories = computed(() => {
  return selectedCategories.value.filter(item => {
    const category = categoryStore.categories.find(c => c.id === item.category_id)
    return category && !category.is_hidden
  })
})

const totalAmount = computed(() => {
  return visibleSelectedCategories.value.reduce((sum, item) => sum + (item.amount || 0), 0)
})

const canSave = computed(() => {
  return configName.value.trim().length > 0 &&
         visibleSelectedCategories.value.length > 0 &&
         visibleSelectedCategories.value.some(item => item.amount > 0)
})

// Helper functions
const getCategoryName = (categoryId: string): string => {
  const category = categoryStore.categories.find(c => c.id === categoryId)
  return category?.name || 'Unknown'
}

const getCategoryGroupName = (categoryId: string): string => {
  const category = categoryStore.categories.find(c => c.id === categoryId)
  if (!category) return 'Unknown'
  const group = categoryStore.categoryGroups.find(g => g.id === category.category_group_id)
  return group?.name || 'Unknown'
}

const selectCategory = (category: CategoryResponse) => {
  selectedCategories.value.unshift({
    category_id: category.id,
    amount: 0
  })
  categorySearchQuery.value = ''
  showCategoryDropdown.value = false

  // Focus on the amount input of the newly added category
  nextTick(() => {
    const firstAmountInput = document.querySelector<HTMLInputElement>('.space-y-2 input[type="number"]')
    firstAmountInput?.focus()
  })
}

const removeCategoryByItem = (item: AutoAssignConfigurationItem) => {
  const index = selectedCategories.value.findIndex(i => i.category_id === item.category_id)
  if (index !== -1) {
    selectedCategories.value.splice(index, 1)
  }
}

const handleCategoryBlur = () => {
  setTimeout(() => {
    showCategoryDropdown.value = false
  }, 200)
}

const validateName = (): boolean => {
  const trimmedName = configName.value.trim()

  if (!trimmedName) {
    nameError.value = 'Name is required'
    return false
  }

  // Check for duplicate names (excluding current config if editing)
  const existingConfig = autoAssignStore.configurations.find(c => c.name === trimmedName)
  if (existingConfig && (!props.isEditMode || existingConfig.name !== props.configuration?.name)) {
    nameError.value = 'A configuration with this name already exists'
    return false
  }

  nameError.value = ''
  return true
}

const save = () => {
  if (!validateName()) return

  const itemsToSave = visibleSelectedCategories.value.filter(item => item.amount > 0)

  emit('save', {
    name: configName.value.trim(),
    items: itemsToSave
  })

  handleClose()
}

const handleClose = () => {
  isClosing.value = true
  setTimeout(() => {
    emit('close')
    // Reset after animation
    setTimeout(() => {
      isClosing.value = false
      configName.value = ''
      selectedCategories.value = []
      nameError.value = ''
      categorySearchQuery.value = ''
    }, 100)
  }, 300)
}

// Load configuration data when editing
const loadConfigurationData = async () => {
  if (props.isEditMode && props.configuration) {
    configName.value = props.configuration.name

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
  } else {
    // Reset for create mode
    configName.value = ''
    selectedCategories.value = []
    nameError.value = ''
    categorySearchQuery.value = ''
  }
}

// Watch for configuration changes
watch(() => props.show, (newValue) => {
  if (newValue) {
    loadConfigurationData()
  }
})

// Watch name changes for validation
watch(configName, validateName)
</script>

