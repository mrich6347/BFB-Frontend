import { defineStore } from 'pinia'
import { computed, ref, readonly } from 'vue'
import type { PayeeResponse } from '@/types/DTO/payee.dto'

type PayeeMap = Record<string, PayeeResponse[]>

export const usePayeeStore = defineStore('payeeStore', () => {
  const payeesByBudget = ref<PayeeMap>({})

  const getPayeesForBudget = computed(() => (budgetId: string) => {
    return payeesByBudget.value[budgetId] ?? []
  })

  const getPayeeById = computed(() => (budgetId: string, payeeId: string) => {
    const payees = payeesByBudget.value[budgetId] ?? []
    return payees.find(payee => payee.id === payeeId)
  })

  const getDefaultCategoryForPayee = computed(() => (budgetId: string, payeeId: string) => {
    const payee = getPayeeById.value(budgetId, payeeId)
    return payee?.last_category_id ?? null
  })

  const setPayees = (budgetId: string, payees: PayeeResponse[]) => {
    payeesByBudget.value = {
      ...payeesByBudget.value,
      [budgetId]: [...payees].sort(sortByLastUsedThenName),
    }
  }

  const upsertPayee = (payee: PayeeResponse) => {
    const existing = payeesByBudget.value[payee.budget_id] ?? []
    const index = existing.findIndex(item => item.id === payee.id)
    const updated = index >= 0
      ? [
          ...existing.slice(0, index),
          { ...existing[index], ...payee },
          ...existing.slice(index + 1),
        ]
      : [...existing, payee]

    payeesByBudget.value = {
      ...payeesByBudget.value,
      [payee.budget_id]: updated.sort(sortByLastUsedThenName),
    }
  }

  const touchPayeeUsage = (budgetId: string, payeeId: string, categoryId?: string | null, lastUsedAt?: string) => {
    const payees = payeesByBudget.value[budgetId]
    if (!payees) {
      return
    }

    const index = payees.findIndex(payee => payee.id === payeeId)
    if (index === -1) {
      return
    }

    const updatedPayee: PayeeResponse = {
      ...payees[index],
      last_category_id: categoryId ?? payees[index].last_category_id ?? null,
      last_used_at: lastUsedAt ?? new Date().toISOString(),
    }

    const updated = [
      ...payees.slice(0, index),
      updatedPayee,
      ...payees.slice(index + 1),
    ].sort(sortByLastUsedThenName)

    payeesByBudget.value = {
      ...payeesByBudget.value,
      [budgetId]: updated,
    }
  }

  const reset = () => {
    payeesByBudget.value = {}
  }

  function sortByLastUsedThenName(a: PayeeResponse, b: PayeeResponse): number {
    const aTime = a.last_used_at ? new Date(a.last_used_at).getTime() : 0
    const bTime = b.last_used_at ? new Date(b.last_used_at).getTime() : 0

    if (aTime !== bTime) {
      return bTime - aTime
    }

    return a.name.localeCompare(b.name)
  }

  return {
    payeesByBudget: readonly(payeesByBudget),
    getPayeesForBudget,
    getPayeeById,
    getDefaultCategoryForPayee,
    setPayees,
    upsertPayee,
    touchPayeeUsage,
    reset,
  }
})

