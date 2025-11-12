<template>
  <div class="flex h-screen">
    <Sidebar :budgetId="currentBudgetId" />

    <div class="flex-1 bg-background overflow-auto">
      <div class="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary/80 mb-3">
            <BarChart3Icon class="h-4 w-4" />
            <span>Reports & Analytics</span>
          </div>
          <h1 class="text-5xl font-bold text-foreground mb-2">Financial Insights</h1>
          <p class="text-muted-foreground max-w-2xl">Track your spending patterns and financial trends over time</p>
        </div>

        <!-- Date Range Selector and View Toggle -->
        <div class="mb-8 flex items-center gap-6">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-foreground">Time Period:</label>
            <select
              v-model="selectedPeriod"
              @change="loadAllReports"
              class="px-3 py-2 pr-8 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none bg-no-repeat bg-right"
              style="background-image: url('data:image/svg+xml;charset=UTF-8,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 24 24%27 fill=%27none%27 stroke=%27%23ffffff%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27%3e%3cpolyline points=%276 9 12 15 18 9%27%3e%3c/polyline%3e%3c/svg%3e'); background-position: right 0.5rem center; background-size: 1.25rem;"
            >
              <option value="1">Last Month</option>
              <option value="3">Last 3 Months</option>
              <option value="6">Last 6 Months</option>
              <option value="12">Last Year</option>
              <option value="24">Last 2 Years</option>
            </select>
          </div>

          <!-- View Toggle -->
          <div class="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
            <button
              @click="viewMode = 'category'"
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                viewMode === 'category'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
            >
              By Category
            </button>
            <button
              @click="viewMode = 'group'"
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                viewMode === 'group'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              ]"
            >
              By Category Group
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="isLoading" class="flex items-center justify-center py-20">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p class="text-muted-foreground">Loading reports...</p>
          </div>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="bg-destructive/10 border border-destructive rounded-lg p-4 mb-6">
          <p class="text-destructive">{{ error }}</p>
        </div>

        <!-- Reports Grid -->
        <div v-else class="space-y-8">
          <!-- Two Charts Side by Side -->
          <div class="grid grid-cols-2 gap-6">
            <!-- Top Spending Categories -->
            <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
                  <BarChart3Icon class="w-5 h-5 text-primary" />
                  {{ viewMode === 'group' ? 'Top Spending Category Groups' : 'Top Spending Categories' }}
                </h2>
              </div>
              <div class="h-80">
                <Bar v-if="topCategoriesData" :data="topCategoriesData" :options="topCategoriesOptions" />
                <div v-else class="flex items-center justify-center h-full text-muted-foreground">
                  No data available
                </div>
              </div>
            </div>

            <!-- Category Breakdown Pie Chart -->
            <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-semibold text-foreground flex items-center gap-2">
                  <PieChartIcon class="w-5 h-5 text-primary" />
                  {{ viewMode === 'group' ? 'Spending by Category Group' : 'Spending by Category' }}
                </h2>
              </div>
              <div class="h-80 flex items-center justify-center">
                <Doughnut v-if="categoryBreakdownData" :data="categoryBreakdownData" :options="categoryBreakdownOptions" />
                <div v-else class="text-muted-foreground">
                  No breakdown data available
                </div>
              </div>
            </div>
          </div>

          <!-- Summary Stats -->
          <div class="grid grid-cols-3 gap-6">
            <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div class="text-sm text-muted-foreground mb-1">Total Spending</div>
              <div class="text-2xl font-bold text-red-600">{{ formatCurrency(totalExpenses) }}</div>
              <div class="text-xs text-muted-foreground mt-2">For selected period</div>
            </div>
            <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div class="text-sm text-muted-foreground mb-1">{{ viewMode === 'group' ? 'Top Category Group' : 'Top Category' }}</div>
              <div class="text-2xl font-bold text-foreground">{{ topCategory?.category_name || 'N/A' }}</div>
              <div class="text-xs text-muted-foreground mt-2">{{ topCategory ? formatCurrency(topCategory.total_spent) : '' }}</div>
            </div>
            <div class="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div class="text-sm text-muted-foreground mb-1">Largest Transaction</div>
              <div class="text-2xl font-bold text-foreground">{{ largestTransaction ? formatCurrency(largestTransaction.amount) : 'N/A' }}</div>
              <div class="text-xs text-muted-foreground mt-2">{{ largestTransaction?.payee || '' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Bar, Doughnut } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  type ChartOptions
} from 'chart.js';
import {
  BarChart3Icon,
  PieChartIcon
} from 'lucide-vue-next';
import Sidebar from '@/components/Sidebar.vue';
import { useBudgetStore } from '@/stores/budget.store';
import { formatCurrency } from '@/utils/currencyUtil';
import { ReportsService } from '@/services/reports.service';
import { useMainDataOperations } from '@/composables/common/useMainDataOperations';
import type {
  CategorySpendingResponse,
  CategoryGroupSpendingResponse,
  CategoryBreakdownResponse
} from '@/types/DTO/reports.dto';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const router = useRouter();
const budgetStore = useBudgetStore();
const { ensureDataLoaded } = useMainDataOperations();

