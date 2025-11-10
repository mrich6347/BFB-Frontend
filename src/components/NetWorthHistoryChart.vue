<template>
  <div class="space-y-6">
    <!-- Empty State - No Data -->
    <div v-if="!hasData && !isLoading" class="rounded-xl border border-border bg-card p-8 shadow-sm">
      <div class="flex flex-col items-center justify-center text-center space-y-4">
        <div class="rounded-full bg-primary/10 p-4">
          <TrendingUpIcon class="h-8 w-8 text-primary" />
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-semibold text-foreground">Track Your Net Worth Over Time</h3>
          <p class="text-sm text-muted-foreground max-w-md">
            Upload your YNAB net worth export to see your financial journey visualized.
            You can export this data from YNAB's Net Worth report.
          </p>
        </div>
        <div class="flex gap-3">
          <label
            for="csv-upload"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 cursor-pointer transition-colors"
          >
            <UploadIcon class="h-4 w-4" />
            <span>Upload YNAB CSV</span>
          </label>
          <input
            id="csv-upload"
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleFileUpload"
          />
        </div>
      </div>
    </div>

    <!-- Loading State - Skeleton -->
    <div v-if="isLoading" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="h-5 w-48 bg-muted rounded animate-pulse"></div>
        <div class="flex gap-2">
          <div class="h-8 w-32 bg-muted rounded animate-pulse"></div>
          <div class="h-8 w-32 bg-muted rounded animate-pulse"></div>
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <!-- Chart skeleton -->
        <div class="h-[400px] flex items-end justify-between gap-1 px-4">
          <div v-for="i in 20" :key="i" class="flex-1 bg-muted rounded-t animate-pulse"
               :style="{ height: `${Math.random() * 60 + 40}%` }"></div>
        </div>
      </div>
    </div>

    <!-- Chart Display -->
    <div v-if="hasData && !isLoading" class="space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 text-sm font-medium uppercase tracking-wide text-primary/80">
          <TrendingUpIcon class="h-4 w-4" />
          <span>Net Worth History</span>
        </div>
        <div class="flex gap-2">
          <label
            for="csv-upload-replace"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-accent cursor-pointer transition-colors"
          >
            <UploadIcon class="h-3.5 w-3.5" />
            <span>Replace Data</span>
          </label>
          <input
            id="csv-upload-replace"
            type="file"
            accept=".csv"
            class="hidden"
            @change="handleFileUpload"
          />
          <button
            @click="handleDeleteHistory"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-destructive/50 text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <TrashIcon class="h-3.5 w-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <Chart type="bar" :data="chartData" :options="chartOptions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Chart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions
} from 'chart.js'
import { TrendingUpIcon, UploadIcon, TrashIcon } from 'lucide-vue-next'
import { NetWorthHistoryService } from '@/services/net-worth-history.service'
import type { NetWorthChartResponse } from '@/types/DTO/net-worth-history.dto'
import { useBudgetStore } from '@/stores/budget.store'
import { useAccountStore } from '@/stores/account.store'
import { useToast } from 'vue-toast-notification'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { AccountType } from '@/types/DTO/account.dto'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const budgetStore = useBudgetStore()
const accountStore = useAccountStore()
const $toast = useToast()

const isLoading = ref(false)
const chartResponse = ref<NetWorthChartResponse | null>(null)

const currentBudget = computed(() => budgetStore.currentBudget)

// Helper function to get balance (same as NetWorthPage)
const getNetWorthBalance = (account: any) => {
  if (account.working_balance !== undefined && account.working_balance !== null) {
    const workingBalance = Number(account.working_balance)
    if (!Number.isNaN(workingBalance)) {
      return workingBalance
    }
  }

  const accountBalance = Number(account.account_balance ?? 0)
  return Number.isNaN(accountBalance) ? 0 : accountBalance
}

// Calculate current net worth from active accounts (same logic as NetWorthPage)
const currentNetWorth = computed(() => {
  const accounts = accountStore.activeAccounts
  let cashTotal = 0
  let trackingTotal = 0
  let creditTotal = 0

  accounts.forEach((account) => {
    const balance = getNetWorthBalance(account)

    switch (account.account_type) {
      case AccountType.CASH:
        cashTotal += balance
        break
      case AccountType.TRACKING:
        trackingTotal += balance
        break
      case AccountType.CREDIT:
        creditTotal += balance
        break
      default:
        break
    }
  })

  const assets = cashTotal + trackingTotal
  const liabilities = creditTotal
  const netWorth = assets + liabilities

  return {
    assets,
    liabilities,
    netWorth
  }
})

const hasData = computed(() => chartResponse.value?.has_data ?? false)

