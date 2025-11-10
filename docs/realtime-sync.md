# Real-time Sync Implementation

## Overview
The app uses Supabase Realtime to automatically sync data across web, mobile, and multiple browser tabs.

## How It Works

### 1. Realtime Subscriptions
- Subscribes to database changes on all core tables (transactions, accounts, categories, etc.)
- Automatically triggers a full data refresh when external changes are detected
- Runs globally in `App.vue` via the `useRealtimeSync` composable

### 2. Self-Mutation Filtering
To prevent the app from refreshing when YOU make a change (only when OTHER devices/tabs make changes):

- **Axios interceptor** marks all successful mutations (POST/PATCH/PUT/DELETE)
- **3-second ignore window** after each local mutation
- During this window, all realtime changes are ignored
- After the window, external changes trigger a refresh

### 3. Debounced Refresh
- Multiple rapid changes are debounced (500ms)
- Only triggers one refresh even if many changes happen quickly
- Uses the existing `refreshMainData()` function

## Files Modified

### Core Implementation
- `src/composables/common/useRealtimeSync.ts` - Main sync logic
- `src/services/common/api.ts` - Mutation tracking interceptor
- `src/App.vue` - Global initialization

### Database Migration
- `supabase/migrations/20241201000021_enable_realtime.sql` - Enables realtime on tables

## Configuration

### Monitored Tables
```typescript
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
```

### Timing Constants
- `MUTATION_IGNORE_WINDOW_MS = 3000` - Ignore realtime for 3s after local mutation
- `DEBOUNCE_MS = 500` - Debounce multiple rapid changes

## Usage

The sync is automatic - no code changes needed in components. Just:

1. Make mutations as normal (create/update/delete)
2. Sync automatically filters out your own changes
3. External changes trigger automatic refresh

## Testing

### Test Scenario 1: Same Device, Multiple Tabs
1. Open app in two browser tabs
2. Make a transaction in Tab 1
3. Tab 1 should NOT refresh (own change)
4. Tab 2 SHOULD refresh (external change)

### Test Scenario 2: Web + Mobile
1. Open app on web browser
2. Open app on mobile device
3. Add transaction on mobile
4. Web should refresh automatically
5. Mobile should NOT refresh (own change)

### Test Scenario 3: Rapid Changes
1. Make multiple quick changes
2. Should only trigger one refresh (debounced)

## Troubleshooting

### Changes not syncing
- Check browser console for `[RealtimeSync]` logs
- Verify Supabase Realtime is enabled (migration applied)
- Check network tab for websocket connection

### Too many refreshes
- Increase `MUTATION_IGNORE_WINDOW_MS` if needed
- Check for non-mutation API calls triggering marks

### Delayed sync
- Normal - 3 second window after mutations
- Adjust `MUTATION_IGNORE_WINDOW_MS` if too long

