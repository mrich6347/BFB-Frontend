<template>
  <tr
    class="group border-b border-border bg-background/40 text-sm transition-colors focus-within:bg-background/70"
    @keydown="handleKeydown"
  >
    <td class="w-12 p-2 align-middle">
      <label class="flex h-9 w-full items-center justify-center gap-2 rounded-md border border-transparent transition-colors group-focus-within:border-primary/40">
        <input
          type="checkbox"
          v-model="formValues.is_cleared"
          class="h-4 w-4 rounded border-input accent-primary"
          :disabled="isReconciled"
        />
        <span class="text-[11px] uppercase tracking-wide text-muted-foreground">C</span>
      </label>
    </td>

    <td class="w-32 p-2 align-middle">
      <div class="field-wrap">
        <input
          ref="dateInputRef"
          type="date"
          v-model="formValues.date"
          :max="maxDate"
          :class="[fieldClass, dateError && errorClass]"
        />
        <p v-if="dateError" class="field-hint">{{ dateError }}</p>
      </div>
    </td>

    <td class="p-2 align-middle">
      <div class="field-stack">
        <select
          v-if="payeeMode === 'select'"
          ref="payeeSelectRef"
          v-model="selectedPayee"
          :class="[fieldClass, 'pr-8']"
        >
          <option value="" disabled>Transfer payee…</option>
          <option
            v-for="option in payeeOptions"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </option>
          <option value="__custom">Enter custom payee…</option>
        </select>

        <input
          v-else
          ref="payeeInputRef"
          type="text"
          v-model="selectedPayee"
          placeholder="Payee"
          :class="[fieldClass]"
        />

        <div class="flex items-center gap-3 text-xs text-muted-foreground">
          <button
            v-if="payeeMode === 'select'"
            type="button"
            class="link-button"
            @click="switchToCustomPayee"
          >
            Enter custom
          </button>
          <button
            v-else
            type="button"
            class="link-button"
            @click="switchToTransferPayee"
          >
            Transfer list
          </button>
        </div>
      </div>
    </td>

    <td class="p-2 align-middle">
      <div class="field-wrap">
        <select
          v-model="formValues.category_id"
          :class="[fieldClass, 'pr-8', categoryError && errorClass]"
        >
          <option
            v-for="option in categoryOptions"
            :key="option.value || 'empty'"
            :value="option.value"
          >
            {{ option.label }}
          </option>
        </select>
        <p v-if="categoryError" class="field-hint">{{ categoryError }}</p>
      </div>
    </td>

    <td class="p-2 align-middle">
      <div class="field-wrap">
        <input
          type="text"
          v-model="formValues.memo"
          placeholder="Memo (optional)"
          :class="[fieldClass]"
        />
      </div>
    </td>

    <td class="w-40 p-2 align-middle">
      <div class="field-stack">
        <div class="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-background/60 px-2 py-1">
          <span class="text-xs uppercase tracking-wide text-muted-foreground">Amount</span>
          <div class="flex items-center gap-1">
            <button
              type="button"
              :class="[modeButtonClass, amountType === 'outflow' && modeButtonActiveClass]"
              @click="setOutflow"
            >
              Out
            </button>
            <button
              type="button"
              :class="[modeButtonClass, amountType === 'inflow' && modeButtonActiveClass]"
              @click="setInflow"
            >
              In
            </button>
          </div>
        </div>

        <input
          ref="amountInputRef"
          type="number"
          inputmode="decimal"
          min="0"
          step="0.01"
          :value="displayAmount"
          placeholder="0.00"
          :class="[amountFieldClass, amountError && errorClass]"
          @focus="selectAmount"
          @input="handleAmountInput"
          @blur="formatAmount()"
        />

        <p v-if="amountError" class="field-hint">{{ amountError }}</p>
      </div>
    </td>

    <td class="w-36 p-2 align-middle">
      <div class="flex h-9 items-center justify-end gap-2">
        <button
          type="button"
          class="h-9 rounded-md border border-border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/60"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          class="h-9 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
          :disabled="isSaveDisabled || props.isSaving"
          @click="handleSubmit"
        >
          {{ mode === 'create' ? 'Add' : 'Save' }}
        </button>
      </div>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch, toRef } from 'vue'
import { useToast } from 'vue-toast-notification'
import { TransferService } from '@/services/transfer.service'
import { useTransactionFormState } from '@/composables/transactions/useTransactionFormState'
import type {
  CreateTransactionDto,
  TransactionResponse,
  UpdateTransactionDto
} from '@/types/DTO/transaction.dto'

const props = defineProps<{
  accountId: string
  transaction?: TransactionResponse | null
  mode: 'create' | 'edit'
  isSaving?: boolean
}>()

const emit = defineEmits<{
  save: [CreateTransactionDto | UpdateTransactionDto]
  cancel: []
}>()

