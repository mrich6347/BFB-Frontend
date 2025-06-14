<template>
  <div class="bg-card border-b">
    <div class="p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <div>
            <h1 class="text-2xl font-bold text-foreground">{{ account?.name }}</h1>
            <div class="flex items-center gap-2 mt-1">
              <Badge variant="secondary">{{ formatAccountType(account?.account_type) }}</Badge>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-6">
          <!-- Balance Display -->
          <div class="text-right">
            <div class="text-sm text-muted-foreground">Balance</div>
            <div class="text-2xl font-bold" :class="[
              account && account.working_balance < 0 ? 'text-destructive' : 'text-foreground'
            ]">
              {{ formatCurrency(account?.working_balance || 0) }}
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center gap-2">
            <Button
              @click="showUpdateBalanceModal = true"
              variant="default"
              size="sm"
              class="flex items-center gap-2"
            >
              <TrendingUp class="w-4 h-4" />
              Update Balance
            </Button>
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
          </div>
        </div>
      </div>
    </div>

    <!-- Update Balance Modal -->
    <UpdateBalanceModal
      :is-open="showUpdateBalanceModal"
      :account="account"
      @close="showUpdateBalanceModal = false"
      @updated="handleBalanceUpdated"
    />

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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import Badge from '@/components/shadcn-ui/Badge.vue'
import Button from '@/components/shadcn-ui/button.vue'
import { TrendingUp, Edit, X } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import type { AccountResponse, AccountType } from '@/types/DTO/account.dto'
import UpdateBalanceModal from './UpdateBalanceModal.vue'
import EditAccountModal from '@/components/accounts/EditAccountModal.vue'
import CloseAccountModal from '@/components/accounts/CloseAccountModal.vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  account?: AccountResponse
}>()

const emit = defineEmits<{
  (e: 'balance-updated'): void
}>()

const router = useRouter()
const showUpdateBalanceModal = ref(false)
const showEditModal = ref(false)
const showCloseModal = ref(false)

const formatAccountType = (type?: AccountType): string => {
  if (!type) return ''
  return type.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')
}

const handleBalanceUpdated = () => {
  showUpdateBalanceModal.value = false
  emit('balance-updated')
}

const handleAccountUpdated = () => {
  showEditModal.value = false
}

const handleAccountClosed = () => {
  showCloseModal.value = false
  if (props.account) {
    router.push(`/budget/${props.account.budget_id}`)
  }
}
</script>
