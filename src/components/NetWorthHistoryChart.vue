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
          <button
            v-if="hasNotes"
            @click="showNotesOnChart = !showNotesOnChart"
            class="inline-flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg transition-colors"
            :class="showNotesOnChart ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-accent'"
          >
            <span>{{ showNotesOnChart ? 'Hide Notes' : 'Show Notes' }}</span>
          </button>
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
        </div>
      </div>

      <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
        <Chart ref="chartRef" type="bar" :data="chartData" :options="chartOptions" />
      </div>
    </div>

    <!-- Note Modal -->
    <Dialog :open="showNoteModal" @update:open="(value) => !value && closeNoteModal()">
      <DialogContent class="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{{ selectedDataPoint?.note ? 'Edit Note' : 'Add Note' }}</DialogTitle>
          <DialogDescription>
            Add a note to explain changes in your net worth for {{ selectedDataPoint ? formatDate(selectedDataPoint.month_date) : '' }}
          </DialogDescription>
        </DialogHeader>

        <div class="space-y-4">
          <div>
            <label class="text-sm font-medium text-foreground mb-2 block">Note</label>
            <textarea
              v-model="noteText"
              class="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows="4"
              placeholder="e.g., Bought a new car, Got a raise, Paid off student loans..."
            ></textarea>
          </div>

          <div class="flex gap-2 justify-end">
            <button
              @click="closeNoteModal"
              class="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
            <button
              v-if="selectedDataPoint?.note"
              @click="handleDeleteNote"
              :disabled="isSavingNote"
              class="px-4 py-2 text-sm border border-destructive/50 text-destructive rounded-lg hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              Delete Note
            </button>
            <button
              @click="handleSaveNote"
              :disabled="isSavingNote"
              class="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {{ isSavingNote ? 'Saving...' : 'Save Note' }}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { Chart } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions
} from 'chart.js'
import { TrendingUpIcon, UploadIcon } from 'lucide-vue-next'
import { NetWorthHistoryService } from '@/services/net-worth-history.service'
import type { NetWorthChartResponse, NetWorthChartDataPoint } from '@/types/DTO/net-worth-history.dto'
import { useBudgetStore } from '@/stores/budget.store'
import { useAccountStore } from '@/stores/account.store'
import { useUserProfileStore } from '@/stores/user-profile.store'
import { useToast } from 'vue-toast-notification'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { AccountType } from '@/types/DTO/account.dto'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn-ui'

// Helper function to wrap text
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  words.forEach(word => {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const metrics = ctx.measureText(testLine)

    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  })

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}

