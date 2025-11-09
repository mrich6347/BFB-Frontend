<template>
  <Teleport to="body">
    <div
      v-if="show"
      class="fixed inset-0 z-50 bg-black/50 transition-opacity"
      :class="isClosing ? 'opacity-0' : 'opacity-100'"
      @click="handleClose"
    >
      <!-- Main Modal that slides up from bottom -->
      <div
        v-if="!showCoverOverspending && !showMoveMoney"
        class="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl shadow-lg transition-transform duration-300"
        :class="isClosing ? 'translate-y-full' : 'translate-y-0'"
        @click.stop
        style="padding-bottom: max(2rem, calc(2rem + env(safe-area-inset-bottom)));"
      >
        <!-- Header -->
        <div class="px-4 py-4 border-b border-border">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold">{{ category?.name }}</h3>
            <button @click="handleClose" class="p-2 hover:bg-accent rounded-md">
              <XIcon class="h-5 w-5" />
            </button>
          </div>
        </div>

        <!-- Content -->
        <div class="p-4 space-y-4">
          <!-- Currently Available -->
          <div class="text-center">
            <div class="text-sm text-muted-foreground mb-1">Currently Available</div>
            <div class="text-3xl font-bold" :class="getAvailableColorClass(category?.available || 0)">
              {{ formatCurrency(category?.available || 0) }}
            </div>
          </div>

          <!-- Cover Overspending Button (only show if negative) -->
          <button
            v-if="isOverspent"
            @click="openCoverOverspending"
            class="w-full py-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 border-2 border-amber-500/50 rounded-lg font-semibold hover:bg-amber-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <ShieldCheckIcon class="h-5 w-5" />
            Cover Overspending
          </button>

          <!-- Move Money Button (only show if NOT overspent and has positive balance) -->
          <button
            v-if="!isOverspent && (category?.available || 0) > 0"
            @click="openMoveMoney"
            class="w-full py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-2 border-blue-500/50 rounded-lg font-semibold hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRightLeftIcon class="h-5 w-5" />
            Move Money
          </button>

          <!-- Add/Subtract Toggle (only show if NOT overspent) -->
          <template v-if="!isOverspent">
            <div class="grid grid-cols-2 gap-3">
              <button
                @click="mode = 'add'"
                :class="[
                  'py-4 rounded-lg font-semibold text-2xl transition-all border-2',
                  'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20',
                  mode === 'add'
                    ? 'border-emerald-600 dark:border-emerald-400'
                    : 'border-transparent'
                ]"
              >
                +
              </button>
              <button
                @click="mode = 'subtract'"
                :class="[
                  'py-4 rounded-lg font-semibold text-2xl transition-all border-2',
                  'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20',
                  mode === 'subtract'
                    ? 'border-red-600 dark:border-red-400'
                    : 'border-transparent'
                ]"
              >
                −
              </button>
            </div>

            <!-- Amount Input -->
            <div class="space-y-2">
              <label class="text-sm font-medium">
                {{ mode === 'add' ? 'Amount to Add' : 'Amount to Subtract' }}
              </label>
              <input
                v-model="amount"
                type="number"
                inputmode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                class="w-full px-4 py-3 border border-input rounded-md bg-background text-lg"
              />
            </div>

            <!-- Save Button -->
            <button
              @click="handleSave"
              :disabled="!amount || amount <= 0 || isLoading"
              class="w-full py-3 bg-primary text-primary-foreground rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="isLoading" class="inline-block animate-spin">⏳</span>
              <span v-else>Save Changes</span>
            </button>
          </template>
        </div>
      </div>

      <!-- Cover Overspending Screen -->
      <div
        v-else-if="showCoverOverspending"
        class="fixed inset-0 bg-background z-[60]"
        @click.stop
      >
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
            <button @click="closeCoverOverspending" class="p-2">
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <h2 class="text-lg font-semibold">Cover Overspending</h2>
            <button @click="handleClose" class="p-2">
              <XIcon class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-auto p-4 space-y-4" style="padding-bottom: max(2rem, calc(2rem + env(safe-area-inset-bottom)));">
            <!-- Info Card -->
            <div class="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <div class="flex items-start gap-3">
                <ShieldCheckIcon class="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div class="space-y-1">
                  <div class="font-semibold text-amber-900 dark:text-amber-100">{{ category?.name }}</div>
                  <div class="text-sm text-amber-800 dark:text-amber-200">
                    Overspent by {{ formatCurrency(Math.abs(category?.available || 0)) }}
                  </div>
                  <div class="text-xs text-amber-700 dark:text-amber-300 mt-2">
                    Select a category below to pull money from and cover this overspending.
                  </div>
                </div>
              </div>
            </div>

            <!-- Ready to Assign Option -->
            <div
              v-if="readyToAssign > 0"
              class="space-y-2"
            >
              <h3 class="text-sm font-medium text-muted-foreground px-2">Available Funds</h3>
              <button
                @click="selectCoverSource('ready-to-assign')"
                class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">Ready to Assign</div>
                    <div class="text-sm text-muted-foreground">
                      Will cover: {{ formatCurrency(calculateCoverAmount(readyToAssign)) }}
                    </div>
                  </div>
                  <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {{ formatCurrency(readyToAssign) }}
                  </div>
                </div>
              </button>
            </div>

            <!-- Categories with Positive Balance -->
            <div
              v-for="group in categoriesWithPositiveBalance"
              :key="group.id"
              class="space-y-2"
            >
              <h3 class="text-sm font-medium text-muted-foreground px-2">{{ group.name }}</h3>
              <button
                v-for="cat in group.categories"
                :key="cat.id"
                @click="selectCoverSource(cat.id)"
                class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{{ cat.name }}</div>
                    <div class="text-sm text-muted-foreground">
                      Will cover: {{ formatCurrency(calculateCoverAmount(cat.available)) }}
                    </div>
                  </div>
                  <div class="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                    {{ formatCurrency(cat.available) }}
                  </div>
                </div>
              </button>
            </div>

            <!-- No Available Categories -->
            <div v-if="categoriesWithPositiveBalance.length === 0 && readyToAssign <= 0" class="text-center py-8 text-muted-foreground">
              <ShieldCheckIcon class="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No categories with available funds to cover overspending.</p>
              <p class="text-sm mt-2">Add money to a category or Ready to Assign first.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Move Money - Select Destination Screen -->
      <div
        v-else-if="showMoveMoney && !selectedMoveDestination"
        class="fixed inset-0 bg-background z-[60]"
        @click.stop
      >
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
            <button @click="closeMoveMoney" class="p-2">
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <h2 class="text-lg font-semibold">Move Money</h2>
            <button @click="handleClose" class="p-2">
              <XIcon class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-auto p-4 space-y-4" style="padding-bottom: max(2rem, calc(2rem + env(safe-area-inset-bottom)));">
            <!-- Simple instruction -->
            <p class="text-sm text-blue-600 dark:text-blue-400 text-center">Select a destination category</p>

            <!-- Ready to Assign Option -->
            <div class="space-y-2">
              <h3 class="text-sm font-medium text-muted-foreground px-2">Available Funds</h3>
              <button
                @click="selectDestinationCategory('ready-to-assign')"
                class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">Ready to Assign</div>
                    <div class="text-sm text-muted-foreground">
                      Current: <span :class="readyToAssign > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''">{{ formatCurrency(readyToAssign) }}</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <!-- All Categories (excluding current) -->
            <div
              v-for="group in allCategoryGroups"
              :key="group.id"
              class="space-y-2"
            >
              <h3 class="text-sm font-medium text-muted-foreground px-2">{{ group.name }}</h3>
              <button
                v-for="cat in group.categories"
                :key="cat.id"
                @click="selectDestinationCategory(cat.id)"
                class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
              >
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-medium">{{ cat.name }}</div>
                    <div class="text-sm text-muted-foreground">
                      Available: <span :class="(cat.available || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''">{{ formatCurrency(cat.available) }}</span>
                    </div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Move Money - Enter Amount Screen -->
      <div
        v-else-if="showMoveMoney && selectedMoveDestination"
        class="fixed inset-0 bg-background z-[60]"
        @click.stop
      >
        <div class="h-full flex flex-col">
          <!-- Header -->
          <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
            <button @click="selectedMoveDestination = null; moveAmount = null" class="p-2">
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <h2 class="text-lg font-semibold">Move Money</h2>
            <button @click="handleClose" class="p-2">
              <XIcon class="h-5 w-5" />
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 overflow-auto p-4 space-y-6" style="padding-bottom: max(6rem, calc(6rem + env(safe-area-inset-bottom)));">
            <!-- Visual Flow -->
            <div class="space-y-4">
              <!-- Source Category -->
              <div class="p-4 bg-card rounded-lg border border-border">
                <div class="text-xs text-muted-foreground mb-1">From</div>
                <div class="font-semibold">{{ category?.name }}</div>
                <div class="text-sm text-muted-foreground mt-1">
                  Available: <span :class="(category?.available || 0) > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''">{{ formatCurrency(category?.available || 0) }}</span>
                </div>
              </div>

              <!-- Arrow -->
              <div class="flex justify-center">
                <svg class="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>

              <!-- Destination Category -->
              <div class="p-4 bg-card rounded-lg border border-border">
                <div class="text-xs text-muted-foreground mb-1">To</div>
                <div class="font-semibold">{{ getDestinationCategoryName() }}</div>
                <div class="text-sm text-muted-foreground mt-1">
                  Available: <span :class="getDestinationCategoryAvailable() > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''">{{ formatCurrency(getDestinationCategoryAvailable()) }}</span>
                </div>
              </div>
            </div>

            <!-- Amount Input -->
            <div class="space-y-2">
              <label class="text-sm font-medium">Amount to Move</label>
              <input
                v-model="moveAmount"
                type="number"
                inputmode="decimal"
                step="0.01"
                min="0"
                :max="category?.available || 0"
                placeholder="0.00"
                class="w-full px-4 py-3 border border-input rounded-md bg-background text-lg"
                autofocus
              />
              <div class="text-xs text-muted-foreground">
                Maximum: {{ formatCurrency(category?.available || 0) }}
              </div>
            </div>

            <!-- Save Button -->
            <button
              @click="confirmMoveMoney"
              :disabled="!moveAmount || moveAmount <= 0 || moveAmount > (category?.available || 0)"
              class="w-full py-3 bg-primary text-primary-foreground rounded-md font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Move Money
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { XIcon, ShieldCheckIcon, ChevronLeftIcon, ArrowRightLeftIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import type { CategoryResponse } from '@/types/DTO/category.dto'

const props = defineProps<{
  show: boolean
  category: CategoryResponse | null
}>()

const emit = defineEmits<{
  close: []
  save: [categoryId: string, newAssigned: number]
  coverOverspending: [sourceCategoryId: string, amount: number]
  moveMoney: [destinationCategoryId: string, amount: number]
}>()

const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()

const mode = ref<'add' | 'subtract'>('add')
const amount = ref<number | null>(null)
const isLoading = ref(false)
const isClosing = ref(false)
const showCoverOverspending = ref(false)
const showMoveMoney = ref(false)
const moveAmount = ref<number | null>(null)
const selectedMoveDestination = ref<string | null>(null)

// Computed properties
const isOverspent = computed(() => (props.category?.available || 0) < 0)

const readyToAssign = computed(() => budgetStore.readyToAssign)

const categoriesWithPositiveBalance = computed(() => {
  const groups = categoryStore.visibleCategoryGroups
    .filter(group => {
      if (group.name === 'Hidden Categories' && group.is_system_group) {
        return false
      }
      return true
    })
    .map(group => {
      const categories = categoryStore.getCategoriesByGroupWithBalances(group.id)
        .filter(cat =>
          cat.id !== props.category?.id && // Exclude current category
          (cat.available || 0) > 0 // Only positive balances
        )

      return {
        id: group.id,
        name: group.name,
        categories
      }
    })
    .filter(group => group.categories.length > 0) // Only groups with available categories

  return groups
})

const allCategoryGroups = computed(() => {
  const groups = categoryStore.visibleCategoryGroups
    .filter(group => {
      if (group.name === 'Hidden Categories' && group.is_system_group) {
        return false
      }
      return true
    })
    .map(group => {
      const categories = categoryStore.getCategoriesByGroupWithBalances(group.id)
        .filter(cat => cat.id !== props.category?.id) // Exclude current category

      return {
        id: group.id,
        name: group.name,
        categories
      }
    })
    .filter(group => group.categories.length > 0) // Only groups with categories

  return groups
})

const getAvailableColorClass = (available: number) => {
  if (available > 0) {
    return 'text-emerald-600 dark:text-emerald-400 font-semibold'
  } else if (available < 0) {
    return 'text-red-600 dark:text-red-400 font-semibold'
  }
  return 'text-muted-foreground'
}

const calculateCoverAmount = (sourceAvailable: number) => {
  const neededAmount = Math.abs(props.category?.available || 0)
  return Math.min(sourceAvailable, neededAmount)
}

// Methods
const openCoverOverspending = () => {
  showCoverOverspending.value = true
}

const closeCoverOverspending = () => {
  showCoverOverspending.value = false
}

const openMoveMoney = () => {
  showMoveMoney.value = true
  moveAmount.value = null
  selectedMoveDestination.value = null
}

const closeMoveMoney = () => {
  showMoveMoney.value = false
  moveAmount.value = null
  selectedMoveDestination.value = null
}

const selectDestinationCategory = (destinationId: string) => {
  selectedMoveDestination.value = destinationId
}

const getDestinationCategoryName = () => {
  if (!selectedMoveDestination.value) return ''

  if (selectedMoveDestination.value === 'ready-to-assign') {
    return 'Ready to Assign'
  }

  // Find the category in allCategoryGroups
  for (const group of allCategoryGroups.value) {
    const cat = group.categories.find(c => c.id === selectedMoveDestination.value)
    if (cat) return cat.name
  }

  return ''
}

const getDestinationCategoryAvailable = () => {
  if (!selectedMoveDestination.value) return 0

  if (selectedMoveDestination.value === 'ready-to-assign') {
    return readyToAssign.value
  }

  // Find the category in allCategoryGroups
  for (const group of allCategoryGroups.value) {
    const cat = group.categories.find(c => c.id === selectedMoveDestination.value)
    if (cat) return cat.available || 0
  }

  return 0
}

const confirmMoveMoney = async () => {
  if (!props.category || !selectedMoveDestination.value || !moveAmount.value || moveAmount.value <= 0) return

  const maxAmount = props.category.available || 0
  const amountToMove = Math.min(moveAmount.value, maxAmount)

  console.log('Move money:', {
    destinationCategoryId: selectedMoveDestination.value,
    amountToMove,
    sourceAvailable: props.category.available
  })

  // Emit the move money event
  emit('moveMoney', selectedMoveDestination.value, amountToMove)

  // Close the modal
  await handleClose()
}

const selectCoverSource = async (sourceCategoryId: string) => {
  if (!props.category) return

  const neededAmount = Math.abs(props.category.available || 0)
  let sourceAvailable = 0

  if (sourceCategoryId === 'ready-to-assign') {
    sourceAvailable = readyToAssign.value
  } else {
    // Find the source category from the categoriesWithPositiveBalance (which has balances)
    let sourceCategory = null
    for (const group of categoriesWithPositiveBalance.value) {
      sourceCategory = group.categories.find(c => c.id === sourceCategoryId)
      if (sourceCategory) break
    }
    sourceAvailable = sourceCategory?.available || 0
  }

  const coverAmount = Math.min(sourceAvailable, neededAmount)

  console.log('Cover overspending:', {
    sourceCategoryId,
    neededAmount,
    sourceAvailable,
    coverAmount,
    categoryAvailable: props.category.available
  })

  // Emit the cover overspending event
  emit('coverOverspending', sourceCategoryId, coverAmount)

  // Close the modal
  await handleClose()
}

const handleClose = async () => {
  isClosing.value = true
  await new Promise(resolve => setTimeout(resolve, 300))
  isClosing.value = false
  showCoverOverspending.value = false
  showMoveMoney.value = false
  moveAmount.value = null
  selectedMoveDestination.value = null
  emit('close')
}

const handleSave = async () => {
  if (!props.category || !amount.value || amount.value <= 0 || isLoading.value) return

  isLoading.value = true

  try {
    const currentAssigned = props.category.assigned || 0
    const changeAmount = mode.value === 'add' ? amount.value : -amount.value
    const newAssigned = Math.max(0, currentAssigned + changeAmount)

    emit('save', props.category.id, newAssigned)

    // Keep loading state briefly for feedback
    await new Promise(resolve => setTimeout(resolve, 300))

    // Animate close
    await handleClose()
  } finally {
    isLoading.value = false
  }
}

// Reset when category changes
watch(() => props.category, (newCategory) => {
  if (newCategory) {
    mode.value = 'add'
    amount.value = null
    isClosing.value = false
    showCoverOverspending.value = false
    showMoveMoney.value = false
    moveAmount.value = null
    selectedMoveDestination.value = null
  }
}, { immediate: true })
</script>

