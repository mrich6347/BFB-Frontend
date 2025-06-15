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

        <!-- Categories Section -->
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <label class="block text-sm font-medium">Categories</label>
            <Button @click="showAddCategoryModal = true" variant="outline" size="sm">
              <Plus class="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <!-- Selected Categories List -->
          <div v-if="selectedCategories.length === 0" class="text-center py-8 text-muted-foreground">
            <p>No categories selected yet.</p>
            <p class="text-sm">Click "Add Category" to get started.</p>
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="(item, index) in selectedCategories"
              :key="item.category_id"
              class="flex items-center justify-between p-3 border border-border rounded-lg"
            >
              <div class="flex-1">
                <p class="font-medium text-sm">{{ getCategoryName(item.category_id) }}</p>
                <p class="text-xs text-muted-foreground">{{ getCategoryGroupName(item.category_id) }}</p>
              </div>

              <div class="flex items-center space-x-2">
                <div class="flex items-center">
                  <span class="text-sm mr-2">$</span>
                  <input
                    v-model.number="item.amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    class="w-24 px-2 py-1 text-sm border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  @click="removeCategory(index)"
                  class="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 class="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>

          <!-- Total Amount -->
          <div v-if="selectedCategories.length > 0" class="mt-4 p-3 bg-muted rounded-lg">
            <div class="flex justify-between items-center">
              <span class="font-medium">Total Amount:</span>
              <span class="font-semibold">{{ formatCurrency(totalAmount) }}</span>
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

    <!-- Add Category Modal -->
    <div v-if="showAddCategoryModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-60">
      <div class="bg-background border border-border rounded-lg shadow-lg w-full max-w-md max-h-[60vh] flex flex-col">
        <div class="flex items-center justify-between p-4 border-b border-border">
          <h3 class="text-lg font-semibold">Add Category</h3>
          <Button variant="ghost" size="icon" @click="showAddCategoryModal = false">
            <X class="h-4 w-4" />
          </Button>
        </div>

        <div class="flex-1 overflow-auto p-4">
          <input
            v-model="categorySearchQuery"
            type="text"
            placeholder="Search categories..."
            class="w-full px-3 py-2 border border-border rounded-md mb-4 focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div class="space-y-2">
            <div
              v-for="category in filteredAvailableCategories"
              :key="category.id"
              @click="addCategory(category)"
              class="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <p class="font-medium text-sm">{{ category.name }}</p>
              <p class="text-xs text-muted-foreground">{{ getCategoryGroupName(category.id) }}</p>
            </div>
          </div>

          <div v-if="filteredAvailableCategories.length === 0" class="text-center py-8 text-muted-foreground">
            <p>No available categories found.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import Button from '@/components/shadcn-ui/button.vue'
import { X, Plus, Trash2 } from 'lucide-vue-next'
import { useCategoryStore } from '@/stores/category.store'
import { useAutoAssignStore } from '@/stores/auto-assign.store'
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

const configName = ref('')
const selectedCategories = ref<AutoAssignConfigurationItem[]>([])
const nameError = ref('')
const showAddCategoryModal = ref(false)
const categorySearchQuery = ref('')

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
  if (!categorySearchQuery.value.trim()) {
    return availableCategories.value
  }

  const query = categorySearchQuery.value.toLowerCase()
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

const addCategory = (category: CategoryResponse) => {
  selectedCategories.value.push({
    category_id: category.id,
    amount: 0
  })
  showAddCategoryModal.value = false
  categorySearchQuery.value = ''
}

const removeCategory = (index: number) => {
  selectedCategories.value.splice(index, 1)
}

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
    const fullConfig = await autoAssignStore.loadConfiguration(
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
