<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
      <button @click="$emit('close')" class="p-2">
        <XIcon class="h-5 w-5" />
      </button>
      <h2 class="text-lg font-semibold">
        {{ defaultTransactionType === 'inflow' ? 'Got Paid' : 'Add Transaction' }}
      </h2>
      <button
        @click="handleSubmit"
        :disabled="!isValid || isLoading"
        class="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm min-w-[60px]"
      >
        <span v-if="isLoading" class="inline-block animate-spin">⏳</span>
        <span v-else>Save</span>
      </button>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-auto p-4 space-y-4">
      <!-- Amount Type Toggle (only for regular transactions, not "Got Paid") -->
      <div v-if="defaultTransactionType === 'outflow'" class="flex gap-2">
        <button
          @click="amountType = 'outflow'"
          :class="[
            'flex-1 py-3 rounded-md font-medium transition-colors',
            amountType === 'outflow'
              ? 'bg-red-500/10 text-red-600 border-2 border-red-500'
              : 'bg-muted text-muted-foreground border-2 border-transparent'
          ]"
        >
          Expense
        </button>
        <button
          @click="amountType = 'inflow'"
          :class="[
            'flex-1 py-3 rounded-md font-medium transition-colors',
            amountType === 'inflow'
              ? 'bg-emerald-500/10 text-emerald-600 border-2 border-emerald-500'
              : 'bg-muted text-muted-foreground border-2 border-transparent'
          ]"
        >
          Income
        </button>
      </div>

      <!-- Payee -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Payee</label>
        <button
          @click="showPayeePicker = true"
          class="w-full px-4 py-3 border border-input rounded-md bg-background text-left flex items-center justify-between"
        >
          <span :class="selectedPayeeName ? 'text-foreground' : 'text-muted-foreground'">
            {{ selectedPayeeName || 'Select or add payee...' }}
          </span>
          <ChevronRightIcon class="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <!-- Category -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Category</label>
        <button
          @click="showCategoryPicker = true"
          class="w-full px-4 py-3 border border-input rounded-md bg-background text-left flex items-center justify-between"
        >
          <span :class="selectedCategory ? 'text-foreground' : 'text-muted-foreground'">
            {{ selectedCategory?.name || 'Select category...' }}
          </span>
          <ChevronRightIcon class="h-5 w-5 text-muted-foreground" />
        </button>
      </div>

      <!-- Amount -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Amount</label>
        <input
          v-model="amount"
          type="number"
          inputmode="decimal"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          class="w-full px-4 py-3 border border-input rounded-md bg-background text-lg"
        />
      </div>

      <!-- Memo -->
      <div class="space-y-2">
        <label class="text-sm font-medium">Memo (optional)</label>
        <input
          v-model="memo"
          type="text"
          placeholder="Enter memo..."
          class="w-full px-4 py-3 border border-input rounded-md bg-background"
        />
      </div>
    </div>

    <!-- Payee Picker Modal -->
    <Teleport to="body">
      <div
        v-if="showPayeePicker"
        class="fixed inset-0 z-[60] bg-background"
      >
        <div class="h-full flex flex-col">
          <div class="sticky top-0 bg-background border-b border-border px-4 space-y-3" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
            <div class="flex items-center justify-between">
              <button @click="showPayeePicker = false" class="p-2">
                <ChevronLeftIcon class="h-5 w-5" />
              </button>
              <h3 class="text-lg font-semibold">Select Payee</h3>
              <button @click="$emit('close')" class="p-2">
                <XIcon class="h-5 w-5" />
              </button>
            </div>

            <!-- Search Input -->
            <div class="relative">
              <input
                v-model="payeeSearchQuery"
                type="text"
                placeholder="Search or add payee..."
                class="w-full px-4 py-2 border border-input rounded-md bg-background"
              />
              <button
                v-if="payeeSearchQuery"
                @click="payeeSearchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-auto p-4 space-y-2">
            <!-- Filtered Payees -->
            <button
              v-for="payee in filteredPayees"
              :key="payee.id"
              @click="selectPayee(payee.name, payee.last_category_id)"
              class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
            >
              <div class="font-medium">{{ payee.name }}</div>
            </button>

            <!-- New Payee Option -->
            <button
              v-if="payeeSearchQuery.trim() && !exactPayeeMatch"
              @click="selectPayee(payeeSearchQuery.trim(), null)"
              class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left border-dashed"
            >
              <div class="font-medium">
                <span class="text-muted-foreground">Create: </span>
                <span>{{ payeeSearchQuery.trim() }}</span>
              </div>
            </button>

            <!-- No Results / Empty State -->
            <div v-if="!payeeSearchQuery && availablePayees.length === 0" class="text-center py-8 text-muted-foreground">
              Start typing to add a payee
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Category Picker Modal -->
    <Teleport to="body">
      <div
        v-if="showCategoryPicker"
        class="fixed inset-0 z-[60] bg-background"
      >
        <div class="h-full flex flex-col">
          <div class="sticky top-0 bg-background border-b border-border px-4 space-y-3" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
            <div class="flex items-center justify-between">
              <button @click="showCategoryPicker = false" class="p-2">
                <ChevronLeftIcon class="h-5 w-5" />
              </button>
              <h3 class="text-lg font-semibold">Select Category</h3>
              <button @click="$emit('close')" class="p-2">
                <XIcon class="h-5 w-5" />
              </button>
            </div>

            <!-- Search Input -->
            <div class="relative">
              <input
                v-model="categorySearchQuery"
                type="text"
                placeholder="Search categories..."
                class="w-full px-4 py-2 border border-input rounded-md bg-background"
              />
              <button
                v-if="categorySearchQuery"
                @click="categorySearchQuery = ''"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                <XIcon class="h-4 w-4" />
              </button>
            </div>
          </div>

          <div class="flex-1 overflow-auto p-4 space-y-4">
            <!-- Ready to Assign -->
            <button
              v-if="!categorySearchQuery || 'ready to assign'.includes(categorySearchQuery.toLowerCase())"
              @click="selectCategory({ id: 'ready-to-assign', name: 'Ready to Assign' })"
              class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
            >
              <div class="font-medium">Ready to Assign</div>
            </button>

            <!-- Uncategorized -->
            <button
              v-if="!categorySearchQuery || 'uncategorized'.includes(categorySearchQuery.toLowerCase())"
              @click="selectCategory({ id: 'uncategorized', name: 'Uncategorized' })"
              class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
            >
              <div class="font-medium">Uncategorized</div>
            </button>

            <!-- Category Groups -->
            <div
              v-for="group in filteredCategoryGroups"
              :key="group.id"
              class="space-y-2"
            >
              <h4 class="text-sm font-medium text-muted-foreground px-2">{{ group.name }}</h4>
              <button
                v-for="category in getFilteredCategoriesForGroup(group.id)"
                :key="category.id"
                @click="selectCategory(category)"
                class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
              >
                <div class="font-medium">{{ category.name }}</div>
                <div class="text-sm text-muted-foreground">{{ formatCurrency(category.available) }}</div>
              </button>
            </div>

            <!-- No Results -->
            <div v-if="categorySearchQuery && filteredCategoryGroups.length === 0" class="text-center py-8 text-muted-foreground">
              No categories found
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { XIcon, ChevronRightIcon, ChevronLeftIcon } from 'lucide-vue-next'
import { useCategoryStore } from '@/stores/category.store'
import { usePayeeStore } from '@/stores/payee.store'
import { useBudgetStore } from '@/stores/budget.store'
import { formatCurrency } from '@/utils/currencyUtil'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'

