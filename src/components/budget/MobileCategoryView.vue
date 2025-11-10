<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Simple Header -->
    <div class="sticky top-0 z-10 bg-background border-b border-border" style="padding-top: max(3rem, env(safe-area-inset-top));">
      <div class="px-4 pb-3">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-semibold text-foreground">{{ budgetStore.currentBudget?.name }}</h1>
            <p class="text-sm text-muted-foreground">{{ budgetStore.currentMonthName }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Sticky Ready to Assign Banner -->
    <div class="sticky top-[calc(3rem+3.5rem)] z-10 px-4 py-3" :class="getReadyToAssignBgClass()">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-xs font-medium" :class="Math.round(budgetStore.readyToAssign * 100) / 100 === 0 ? 'text-muted-foreground' : 'opacity-90'">Ready to Assign</p>
          <p class="text-2xl font-bold" :class="getReadyToAssignTextClass()">
            {{ formatCurrency(budgetStore.readyToAssign) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Category List - scrollable area with bottom nav padding -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6 pb-24" @click="closeAllSwipes">
      <div
        v-for="group in visibleGroupsWithCategories"
        :key="group.id"
        class="space-y-2"
      >
        <!-- Group Header -->
        <div class="px-3 py-2 bg-muted/50 rounded-md flex items-center justify-between">
          <h2 class="text-sm font-medium text-muted-foreground">{{ group.name }}</h2>
          <button
            v-if="!group.is_system_group"
            @click.stop="openCreateCategory(group.id)"
            class="p-1 rounded-md hover:bg-muted transition-colors"
            :aria-label="`Add category to ${group.name}`"
          >
            <PlusIcon class="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <!-- Categories in Group -->
        <div class="space-y-1">
          <div
            v-for="category in getCategoriesForGroup(group.id)"
            :key="category.id"
            class="relative overflow-hidden rounded-md"
          >
            <!-- Edit button (revealed on swipe) -->
            <div class="absolute inset-y-0 right-0 flex items-center">
              <button
                @click.stop="handleEditCategory(category)"
                class="h-full px-6 bg-blue-500 text-white font-medium flex items-center justify-center"
              >
                Edit
              </button>
            </div>

            <!-- Swipeable category content -->
            <button
              :ref="el => setCategoryRef(category.id, el)"
              class="w-full flex items-center justify-between px-4 py-3 bg-card border border-border hover:bg-accent transition-colors text-left touch-pan-y"
              :class="{ 'transition-transform duration-200 ease-out': !isSwiping(category.id) }"
              :style="{ transform: `translateX(${getSwipeOffset(category.id)}px)` }"
              @touchstart="handleTouchStart($event, category.id)"
              @touchmove="handleTouchMove($event, category.id)"
              @touchend="handleTouchEnd(category.id)"
              @click.stop="handleCategoryClick(category)"
            >
              <span class="text-sm text-foreground">{{ category.name }}</span>
              <span class="text-sm font-semibold" :class="getAvailableColorClass(category.available)">
                {{ formatCurrency(category.available) }}
              </span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="visibleGroupsWithCategories.length === 0" class="flex flex-col items-center justify-center min-h-[200px] p-4">
        <p class="text-muted-foreground text-center">No categories found</p>
      </div>
    </div>

    <!-- Mobile Bottom Navigation -->
    <MobileBottomNav
      active-tab="budget"
      @navigate="handleNavigate"
    />

    <!-- Mobile Transaction Flow -->
    <MobileTransactionFlow
      ref="transactionFlowRef"
      @save-transaction="handleSaveTransaction"
      @save-transfer="handleSaveTransfer"
      @save-payment="handleSavePayment"
      @update-balance="handleUpdateBalance"
      @category-balance-change="handleCategoryBalanceChange"
    />

    <!-- Category Balance Toast -->
    <MobileCategoryBalanceToast ref="categoryBalanceToastRef" />

    <!-- Mobile Assign Money Modal -->
    <MobileAssignMoney
      :show="showAssignMoney"
      :category="selectedCategory"
      @close="closeAssignMoney"
      @save="handleAssignMoney"
      @cover-overspending="handleCoverOverspending"
      @move-money="handleMoveMoney"
    />

    <!-- Mobile Create Category Modal -->
    <MobileCreateCategoryModal
      :show="showCreateCategory"
      :category-group-id="selectedGroupId"
      :budget-id="budgetStore.currentBudget?.id || ''"
      @close="closeCreateCategory"
      @created="handleCategoryCreated"
    />

    <!-- Mobile Edit Category Modal -->
    <MobileEditCategoryModal
      :show="showEditCategory"
      :category="editingCategory"
      @close="closeEditCategory"
      @updated="handleCategoryUpdated"
      @hidden="handleCategoryHidden"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toast-notification'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { useAccountStore } from '@/stores/account.store'
import { useTransactionOperations } from '@/composables/transactions/useTransactionOperations'
import { useMoveMoneyBetweenCategories } from '@/composables/categories/category-write/useMoveMoneyBetweenCategories'
import { usePullFromReadyToAssign } from '@/composables/categories/category-write/usePullFromReadyToAssign'
import { useMoveMoneyToReadyToAssign } from '@/composables/categories/category-write/useMoveMoneyToReadyToAssign'
import { useUpdateCategoryBalance } from '@/composables/categories/category-write/useUpdateCategoryBalance'
import { useMakeCreditCardPayment } from '@/composables/accounts/account-write/useMakeCreditCardPayment'
import { TrackingAccountService } from '@/services/tracking-account.service'
import { formatCurrency } from '@/utils/currencyUtil'
import MobileTransactionFlow from '@/components/mobile/MobileTransactionFlow.vue'
import MobileAssignMoney from '@/components/mobile/MobileAssignMoney.vue'
import MobileBottomNav from '@/components/mobile/MobileBottomNav.vue'
import MobileCreateCategoryModal from '@/components/mobile/MobileCreateCategoryModal.vue'
import MobileEditCategoryModal from '@/components/mobile/MobileEditCategoryModal.vue'
import MobileCategoryBalanceToast from '@/components/mobile/MobileCategoryBalanceToast.vue'
import { PlusIcon } from 'lucide-vue-next'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'

const router = useRouter()
const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const accountStore = useAccountStore()
const { createTransaction } = useTransactionOperations()
const { moveMoney } = useMoveMoneyBetweenCategories()
const { pullFromReadyToAssign } = usePullFromReadyToAssign()
const { moveMoneyToReadyToAssign } = useMoveMoneyToReadyToAssign()
const { updateCategoryBalance } = useUpdateCategoryBalance()
const { makeCreditCardPayment } = useMakeCreditCardPayment()
const $toast = useToast()

const showAssignMoney = ref(false)
const selectedCategory = ref<CategoryResponse | null>(null)
const showCreateCategory = ref(false)
const selectedGroupId = ref<string>('')
const showEditCategory = ref(false)
const editingCategory = ref<CategoryResponse | null>(null)
const transactionFlowRef = ref<InstanceType<typeof MobileTransactionFlow> | null>(null)
const categoryBalanceToastRef = ref<InstanceType<typeof MobileCategoryBalanceToast> | null>(null)

// Swipe state management
const swipeStates = ref<Record<string, { offset: number, startX: number, startTime: number, isSwiping: boolean }>>({})
const categoryRefs = ref<Record<string, HTMLElement>>({})
const SWIPE_THRESHOLD = -80 // How far to swipe to reveal edit button
const SWIPE_VELOCITY_THRESHOLD = 0.3 // Minimum velocity to trigger swipe

// Swipe functions
const setCategoryRef = (id: string, el: any) => {
  if (el) {
    categoryRefs.value[id] = el
  }
}

const getSwipeOffset = (id: string) => {
  return swipeStates.value[id]?.offset || 0
}

const isSwiping = (id: string) => {
  return swipeStates.value[id]?.isSwiping || false
}

const closeOtherSwipes = (exceptId?: string) => {
  Object.keys(swipeStates.value).forEach(id => {
    if (id !== exceptId) {
      swipeStates.value[id] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }
    }
  })
}

const closeAllSwipes = () => {
  closeOtherSwipes()
}

const handleTouchStart = (event: TouchEvent, id: string) => {
  // Close other open swipes when starting a new swipe
  closeOtherSwipes(id)

  const touch = event.touches[0]
  swipeStates.value[id] = {
    offset: swipeStates.value[id]?.offset || 0,
    startX: touch.clientX,
    startTime: Date.now(),
    isSwiping: true
  }
}

const handleTouchMove = (event: TouchEvent, id: string) => {
  const state = swipeStates.value[id]
  if (!state) return

  const touch = event.touches[0]
  const deltaX = touch.clientX - state.startX
  const currentOffset = state.offset || 0

  // Only allow swiping left (negative direction)
  const newOffset = Math.min(0, Math.max(SWIPE_THRESHOLD, currentOffset + deltaX))

  swipeStates.value[id] = {
    ...state,
    offset: newOffset,
    startX: touch.clientX,
    isSwiping: true
  }
}

const handleTouchEnd = (id: string) => {
  const state = swipeStates.value[id]
  if (!state) return

  const duration = Date.now() - state.startTime
  const distance = state.offset
  const velocity = Math.abs(distance) / duration

  // Snap to open or closed based on threshold or velocity
  if (state.offset < SWIPE_THRESHOLD / 2 || velocity > SWIPE_VELOCITY_THRESHOLD) {
    // Snap to open (reveal edit button)
    swipeStates.value[id] = { ...state, offset: SWIPE_THRESHOLD, isSwiping: false }
  } else {
    // Snap to closed
    swipeStates.value[id] = { ...state, offset: 0, isSwiping: false }
  }
}

const handleCategoryClick = (category: CategoryResponse) => {
  // If the category is swiped open, close it instead of opening assign money
  if (swipeStates.value[category.id]?.offset !== 0) {
    swipeStates.value[category.id] = {
      ...swipeStates.value[category.id],
      offset: 0,
      isSwiping: false
    }
    return
  }

  // Otherwise, open assign money modal
  openAssignMoney(category)
}

// Get categories for a specific group with balances
const getCategoriesForGroup = (groupId: string) => {
  return categoryStore.getCategoriesByGroupWithBalances(groupId)
}

// Get visible groups (excluding Hidden Categories system group)
const visibleGroupsWithCategories = computed(() => {
  return categoryStore.visibleCategoryGroups
    .filter(group => {
      // Exclude Hidden Categories system group
      if (group.name === 'Hidden Categories' && group.is_system_group) {
        return false
      }

      const categories = getCategoriesForGroup(group.id)
      return categories.length > 0
    })
})

// Get total available for a group
const getGroupTotal = (groupId: string) => {
  const categories = getCategoriesForGroup(groupId)
  return categories.reduce((sum, cat) => sum + cat.available, 0)
}

// Get color class based on available amount
const getAvailableColorClass = (amount: number) => {
  if (amount > 0) {
    return 'text-emerald-600 dark:text-emerald-400'
  } else if (amount < 0) {
    return 'text-red-600 dark:text-red-400'
  }
  return 'text-muted-foreground'
}

// Get background class for Ready to Assign banner
const getReadyToAssignBgClass = () => {
  const amount = budgetStore.readyToAssign
  // Round to 2 decimal places to avoid floating point issues
  const rounded = Math.round(amount * 100) / 100
  if (rounded > 0) {
    return 'bg-emerald-500/20 dark:bg-emerald-500/10'
  } else if (rounded < 0) {
    return 'bg-red-500/20 dark:bg-red-500/10'
  }
  return 'bg-muted/50'
}

// Get text color class for Ready to Assign
const getReadyToAssignTextClass = () => {
  const amount = budgetStore.readyToAssign
  // Round to 2 decimal places to avoid floating point issues
  const rounded = Math.round(amount * 100) / 100
  if (rounded > 0) {
    return 'text-emerald-700 dark:text-emerald-300'
  } else if (rounded < 0) {
    return 'text-red-700 dark:text-red-300'
  }
  return 'text-gray-400 dark:text-gray-500'
}

// Transaction handlers
const handleSaveTransaction = async (data: CreateTransactionDto) => {
  try {
    const result = createTransaction(data)
    // Show category balance toast immediately with optimistic data
    if (result.categoryBalanceChange && categoryBalanceToastRef.value) {
      categoryBalanceToastRef.value.show(
        result.categoryBalanceChange.categoryName,
        result.categoryBalanceChange.oldBalance,
        result.categoryBalanceChange.newBalance
      )
    }
    // Wait for the server response in the background
    await result.promise
    // Optimistic update provides instant feedback, no need to reload
  } catch (error) {
    $toast.error('Failed to save transaction')
  }
}

const handleSaveTransfer = async (data: CreateTransactionDto) => {
  try {
    const result = createTransaction(data)
    // Show category balance toast immediately with optimistic data
    if (result.categoryBalanceChange && categoryBalanceToastRef.value) {
      categoryBalanceToastRef.value.show(
        result.categoryBalanceChange.categoryName,
        result.categoryBalanceChange.oldBalance,
        result.categoryBalanceChange.newBalance
      )
    }
    // Wait for the server response in the background
    await result.promise
    // Optimistic update provides instant feedback, no need to reload
  } catch (error) {
    $toast.error('Failed to create transfer')
  }
}

const handleCategoryBalanceChange = (categoryName: string, oldBalance: number, newBalance: number) => {
  if (categoryBalanceToastRef.value) {
    categoryBalanceToastRef.value.show(categoryName, oldBalance, newBalance)
  }
}

const handleSavePayment = async (creditCardAccountId: string, amount: number, fromAccountId: string, memo?: string) => {
  try {
    await makeCreditCardPayment(creditCardAccountId, amount, fromAccountId, memo)
    // Optimistic update provides instant feedback, no need to reload or show toast
  } catch (error) {
    $toast.error('Failed to make payment')
  }
}

const openAssignMoney = (category: CategoryResponse) => {
  selectedCategory.value = category
  showAssignMoney.value = true
}

const closeAssignMoney = () => {
  showAssignMoney.value = false
  selectedCategory.value = null
}

const openCreateCategory = (groupId: string) => {
  selectedGroupId.value = groupId
  showCreateCategory.value = true
}

const closeCreateCategory = () => {
  showCreateCategory.value = false
  selectedGroupId.value = ''
}

const handleCategoryCreated = (category: CategoryResponse) => {
  // Category is already added to store by the composable
  // Just close the modal
  closeCreateCategory()
}

const handleEditCategory = (category: CategoryResponse) => {
  // Close the swipe
  swipeStates.value[category.id] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }
  // Open edit modal
  editingCategory.value = category
  showEditCategory.value = true
}

const closeEditCategory = () => {
  showEditCategory.value = false
  editingCategory.value = null
}

const handleCategoryUpdated = (category: CategoryResponse) => {
  // Category is already updated in store by the composable
  // Just close the modal
  closeEditCategory()
}

const handleCategoryHidden = (categoryId: string) => {
  // Category is already hidden in store by the composable
  // Just close the modal
  closeEditCategory()
}

const handleAssignMoney = async (categoryId: string, newAssigned: number) => {
  try {
    await updateCategoryBalance(categoryId, newAssigned)
    // Optimistic update provides instant feedback
  } catch (error) {
    $toast.error('Failed to assign money')
  }
}

const handleCoverOverspending = async (sourceCategoryId: string, amount: number) => {
  if (!selectedCategory.value) return

  // Capture the destination category ID before any async operations
  const destinationCategoryId = selectedCategory.value.id

  console.log('handleCoverOverspending called:', {
    sourceCategoryId,
    destinationCategoryId,
    amount,
    selectedCategoryAvailable: selectedCategory.value.available
  })

  try {
    // If source is ready-to-assign, pull from there
    if (sourceCategoryId === 'ready-to-assign') {
      await pullFromReadyToAssign(destinationCategoryId, amount)
    } else {
      // Move money from source category to destination category
      await moveMoney(sourceCategoryId, destinationCategoryId, amount)
    }

    // Optimistic update provides instant feedback, no toast needed
  } catch (error) {
    console.error('Failed to cover overspending:', error)
    // Error handling is done in the composables with optimistic rollback
  }
}

const handleMoveMoney = async (destinationCategoryId: string, amount: number) => {
  if (!selectedCategory.value) return

  // Capture the source category ID before any async operations
  const sourceCategoryId = selectedCategory.value.id

  console.log('handleMoveMoney called:', {
    sourceCategoryId,
    destinationCategoryId,
    amount,
    selectedCategoryAvailable: selectedCategory.value.available
  })

  try {
    // If destination is ready-to-assign, move to there
    if (destinationCategoryId === 'ready-to-assign') {
      await moveMoneyToReadyToAssign(sourceCategoryId, amount)
    } else {
      // Move money from source category to destination category
      await moveMoney(sourceCategoryId, destinationCategoryId, amount)
    }

    // Optimistic update provides instant feedback, no toast needed
  } catch (error) {
    console.error('Failed to move money:', error)
    // Error handling is done in the composables with optimistic rollback
  }
}

const handleUpdateBalance = async (accountId: string, newBalance: number) => {
  try {
    const response = await TrackingAccountService.updateBalance(accountId, {
      new_balance: newBalance
    })

    // Update account store with the updated account
    accountStore.updateAccount(accountId, response.account)

    // Update ready to assign if it changed
    if (response.readyToAssign !== undefined) {
      budgetStore.setReadyToAssign(response.readyToAssign)
    }

    // Optimistic update provides instant feedback
  } catch (error) {
    console.error('Failed to update balance:', error)
    $toast.error('Failed to update balance')
  }
}

const handleNavigate = (tab: 'budget' | 'accounts' | 'goals' | 'retirement' | 'networth') => {
  if (tab === 'accounts') {
    // Open the transaction flow to account selection
    transactionFlowRef.value?.openFlow()
  } else if (tab === 'goals') {
    router.push('/shared-goals')
  } else if (tab === 'retirement') {
    router.push('/retirement-plan')
  } else if (tab === 'networth') {
    // Navigate to net worth page
    router.push('/net-worth')
  }
  // Budget tab is already the current view, no action needed
}
</script>

