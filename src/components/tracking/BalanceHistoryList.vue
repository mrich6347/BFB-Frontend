<template>
  <div class="w-full">
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="flex justify-center items-center py-8 text-destructive">
      <p>{{ error }}</p>
    </div>
    <div v-else-if="balanceHistory.length === 0" class="flex justify-center items-center py-8 text-muted-foreground">
      <p>No balance updates yet</p>
    </div>
    <div v-else class="space-y-2">
      <!-- Show recent items first, with pagination for long lists -->
      <div class="max-h-96 overflow-y-auto">
        <div
          v-for="(point, index) in displayedHistory"
          :key="`${point.date}-${index}`"
          class="flex items-center justify-between p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
        >
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <div class="text-sm font-medium">
                {{ formatDate(point.date) }}
              </div>
              <div class="text-sm text-muted-foreground">
                {{ point.memo || 'Balance update' }}
              </div>
            </div>
          </div>
          <div class="text-right">
            <div class="font-semibold" :class="[
              point.balance < 0 ? 'text-destructive' : 'text-foreground'
            ]">
              {{ formatCurrency(point.balance) }}
            </div>

          </div>
        </div>
      </div>

      <!-- Show More / Show Less buttons for long lists -->
      <div v-if="balanceHistory.length > ITEMS_PER_PAGE" class="flex justify-center pt-4">
        <button
          v-if="!showAll"
          @click="showAll = true"
          class="px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Show All ({{ balanceHistory.length }} items)
        </button>
        <button
          v-else
          @click="showAll = false"
          class="px-4 py-2 text-sm text-primary hover:text-primary/80 transition-colors"
        >
          Show Less
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatCurrency } from '@/utils/currencyUtil'
import { useBalanceHistory } from '@/composables/tracking/useBalanceHistory'

const props = defineProps<{
  accountId: string
}>()

const ITEMS_PER_PAGE = 10

const { balanceHistory, isLoading, error, loadBalanceHistory } = useBalanceHistory(props.accountId)
const showAll = ref(false)

const displayedHistory = computed(() => {
  if (showAll.value || balanceHistory.value.length <= ITEMS_PER_PAGE) {
    return balanceHistory.value
  }
  return balanceHistory.value.slice(0, ITEMS_PER_PAGE)
})

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}



onMounted(loadBalanceHistory)

// Watch for account ID changes
watch(() => props.accountId, () => {
  loadBalanceHistory()
})
</script>
