<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Scheduled Transaction</DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Inflow/Outflow Toggle -->
        <div>
          <label class="text-sm font-medium text-foreground mb-2 block">Type</label>
          <div class="inline-flex rounded-md border border-input bg-background p-1">
            <button
              type="button"
              @click="amountType = 'outflow'"
              :class="[
                'px-4 py-2 text-sm font-medium rounded transition-colors',
                amountType === 'outflow'
                  ? 'bg-destructive text-destructive-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
            >
              Outflow
            </button>
            <button
              type="button"
              @click="amountType = 'inflow'"
              :class="[
                'px-4 py-2 text-sm font-medium rounded transition-colors',
                amountType === 'inflow'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
            >
              Inflow
            </button>
          </div>
        </div>

        <!-- Payee -->
        <div>
          <PayeeSelector
            v-model="selectedPayeeId"
            :payee-name="selectedPayeeName"
            label="Payee"
            placeholder="Select or add payee..."
            @select="handlePayeeSelect"
          />
        </div>

        <!-- Category -->
        <div>
          <CategorySelector
            ref="categorySelectorRef"
            v-model="selectedCategoryId"
            label="Category"
            placeholder="Select category..."
            :include-ready-to-assign="true"
            :include-uncategorized="true"
            :show-group-headers="false"
            @select="handleCategorySelect"
          />
        </div>

        <!-- Amount -->
        <div ref="amountFieldRef">
          <label class="block text-sm font-medium text-foreground mb-1">Amount</label>
          <input
            v-model.number="amountValue"
            type="number"
            step="0.01"
            required
            class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="0.00"
          />
        </div>

        <!-- Frequency -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Frequency</label>
          <select
            v-model="formData.frequency"
            required
            class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option :value="ScheduledFrequency.ONCE">Once</option>
            <option value="MONTHLY">Monthly</option>
            <option value="WEEKLY">Weekly</option>
            <option value="BIWEEKLY">Bi-weekly</option>
            <option value="YEARLY">Yearly</option>
          </select>
        </div>

        <!-- Specific Date (for ONCE frequency) -->
        <div v-if="formData.frequency === ScheduledFrequency.ONCE">
          <label class="block text-sm font-medium text-foreground mb-1">Date</label>
          <input
            v-model="formData.specific_date"
            type="date"
            required
            class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <!-- Day of Month (for MONTHLY and YEARLY) -->
        <div v-if="formData.frequency === 'MONTHLY' || formData.frequency === 'YEARLY'">
          <label class="block text-sm font-medium text-foreground mb-1">Day of Month</label>
          <input
            v-model.number="formData.day_of_month"
            type="number"
            min="1"
            max="31"
            required
            class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="1-31"
          />
        </div>

        <!-- Day of Week (for WEEKLY and BIWEEKLY) -->
        <div v-if="formData.frequency === 'WEEKLY' || formData.frequency === 'BIWEEKLY'">
          <label class="block text-sm font-medium text-foreground mb-1">Day of Week</label>
          <select
            v-model.number="formData.day_of_week"
            required
            class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
        <div v-if="formData.frequency === 'YEARLY'">
          <label class="block text-sm font-medium text-foreground mb-1">Month</label>
          <select
            v-model.number="formData.month_of_year"
            required
            class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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

        <!-- Memo -->
        <div>
          <label class="block text-sm font-medium text-foreground mb-1">Memo (Optional)</label>
          <input
            v-model="formData.memo"
            type="text"
            class="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Add a note"
          />
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            @click="$emit('close')"
            :disabled="isSubmitting"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            :disabled="isSubmitting"
          >
            {{ isSubmitting ? 'Creating...' : 'Create' }}
          </Button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import CategorySelector from '@/components/categories/CategorySelector.vue'
import PayeeSelector from '@/components/payees/PayeeSelector.vue'
import { ScheduledFrequency } from '@/types/DTO/scheduled-transaction.dto'
import type { CreateScheduledTransactionDto } from '@/types/DTO/scheduled-transaction.dto'
import type { PayeeResponse } from '@/types/DTO/payee.dto'
import { usePayeeStore } from '@/stores/payee.store'

const props = defineProps<{
  isOpen: boolean
  accountId: string
  budgetId: string
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [data: CreateScheduledTransactionDto]
}>()

const payeeStore = usePayeeStore()

