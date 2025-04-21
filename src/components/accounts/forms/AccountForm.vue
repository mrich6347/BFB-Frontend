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
      type="number" 
      name="current_balance"
      label="Current Balance"
      step="0.01" 
      validation="required|number"
      placeholder="0.00"
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
  (e: 'submit', data: CreateAccountDto): void;
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
  
  // Check against the store, case-insensitive
  return !accountStore.accountExistsByName(value);
};

const handleSubmit = async (formData: Omit<CreateAccountDto, 'budget_id' | 'id'>) => {
  // Add budget_id before emitting
  const completeFormData: CreateAccountDto = {
      ...formData,
      id: props.initialValues?.id || '', // Add id if in edit mode
      budget_id: props.budgetId,
      interest_rate: props.initialValues?.interest_rate || null, // Add default null values if not provided
      minimum_monthly_payment: props.initialValues?.minimum_monthly_payment || null,
  };
  emit('submit', completeFormData);
};
</script> 