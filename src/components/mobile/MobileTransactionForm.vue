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
      <div class="w-[60px]"></div>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-auto p-4 space-y-4" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">

      <!-- Transaction Mode Toggle -->
      <div class="flex gap-2 bg-muted/50 p-1 rounded-lg">
        <button
          @click="transactionMode = 'standard'"
          :class="[
            'flex-1 py-2 rounded-md text-sm font-medium transition-colors',
            transactionMode === 'standard'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          ]"
        >
          Standard
        </button>
        <button
          @click="transactionMode = 'scheduled'"
          :class="[
            'flex-1 py-2 rounded-md text-sm font-medium transition-colors',
            transactionMode === 'scheduled'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          ]"
        >
          Scheduled
        </button>
      </div>

      <!-- Amount Type Toggle -->
      <div v-if="defaultTransactionType === 'outflow'" class="flex gap-2">
        <!-- For scheduled: show only Expense button (highlighted) -->
        <template v-if="transactionMode === 'scheduled'">
          <div class="flex-1 py-3 rounded-md font-medium bg-red-500/10 text-red-600 border-2 border-red-500 text-center">
            Expense
          </div>
        </template>
        <!-- For standard: show both buttons -->
        <template v-else>
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
        </template>
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

      <!-- Scheduled Transaction Fields -->
      <template v-if="transactionMode === 'scheduled'">
        <!-- Frequency -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Frequency</label>
          <select
            v-model="scheduledFrequency"
            class="w-full px-4 py-3 border border-input rounded-md bg-background"
          >
            <option value="ONCE">Once</option>
            <option value="MONTHLY">Monthly</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Bi-weekly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>

        <!-- Specific Date (for ONCE frequency) -->
        <div v-if="scheduledFrequency === 'ONCE'" class="space-y-2">
          <label class="text-sm font-medium">Date</label>
          <input
            v-model="specificDate"
            type="date"
            class="w-full px-4 py-3 border border-input rounded-md bg-background"
          />
        </div>

        <!-- Day of Month (for MONTHLY and YEARLY) -->
        <div v-if="scheduledFrequency === 'MONTHLY' || scheduledFrequency === 'YEARLY'" class="space-y-2">
          <label class="text-sm font-medium">Day of Month</label>
          <input
            v-model.number="dayOfMonth"
            type="number"
            min="1"
            max="31"
            placeholder="1-31"
            class="w-full px-4 py-3 border border-input rounded-md bg-background"
          />
        </div>

        <!-- Day of Week (for WEEKLY and BIWEEKLY) -->
        <div v-if="scheduledFrequency === 'WEEKLY' || scheduledFrequency === 'BIWEEKLY'" class="space-y-2">
          <label class="text-sm font-medium">Day of Week</label>
          <select
            v-model.number="dayOfWeek"
            class="w-full px-4 py-3 border border-input rounded-md bg-background"
          >
            <option :value="0">Sunday</option>
            <option :value="1">Monday</option>
            <option :value="2">Tuesday</option>
            <option :value="3">Wednesday</option>
            <option :value="4">Thursday</option>
            <option :value="5">Friday</option>
            <option :value="6">Saturday</option>
          </select>
        </div>

        <!-- Month of Year (for YEARLY) -->
        <div v-if="scheduledFrequency === 'YEARLY'" class="space-y-2">
          <label class="text-sm font-medium">Month</label>
          <select
            v-model.number="monthOfYear"
            class="w-full px-4 py-3 border border-input rounded-md bg-background"
          >
            <option :value="1">January</option>
            <option :value="2">February</option>
            <option :value="3">March</option>
            <option :value="4">April</option>
            <option :value="5">May</option>
            <option :value="6">June</option>
            <option :value="7">July</option>
            <option :value="8">August</option>
            <option :value="9">September</option>
            <option :value="10">October</option>
            <option :value="11">November</option>
            <option :value="12">December</option>
          </select>
        </div>
      </template>

      <!-- Save Button -->
      <div class="pt-4">
        <button
          @click="handleSubmit"
          :disabled="!isValid || isLoading"
          class="w-full py-3 bg-primary text-primary-foreground rounded-md font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          :class="isLoading ? 'animate-pulse' : 'hover:bg-primary/90'"
        >
          {{ isLoading ? 'Saving...' : 'Save' }}
        </button>
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
            <!-- Only show payees if user is searching -->
            <template v-if="payeeSearchQuery.trim()">
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
                v-if="!exactPayeeMatch"
                @click="selectPayee(payeeSearchQuery.trim(), null)"
                class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left border-dashed"
              >
                <div class="font-medium">
                  <span class="text-muted-foreground">Create: </span>
                  <span>{{ payeeSearchQuery.trim() }}</span>
                </div>
              </button>

              <!-- No Results -->
              <div v-if="filteredPayees.length === 0" class="text-center py-8 text-muted-foreground">
                No payees found
              </div>
            </template>

            <!-- Empty State - Show when not searching -->
            <div v-else class="text-center py-8 text-muted-foreground">
              <p class="text-sm">Start typing to search for a payee</p>
              <p class="text-xs mt-2">or create a new one</p>
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
                <div
                  class="text-sm font-medium"
                  :class="getCategoryAvailableColor(category.available)"
                >
                  {{ formatCurrency(category.available) }}
                </div>
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
import { ref, computed, watch } from 'vue'
import { XIcon, ChevronRightIcon, ChevronLeftIcon } from 'lucide-vue-next'
import { useCategoryStore } from '@/stores/category.store'
import { usePayeeStore } from '@/stores/payee.store'
import { useBudgetStore } from '@/stores/budget.store'
import { useScheduledTransactionOperations } from '@/composables/scheduled-transactions/useScheduledTransactionOperations'
import { formatCurrency } from '@/utils/currencyUtil'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import type { CreateScheduledTransactionDto } from '@/types/DTO/scheduled-transaction.dto'
import { ScheduledFrequency } from '@/types/DTO/scheduled-transaction.dto'
import { useToast } from 'vue-toast-notification'

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
const { createScheduledTransaction } = useScheduledTransactionOperations()
const $toast = useToast()

