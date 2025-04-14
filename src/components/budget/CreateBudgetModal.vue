<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
    <div class="bg-background dark:bg-background rounded-lg shadow-lg w-full max-w-md p-6">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-foreground dark:text-foreground">Create New Budget</h3>
        <button @click="close" class="text-muted-foreground hover:text-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="name">
            Budget Name
          </label>
          <input
            id="name"
            v-model="form.name"
            type="text"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
            placeholder="Enter budget name"
          />
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="currency">
            Currency
          </label>
          <select
            id="currency"
            v-model="form.currency"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
          >
            <option v-for="currency in commonCurrencies" :key="currency.code" :value="currency.code">
              {{ currency.code }} - {{ currency.name }} ({{ currency.symbol }})
            </option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="currency_placement">
            Currency Placement
          </label>
          <select
            id="currency_placement"
            v-model="form.currency_placement"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
          >
            <option value="BEFORE">$123.45</option>
            <option value="AFTER">123.45$</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="number_format">
            Number Format
          </label>
          <select
            id="number_format"
            v-model="form.number_format"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
          >
            <option value="DOT_COMMA">123,456.78</option>
            <option value="COMMA_COMMA">123.456,78</option>
            <option value="DOT_COMMA_THREE">123,456.789</option>
            <option value="SPACE_DOT">123 456.78</option>
            <option value="APOSTROPHE_DOT">123'456.78</option>
            <option value="DOT_NO_DECIMAL">123.456</option>
            <option value="COMMA_NO_DECIMAL">123,456</option>
            <option value="SPACE_HYPHEN">123 456-78</option>
            <option value="SPACE_COMMA">123 456,78</option>
          </select>
        </div>

        <div class="space-y-2">
          <label class="text-sm font-medium text-foreground dark:text-foreground" for="date_format">
            Date Format
          </label>
          <select
            id="date_format"
            v-model="form.date_format"
            required
            class="w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input"
          >
            <option value="ISO">2025/12/30</option>
            <option value="HYPHEN">2025-12-30</option>
            <option value="EUROPEAN">30-12-2025</option>
            <option value="UK_SLASH">30/12/2025</option>
            <option value="PERIOD">30.12.2025</option>
            <option value="US_SLASH">12/30/2025</option>
            <option value="DOT_NOTATION">2025.12.30</option>
          </select>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button
            type="button"
            @click="close"
            class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90"
            :disabled="isLoading"
          >
            <span v-if="isLoading">Creating...</span>
            <span v-else>Create Budget</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useBudgetStore } from '@/stores/budgetStore'
import { CurrencyPlacement, DateFormat, NumberFormat } from '@/types/models/budget'
import type { CreateBudgetRequest } from '@/types/DTO/budget.dto'
import { commonCurrencies } from '@/utils/currencyUtil'
import { useRouter } from 'vue-router'

const router = useRouter()
defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const budgetStore = useBudgetStore()
const isLoading = ref(false)

const form = reactive<CreateBudgetRequest>({
  name: '',
  currency: 'USD',
  currency_placement: CurrencyPlacement.BEFORE,
  number_format: NumberFormat.DOT_COMMA,
  date_format: DateFormat.US_SLASH
})

const resetForm = () => {
  form.name = ''
  form.currency = 'USD'
  form.currency_placement = CurrencyPlacement.BEFORE
  form.number_format = NumberFormat.DOT_COMMA
  form.date_format = DateFormat.US_SLASH
}

const close = () => {
  emit('close')
}

const handleSubmit = async () => {
  try {
    isLoading.value = true
    const budget = await budgetStore.createBudget(form)
    close();
    router.push(`/budget/${budget.id}`)
  } catch (error) {
    console.error('Failed to create budget:', error)
  } finally {
    isLoading.value = false
    resetForm()
  }
}
</script> 