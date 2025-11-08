import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  buildTransactionPayload,
  createEmptyTransactionFormValues,
  mapTransactionToFormValues,
  type TransactionFormValues
} from '@/composables/transactions/useTransactionFormState'
import { TransferService } from '@/services/transfer.service'
import type { TransactionResponse } from '@/types/DTO/transaction.dto'

describe('useTransactionFormState helpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-03-10T12:00:00Z'))
  })

  it('creates default form values with today as date', () => {
    const defaults = createEmptyTransactionFormValues()

    expect(defaults).toEqual({
      date: '2025-03-10',
      payee: '',
      category_id: '',
      memo: '',
      amount: 0,
      is_cleared: false
    })
  })

  it('maps transaction response into form values', () => {
    const transaction: TransactionResponse = {
      id: 'txn-1',
      user_id: 'user-1',
      account_id: 'acct-1',
      amount: -52.34,
      date: '2025-02-28',
      memo: 'Groceries',
      payee: 'Local Market',
      category_id: null,
      created_at: '2025-02-28T00:00:00Z',
      updated_at: '2025-02-28T00:00:00Z',
      is_cleared: true,
      is_reconciled: false
    }

    const mapped = mapTransactionToFormValues(transaction)

    expect(mapped).toEqual({
      date: '2025-02-28',
      payee: 'Local Market',
      category_id: 'ready-to-assign',
      memo: 'Groceries',
      amount: 52.34,
      is_cleared: true
    })
  })

  it('builds payload with negative amount for outflow', () => {
    const values: TransactionFormValues = {
      date: '2025-02-28',
      payee: 'Coffee Shop',
      category_id: 'cat-123',
      memo: 'Morning coffee',
      amount: 5.25,
      is_cleared: false
    }

    const payload = buildTransactionPayload(values, {
      accountId: 'acct-1',
      amountType: 'outflow',
      selectedPayee: 'Coffee Shop'
    })

    expect(payload).toEqual({
      ...values,
      amount: -5.25,
      account_id: 'acct-1',
      category_id: 'cat-123',
      payee: 'Coffee Shop'
    })
  })

  it('builds payload with positive amount for inflow and omits empty fields', () => {
    const values: TransactionFormValues = {
      date: '2025-02-28',
      payee: '',
      category_id: '',
      memo: '',
      amount: 125.0,
      is_cleared: true
    }

    const payload = buildTransactionPayload(values, {
      accountId: 'acct-2',
      amountType: 'inflow',
      selectedPayee: ''
    })

    expect(payload).toEqual({
      date: '2025-02-28',
      payee: undefined,
      category_id: undefined,
      memo: '',
      amount: 125,
      is_cleared: true,
      account_id: 'acct-2'
    })
  })

  it('forces outflow for transfer payees regardless of selected mode', () => {
    const values: TransactionFormValues = {
      date: '2025-02-28',
      payee: TransferService.formatTransferPayee('Savings'),
      category_id: 'cat-transfer',
      memo: '',
      amount: 200,
      is_cleared: false
    }

    const payload = buildTransactionPayload(values, {
      accountId: 'acct-3',
      amountType: 'inflow',
      selectedPayee: TransferService.formatTransferPayee('Savings')
    })

    expect(payload.amount).toBe(-200)
  })
})

