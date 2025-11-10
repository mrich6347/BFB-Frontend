import { ref, readonly } from 'vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useAccountStore } from '@/stores/account.store'
import { useBudgetStore } from '@/stores/budget.store'
import { useCategoryStore } from '@/stores/category.store'
import { AccountService } from '@/services/account.service'
import type { TransactionResponse } from '@/types/DTO/transaction.dto'

export const useMakeCreditCardPayment = () => {
  const transactionStore = useTransactionStore()
  const accountStore = useAccountStore()
  const budgetStore = useBudgetStore()
  const categoryStore = useCategoryStore()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const makeCreditCardPayment = async (
    creditCardAccountId: string,
    amount: number,
    fromAccountId: string,
    memo?: string
  ) => {
    isLoading.value = true
    error.value = null

    const creditCardAccount = accountStore.accounts.find(acc => acc.id === creditCardAccountId)
    const cashAccount = accountStore.accounts.find(acc => acc.id === fromAccountId)

    if (!creditCardAccount || !cashAccount) {
      error.value = 'Account not found'
      isLoading.value = false
      throw new Error('Account not found')
    }

    const today = new Date().toISOString().split('T')[0]
    const positiveAmount = Math.abs(amount)

    // Create optimistic transactions
    const optimisticCreditCardTransaction: TransactionResponse = {
      id: `temp-cc-${Date.now()}-${Math.random()}`,
      user_id: '',
      account_id: creditCardAccountId,
      date: today,
      amount: positiveAmount, // Positive (inflow to credit card)
      memo: memo || 'Credit Card Payment',
      payee: `Transfer : ${cashAccount.name}`,
      category_id: undefined,
      is_cleared: true,
      is_reconciled: false,
      transfer_id: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const optimisticCashTransaction: TransactionResponse = {
      id: `temp-cash-${Date.now()}-${Math.random()}`,
      user_id: '',
      account_id: fromAccountId,
      date: today,
      amount: -positiveAmount, // Negative (outflow from cash)
      memo: memo || 'Credit Card Payment',
      payee: `Transfer : ${creditCardAccount.name}`,
      category_id: undefined,
      is_cleared: true,
      is_reconciled: false,
      transfer_id: undefined,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Optimistically add transactions to store (instant UI update)
    transactionStore.addTransaction(optimisticCreditCardTransaction)
    transactionStore.addTransaction(optimisticCashTransaction)

    // Optimistically update account balances (instant UI update)
    // Credit card: add positive amount to cleared balance (reduces debt)
    accountStore.updateAccount(creditCardAccountId, {
      cleared_balance: creditCardAccount.cleared_balance + positiveAmount,
      working_balance: creditCardAccount.working_balance + positiveAmount
    })

    // Cash account: subtract amount from cleared balance
    accountStore.updateAccount(fromAccountId, {
      cleared_balance: cashAccount.cleared_balance - positiveAmount,
      working_balance: cashAccount.working_balance - positiveAmount
    })

    try {
      const response = await AccountService.makeCreditCardPayment(creditCardAccountId, {
        amount: positiveAmount,
        from_account_id: fromAccountId,
        memo
      })

      // Remove optimistic transactions
      transactionStore.removeTransaction(optimisticCreditCardTransaction.id)
      transactionStore.removeTransaction(optimisticCashTransaction.id)

      // Add actual transactions from server
      transactionStore.addTransaction(response.linkedTransaction) // Credit card transaction
      transactionStore.addTransaction(response.transaction) // Cash transaction

      // Update stores with server response (reconcile balances)
      budgetStore.setReadyToAssign(response.readyToAssign)
      accountStore.updateAccount(creditCardAccountId, response.account)
      accountStore.updateAccount(fromAccountId, response.sourceAccount)

      // Update payment category balance if provided
      if (response.paymentCategoryBalance) {
        categoryStore.updateCategoryBalance(
          response.paymentCategoryBalance.category_id,
          response.paymentCategoryBalance
        )
      }

      return response
    } catch (err) {
      // Roll back optimistic updates on failure
      transactionStore.removeTransaction(optimisticCreditCardTransaction.id)
      transactionStore.removeTransaction(optimisticCashTransaction.id)

      // Restore original account balances
      accountStore.updateAccount(creditCardAccountId, {
        cleared_balance: creditCardAccount.cleared_balance,
        working_balance: creditCardAccount.working_balance
      })

      accountStore.updateAccount(fromAccountId, {
        cleared_balance: cashAccount.cleared_balance,
        working_balance: cashAccount.working_balance
      })

      error.value = err instanceof Error ? err.message : 'Failed to make payment'
      console.error('Error making credit card payment:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    isLoading: readonly(isLoading),
    error: readonly(error),
    makeCreditCardPayment
  }
}