// Custom plugin to display notes on the chart
const notesPlugin = {
  id: 'notesPlugin',
  afterDatasetsDraw(chart: any) {
    // Access the show notes state from the chart's config
    const showNotes = chart.config.options.plugins?.notesPlugin?.showNotes
    if (!showNotes) return

    const ctx = chart.ctx
    const dataPoints = chart.config.options.plugins?.notesPlugin?.dataPoints
    if (!dataPoints) return

    // Get the Net Worth dataset (index 2)
    const meta = chart.getDatasetMeta(2)
    if (!meta) return

    ctx.save()
    ctx.font = 'bold 11px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'bottom'

    // Track used positions to avoid overlaps
    const usedPositions: { x: number; y: number; width: number; height: number }[] = []

    dataPoints.forEach((point: any, index: number) => {
      if (!point.note) return

      const dataPoint = meta.data[index]
      if (!dataPoint) return

      const x = dataPoint.x
      let y = dataPoint.y - 15 // Start above the point

      // Measure text
      const maxWidth = 150
      const lines = wrapText(ctx, point.note, maxWidth)
      const lineHeight = 14
      const padding = 6
      const boxWidth = Math.min(maxWidth, Math.max(...lines.map(line => ctx.measureText(line).width))) + padding * 2
      const boxHeight = lines.length * lineHeight + padding * 2

      // Adjust position to avoid overlaps
      let attempts = 0
      while (attempts < 10) {
        const overlaps = usedPositions.some(pos => {
          return !(x + boxWidth / 2 < pos.x - pos.width / 2 ||
                   x - boxWidth / 2 > pos.x + pos.width / 2 ||
                   y < pos.y + pos.height ||
                   y - boxHeight > pos.y)
        })

        if (!overlaps) break

        y -= boxHeight + 5 // Move up if overlapping
        attempts++
      }

      // Keep within chart bounds vertically
      if (y - boxHeight < chart.chartArea.top) {
        y = dataPoint.y + boxHeight + 15 // Place below if too high
      }

      // Calculate box position
      let boxX = x - boxWidth / 2
      const boxY = y - boxHeight

      // Keep within chart bounds horizontally
      if (boxX < chart.chartArea.left) {
        boxX = chart.chartArea.left + 5 // Add small padding from left edge
      } else if (boxX + boxWidth > chart.chartArea.right) {
        boxX = chart.chartArea.right - boxWidth - 5 // Add small padding from right edge
      }

      // Draw background box
      ctx.fillStyle = 'rgba(234, 179, 8, 0.95)' // Yellow background
      ctx.strokeStyle = 'rgba(234, 179, 8, 1)'
      ctx.lineWidth = 2

      ctx.beginPath()
      ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 4)
      ctx.fill()
      ctx.stroke()

      // Draw text (centered in the box)
      ctx.fillStyle = '#000'
      const textX = boxX + boxWidth / 2
      lines.forEach((line, lineIndex) => {
        ctx.fillText(line, textX, boxY + padding + (lineIndex + 1) * lineHeight)
      })

      // Draw connector line to point
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(x, dataPoint.y)
      ctx.lineTo(x, y)
      ctx.stroke()

      // Track this position
      usedPositions.push({ x, y: boxY, width: boxWidth, height: boxHeight })
    })

    ctx.restore()
  }
}

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  BarController,
  LineController,
  Title,
  Tooltip,
  Legend,
  Filler,
  notesPlugin
)

const budgetStore = useBudgetStore()
const accountStore = useAccountStore()
const userProfileStore = useUserProfileStore()
const $toast = useToast()

const isLoading = ref(false)
const chartResponse = ref<NetWorthChartResponse | null>(null)
const showNoteModal = ref(false)
const selectedDataPoint = ref<NetWorthChartDataPoint | null>(null)
const noteText = ref('')
const isSavingNote = ref(false)
const showNotesOnChart = ref(false)
const chartRef = ref<any>(null)

// Watch for toggle changes and force chart update
watch(showNotesOnChart, () => {
  // Use setTimeout to ensure chart is ready
  setTimeout(() => {
    if (chartRef.value?.chart) {
      chartRef.value.chart.update('none') // 'none' mode for immediate update without animation
    }
  }, 0)
})

// Watch for chart data changes and ensure chart is updated
watch(chartResponse, () => {
  setTimeout(() => {
    if (chartRef.value?.chart) {
      chartRef.value.chart.update()
    }
  }, 100) // Small delay to ensure chart is fully rendered
})

const currentBudget = computed(() => budgetStore.currentBudget)

// Helper function to calculate age at a specific date
const calculateAgeAtDate = (birthdate: string, targetDate: string): number => {
  const birthDate = new Date(birthdate)
  const target = new Date(targetDate)
  let age = target.getFullYear() - birthDate.getFullYear()
  const monthDiff = target.getMonth() - birthDate.getMonth()

  // Adjust age if birthday hasn't occurred yet in the target year
  if (monthDiff < 0 || (monthDiff === 0 && target.getDate() < birthDate.getDate())) {
    age--
  }

  return age
}

