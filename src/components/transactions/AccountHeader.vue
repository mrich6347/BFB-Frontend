<template>
  <div class="bg-background border-b border-border">
    <div class="px-6 py-4">
      <div class="flex items-center justify-between">
        <!-- Account Info -->
        <div class="flex items-center gap-4">
          <h1 class="text-2xl font-bold text-foreground">{{ account?.name || 'Account' }}</h1>
          <Badge variant="secondary" class="text-xs">
            {{ formatAccountType(account?.account_type) }}
          </Badge>
        </div>

        <!-- Account Balances and Actions -->
        <div class="flex items-center gap-6">
          <!-- Account Balances -->
          <div class="flex items-center gap-6 text-sm">
            <div class="text-center">
              <div class="text-muted-foreground">Cleared Balance</div>
              <div class="font-semibold tabular-nums" :class="getBalanceColor(account?.cleared_balance)">
                {{ formatCurrency(account?.cleared_balance || 0) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-muted-foreground">Uncleared Balance</div>
              <div class="font-semibold tabular-nums" :class="getBalanceColor(account?.uncleared_balance)">
                {{ formatCurrency(account?.uncleared_balance || 0) }}
              </div>
            </div>
            <div class="text-center">
              <div class="text-muted-foreground">Working Balance</div>
              <div class="font-semibold tabular-nums" :class="getBalanceColor(account?.working_balance)">
                {{ formatCurrency(account?.working_balance || 0) }}
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <Button
              @click="showEditModal = true"
              variant="outline"
              size="sm"
              class="flex items-center gap-2"
            >
              <Edit class="w-4 h-4" />
              Edit
            </Button>
            <Button
              @click="showCloseModal = true"
              variant="outline"
              size="sm"
              class="flex items-center gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X class="w-4 h-4" />
              Close
            </Button>
            <Button
              @click="showReconcileModal = true"
              variant="outline"
              size="sm"
              class="flex items-center gap-2"
            >
              <CheckCircle class="w-4 h-4" />
              Reconcile
            </Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Account Modal -->
    <EditAccountModal
      :is-open="showEditModal"
      :account="account"
      @close="showEditModal = false"
      @updated="handleAccountUpdated"
    />

    <!-- Close Account Modal -->
    <CloseAccountModal
      :is-open="showCloseModal"
      :account="account"
      @close="showCloseModal = false"
      @closed="handleAccountClosed"
    />

    <!-- Reconcile Modal -->
    <ReconcileModal
      :is-open="showReconcileModal"
      :account="account"
      @close="showReconcileModal = false"
      @reconciled="handleReconciled"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Badge from '@/components/shadcn-ui/Badge.vue'
import Button from '@/components/shadcn-ui/button.vue'
import { CheckCircle, Edit, X } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AccountResponse, AccountType } from '@/types/DTO/account.dto'
import ReconcileModal from '@/components/accounts/ReconcileModal.vue'
import EditAccountModal from '@/components/accounts/EditAccountModal.vue'
import CloseAccountModal from '@/components/accounts/CloseAccountModal.vue'
import { useTransactionStore } from '@/stores/transaction.store'
import { useRouter } from 'vue-router'

const props = defineProps<{
  account?: AccountResponse
}>()

const transactionStore = useTransactionStore()
const router = useRouter()
const showReconcileModal = ref(false)
const showEditModal = ref(false)
const showCloseModal = ref(false)

const formatAccountType = (type?: AccountType) => {
  if (!type) return ''
  return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
}

const getBalanceColor = (balance?: number) => {
  if (!balance) return 'text-foreground'
  return balance < 0 ? 'text-destructive' : 'text-foreground'
}

const handleReconciled = () => {
  // The reconcile modal will handle updating the account balance
  // and marking transactions as reconciled
  showReconcileModal.value = false

  // Refresh transactions to show updated reconciled status
  if (props.account) {
    transactionStore.loadTransactionsByAccount(props.account.id)
  }
}

const handleAccountUpdated = () => {
  // Account will be automatically updated in the store due to reactivity
  showEditModal.value = false
}

const handleAccountClosed = () => {
  // Account has been closed, redirect to budget page
  showCloseModal.value = false
  if (props.account) {
    router.push(`/budget/${props.account.budget_id}`)
  }
}
</script>
