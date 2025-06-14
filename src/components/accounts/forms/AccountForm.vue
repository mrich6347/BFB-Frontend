<template>
  <FormKit
    type="form"
    @submit="handleSubmit"
    :actions="false"
    :value="initialValues"
    validation-visibility="live"
    #default="{ state }"
  >
    <FormKit
      type="text"
      name="name"
      label="Account Name"
      :validation-visibility="props.mode === 'edit' ? 'live' : 'blur'"
      :validation-rules="{
        uniqueAccountName: uniqueAccountNameRule
      }"
      :validation-messages="{
        uniqueAccountName: 'Account already exists with this name'
      }"
      validation="required|uniqueAccountName"
      placeholder="Enter account name"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />

    <FormKit
      v-if="mode === 'create'"
      type="select"
      name="account_type"
      label="Account Type"
      :options="accountTypeOptions"
      validation="required"
      placeholder="Select account type"
      :classes="{
        input: 'w-full px-3 py-2 border rounded-md bg-background dark:bg-background border-input dark:border-input',
        label: 'text-sm font-medium text-foreground dark:text-foreground',
        outer: 'space-y-2 mb-4',
        message: 'text-red-500 dark:text-red-400 text-sm mt-1'
      }"
    />

    <FormKit
      v-if="mode === 'create'"
      type="text"
      name="current_balance"
      label="Current Balance"
      :validation-rules="{
        validBalance: validBalanceRule
      }"
      :validation-messages="{
        validBalance: 'Please enter a valid number (e.g., 500, +500, -500, 1,234.56)'
      }"
      validation="required|validBalance"
      placeholder="0.00 (use +500 for positive credit balance)"
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
        <span>{{ isLoading ? (mode === 'edit' ? 'Updating...' : 'Creating...') : (mode === 'edit' ? 'Update Account' : 'Create Account') }}</span>
      </FormKit>
    </div>
  </FormKit>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAccountStore } from '@/stores/account.store';
import { AccountType } from '@/types/DTO/account.dto';
import type { CreateAccountDto } from '@/types/DTO/account.dto';
import type { FormKitNode } from '@formkit/core';
import { parseFormattedNumberToDecimal } from '@/utils/numberFormatUtil';

const accountStore = useAccountStore();

interface Props {
  isLoading: boolean;
  mode: 'create' | 'edit';
  initialValues?: Partial<CreateAccountDto>;
  budgetId: string; // Added budgetId prop
}

const props = withDefaults(defineProps<Props>(), {
  initialValues: () => ({ account_type: AccountType.CASH, current_balance: 0 }), // Default starting balance
  mode: 'create',
});

const emit = defineEmits<{
  (e: 'submit', data: CreateAccountDto | { name: string }): void;
  (e: 'cancel'): void;
}>();

// Format AccountType enum for select options
const formatAccountTypeDisplay = (type: AccountType): string => {
  return type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
};

const accountTypeOptions = computed(() => {
  return Object.values(AccountType).map(type => ({
    label: formatAccountTypeDisplay(type),
    value: type
  }));
});

// Custom validation rule for unique account name
const uniqueAccountNameRule = (node: FormKitNode): boolean => {
  const value = node.value as string;
  if (!value) return true;

  // If we're in edit mode and the name hasn't changed, it's valid
  if (props.mode === 'edit' && value === props.initialValues?.name) {
    return true;
  }

  // Check against the store, case-insensitive, excluding current account in edit mode
  const excludeAccountId = props.mode === 'edit' ? props.initialValues?.id : undefined;
  return !accountStore.accountExistsByName(value, excludeAccountId);
};

// Custom validation rule for valid balance format
const validBalanceRule = (node: FormKitNode): boolean => {
  const value = node.value as string;
  if (!value) return true;

  try {
    // Try to parse the value using our number format utility
    const decimalStr = parseFormattedNumberToDecimal(value);
    const parsed = parseFloat(decimalStr);

    // Check if the parsed value is a valid number
    return !isNaN(parsed) && isFinite(parsed);
  } catch (error) {
    return false;
  }
};

const handleSubmit = async (formData: any) => {
  if (props.mode === 'edit') {
    // In edit mode, only emit the name
    emit('submit', { name: formData.name });
  } else {
    // In create mode, emit the complete form data
    const completeFormData: CreateAccountDto = {
        ...formData,
        id: props.initialValues?.id || '', // Add id if in edit mode
        budget_id: props.budgetId,
        interest_rate: props.initialValues?.interest_rate || null, // Add default null values if not provided
        minimum_monthly_payment: props.initialValues?.minimum_monthly_payment || null,
    };
    emit('submit', completeFormData);
  }
};
</script>
