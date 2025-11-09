<template>
  <div class="h-screen flex flex-col bg-background">
    <!-- Simple Header -->
    <div class="sticky top-0 z-10 bg-background border-b border-border" style="padding-top: max(3rem, env(safe-area-inset-top));">
      <div class="px-4 pb-3 space-y-2">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-lg font-semibold text-foreground">{{ budgetStore.currentBudget?.name }}</h1>
            <p class="text-sm text-muted-foreground">{{ budgetStore.currentMonthName }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-muted-foreground">Ready to Assign</p>
            <p class="text-lg font-semibold" :class="getReadyToAssignColorClass()">
              {{ formatCurrency(budgetStore.readyToAssign) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Category List - scrollable area with bottom nav padding -->
    <div class="flex-1 overflow-y-auto p-4 space-y-6" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">
      <div
        v-for="group in visibleGroupsWithCategories"
        :key="group.id"
        class="space-y-2"
      >
        <!-- Group Header -->
        <div class="px-3 py-2 bg-muted/50 rounded-md">
          <h2 class="text-sm font-medium text-muted-foreground">{{ group.name }}</h2>
        </div>

        <!-- Categories in Group -->
        <div class="space-y-1">
          <button
            v-for="category in getCategoriesForGroup(group.id)"
            :key="category.id"
            @click="openAssignMoney(category)"
            class="w-full flex items-center justify-between px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
          >
            <span class="text-sm text-foreground">{{ category.name }}</span>
            <span class="text-sm font-semibold" :class="getAvailableColorClass(category.available)">
              {{ formatCurrency(category.available) }}
            </span>
          </button>
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
    />

    <!-- Mobile Assign Money Modal -->
    <MobileAssignMoney
      :show="showAssignMoney"
      :category="selectedCategory"
      @close="closeAssignMoney"
      @save="handleAssignMoney"
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
import { AccountService } from '@/services/account.service'
import { TrackingAccountService } from '@/services/tracking-account.service'
import CategoryService from '@/services/category.service'
import { formatCurrency } from '@/utils/currencyUtil'
import MobileTransactionFlow from '@/components/mobile/MobileTransactionFlow.vue'
import MobileAssignMoney from '@/components/mobile/MobileAssignMoney.vue'
import MobileBottomNav from '@/components/mobile/MobileBottomNav.vue'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import type { CategoryResponse } from '@/types/DTO/category.dto'

const router = useRouter()
const budgetStore = useBudgetStore()
const categoryStore = useCategoryStore()
const accountStore = useAccountStore()
const { createTransaction } = useTransactionOperations()
const $toast = useToast()

const showAssignMoney = ref(false)
const selectedCategory = ref<CategoryResponse | null>(null)
const transactionFlowRef = ref<InstanceType<typeof MobileTransactionFlow> | null>(null)

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

// Get color class for Ready to Assign
const getReadyToAssignColorClass = () => {
  const amount = budgetStore.readyToAssign
  if (amount > 0) {
    return 'text-emerald-600 dark:text-emerald-400'
  } else if (amount < 0) {
    return 'text-red-600 dark:text-red-400'
  }
  return 'text-foreground'
}

// Transaction handlers
const handleSaveTransaction = async (data: CreateTransactionDto) => {
  try {
    await createTransaction(data)
    // Optimistic update provides instant feedback, no toast needed
  } catch (error) {
    $toast.error('Failed to save transaction')
  }
}

const handleSaveTransfer = async (data: CreateTransactionDto) => {
  try {
    await createTransaction(data)
    // Optimistic update provides instant feedback, no toast needed
  } catch (error) {
    $toast.error('Failed to create transfer')
  }
}

const handleSavePayment = async (creditCardAccountId: string, amount: number, fromAccountId: string, memo?: string) => {
  try {
    const response = await AccountService.makeCreditCardPayment(creditCardAccountId, {
      amount,
      from_account_id: fromAccountId,
      memo
    })

    // Update stores with server response
    budgetStore.setReadyToAssign(response.readyToAssign)
    accountStore.updateAccount(creditCardAccountId, response.account) // Credit card account
    accountStore.updateAccount(fromAccountId, response.sourceAccount) // Cash account

    // Update payment category balance if provided
    if (response.paymentCategoryBalance) {
      categoryStore.updateCategoryBalance(
        response.paymentCategoryBalance.category_id,
        response.paymentCategoryBalance
      )
    }

    // Optimistic update provides instant feedback, no toast needed
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

const handleAssignMoney = async (categoryId: string, newAssigned: number) => {
  try {
    const currentMonth = budgetStore.currentMonth
    const currentYear = budgetStore.currentYear

    const response = await CategoryService.updateCategoryBalance(
      categoryId,
      { assigned: newAssigned },
      currentYear,
      currentMonth
    )

    // Update stores with response
    categoryStore.updateCategoryBalance(categoryId, response.categoryBalance)
    budgetStore.setReadyToAssign(response.readyToAssign)

    // Update affected categories if any
    if (response.affectedCategories) {
      response.affectedCategories.forEach(affectedCategory => {
        categoryStore.updateCategoryBalance(affectedCategory.category_id, affectedCategory)
      })
    }

    // Optimistic update provides instant feedback
  } catch (error) {
    $toast.error('Failed to assign money')
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

const handleNavigate = (tab: 'budget' | 'accounts' | 'networth') => {
  if (tab === 'accounts') {
    // Open the transaction flow to account selection
    transactionFlowRef.value?.openFlow()
  } else if (tab === 'networth') {
    // Navigate to net worth page
    router.push('/net-worth')
  }
  // Budget tab is already the current view, no action needed
}
</script>