const transactionMode = ref<'standard' | 'scheduled'>('standard')
const amountType = ref<'inflow' | 'outflow'>(props.defaultTransactionType || 'outflow')

// Watch transaction mode and force outflow for scheduled
watch(transactionMode, (newMode) => {
  if (newMode === 'scheduled') {
    amountType.value = 'outflow'
  }
})
const selectedCategory = ref<{ id: string; name: string } | null>(null)
const selectedPayeeName = ref('')
const amount = ref<number | null>(null)
const memo = ref('')
const showCategoryPicker = ref(false)
const showPayeePicker = ref(false)
const categorySearchQuery = ref('')
const payeeSearchQuery = ref('')
const isLoading = ref(false)

// Scheduled transaction fields
const scheduledFrequency = ref<'ONCE' | 'MONTHLY' | 'WEEKLY' | 'BIWEEKLY' | 'YEARLY'>('MONTHLY')
const specificDate = ref('')
const dayOfMonth = ref(1)
const dayOfWeek = ref(1)
const monthOfYear = ref(1)

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

const getCategoryAvailableColor = (available: number) => {
  if (available > 0) return 'text-emerald-600 dark:text-emerald-400'
  if (available < 0) return 'text-destructive'
  return 'text-muted-foreground'
}

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

    if (transactionMode.value === 'scheduled') {
      // Create scheduled transaction
      const budgetId = budgetStore.currentBudget?.id
      if (!budgetId) {
        $toast.error('No budget selected')
        return
      }

      const scheduledData: CreateScheduledTransactionDto = {
        budget_id: budgetId,
        account_id: props.accountId,
        payee: selectedPayeeName.value || '',
        amount: finalAmount,
        category_id: selectedCategory.value!.id === 'uncategorized' ? undefined : selectedCategory.value!.id,
        memo: memo.value || undefined,
        frequency: scheduledFrequency.value,
        specific_date: scheduledFrequency.value === 'ONCE' ? specificDate.value : undefined,
        day_of_month: (scheduledFrequency.value === 'MONTHLY' || scheduledFrequency.value === 'YEARLY') ? dayOfMonth.value : undefined,
        day_of_week: (scheduledFrequency.value === 'WEEKLY' || scheduledFrequency.value === 'BIWEEKLY') ? dayOfWeek.value : undefined,
        month_of_year: scheduledFrequency.value === 'YEARLY' ? monthOfYear.value : undefined,
        is_active: true
      }

      await createScheduledTransaction(scheduledData)
      emit('close')
    } else {
      // Create standard transaction
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
    }

    // Keep loading state until parent closes the form
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoading.value = false
  }
}
</script>

