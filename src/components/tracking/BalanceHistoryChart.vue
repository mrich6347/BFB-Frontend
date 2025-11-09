<template>
  <div class="w-full">
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="flex justify-center items-center h-64 text-destructive">
      <p>{{ error }}</p>
    </div>
    <div v-else class="h-64">
      <Line
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line } from 'vue-chartjs'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatCurrency } from '@/utils/currencyUtil'
import { useBalanceHistory } from '@/composables/tracking/useBalanceHistory'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

const props = defineProps<{
  accountId: string
  currentBalance?: number
}>()

const { balanceHistory, isLoading, error, loadBalanceHistory } = useBalanceHistory(props.accountId)

const chartData = computed(() => {
  // If no balance history, show current balance as a single point
  if (balanceHistory.value.length === 0) {
    const currentBalance = props.currentBalance || 0
    const today = new Date().toLocaleDateString()

    return {
      labels: [today],
      datasets: [
        {
          label: 'Balance',
          data: [currentBalance],
          borderColor: 'rgb(16, 185, 129)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: 'rgb(16, 185, 129)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    }
  }

  // Reverse for chart display (backend returns newest first, chart needs oldest first)
  const chartHistory = [...balanceHistory.value].reverse()

  const labels = chartHistory.map(point => {
    const date = new Date(point.date)
    return date.toLocaleDateString()
  })

  const data = chartHistory.map(point => point.balance)

  return {
    labels,
    datasets: [
      {
        label: 'Balance',
        data,
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx
          const gradient = ctx.createLinearGradient(0, 0, 0, 400)
          gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)')
          gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.15)')
          gradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)')
          return gradient
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(16, 185, 129)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointHoverBorderWidth: 3
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    title: {
      display: false
    },
    legend: {
      display: false
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      callbacks: {
        label: (context: any) => {
          // Use reversed data for tooltip since chart uses reversed data
          const chartHistory = [...balanceHistory.value].reverse()
          const point = chartHistory[context.dataIndex]
          return [
            `Balance: ${formatCurrency(context.parsed.y)}`,
            point.memo ? `Note: ${point.memo}` : ''
          ].filter(Boolean)
        }
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Date',
        font: {
          size: 12,
          weight: '600'
        }
      },
      grid: {
        display: false
      },
      ticks: {
        font: {
          size: 11
        }
      }
    },
    y: {
      title: {
        display: true,
        text: 'Balance',
        font: {
          size: 12,
          weight: '600'
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.05)',
        drawBorder: false
      },
      ticks: {
        callback: (value: any) => formatCurrency(value),
        font: {
          size: 11
        }
      }
    }
  },
  interaction: {
    intersect: false,
    mode: 'index' as const
  }
}))

onMounted(loadBalanceHistory)

// Watch for account ID changes
watch(() => props.accountId, () => {
  loadBalanceHistory()
})
</script>