const props = defineProps<{
  accountId: string
  defaultTransactionType?: 'inflow' | 'outflow'
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateTransactionDto]
}>()

const categoryStore = useCategoryStore()
const payeeStore = usePayeeStore()
const budgetStore = useBudgetStore()

const amountType = ref<'inflow' | 'outflow'>(props.defaultTransactionType || 'outflow')
const selectedCategory = ref<{ id: string; name: string } | null>(null)
const selectedPayeeName = ref('')
const amount = ref<number | null>(null)
const memo = ref('')
const showCategoryPicker = ref(false)
const showPayeePicker = ref(false)
const categorySearchQuery = ref('')
const payeeSearchQuery = ref('')
const isLoading = ref(false)

// Get available payees (excluding transfer payees)
const availablePayees = computed(() => {
  const budgetId = budgetStore.currentBudget?.id
  if (!budgetId) return []

  return payeeStore.getPayeesForBudget(budgetId)
    .filter(payee => !payee.is_transfer)
})

// Filter payees based on search query
const filteredPayees = computed(() => {
  if (!payeeSearchQuery.value.trim()) {
    return availablePayees.value
  }

  const query = payeeSearchQuery.value.toLowerCase()
  return availablePayees.value.filter(payee =>
    payee.name.toLowerCase().includes(query)
  )
})