const selectedPeriod = ref(1); // Default to this month
const viewMode = ref<'category' | 'group'>('category'); // Default to category view
const isLoading = ref(false);
const error = ref<string | null>(null);
const currentBudgetId = computed(() => budgetStore.currentBudget?.id || '');

// Data refs
const topCategoriesResponse = ref<CategorySpendingResponse | null>(null);
const categoryBreakdownResponse = ref<CategoryBreakdownResponse | null>(null);
const topCategoryGroupsResponse = ref<CategoryGroupSpendingResponse | null>(null);
const categoryGroupBreakdownResponse = ref<any | null>(null);

// Color palette for charts
const chartColors = [
  'rgba(59, 130, 246, 0.8)',   // blue
  'rgba(16, 185, 129, 0.8)',   // emerald
  'rgba(245, 158, 11, 0.8)',   // amber
  'rgba(239, 68, 68, 0.8)',    // red
  'rgba(168, 85, 247, 0.8)',   // purple
  'rgba(236, 72, 153, 0.8)',   // pink
  'rgba(20, 184, 166, 0.8)',   // teal
  'rgba(251, 146, 60, 0.8)',   // orange
  'rgba(132, 204, 22, 0.8)',   // lime
  'rgba(14, 165, 233, 0.8)',   // sky
];

// Load all reports
const loadAllReports = async () => {
  if (!currentBudgetId.value) {
    console.warn('No budget ID available for reports');
    return;
  }

  isLoading.value = true;
  error.value = null;

  try {
    const params = {
      budget_id: currentBudgetId.value,
      months: selectedPeriod.value,
      limit: 10
    };

    console.log('Loading reports with params:', params);

    const [categories, breakdown, categoryGroups, groupBreakdown] = await Promise.all([
      ReportsService.getTopSpendingCategories(params),
      ReportsService.getCategoryBreakdown(params),
      ReportsService.getTopSpendingCategoryGroups(params),
      ReportsService.getCategoryGroupBreakdown(params)
    ]);

    console.log('Reports loaded:', { categories, breakdown, categoryGroups, groupBreakdown });

    topCategoriesResponse.value = categories;
    categoryBreakdownResponse.value = breakdown;
    topCategoryGroupsResponse.value = categoryGroups;
    categoryGroupBreakdownResponse.value = groupBreakdown;
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load reports';
    console.error('Error loading reports:', err);
  } finally {
    isLoading.value = false;
  }
};

// Chart data computeds
const topCategoriesData = computed(() => {
  if (viewMode.value === 'group') {
    if (!topCategoryGroupsResponse.value) return null;
    return {
      labels: topCategoryGroupsResponse.value.category_groups.map(g => g.category_group_name),
      datasets: [{
        label: 'Total Spent',
        data: topCategoryGroupsResponse.value.category_groups.map(g => g.total_spent),
        backgroundColor: chartColors,
        borderWidth: 0
      }]
    };
  } else {
    if (!topCategoriesResponse.value) return null;
    return {
      labels: topCategoriesResponse.value.categories.map(c => c.category_name),
      datasets: [{
        label: 'Total Spent',
        data: topCategoriesResponse.value.categories.map(c => c.total_spent),
        backgroundColor: chartColors,
        borderWidth: 0
      }]
    };
  }
});

const topCategoriesOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  indexAxis: 'y',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${formatCurrency(context.parsed.x)}`
      }
    }
  },
  scales: {
    x: {
      ticks: {
        callback: (value) => formatCurrency(Number(value))
      }
    }
  }
}));

const categoryBreakdownData = computed(() => {
  if (viewMode.value === 'group') {
    if (!categoryGroupBreakdownResponse.value) return null;

    const breakdown = categoryGroupBreakdownResponse.value.breakdown;
    const top8 = breakdown.slice(0, 8);
    const others = breakdown.slice(8);

    const labels = top8.map((g: any) => g.category_group_name);
    const data = top8.map((g: any) => g.amount);

    if (others.length > 0) {
      const otherTotal = others.reduce((sum: number, g: any) => sum + g.amount, 0);
      labels.push('Other');
      data.push(otherTotal);
    }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: chartColors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  } else {
    if (!categoryBreakdownResponse.value) return null;

    // Take top 8 categories and group the rest as "Other"
    const breakdown = categoryBreakdownResponse.value.breakdown;
    const top8 = breakdown.slice(0, 8);
    const others = breakdown.slice(8);

    const labels = top8.map(c => c.category_name);
    const data = top8.map(c => c.amount);

    if (others.length > 0) {
      const otherTotal = others.reduce((sum, c) => sum + c.amount, 0);
      labels.push('Other');
      data.push(otherTotal);
    }

    return {
      labels,
      datasets: [{
        data,
        backgroundColor: chartColors,
        borderWidth: 2,
        borderColor: '#fff'
      }]
    };
  }
});

const categoryBreakdownOptions = computed<ChartOptions<'doughnut'>>(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { 
      display: true, 
      position: 'right',
      labels: {
        boxWidth: 12,
        padding: 10,
        font: { size: 11 }
      }
    },
    tooltip: {
      callbacks: {
        label: (context) => {
          const label = context.label || '';
          const value = formatCurrency(context.parsed);
          const total = categoryBreakdownResponse.value?.total_expenses || 0;
          const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : '0';
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    }
  }
}));

// Summary stats
const totalExpenses = computed(() => {
  if (viewMode.value === 'group') {
    if (!categoryGroupBreakdownResponse.value) return 0;
    return categoryGroupBreakdownResponse.value.total_expenses;
  } else {
    if (!categoryBreakdownResponse.value) return 0;
    return categoryBreakdownResponse.value.total_expenses;
  }
});

const topCategory = computed(() => {
  if (viewMode.value === 'group') {
    if (!topCategoryGroupsResponse.value || topCategoryGroupsResponse.value.category_groups.length === 0) return null;
    return {
      category_name: topCategoryGroupsResponse.value.category_groups[0].category_group_name,
      total_spent: topCategoryGroupsResponse.value.category_groups[0].total_spent
    };
  } else {
    if (!topCategoriesResponse.value || topCategoriesResponse.value.categories.length === 0) return null;
    return topCategoriesResponse.value.categories[0];
  }
});

const largestTransaction = computed(() => {
  if (!categoryBreakdownResponse.value?.largest_transaction) return null;
  return categoryBreakdownResponse.value.largest_transaction;
});

onMounted(async () => {
  try {
    // Get the budget ID from current budget or localStorage
    let targetBudgetId = currentBudgetId.value;
    if (!targetBudgetId) {
      targetBudgetId = localStorage.getItem('lastVisitedBudgetId') || '';
    }

    if (!targetBudgetId) {
      console.error('No budget ID available for Reports page');
      router.push('/dashboard');
      return;
    }

    // Save this as the last visited budget
    localStorage.setItem('lastVisitedBudgetId', targetBudgetId);

    // Ensure budget data is loaded
    const success = await ensureDataLoaded(targetBudgetId);
    if (!success) {
      console.error('Failed to load budget data');
      router.push('/dashboard');
      return;
    }

    // Load reports
    await loadAllReports();
  } catch (err) {
    console.error('Error loading reports page:', err);
    router.push('/dashboard');
  }
});
</script>

