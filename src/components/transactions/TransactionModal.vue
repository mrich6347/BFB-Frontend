<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ transaction ? 'Edit Transaction' : 'Add Transaction' }}</DialogTitle>
      </DialogHeader>

      <FormKit
        type="form"
        @submit="handleSubmit"
        :actions="false"
        :value="formData"
        validation-visibility="live"
        #default="{ state }"
      >
        <!-- Category -->
        <div class="mb-4">
          <CategorySelector
            ref="categorySelectorRef"
            v-model="selectedCategoryId"
            :available-categories="availableCategories"
            label="Category"
            placeholder="Select category..."
            :include-ready-to-assign="true"
            :include-uncategorized="true"
            :show-group-headers="false"
            @select="handleCategorySelect"
          />
        </div>

        <!-- Memo -->
        <FormKit
          type="text"
          name="memo"
          label="Memo"
          placeholder="Enter memo (optional)"
          :classes="{
            input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
            label: 'text-sm font-medium text-foreground',
            outer: 'space-y-2 mb-4',
            message: 'text-red-500 text-sm mt-1'
          }"
        />

        <!-- Amount Type Toggle -->
        <div class="mb-4">
          <label class="text-sm font-medium text-foreground mb-2 block">Transaction Type</label>
          <div class="flex gap-2">
            <Button
              type="button"
              variant="outline"
              :class="amountType === 'outflow' ? 'bg-destructive text-destructive-foreground' : ''"
              @click="amountType = 'outflow'"
            >
              Outflow
            </Button>
            <Button
              type="button"
              variant="outline"
              :class="amountType === 'inflow' ? 'bg-green-600 text-white' : ''"
              @click="amountType = 'inflow'"
            >
              Inflow
            </Button>
          </div>
        </div>

        <!-- Amount -->
        <div ref="amountFieldRef">
          <FormKit
            type="number"
            name="amount"
            label="Amount"
            validation="required|min:0.01"
            step="0.01"
            min="0.01"
            placeholder="0.00"
            :classes="{
              input: 'w-full px-3 py-2 border rounded-md bg-background border-input',
              label: 'text-sm font-medium text-foreground',
              outer: 'space-y-2 mb-4',
              message: 'text-red-500 text-sm mt-1'
            }"
          />
        </div>

        <!-- Form Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" @click="$emit('close')">
            Cancel
          </Button>
          <Button type="submit" :disabled="!state.valid || props.isSubmitting">
            <span v-if="props.isSubmitting">{{ transaction ? 'Updating...' : 'Adding...' }}</span>
            <span v-else>{{ transaction ? 'Update' : 'Add' }} Transaction</span>
          </Button>
        </div>
      </FormKit>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import { useCategoryStore } from '@/stores/category.store'
import CategorySelector from '@/components/categories/CategorySelector.vue'
import type { TransactionResponse, CreateTransactionDto, UpdateTransactionDto } from '@/types/DTO/transaction.dto'

const props = defineProps<{
  isOpen: boolean
  transaction?: TransactionResponse | null
  accountId: string
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateTransactionDto | UpdateTransactionDto]
}>()

const categoryStore = useCategoryStore()
const amountType = ref<'inflow' | 'outflow'>('outflow')
const selectedCategoryId = ref<string | null>('')
const categorySelectorRef = ref<InstanceType<typeof CategorySelector> | null>(null)
const amountFieldRef = ref<HTMLDivElement | null>(null)

// Filter out credit card payment categories
const isCreditCardPaymentCategory = (categoryId: string) => {
  const category = categoryStore.categories.find(c => c.id === categoryId)
  if (!category) return false

  const categoryGroup = categoryStore.getCategoryGroupById(category.category_group_id)
  return categoryGroup?.name === 'Credit Card Payments' && categoryGroup?.is_system_group === true
}

const availableCategories = computed(() => {
  return categoryStore.categories.filter(category => !isCreditCardPaymentCategory(category.id))
})

const formData = computed(() => {
  if (props.transaction) {
    return {
      memo: props.transaction.memo || '',
      amount: Math.abs(props.transaction.amount)
    }
  }

  return {
    memo: '',
    amount: 0
  }
})

// Set amount type and category based on transaction
watch(() => props.transaction, (transaction) => {
  if (transaction) {
    amountType.value = transaction.amount < 0 ? 'outflow' : 'inflow'
    selectedCategoryId.value = transaction.category_id === null ? 'ready-to-assign' : (transaction.category_id || '')
  } else {
    selectedCategoryId.value = ''
  }
}, { immediate: true })

// Auto-focus category selector when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    // Use a small delay to ensure the modal is fully rendered
    setTimeout(() => {
      categorySelectorRef.value?.focus()
    }, 100)
  }
})

// Handle category selection - jump to amount field
const handleCategorySelect = () => {
  nextTick(() => {
    // Find the input element within the amount field
    const amountInput = amountFieldRef.value?.querySelector('input[type="number"]') as HTMLInputElement
    if (amountInput) {
      amountInput.focus()
      amountInput.select()
    }
  })
}

const handleSubmit = (data: any) => {
  // Regular transactions use the selected amount type
  const amount = amountType.value === 'outflow'
    ? -Math.abs(data.amount)
    : Math.abs(data.amount)

  // Set date: use existing transaction's date if editing, otherwise use today
  const date = props.transaction
    ? props.transaction.date
    : new Date().toISOString().split('T')[0]

  const transactionData = {
    ...data,
    date,
    amount,
    account_id: props.accountId,
    category_id: selectedCategoryId.value || undefined,
    payee: undefined // No payee for regular transactions
  }

  emit('save', transactionData)
}
</script>