// Check if there's an exact match for the payee search
const exactPayeeMatch = computed(() => {
  if (!payeeSearchQuery.value.trim()) return false
  const query = payeeSearchQuery.value.trim().toLowerCase()
  return filteredPayees.value.some(payee => payee.name.toLowerCase() === query)
})

const visibleCategoryGroups = computed(() => {
  return categoryStore.visibleCategoryGroups.filter(group => {
    // Exclude Hidden Categories
    if (group.name === 'Hidden Categories' && group.is_system_group) {
      return false
    }
    return true
  })
})

const getCategoriesForGroup = (groupId: string) => {
  return categoryStore.getCategoriesByGroupWithBalances(groupId)
}

// Filtered category groups based on search
const filteredCategoryGroups = computed(() => {
  if (!categorySearchQuery.value) {
    return visibleCategoryGroups.value
  }

  const query = categorySearchQuery.value.toLowerCase()
  return visibleCategoryGroups.value.filter(group => {
    // Check if group name matches
    if (group.name.toLowerCase().includes(query)) {
      return true
    }
    // Check if any category in the group matches
    const categories = getCategoriesForGroup(group.id)
    return categories.some(cat => cat.name.toLowerCase().includes(query))
  })
})

// Get filtered categories for a group
const getFilteredCategoriesForGroup = (groupId: string) => {
  const categories = getCategoriesForGroup(groupId)
  if (!categorySearchQuery.value) {
    return categories
  }

  const query = categorySearchQuery.value.toLowerCase()
  return categories.filter(cat => cat.name.toLowerCase().includes(query))
}

const isValid = computed(() => {
  return selectedCategory.value && amount.value && amount.value > 0
})

const selectPayee = (payeeName: string, lastCategoryId: string | null | undefined) => {
  selectedPayeeName.value = payeeName
  showPayeePicker.value = false
  payeeSearchQuery.value = '' // Reset search when closing

  // Auto-populate category if payee has a last category
  if (lastCategoryId) {
    const category = categoryStore.categories.find(c => c.id === lastCategoryId)
    if (category) {
      selectedCategory.value = { id: category.id, name: category.name }
    }
  }
}

const selectCategory = (category: { id: string; name: string }) => {
  selectedCategory.value = category
  showCategoryPicker.value = false
  categorySearchQuery.value = '' // Reset search when closing
}

const handleSubmit = async () => {
  if (!isValid.value || isLoading.value) return

  isLoading.value = true

  try {
    const finalAmount = amountType.value === 'outflow'
      ? -Math.abs(amount.value!)
      : Math.abs(amount.value!)

    const date = new Date().toISOString().split('T')[0]

    const transactionData: CreateTransactionDto = {
      date,
      amount: finalAmount,
      account_id: props.accountId,
      category_id: selectedCategory.value!.id === 'uncategorized' ? undefined : selectedCategory.value!.id,
      memo: memo.value || undefined,
      payee: selectedPayeeName.value || undefined,
      is_cleared: false
    }

    emit('save', transactionData)

    // Keep loading state until parent closes the form
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoading.value = false
  }
}
</script>