const {
  formValues,
  amountType,
  selectedPayee,
  payeeMode,
  payeeOptions,
  categoryOptions,
  isTransferTransaction,
  maxDate,
  loadTransferOptions,
  applyTransaction,
  buildPayload
} = useTransactionFormState({
  accountId: props.accountId,
  transaction: toRef(props, 'transaction')
})

const toast = useToast()
const dateInputRef = ref<HTMLInputElement | null>(null)
const payeeInputRef = ref<HTMLInputElement | null>(null)
const payeeSelectRef = ref<HTMLSelectElement | null>(null)
const amountInputRef = ref<HTMLInputElement | null>(null)

const amountValue = ref('')

const fieldClass =
  'h-9 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors'
const amountFieldClass = `${fieldClass} text-right tabular-nums`
const errorClass = 'border-destructive focus:border-destructive focus:ring-destructive/30'
const modeButtonClass =
  'rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary'
const modeButtonActiveClass =
  'bg-primary/10 text-primary shadow-sm'

const isReconciled = computed(() => props.transaction?.is_reconciled ?? false)

const displayAmount = computed(() => amountValue.value)

const syncAmountFromForm = () => {
  amountValue.value = formValues.amount > 0 ? formValues.amount.toString() : ''
}

watch(
  () => [amountType.value, formValues.amount],
  () => syncAmountFromForm(),
  { immediate: true }
)

const handleAmountInput = (event: Event) => {
  const input = event.target as HTMLInputElement | null
  if (!input) return
  amountValue.value = input.value
  const numeric = Number(input.value)
  if (Number.isFinite(numeric)) {
    formValues.amount = Math.abs(numeric)
  } else {
    formValues.amount = 0
  }
}

const selectAmount = () => {
  nextTick(() => amountInputRef.value?.select())
}

const setOutflow = () => {
  amountType.value = 'outflow'
  nextTick(() => amountInputRef.value?.focus())
}

const setInflow = () => {
  amountType.value = 'inflow'
  nextTick(() => amountInputRef.value?.focus())
}

const formatAmount = () => {
  if (!amountValue.value) return
  const numeric = Number(amountValue.value)
  if (Number.isFinite(numeric)) {
    amountValue.value = numeric.toFixed(2)
    formValues.amount = Math.abs(numeric)
  }
}

const focusInitialField = async () => {
  await nextTick()
  if (payeeMode.value === 'select') {
    payeeSelectRef.value?.focus()
  } else {
    payeeInputRef.value?.focus()
  }
}

const switchToCustomPayee = async () => {
  payeeMode.value = 'custom'
  if (TransferService.isTransferPayee(selectedPayee.value) || selectedPayee.value === '__custom') {
    selectedPayee.value = ''
  }
  await nextTick()
  payeeInputRef.value?.focus()
}

const switchToTransferPayee = async () => {
  payeeMode.value = 'select'
  if (!TransferService.isTransferPayee(selectedPayee.value)) {
    selectedPayee.value = ''
  }
  await nextTick()
  payeeSelectRef.value?.focus()
}

watch(selectedPayee, newValue => {
  if (newValue === '__custom') {
    switchToCustomPayee()
  }
})

const isDateValid = computed(() => Boolean(formValues.date))
const isAmountValid = computed(() => formValues.amount > 0)
const isCategoryValid = computed(
  () => !isTransferTransaction.value || Boolean(formValues.category_id)
)

const dateError = computed(() => (isDateValid.value ? '' : 'Date required'))
const amountError = computed(() =>
  isAmountValid.value ? '' : 'Enter an amount'
)
const categoryError = computed(() =>
  isCategoryValid.value ? '' : 'Transfers require a category'
)

const isSaveDisabled = computed(
  () => !(isDateValid.value && isAmountValid.value && isCategoryValid.value)
)

const handleSubmit = () => {
  if (isSaveDisabled.value || props.isSaving) {
    if (!isDateValid.value) {
      toast.error('Choose a date')
    } else if (!isAmountValid.value) {
      toast.error('Enter an amount')
    } else if (!isCategoryValid.value) {
      toast.error('Select a category for transfers')
    }
    return
  }

  emit('save', buildPayload())
}

const handleCancel = () => {
  emit('cancel')
}

const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey || event.shiftKey)) {
    event.preventDefault()
    handleSubmit()
  } else if (event.key === 'Escape') {
    event.preventDefault()
    handleCancel()
  }
}

onMounted(async () => {
  await loadTransferOptions()
  applyTransaction(props.transaction ?? null)
  syncAmountFromForm()
  await focusInitialField()
})

watch(
  () => props.transaction,
  newTransaction => {
    applyTransaction(newTransaction ?? null)
    syncAmountFromForm()
  }
)
</script>

<style scoped>
.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  position: relative;
}

.field-stack {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field-hint {
  font-size: 0.75rem;
  color: var(--destructive);
}

.link-button {
  cursor: pointer;
  color: var(--muted-foreground);
  transition: color 0.2s ease;
  text-decoration: none;
}

.link-button:hover {
  color: var(--primary);
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 2px;
}
</style>

