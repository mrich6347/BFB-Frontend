<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
      <button @click="handleClose" class="p-2">
        <XIcon class="h-5 w-5" />
      </button>
      <h2 class="text-lg font-semibold">Transfer Money</h2>
      <div class="w-[60px]"></div>
    </div>

    <!-- Form -->
    <div class="flex-1 overflow-auto space-y-4" style="padding-bottom: max(5rem, calc(5rem + env(safe-area-inset-bottom)));">

      <!-- Amount Section (Top) -->
      <div class="px-4 pt-4 pb-6">
        <!-- Large Amount Display -->
        <div class="text-center py-2">
          <button
            @click="showKeyboard = true"
            class="w-full text-center text-5xl font-bold bg-transparent border-none outline-none text-blue-500"
          >
            {{ displayAmount }}
          </button>
        </div>
      </div>

      <!-- Form Fields -->
      <div class="px-4 space-y-4">
        <!-- To Account -->
        <div class="space-y-2">
          <label class="text-sm font-medium">To Account</label>
          <button
            @click="showAccountPicker = true; showKeyboard = false"
            class="w-full px-4 py-3 border border-input rounded-md bg-background text-left flex items-center justify-between"
          >
            <span :class="selectedToAccount ? 'text-foreground' : 'text-muted-foreground'">
              {{ selectedToAccount?.name || 'Select account...' }}
            </span>
            <ChevronRightIcon class="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <!-- Category (only for transfers to tracking accounts) -->
        <div v-if="isTargetTracking" class="space-y-2">
          <label class="text-sm font-medium">Category</label>
          <button
            @click="showCategoryPicker = true; showKeyboard = false"
            class="w-full px-4 py-3 border border-input rounded-md bg-background text-left flex items-center justify-between"
          >
            <span :class="selectedCategory ? 'text-foreground' : 'text-muted-foreground'">
              {{ selectedCategory?.name || 'Select category...' }}
            </span>
            <ChevronRightIcon class="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <!-- Memo -->
        <div class="space-y-2">
          <label class="text-sm font-medium">Memo (optional)</label>
          <input
            v-model="memo"
            type="text"
            placeholder="Enter memo..."
            class="w-full px-4 py-3 border border-input rounded-md bg-background"
            @focus="showKeyboard = false"
          />
        </div>

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
    </div>

    <!-- Account Picker Modal -->
    <Teleport to="body">
      <div
        v-if="showAccountPicker"
        class="fixed inset-0 z-[60] bg-background"
      >
        <div class="h-full flex flex-col">
          <div class="sticky top-0 bg-background border-b border-border px-4 flex items-center justify-between" style="padding-top: max(3rem, env(safe-area-inset-top)); padding-bottom: 0.75rem;">
            <button @click="showAccountPicker = false" class="p-2">
              <ChevronLeftIcon class="h-5 w-5" />
            </button>
            <h3 class="text-lg font-semibold">Select Account</h3>
            <button @click="$emit('close')" class="p-2">
              <XIcon class="h-5 w-5" />
            </button>
          </div>

          <div class="flex-1 overflow-auto p-4 space-y-4">
            <button
              v-for="account in transferOptions"
              :key="account.id"
              @click="selectAccount(account)"
              class="w-full px-4 py-3 bg-card rounded-md border border-border hover:bg-accent transition-colors text-left"
            >
              <div class="font-medium">{{ account.name }}</div>
              <div class="text-sm text-muted-foreground">{{ formatCurrency(account.account_balance) }}</div>
            </button>
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

    <!-- Custom Number Keyboard -->
    <MobileNumberKeyboard
      v-model="internalAmountValue"
      :show="showKeyboard"
      color="blue"
      @done="showKeyboard = false"
      @cancel="showKeyboard = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { XIcon, ChevronRightIcon, ChevronLeftIcon } from 'lucide-vue-next'