const chartData = computed(() => {
  if (!chartResponse.value?.data_points) {
    return { labels: [], datasets: [] }
  }

  let dataPoints = [...chartResponse.value.data_points]

  // Always override current month with live data
  // Since we store YNAB data with +1 month offset, the current month's data
  // is stored as next month. E.g., November data is stored as 2025-12-01
  const currentDate = new Date()
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
  const currentMonthStorageDate = `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-01`

  // Find and remove current month if it exists (we'll replace with live data)
  const currentMonthIndex = dataPoints.findIndex(point => point.month_date === currentMonthStorageDate)
  if (currentMonthIndex !== -1) {
    dataPoints.splice(currentMonthIndex, 1)
  }

  // Always add current month with live data
  const currentMonthPoint = {
    month_date: currentMonthStorageDate,
    total_assets: currentNetWorth.value.assets,
    total_liabilities: currentNetWorth.value.liabilities,
    net_worth: currentNetWorth.value.netWorth
  }
  dataPoints.push(currentMonthPoint)

  // Sort by date to ensure proper order
  dataPoints.sort((a, b) => a.month_date.localeCompare(b.month_date))

  return {
    labels: dataPoints.map(point => formatDate(point.month_date)),
    datasets: [
      // Assets - Blue bars
      {
        type: 'bar' as const,
        label: 'Assets',
        data: dataPoints.map(point => point.total_assets),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 0,
        order: 2
      },
      // Liabilities - Red bars
      {
        type: 'bar' as const,
        label: 'Debts',
        data: dataPoints.map(point => Math.abs(point.total_liabilities)),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 0,
        order: 2
      },
      // Net Worth - White line with dots
      {
        type: 'line' as const,
        label: 'Net Worth',
        data: dataPoints.map(point => point.net_worth),
        borderColor: 'rgb(255, 255, 255)',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(255, 255, 255)',
        pointBorderColor: 'rgb(255, 255, 255)',
        pointBorderWidth: 2,
        order: 1
      }
    ]
  }
})

const chartOptions = computed<ChartOptions<'bar'>>(() => ({
  responsive: true,
  maintainAspectRatio: true,
  aspectRatio: 2.5,
  plugins: {
    legend: {
      display: true,
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 15,
        font: {
          size: 12
        }
      }
    },
    tooltip: {
      mode: 'index',
      intersect: false,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      titleFont: {
        size: 13
      },
      bodyFont: {
        size: 12
      },
      callbacks: {
        label: (context) => {
          const label = context.dataset.label || ''
          const value = formatCurrency(context.parsed.y)
          return `${label}: ${value}`
        }
      }
    }
  },
  scales: {
    x: {
      grid: {
        display: false
      },
      ticks: {
        maxRotation: 0,
        autoSkip: true,
        maxTicksLimit: 12
      }
    },
    y: {
      beginAtZero: false,
      grid: {
        color: 'rgba(255, 255, 255, 0.1)'
      },
      ticks: {
        callback: (value) => formatCurrency(Number(value)),
        font: {
          size: 11
        }
      }
    }
  },
  interaction: {
    mode: 'index',
    intersect: false
  }
}))

const firstNetWorth = computed(() => {
  const points = chartResponse.value?.data_points
  return points && points.length > 0 ? points[0].net_worth : 0
})

const latestNetWorth = computed(() => {
  const points = chartResponse.value?.data_points
  return points && points.length > 0 ? points[points.length - 1].net_worth : 0
})

const firstDate = computed(() => {
  const points = chartResponse.value?.data_points
  return points && points.length > 0 ? points[0].month_date : ''
})

const latestDate = computed(() => {
  const points = chartResponse.value?.data_points
  return points && points.length > 0 ? points[points.length - 1].month_date : ''
})

const netWorthChange = computed(() => latestNetWorth.value - firstNetWorth.value)

const netWorthChangePercent = computed(() => {
  if (firstNetWorth.value === 0) return 0
  return (netWorthChange.value / Math.abs(firstNetWorth.value)) * 100
})

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
}

const loadHistory = async () => {
  if (!currentBudget.value) return

  isLoading.value = true
  try {
    chartResponse.value = await NetWorthHistoryService.getHistory(currentBudget.value.id)
  } catch (error) {
    console.error('Failed to load net worth history:', error)
    $toast.error('Failed to load net worth history')
  } finally {
    isLoading.value = false
  }
}

const handleFileUpload = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file || !currentBudget.value) return

  isLoading.value = true
  try {
    const csvData = await file.text()
    const result = await NetWorthHistoryService.uploadYNABCSV({
      budget_id: currentBudget.value.id,
      csv_data: csvData
    })

    await loadHistory()
  } catch (error: any) {
    console.error('Failed to upload CSV:', error)
    $toast.error(error.response?.data?.message || 'Failed to upload CSV file')
  } finally {
    isLoading.value = false
    // Reset file input
    target.value = ''
  }
}

const handleDeleteHistory = async () => {
  if (!currentBudget.value) return

  if (!confirm('Are you sure you want to delete all net worth history? This cannot be undone.')) {
    return
  }

  isLoading.value = true
  try {
    await NetWorthHistoryService.deleteHistory(currentBudget.value.id)
    $toast.success('Net worth history deleted successfully')
    chartResponse.value = { has_data: false, data_points: [] }
  } catch (error) {
    console.error('Failed to delete history:', error)
    $toast.error('Failed to delete net worth history')
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadHistory()
})
</script>

