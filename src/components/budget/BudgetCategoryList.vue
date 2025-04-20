<template>
  <div class="space-y-1">
    <!-- Header Row -->
    <div class="grid grid-cols-[2fr_150px_150px_150px] gap-10 text-xs font-medium text-muted-foreground px-2 py-1 border-b">
      <div class="flex items-center gap-1">
        CATEGORY
        <PlusIcon class="h-4 w-4 cursor-pointer hover:text-primary bg-primary/20 rounded-full p-0.5" />
      </div>
      <div class="text-right">ASSIGNED</div>
      <div class="text-right">ACTIVITY</div>
      <div class="text-right">AVAILABLE</div>
    </div>

    <!-- Category Groups -->
    <div v-for="group in categoryGroups" :key="group.id" class="border-b last:border-b-0">
      <!-- Group Header -->
      <div 
        class="grid grid-cols-[2fr_150px_150px_150px] gap-10 font-semibold px-2 py-1.5 cursor-pointer hover:bg-muted/50"
        @click="toggleGroup(group.id)"
      >
        <div class="flex items-center">
          <ChevronDownIcon v-if="expandedGroups.has(group.id)" class="h-4 w-4 mr-1 flex-shrink-0" />
          <ChevronRightIcon v-else class="h-4 w-4 mr-1 flex-shrink-0" />
          {{ group.name }}
        </div>
        <div class="text-right text-sm">{{ formatCurrency(group.assigned) }}</div>
        <div class="text-right text-sm">{{ formatCurrency(group.activity) }}</div>
        <div class="text-right text-sm">
            {{ formatCurrency(group.available) }}
        </div>
      </div>

      <!-- Categories within Group -->
      <div v-if="expandedGroups.has(group.id)">
        <div 
          v-for="(category, index) in group.categories" 
          :key="category.id"
          class="grid grid-cols-[2fr_150px_150px_150px] gap-10 text-sm pl-8 pr-2 py-1.5 hover:bg-muted/50 transition-colors border-b border-border/40 last:border-b-0"
        >
          <div class="flex items-center truncate">
            {{ category.name }}
          </div>
          <div class="text-right text-xs text-muted-foreground">{{ formatCurrency(category.assigned) }}</div>
          <div class="text-right text-xs text-muted-foreground">{{ formatCurrency(category.activity) }}</div>
          <div class="text-right">
            <Badge :variant="getBadgeVariant(category.available)" class="cursor-pointer">
              {{ formatCurrency(category.available) }}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ChevronRightIcon, ChevronDownIcon, PlusIcon } from 'lucide-vue-next'
import { formatCurrency } from '@/utils/currencyUtil'
import Badge from '@/components/shadcn-ui/Badge.vue'
// Mock Data
const categoryGroups = ref([
  {
    id: 'group-1',
    name: 'Primary Bills',
    assigned: 50.00,
    activity: -25.00,
    available: 25.00,
    categories: [
      { id: 'cat-1-1', name: 'Rent | $1050 | 1st (Manual)', assigned: 25.00, activity: 0.00, available: -25.00 },
      { id: 'cat-1-2', name: 'Auto Insurance | $131.61 | 4th (Checking)', assigned: 0.00, activity: 0.00, available: 0.00 },
      { id: 'cat-1-3', name: 'Visible Phone Plan | $34 | 9th (Citi)', assigned: 25.00, activity: -25.00, available: 0.00 },
    ]
  },
  {
    id: 'group-2',
    name: 'Subscriptions',
    assigned: 0.00,
    activity: 0.00,
    available: 0.00,
    categories: [
      { id: 'cat-2-1', name: 'Zwift | $21.83 | Dec 7th (Citi)', assigned: 0.00, activity: 0.00, available: 0.00 },
      { id: 'cat-2-2', name: 'Youtube | $15.14 | 12th (Citi)', assigned: 0.00, activity: 0.00, available: 0.00 },
      { id: 'cat-2-3', name: 'Claude AI | $21.84 | 13th (Citi)', assigned: 0.00, activity: 0.00, available: 0.00 },
    ]
  },
  {
    id: 'group-3',
    name: 'Monthly Living Expenses',
    assigned: 3501.89,
    activity: -3501.89,
    available: 0.00,
    categories: [
      { id: 'cat-3-1', name: 'House Fund | $1200 | 1st', assigned: 0.00, activity: 0.00, available: 0.00 },
      { id: 'cat-3-2', name: 'Retirement Funds | $2500 | 15th', assigned: 0.00, activity: 0.00, available: 0.00 },
      { id: 'cat-3-3', name: 'Groceries \u{1f95d} | $250', assigned: 78.98, activity: -78.98, available: 0.00 },
      { id: 'cat-3-4', name: 'Gas \u{1f697} | $120', assigned: 244.28, activity: -244.28, available: 0.00 },
      { id: 'cat-3-5', name: 'Random Spending \u{1f45b} | $250', assigned: 3178.63, activity: -3178.63, available: 0.00 },
    ]
  },
  {
    id: 'group-4',
    name: 'Random Stuff',
    assigned: 0.00,
    activity: 0.00,
    available: 0.00,
    categories: [
       { id: 'cat-4-1', name: 'Car Maintenance', assigned: 0.00, activity: 0.00, available: 0.00 },
    ]
  }
]);

const expandedGroups = ref<Set<string>>(new Set());

// Add all group IDs to expandedGroups initially
categoryGroups.value.forEach(group => expandedGroups.value.add(group.id));

const toggleGroup = (groupId: string) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId);
  } else {
    expandedGroups.value.add(groupId);
  }
};

const getBadgeVariant = (amount: number): 'positive' | 'negative' | 'neutral' => {
  if (amount < 0) return 'negative'
  if (amount === 0) return 'neutral'
  return 'positive'
}

// Define grid columns layout in Tailwind config or a global CSS file if not already done
// Example in tailwind.config.js:
// theme: {
//   extend: {
//     gridTemplateColumns: {
//       'budget-category-row': 'minmax(0, 2fr) repeat(3, minmax(0, 1fr))',
//     },
//   },
// },

</script>

<style scoped>
/* Add any component-specific styles here */
</style>