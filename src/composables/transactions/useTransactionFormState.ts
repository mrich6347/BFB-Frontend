import { computed, reactive, ref, watch, isRef, unref, type Ref } from 'vue'
import { useCategoryStore } from '@/stores/category.store'
import { useGetTransferOptions } from '@/composables/accounts/account-read/useGetTransferOptions'
import { TransferService } from '@/services/transfer.service'
import type {
  CreateTransactionDto,
  TransactionResponse,
  UpdateTransactionDto
} from '@/types/DTO/transaction.dto'
import type { AccountResponse } from '@/types/DTO/account.dto'

export type TransactionFormValues = {
  date: string
  payee: string
  category_id: string
  memo: string
  amount: number
  is_cleared: boolean
}

export interface UseTransactionFormStateOptions {
  accountId: string
  transaction?: TransactionResponse | Ref<TransactionResponse | null | undefined> | null
}

const getTodayIsoString = () => new Date().toISOString().split('T')[0]

export const createEmptyTransactionFormValues = (): TransactionFormValues => ({
  date: getTodayIsoString(),
  payee: '',
  category_id: '',
  memo: '',
  amount: 0,
  is_cleared: false
})

export const mapTransactionToFormValues = (
  transaction: TransactionResponse
): TransactionFormValues => ({
  date: transaction.date,
  payee: transaction.payee || '',
  category_id:
    transaction.category_id === null
      ? 'ready-to-assign'
      : transaction.category_id || '',
  memo: transaction.memo || '',
  amount: Math.abs(transaction.amount),
  is_cleared: transaction.is_cleared
})

interface BuildPayloadOptions {
  accountId: string
  amountType: 'inflow' | 'outflow'
  selectedPayee: string
}

export const buildTransactionPayload = (
  values: TransactionFormValues,
  { accountId, amountType, selectedPayee }: BuildPayloadOptions
): CreateTransactionDto | UpdateTransactionDto => {
  const payeeValue = selectedPayee || values.payee || ''
  const isTransfer = TransferService.isTransferPayee(payeeValue)
  const normalizedAmount =
    isTransfer || amountType === 'outflow'
      ? -Math.abs(values.amount)
      : Math.abs(values.amount)

  return {
    ...values,
    amount: normalizedAmount,
    account_id: accountId,
    category_id: values.category_id || undefined,
    payee: payeeValue || undefined
  }
}

export const useTransactionFormState = ({
  accountId,
  transaction = null
}: UseTransactionFormStateOptions) => {
  const categoryStore = useCategoryStore()
  const { getTransferOptions } = useGetTransferOptions()

  const transactionRef = isRef(transaction)
    ? transaction
    : ref<TransactionResponse | null | undefined>(transaction)

  const formValues = reactive<TransactionFormValues>(
    unref(transactionRef)
      ? mapTransactionToFormValues(unref(transactionRef) as TransactionResponse)
      : createEmptyTransactionFormValues()
  )

  const amountType = ref<'inflow' | 'outflow'>(
    unref(transactionRef) && (unref(transactionRef) as TransactionResponse).amount >= 0
      ? 'inflow'
      : 'outflow'
  )

  const selectedPayee = ref(formValues.payee)

  const payeeMode = ref<'select' | 'custom'>(
    !selectedPayee.value || TransferService.isTransferPayee(selectedPayee.value)
      ? 'select'
      : 'custom'
  )

  const transferOptions = ref<AccountResponse[]>([])

  const maxDate = computed(() => getTodayIsoString())

  const payeeOptions = computed(() =>
    transferOptions.value.map(account => ({
      label: TransferService.formatTransferPayee(account.name),
      value: TransferService.formatTransferPayee(account.name)
    }))
  )

  // Filter out credit card payment categories
  const isCreditCardPaymentCategory = (categoryId: string) => {
    const category = categoryStore.categories.find(c => c.id === categoryId)
    if (!category) return false

    const categoryGroup = categoryStore.getCategoryGroupById(category.category_group_id)
    return categoryGroup?.name === 'Credit Card Payments' && categoryGroup?.is_system_group === true
  }

  const categoryOptions = computed(() => [
    { label: 'Uncategorized', value: '' },
    { label: 'Ready to Assign', value: 'ready-to-assign' },
    ...categoryStore.categories
      .filter(category => !isCreditCardPaymentCategory(category.id))
      .map(category => ({
        label: category.name,
        value: category.id
      }))
  ])

  const isTransferTransaction = computed(() =>
    TransferService.isTransferPayee(selectedPayee.value)
  )

  const loadTransferOptions = async () => {
    try {
      transferOptions.value = await getTransferOptions(accountId)
    } catch (error) {
      console.error('Failed to load transfer options:', error)
    }
  }

  const resetForm = () => {
    const defaults = createEmptyTransactionFormValues()
    Object.assign(formValues, defaults)
    amountType.value = 'outflow'
    selectedPayee.value = ''
    payeeMode.value = 'select'
  }

  const applyTransaction = (value?: TransactionResponse | null) => {
    if (!value) {
      resetForm()
      return
    }

    const mapped = mapTransactionToFormValues(value)
    Object.assign(formValues, mapped)
    amountType.value = value.amount >= 0 ? 'inflow' : 'outflow'
    selectedPayee.value = mapped.payee
    payeeMode.value =
      !mapped.payee || TransferService.isTransferPayee(mapped.payee)
        ? 'select'
        : 'custom'
  }

  watch(
    transactionRef,
    newTransaction => {
      applyTransaction(newTransaction as TransactionResponse | null | undefined)
    },
    { immediate: false }
  )

  watch(
    () => selectedPayee.value,
    newPayee => {
      if (TransferService.isTransferPayee(newPayee)) {
        amountType.value = 'outflow'
      }
    }
  )

  return {
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
    resetForm,
    buildPayload: () =>
      buildTransactionPayload(formValues, {
        accountId,
        amountType: amountType.value,
        selectedPayee: selectedPayee.value
      })
  }
}


