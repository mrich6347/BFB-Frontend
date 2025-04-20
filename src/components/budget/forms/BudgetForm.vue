<template>
  <FormKit
    type="form"
    @submit="handleSubmit"
    :actions="false"
    :value="initialValues"
    #default="{ state }"
  >
    <FormKit
      type="text"
      name="name"
      label="Budget Name"
      :validation-rules="{ 
        uniqueBudgetName: uniqueBudgetNameRule 
      }"
      :validation-messages="{
        uniqueBudgetName: 'Budget already exists with this name'
      }"
      validation="required|uniqueBudgetName"
      placeholder="Enter budget name"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />

    <FormKit
      type="select"
      name="currency"
      label="Currency"
      :options="commonCurrencies.map(c => ({ label: `${c.code} - ${c.name} (${c.symbol})`, value: c.code }))"
      :validation="'required|length:3|matches:' + commonCurrencies.map(c => c.code).join(',')"
      placeholder="Select currency"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />

    <FormKit
      type="select"
      name="currency_placement"
      label="Currency Placement"
      :options="[
        { label: '$123.45', value: 'BEFORE' },
        { label: '123.45$', value: 'AFTER' }
      ]"
      :validation="'required|matches:' + Object.values(CurrencyPlacement).join(',')"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />

    <FormKit
      type="select"
      name="number_format"
      label="Number Format"
      :options="[
        { label: '123,456.78', value: NumberFormat.DOT_COMMA },
        { label: '123.456,78', value: NumberFormat.COMMA_COMMA },
        { label: '123,456.789', value: NumberFormat.DOT_COMMA_THREE },
        { label: '123 456.78', value: NumberFormat.SPACE_DOT },
        { label: '123\'456.78', value: NumberFormat.APOSTROPHE_DOT },
        { label: '123.456', value: NumberFormat.DOT_NO_DECIMAL },
        { label: '123,456', value: NumberFormat.COMMA_NO_DECIMAL },
        { label: '123 456-78', value: NumberFormat.SPACE_HYPHEN },
        { label: '123 456,78', value: NumberFormat.SPACE_COMMA }
      ]"
      :validation="'required|matches:' + Object.values(NumberFormat).join(',')"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />

    <FormKit
      type="select"
      name="date_format"
      label="Date Format"
      :options="[
        { label: '2025/12/30', value: DateFormat.ISO },
        { label: '2025-12-30', value: DateFormat.HYPHEN },
        { label: '30-12-2025', value: DateFormat.EUROPEAN },
        { label: '30/12/2025', value: DateFormat.UK_SLASH },
        { label: '30.12.2025', value: DateFormat.PERIOD },
        { label: '12/30/2025', value: DateFormat.US_SLASH },
        { label: '2025.12.30', value: DateFormat.DOT_NOTATION }
      ]"
      :validation="'required|matches:' + Object.values(DateFormat).join(',')"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />

    <div class="flex justify-end gap-3 mt-6">
      <button
        type="button"
        @click="$emit('cancel')"
        class="px-4 py-2 text-sm font-medium border rounded-md border-input bg-background hover:bg-accent"
      >
        Cancel
      </button>
      <FormKit
        type="submit"
        :disabled="isLoading || state.valid === false"
        input-class="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50"
      >
        <span>{{ isLoading ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Budget' : 'Create Budget') }}</span>
      </FormKit>
    </div>
  </FormKit>
</template>

<script setup lang="ts">
import type { CreateBudgetDto } from '@/types/DTO/budget.dto'
import { commonCurrencies } from '@/utils/currencyUtil'
import { NumberFormat, CurrencyPlacement, DateFormat } from '@/types/DTO/budget.dto'
import { useBudgetStore } from '@/stores/budget.store'
import type { FormKitNode } from '@formkit/core'

const budgetStore = useBudgetStore()


interface Props {
  isLoading: boolean
  mode: 'create' | 'edit'
  initialValues?: Partial<CreateBudgetDto>
}

const props = withDefaults(defineProps<Props>(), {
  initialValues: () => ({}),
  mode: 'create'
})

const emit = defineEmits<{
  (e: 'submit', data: CreateBudgetDto): void
  (e: 'cancel'): void
}>()


// Custom validation rule for unique budget name
const uniqueBudgetNameRule = (node: FormKitNode): boolean => {
  const value = node.value as string
  if (!value) return true
  
  // If we're in edit mode and the name hasn't changed, it's valid
  if (props.mode === 'edit' && value === props.initialValues?.name) {
    return true
  }
  
  return !budgetStore.budgetExistsByName(value)
}

const handleSubmit = async (formData: CreateBudgetDto) => {
  emit('submit', formData)
}
</script> 