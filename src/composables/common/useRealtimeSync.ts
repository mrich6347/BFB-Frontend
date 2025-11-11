import { ref, onMounted, onUnmounted } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useMainDataOperations } from './useMainDataOperations'
import { useBudgetStore } from '@/stores/budget.store'
import type { RealtimeChannel } from '@supabase/supabase-js'

// Global state to track sync status
const isSyncActive = ref(false)
const lastSyncTime = ref<Date | null>(null)

// Track when the last local mutation happened
let lastLocalMutationTime = 0
const MUTATION_IGNORE_WINDOW_MS = 5000 // Ignore realtime changes for 5 seconds after a local mutation

// Track if changes happened while page was hidden
let changesWhileHidden = false
let pageHiddenTime: number | null = null

// Tables to monitor for changes
const MONITORED_TABLES = [
  'transactions',
  'accounts',
  'categories',
  'category_groups',
  'category_balances',
  'scheduled_transactions',
  'budgets',
  'shared_goals',
  'payees'
]

/**
 * Mark that a local mutation just happened
 * This prevents the realtime listener from triggering a refresh for our own changes
 */
export function markLocalMutation() {
  lastLocalMutationTime = Date.now()
  console.log('[RealtimeSync] 🔒 Local mutation marked at', new Date(lastLocalMutationTime).toISOString(), '- ignoring realtime changes for', MUTATION_IGNORE_WINDOW_MS, 'ms')
}

/**
 * Check if we should ignore realtime changes (because we just made a local mutation)
 */
function shouldIgnoreRealtimeChange(): boolean {
  const timeSinceLastMutation = Date.now() - lastLocalMutationTime
  const shouldIgnore = timeSinceLastMutation < MUTATION_IGNORE_WINDOW_MS

  if (shouldIgnore) {
    console.log('[RealtimeSync] ⏭️  Ignoring change (', timeSinceLastMutation, 'ms since last local mutation)')
  } else {
    console.log('[RealtimeSync] ✅ Processing change (', timeSinceLastMutation, 'ms since last local mutation)')
  }

  return shouldIgnore
}

export function useRealtimeSync() {
  const { refreshMainData } = useMainDataOperations()
  const budgetStore = useBudgetStore()
  
  let channel: RealtimeChannel | null = null
  let refreshTimeout: ReturnType<typeof setTimeout> | null = null
  
  // Debounce refresh to avoid multiple rapid refreshes
  const DEBOUNCE_MS = 500

  const triggerRefresh = () => {
    // Clear any pending refresh
    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
    }

    // Debounce the refresh
    refreshTimeout = setTimeout(async () => {
      const currentBudgetId = budgetStore.currentBudget?.id
      if (!currentBudgetId) {
        console.log('[RealtimeSync] No current budget, skipping refresh')
        return
      }

      console.log('[RealtimeSync] Triggering data refresh...')
      try {
        await refreshMainData(currentBudgetId)
        lastSyncTime.value = new Date()
        console.log('[RealtimeSync] Data refreshed successfully')
      } catch (error) {
        console.error('[RealtimeSync] Failed to refresh data:', error)
      }
    }, DEBOUNCE_MS)
  }

  const startSync = () => {
    if (isSyncActive.value) {
      console.log('[RealtimeSync] Already active, skipping')
      return
    }

    console.log('[RealtimeSync] Starting real-time sync...')

    // Create a channel for all monitored tables
    channel = supabase.channel('db-changes')

    // Subscribe to changes on all monitored tables
    MONITORED_TABLES.forEach(table => {
      channel!
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
            table: table
          },
          (payload) => {
            // Check if we should ignore this change (because we just made a local mutation)
            if (shouldIgnoreRealtimeChange()) {
              console.log(`[RealtimeSync] Ignoring change in ${table} (recent local mutation)`)
              return
            }

            console.log(`[RealtimeSync] External change detected in ${table}:`, payload.eventType)

            // If page is currently hidden, mark that changes happened instead of refreshing immediately
            if (document.hidden) {
              changesWhileHidden = true
              console.log(`[RealtimeSync] Page is hidden, marking changes for refresh on return`)
              return
            }

            triggerRefresh()
          }
        )
    })

    // Subscribe to the channel
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        isSyncActive.value = true
        console.log('[RealtimeSync] Successfully subscribed to database changes')
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[RealtimeSync] Channel error')
        isSyncActive.value = false
      } else if (status === 'TIMED_OUT') {
        console.error('[RealtimeSync] Connection timed out')
        isSyncActive.value = false
      } else if (status === 'CLOSED') {
        console.log('[RealtimeSync] Channel closed')
        isSyncActive.value = false
      }
    })
  }

  const stopSync = () => {
    if (channel) {
      console.log('[RealtimeSync] Stopping real-time sync...')
      supabase.removeChannel(channel)
      channel = null
      isSyncActive.value = false
    }

    if (refreshTimeout) {
      clearTimeout(refreshTimeout)
      refreshTimeout = null
    }
  }

  // Handle page visibility changes (when user switches apps or tabs)
  const handleVisibilityChange = () => {
    if (document.hidden) {
      // Page is now hidden (user switched to another app/tab)
      pageHiddenTime = Date.now()
      console.log('[RealtimeSync] 📱 Page hidden at', new Date(pageHiddenTime).toISOString())
    } else {
      // Page is now visible again (user came back)
      const hiddenDuration = pageHiddenTime ? Date.now() - pageHiddenTime : 0
      console.log('[RealtimeSync] 📱 Page visible again after', hiddenDuration, 'ms')

      // If changes happened while the page was hidden, refresh now
      if (changesWhileHidden) {
        console.log('[RealtimeSync] 🔄 Changes detected while hidden, refreshing now...')
        changesWhileHidden = false
        triggerRefresh()
      }

      pageHiddenTime = null
    }
  }

  // Auto-start on mount, auto-stop on unmount
  onMounted(() => {
    startSync()

    // Listen for page visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange)
    console.log('[RealtimeSync] 👁️ Visibility change listener added')
  })

  onUnmounted(() => {
    stopSync()

    // Clean up visibility listener
    document.removeEventListener('visibilitychange', handleVisibilityChange)
    console.log('[RealtimeSync] 👁️ Visibility change listener removed')
  })

  return {
    isSyncActive,
    lastSyncTime,
    startSync,
    stopSync,
    triggerRefresh
  }
}

