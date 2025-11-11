<template>
  <Dialog :open="isOpen" @update:open="(value: boolean) => !value && $emit('close')">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Scheduled Transaction</DialogTitle>
      </DialogHeader>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Outflow Toggle (always outflow for scheduled transactions) -->
        <div>
          <label class="text-sm font-medium text-foreground mb-2 block">Type</label>
          <div class="inline-flex rounded-md border border-input bg-background p-1">
            <button
              type="button"
              disabled
              class="px-4 py-2 text-sm font-medium rounded transition-colors bg-destructive text-destructive-foreground shadow-sm cursor-default"
            >
              Outflow
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
            :auto-focus="false"
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
            :include-ready-to-assign="false"
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
            <option :value="ScheduledFrequency.MONTHLY">Monthly</option>
            <option :value="ScheduledFrequency.WEEKLY">Weekly</option>
            <option :value="ScheduledFrequency.BIWEEKLY">Bi-weekly</option>
            <option :value="ScheduledFrequency.YEARLY">Yearly</option>
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
            {{ isSubmitting ? 'Saving...' : 'Save' }}
          </Button>
        </div>

        <!-- Delete Button (Mobile Only) -->
        <div v-if="isMobile" class="pt-2">
          <button
            @click="handleDelete"
            :disabled="isDeleting"
            type="button"
            class="w-full py-3 bg-red-600 text-white rounded-md font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            :class="isDeleting ? 'animate-pulse' : 'hover:bg-red-700'"
          >
            <template v-if="!isDeleting">
              <TrashIcon class="h-5 w-5" />
              Delete Scheduled Transaction
            </template>
            <span v-else>Deleting...</span>
          </button>
        </div>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { TrashIcon } from 'lucide-vue-next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import CategorySelector from '@/components/categories/CategorySelector.vue'
import PayeeSelector from '@/components/payees/PayeeSelector.vue'
import { ScheduledFrequency } from '@/types/DTO/scheduled-transaction.dto'
import type { UpdateScheduledTransactionDto, ScheduledTransactionResponse } from '@/types/DTO/scheduled-transaction.dto'
import type { PayeeResponse } from '@/types/DTO/payee.dto'
import { usePayeeStore } from '@/stores/payee.store'

const props = defineProps<{
  isOpen: boolean
  transaction: ScheduledTransactionResponse | null
  isSubmitting?: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [id: string, data: UpdateScheduledTransactionDto]
  delete: [id: string]
}>()

const payeeStore = usePayeeStore()

const selectedPayeeName = ref('')
const selectedPayeeId = ref<string | null>(null)
const selectedCategoryId = ref<string | null>(null)
const amountValue = ref<number>(0)
const categorySelectorRef = ref<InstanceType<typeof CategorySelector> | null>(null)
const amountFieldRef = ref<HTMLDivElement | null>(null)
const isDeleting = ref(false)

// Mobile detection
const isMobile = ref(false)

const checkMobile = () => {
  isMobile.value = window.innerWidth < 768 // Tailwind's md breakpoint
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
})

const formData = ref<UpdateScheduledTransactionDto>({
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
  selectedPayeeName.value = payeeName
  formData.value.payee = payeeName

  if (payee?.last_category_id) {
    selectedCategoryId.value = payee.last_category_id
    formData.value.category_id = payee.last_category_id

    nextTick(() => {
      const amountInput = amountFieldRef.value?.querySelector('input[type="number"]') as HTMLInputElement
      if (amountInput) {
        amountInput.focus()
        amountInput.select()
      }
    })
  } else {
    nextTick(() => {
      categorySelectorRef.value?.focus()
    })
  }
}

const handleCategorySelect = () => {
  formData.value.category_id = selectedCategoryId.value || undefined

  nextTick(() => {
    const amountInput = amountFieldRef.value?.querySelector('input[type="number"]') as HTMLInputElement
    if (amountInput) {
      amountInput.focus()
      amountInput.select()
    }
  })
}

// Function to populate form from transaction
const populateForm = (transaction: ScheduledTransactionResponse) => {
  selectedPayeeName.value = transaction.payee
  selectedCategoryId.value = transaction.category_id || null
  amountValue.value = Math.abs(transaction.amount)

  formData.value = {
    payee: transaction.payee,
    amount: transaction.amount,
    category_id: transaction.category_id,
    memo: transaction.memo,
    frequency: transaction.frequency,
    specific_date: transaction.specific_date,
    day_of_month: transaction.day_of_month,
    day_of_week: transaction.day_of_week,
    month_of_year: transaction.month_of_year,
    is_active: transaction.is_active
  }
}

// Populate form when transaction changes
watch(() => props.transaction, (transaction) => {
  if (transaction && props.isOpen) {
    populateForm(transaction)
  }
}, { immediate: true })

// Also populate when modal opens
watch(() => props.isOpen, (isOpen) => {
  if (isOpen && props.transaction) {
    populateForm(props.transaction)
  }
})

const handleSubmit = () => {
  if (!props.transaction) return

  // Always outflow (negative amount) for scheduled transactions
  const finalAmount = -Math.abs(amountValue.value)

  const data: UpdateScheduledTransactionDto = {
    ...formData.value,
    amount: finalAmount
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

  emit('save', props.transaction.id, data)
}

const handleDelete = async () => {
  if (!props.transaction || isDeleting.value) return

  isDeleting.value = true

  try {
    emit('delete', props.transaction.id)

    // Keep loading state until parent closes the form
    await new Promise(resolve => setTimeout(resolve, 500))
  } finally {
    isDeleting.value = false
  }
}
</script>