const selectedPayeeName = ref('')
const selectedPayeeId = ref<string | null>(null)
const selectedCategoryId = ref<string | null>(null)
const amountValue = ref<number>(0)
const amountType = ref<'inflow' | 'outflow'>('outflow')
const categorySelectorRef = ref<InstanceType<typeof CategorySelector> | null>(null)
const amountFieldRef = ref<HTMLDivElement | null>(null)

const formData = ref<CreateScheduledTransactionDto>({
  budget_id: props.budgetId,
  account_id: props.accountId,
  payee: '',
  amount: 0,
  category_id: undefined,
  memo: '',
  frequency: ScheduledFrequency.ONCE,
  specific_date: undefined,
  day_of_month: 1,
  day_of_week: undefined,
  month_of_year: undefined,
  is_active: true
})

// Handle payee selection and auto-populate category
const handlePayeeSelect = (payee: PayeeResponse | null, payeeName: string) => {
  console.log('🔍 handlePayeeSelect called:', { payee, payeeName })
  console.log('🔍 Payee object:', JSON.stringify(payee, null, 2))
  console.log('🔍 last_category_id:', payee?.last_category_id)

  selectedPayeeName.value = payeeName
  formData.value.payee = payeeName

  // If payee has a last category, auto-populate it and jump to amount
  if (payee?.last_category_id) {
    console.log('✅ Auto-populating category:', payee.last_category_id)
    selectedCategoryId.value = payee.last_category_id
    formData.value.category_id = payee.last_category_id
    console.log('✅ selectedCategoryId set to:', selectedCategoryId.value)
    console.log('✅ formData.category_id set to:', formData.value.category_id)

    // Jump directly to amount field since category is auto-populated
    nextTick(() => {
      const amountInput = amountFieldRef.value?.querySelector('input[type="number"]') as HTMLInputElement
      if (amountInput) {
        amountInput.focus()
        amountInput.select()
      }
    })
  } else {
    console.log('❌ No last_category_id found on payee')
    // No category set, move focus to category selector
    nextTick(() => {
      categorySelectorRef.value?.focus()
    })
  }
}

// Handle category selection - jump to amount field
const handleCategorySelect = () => {
  console.log('🔍 handleCategorySelect called, selectedCategoryId:', selectedCategoryId.value)
  // Update formData when category changes
  formData.value.category_id = selectedCategoryId.value || undefined

  // Jump to amount field
  nextTick(() => {
    const amountInput = amountFieldRef.value?.querySelector('input[type="number"]') as HTMLInputElement
    if (amountInput) {
      amountInput.focus()
      amountInput.select()
    }
  })
}

// Reset form when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    console.log('🔍 Modal opened, resetting form')
    selectedPayeeName.value = ''
    selectedPayeeId.value = null
    selectedCategoryId.value = null
    amountValue.value = 0
    amountType.value = 'outflow'
    formData.value = {
      budget_id: props.budgetId,
      account_id: props.accountId,
      payee: '',
      amount: 0,
      category_id: undefined,
      memo: '',
      frequency: ScheduledFrequency.ONCE,
      specific_date: undefined,
      day_of_month: 1,
      day_of_week: undefined,
      month_of_year: undefined,
      is_active: true
    }
  }
})

// Update budget_id and account_id when props change
watch(() => props.budgetId, (newBudgetId) => {
  formData.value.budget_id = newBudgetId
})

watch(() => props.accountId, (newAccountId) => {
  formData.value.account_id = newAccountId
})

const handleSubmit = () => {
  // Set amount based on inflow/outflow type
  const finalAmount = amountType.value === 'outflow'
    ? -Math.abs(amountValue.value)
    : Math.abs(amountValue.value)

  // Clean up the data based on frequency
  const data: CreateScheduledTransactionDto = {
    ...formData.value,
    amount: finalAmount,
    // Handle ready-to-assign: set category_id to undefined
    category_id: formData.value.category_id === 'ready-to-assign' ? undefined : formData.value.category_id
  }

  // Remove unnecessary fields based on frequency
  if (data.frequency === 'ONCE') {
    delete data.day_of_month
    delete data.day_of_week
    delete data.month_of_year
  } else if (data.frequency === 'MONTHLY') {
    delete data.specific_date
    delete data.day_of_week
    delete data.month_of_year
  } else if (data.frequency === 'WEEKLY' || data.frequency === 'BIWEEKLY') {
    delete data.specific_date
    delete data.day_of_month
    delete data.month_of_year
  } else if (data.frequency === 'YEARLY') {
    delete data.specific_date
    delete data.day_of_week
  }

  emit('save', data)
}
</script>