const hasNotes = computed(() => {
  return chartResponse.value?.data_points.some(point => point.note) ?? false
})

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
      // Net Worth - Emerald line with dots (matches app color scheme)
      {
        type: 'line' as const,
        label: 'Net Worth',
        data: dataPoints.map(point => point.net_worth),
        borderColor: 'rgb(16, 185, 129)', // Emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderWidth: 3,
        fill: false,
        tension: 0.4,
        pointRadius: dataPoints.map(point => point.note ? 6 : 5),
        pointHoverRadius: dataPoints.map(point => point.note ? 8 : 7),
        pointBackgroundColor: dataPoints.map(point => point.note ? 'rgb(234, 179, 8)' : 'rgb(16, 185, 129)'), // Yellow for notes, emerald otherwise
        pointBorderColor: '#fff',
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
  onClick: (_event, elements) => {
    if (elements.length > 0) {
      const element = elements[0]
      // Only handle clicks on the Net Worth line (dataset index 2)
      if (element.datasetIndex === 2) {
        const dataIndex = element.index
        const dataPoints = chartResponse.value?.data_points
        if (dataPoints && dataPoints[dataIndex]) {
          openNoteModal(dataPoints[dataIndex])
        }
      }
    }
  },
  plugins: {
    notesPlugin: {
      showNotes: showNotesOnChart.value,
      dataPoints: chartResponse.value?.data_points || []
    },
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
        title: (tooltipItems) => {
          // Customize title to include age if birthdate is set
          if (tooltipItems.length > 0) {
            const dataIndex = tooltipItems[0].dataIndex
            const dataPoints = chartResponse.value?.data_points
            const monthDate = dataPoints?.[dataIndex]?.month_date

            if (monthDate) {
              const formattedDate = formatDate(monthDate)
              const birthdate = userProfileStore.currentProfile?.birthdate

              if (birthdate) {
                const age = calculateAgeAtDate(birthdate, monthDate)
                return `${formattedDate} | Age ${age}`
              }

              return formattedDate
            }
          }
          return ''
        },
        label: (context) => {
          const label = context.dataset.label || ''
          const value = formatCurrency(context.parsed.y)
          return `${label}: ${value}`
        },
        footer: (tooltipItems) => {
          // Add note to tooltip if it exists
          const dataIndex = tooltipItems[0]?.dataIndex
          if (dataIndex !== undefined) {
            const dataPoints = chartResponse.value?.data_points
            const note = dataPoints?.[dataIndex]?.note
            if (note) {
              return '💡 ' + note
            }
          }
          return ''
        }
      },
      footerFont: {
        size: 13,
        weight: 'bold'
      },
      footerColor: 'rgb(234, 179, 8)' // Yellow to match the point color
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

const openNoteModal = (dataPoint: NetWorthChartDataPoint) => {
  selectedDataPoint.value = dataPoint
  noteText.value = dataPoint.note || ''
  showNoteModal.value = true
}

const closeNoteModal = () => {
  showNoteModal.value = false
  selectedDataPoint.value = null
  noteText.value = ''
}

const handleSaveNote = async () => {
  if (!currentBudget.value || !selectedDataPoint.value) return

  isSavingNote.value = true
  try {
    await NetWorthHistoryService.updateNote({
      budget_id: currentBudget.value.id,
      month_date: selectedDataPoint.value.month_date,
      note: noteText.value || undefined
    })

    // Update the local data
    if (chartResponse.value) {
      const dataPoint = chartResponse.value.data_points.find(
        p => p.month_date === selectedDataPoint.value!.month_date
      )
      if (dataPoint) {
        dataPoint.note = noteText.value || undefined
      }
    }

    closeNoteModal()
  } catch (error) {
    console.error('Failed to save note:', error)
    $toast.error('Failed to save note')
  } finally {
    isSavingNote.value = false
  }
}

const handleDeleteNote = async () => {
  if (!currentBudget.value || !selectedDataPoint.value) return

  isSavingNote.value = true
  try {
    await NetWorthHistoryService.updateNote({
      budget_id: currentBudget.value.id,
      month_date: selectedDataPoint.value.month_date,
      note: undefined
    })

    // Update the local data
    if (chartResponse.value) {
      const dataPoint = chartResponse.value.data_points.find(
        p => p.month_date === selectedDataPoint.value!.month_date
      )
      if (dataPoint) {
        dataPoint.note = undefined
      }
    }

    closeNoteModal()
  } catch (error) {
    console.error('Failed to delete note:', error)
    $toast.error('Failed to delete note')
  } finally {
    isSavingNote.value = false
  }
}

onMounted(() => {
  loadHistory()
})
</script>

