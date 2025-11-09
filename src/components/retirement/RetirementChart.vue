<template>
  <div class="w-full">
    <div v-if="!hasData" class="flex justify-center items-center h-96 text-muted-foreground">
      <p>Enter your retirement details to see projections</p>
    </div>
    <div v-else class="h-96">
      <Line
        :data="chartData"
        :options="chartOptions"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
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
import { formatCurrency } from '@/utils/currencyUtil'

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

interface Props {
  currentAge: number
  retirementAge: number
  monthlyContribution: number
  startingBalance: number
  annualReturn?: number
}

const props = withDefaults(defineProps<Props>(), {
  annualReturn: 0.08 // 8% default
})

const hasData = computed(() => {
  return props.currentAge > 0 && props.retirementAge > props.currentAge && props.monthlyContribution >= 0
})

// Calculate year-by-year projections using annual compounding
const projections = computed(() => {
  if (!hasData.value) return []

  const years = props.retirementAge - props.currentAge
  const annualRate = props.annualReturn
  const annualContribution = props.monthlyContribution * 12
  const data: Array<{ age: number; contributions: number; interest: number; total: number }> = []

  let balance = props.startingBalance
  let totalContributions = props.startingBalance

  // Add starting point
  data.push({
    age: props.currentAge,
    contributions: props.startingBalance,
    interest: 0,
    total: props.startingBalance
  })

  // Calculate for each year with annual compounding
  for (let year = 1; year <= years; year++) {
    // Add annual contribution at beginning of year
    balance += annualContribution
    totalContributions += annualContribution

    // Apply annual interest
    balance *= (1 + annualRate)

    const totalInterest = balance - totalContributions

    data.push({
      age: props.currentAge + year,
      contributions: totalContributions,
      interest: totalInterest,
      total: balance
    })
  }

  return data
})

const chartData = computed(() => {
  if (!hasData.value || projections.value.length === 0) {
    return {
      labels: [],
      datasets: []
    }
  }

  const labels = projections.value.map(p => `Age ${p.age}`)
  const contributionsData = projections.value.map(p => p.contributions)
  const interestData = projections.value.map(p => p.interest)

  return {
    labels,
    datasets: [
      {
        label: 'Contributions',
        data: contributionsData,
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5
      },
      {
        label: 'Interest Earned',
        data: interestData,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5
      }
    ]
  }
})

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index' as const,
    intersect: false,
  },
  plugins: {
    title: {
      display: true,
      text: 'Retirement Growth Projection',
      font: {
        size: 16,
        weight: 'bold' as const
      }
    },
    legend: {
      display: true,
      position: 'top' as const
    },
    tooltip: {
      callbacks: {
        label: (context: any) => {
          const dataIndex = context.dataIndex
          const projection = projections.value[dataIndex]
          
          if (context.datasetIndex === 0) {
            return `Contributions: ${formatCurrency(projection.contributions)}`
          } else {
            return `Interest: ${formatCurrency(projection.interest)}`
          }
        },
        footer: (tooltipItems: any) => {
          const dataIndex = tooltipItems[0].dataIndex
          const projection = projections.value[dataIndex]
          return `Total: ${formatCurrency(projection.total)}`
        }
      }
    }
  },
  scales: {
    x: {
      title: {
        display: true,
        text: 'Age',
        font: {
          size: 14,
          weight: 'bold' as const
        }
      },
      grid: {
        display: false
      },
      stacked: true
    },
    y: {
      title: {
        display: true,
        text: 'Amount',
        font: {
          size: 14,
          weight: 'bold' as const
        }
      },
      ticks: {
        callback: (value: any) => formatCurrency(value)
      },
      stacked: true
    }
  }
}))
</script>