import { useCategoryStore } from '@/stores/category.store'
import { useGetTransferOptions } from '@/composables/accounts/account-read/useGetTransferOptions'
import { TransferService } from '@/services/transfer.service'
import { formatCurrency } from '@/utils/currencyUtil'
import type { CreateTransactionDto } from '@/types/DTO/transaction.dto'
import type { AccountResponse } from '@/types/DTO/account.dto'
import MobileNumberKeyboard from './MobileNumberKeyboard.vue'

const props = defineProps<{
  accountId: string
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateTransactionDto]
}>()

const categoryStore = useCategoryStore()
const { getTransferOptions } = useGetTransferOptions()

const transferOptions = ref<AccountResponse[]>([])

const selectedToAccount = ref<AccountResponse | null>(null)
const selectedCategory = ref<{ id: string; name: string } | null>(null)
const amount = ref<number | null>(null)
const memo = ref('')
const showAccountPicker = ref(false)
const showCategoryPicker = ref(false)
const categorySearchQuery = ref('')
const isLoading = ref(false)

// Amount input handling
const showKeyboard = ref(false)
const internalAmountValue = ref('000') // Store as cents (e.g., "000" = $0.00, "1234" = $12.34)

// Watch internal amount value and update the amount ref
watch(internalAmountValue, (newValue) => {
  const cents = parseInt(newValue, 10)
  amount.value = cents / 100
})

// Format the internal value (cents) as a currency display string
const formatAmountAsCurrency = (centsString: string): string => {
  const padded = centsString.padStart(3, '0')
  const dollars = padded.slice(0, -2)
  const cents = padded.slice(-2)
  const dollarsFormatted = dollars.replace(/^0+/, '') || '0'
  return `$${dollarsFormatted}.${cents}`
}

const displayAmount = computed(() => formatAmountAsCurrency(internalAmountValue.value))

const isTargetTracking = computed(() => selectedToAccount.value?.account_type === 'TRACKING')

const visibleCategoryGroups = computed(() => {
  return categoryStore.visibleCategoryGroups.filter(group => {
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
  const hasAccount = !!selectedToAccount.value
  const hasAmount = !!amount.value && amount.value > 0
  const hasCategoryIfNeeded = !isTargetTracking.value || !!selectedCategory.value
  return hasAccount && hasAmount && hasCategoryIfNeeded
})

const selectAccount = (account: AccountResponse) => {
  selectedToAccount.value = account
  showAccountPicker.value = false
  // Reset category if switching from tracking to non-tracking
  if (!isTargetTracking.value) {
    selectedCategory.value = null
  }
}

const selectCategory = (category: { id: string; name: string }) => {
  selectedCategory.value = category
  showCategoryPicker.value = false
  categorySearchQuery.value = '' // Reset search when closing
}

const handleSubmit = async () => {
  if (!isValid.value || !selectedToAccount.value || isLoading.value) return

  isLoading.value = true

  try {
    const transferPayee = TransferService.formatTransferPayee(selectedToAccount.value.name)
    const date = new Date().toISOString().split('T')[0]
    const transferAmount = -Math.abs(amount.value!)

    const transactionData: CreateTransactionDto = {
      date,
      amount: transferAmount,
      account_id: props.accountId,
      payee: transferPayee,
      memo: memo.value || undefined,
      is_cleared: false,
      category_id: isTargetTracking.value ? selectedCategory.value?.id : undefined
    }

    emit('save', transactionData)

    // Keep loading state until parent closes the form
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isLoading.value = false
  }
}

onMounted(async () => {
  try {
    transferOptions.value = await getTransferOptions(props.accountId)
  } catch (error) {
    console.error('Failed to load transfer options:', error)
  }

  // Auto-open keyboard
  setTimeout(() => {
    showKeyboard.value = true
  }, 100)
})

// Close keyboard when component unmounts
onBeforeUnmount(() => {
  showKeyboard.value = false
})

// Close keyboard when user clicks close button
const handleClose = () => {
  showKeyboard.value = false
  emit('close')
}
</script>

