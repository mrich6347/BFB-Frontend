<template>
  <Dialog :open="isOpen" @update:open="(value) => !value && close()">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Import from YNAB</DialogTitle>
        <DialogDescription>
          Upload your YNAB export zip file to create a new budget with your categories and category groups.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <!-- File Upload Area -->
        <div v-if="!isProcessing && !importResult">
          <div
            @drop="handleDrop"
            @dragover.prevent
            @dragenter.prevent
            @dragleave="handleDragLeave"
            :class="[
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragOver ? 'border-primary bg-primary/5' : 'border-border',
              'hover:border-primary hover:bg-primary/5'
            ]"
          >
            <div class="flex flex-col items-center space-y-4">
              <Upload class="h-12 w-12 text-muted-foreground" />
              <div>
                <p class="text-lg font-medium">Drop your YNAB export file here</p>
                <p class="text-sm text-muted-foreground mt-1">
                  Or click to browse for a .zip file
                </p>
              </div>
              <input
                ref="fileInput"
                type="file"
                accept=".zip"
                @change="handleFileSelect"
                class="hidden"
              />
              <Button @click="fileInput?.click()" variant="outline">
                Browse Files
              </Button>
            </div>
          </div>

          <!-- Budget Name Input -->
          <div v-if="selectedFile" class="mt-6">
            <label class="text-sm font-medium text-foreground block mb-2">
              Budget Name
            </label>
            <input
              v-model="budgetName"
              type="text"
              placeholder="Enter budget name"
              class="w-full px-3 py-2 border rounded-md bg-background border-input"
              :class="{ 'border-red-500': budgetNameError }"
            />
            <p v-if="budgetNameError" class="text-red-500 text-sm mt-1">
              {{ budgetNameError }}
            </p>
          </div>

          <!-- Selected File Info -->
          <div v-if="selectedFile" class="mt-4 p-4 bg-muted rounded-lg">
            <div class="flex items-center space-x-3">
              <FileArchive class="h-5 w-5 text-muted-foreground" />
              <div class="flex-1">
                <p class="text-sm font-medium">{{ selectedFile.name }}</p>
                <p class="text-xs text-muted-foreground">
                  {{ formatFileSize(selectedFile.size) }}
                </p>
              </div>
              <Button @click="clearFile" variant="ghost" size="sm">
                <X class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <!-- Processing State -->
        <div v-if="isProcessing" class="py-8">
          <div class="text-center mb-6">
            <LoadingSpinner class="mx-auto mb-4" />
            <h3 class="text-lg font-medium mb-2">Importing YNAB Budget</h3>
            <p class="text-sm text-muted-foreground">{{ currentProgressMessage }}</p>
          </div>

          <!-- Progress Steps -->
          <div class="space-y-3">
            <div v-for="(step, index) in importSteps" :key="step.id"
                 class="flex items-center space-x-3 p-3 rounded-lg transition-all duration-300"
                 :class="getStepClasses(step, index)">

              <!-- Step Icon -->
              <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300"
                   :class="getStepIconClasses(step, index)">
                <CheckCircle v-if="step.status === 'complete'" class="h-5 w-5 text-white" />
                <LoadingSpinner v-else-if="step.status === 'active'" class="h-4 w-4" />
                <div v-else class="w-2 h-2 rounded-full bg-current"></div>
              </div>

              <!-- Step Content -->
              <div class="flex-1">
                <p class="font-medium text-sm" :class="getStepTextClasses(step)">
                  {{ step.title }}
                </p>
                <p v-if="step.description" class="text-xs text-muted-foreground mt-1">
                  {{ step.description }}
                </p>
              </div>

              <!-- Step Status -->
              <div v-if="step.status === 'active'" class="text-xs text-primary font-medium">
                In Progress
              </div>
              <div v-else-if="step.status === 'complete'" class="text-xs text-green-600 font-medium">
                Complete
              </div>
            </div>
          </div>

          <!-- Overall Progress Bar -->
          <div class="mt-6">
            <div class="flex justify-between text-xs text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{{ Math.round(overallProgress) }}%</span>
            </div>
            <div class="w-full bg-muted rounded-full h-2">
              <div
                class="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
                :style="{ width: `${overallProgress}%` }"
              ></div>
            </div>
          </div>
        </div>

        <!-- Import Result -->
        <div v-if="importResult" class="text-center py-6">
          <div v-if="importResult.success" class="space-y-4">
            <div class="flex justify-center">
              <CheckCircle class="h-16 w-16 text-green-500" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-green-700">Import Successful!</h3>
              <p class="text-sm text-muted-foreground mt-2">
                Your YNAB budget has been imported successfully.
              </p>
            </div>

            <!-- Import Summary -->
            <div class="bg-green-50 border border-green-200 rounded-lg p-4 text-left">
              <h4 class="font-medium text-green-800 mb-2">Import Summary</h4>
              <ul class="text-sm text-green-700 space-y-1">
                <li>• Budget: {{ importResult.budget?.name }}</li>
                <li>• Category Groups: {{ importResult.categoryGroupsCount }}</li>
                <li>• Categories: {{ importResult.categoriesCount }}</li>
              </ul>
            </div>
          </div>

          <div v-else class="space-y-4">
            <div class="flex justify-center">
              <XCircle class="h-16 w-16 text-red-500" />
            </div>
            <div>
              <h3 class="text-lg font-medium text-red-700">Import Failed</h3>
              <p class="text-sm text-muted-foreground mt-2">
                {{ importResult.error }}
              </p>
              <p v-if="importResult.details" class="text-xs text-muted-foreground mt-1">
                {{ importResult.details }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="flex justify-end gap-3 mt-6">
        <Button variant="outline" @click="close" :disabled="isProcessing">
          {{ importResult?.success ? 'Close' : 'Cancel' }}
        </Button>
        <Button
          v-if="selectedFile && !isProcessing && !importResult"
          @click="startImport"
          :disabled="!canStartImport"
        >
          Import Budget
        </Button>
        <Button
          v-if="importResult?.success"
          @click="goToBudget"
        >
          Open Budget
        </Button>
        <Button
          v-if="importResult && !importResult.success"
          @click="resetImport"
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useBudgetStore } from '@/stores/budget.store'
import { BudgetService, type YnabImportRequest, type YnabImportResult } from '@/services/budget.service'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/shadcn-ui'
import Button from '@/components/shadcn-ui/button.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { Upload, FileArchive, X, CheckCircle, XCircle } from 'lucide-vue-next'

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'imported', budget: any): void
}>()

const router = useRouter()
const budgetStore = useBudgetStore()

// Refs
const fileInput = ref<HTMLInputElement>()

// State
const selectedFile = ref<File | null>(null)
const budgetName = ref('')
const budgetNameError = ref('')
const isDragOver = ref(false)
const isProcessing = ref(false)
const importResult = ref<YnabImportResult | null>(null)
const currentProgressMessage = ref('Preparing import...')

// Progress tracking
const importSteps = ref([
  { id: 'processing', title: 'Processing YNAB File', description: 'Reading and validating your export file', status: 'pending' },
  { id: 'budget', title: 'Creating Budget', description: 'Setting up your new budget', status: 'pending' },
  { id: 'categories', title: 'Importing Categories and Category Groups', description: 'Creating your category structure', status: 'pending' }
])

const overallProgress = ref(0)

// Computed
const canStartImport = computed(() => {
  return selectedFile.value && budgetName.value.trim() && !budgetNameError.value
})

// Methods
const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    handleFileSelection(files[0])
  }
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    handleFileSelection(target.files[0])
  }
}

const handleFileSelection = (file: File) => {
  if (!file.name.toLowerCase().endsWith('.zip')) {
    alert('Please select a ZIP file')
    return
  }

  selectedFile.value = file

  // Auto-generate budget name from filename if empty
  if (!budgetName.value) {
    const nameWithoutExt = file.name.replace(/\.zip$/i, '')
    budgetName.value = nameWithoutExt.replace(/[_-]/g, ' ')
  }

  validateBudgetName()
}

const validateBudgetName = () => {
  const name = budgetName.value.trim()
  if (!name) {
    budgetNameError.value = 'Budget name is required'
    return
  }

  if (budgetStore.budgetExistsByName(name)) {
    budgetNameError.value = 'A budget with this name already exists'
    return
  }

  budgetNameError.value = ''
}

const clearFile = () => {
  selectedFile.value = null
  budgetName.value = ''
  budgetNameError.value = ''
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const startImport = async () => {
  if (!selectedFile.value || !budgetName.value.trim()) return

  validateBudgetName()
  if (budgetNameError.value) return

  isProcessing.value = true
  resetProgress()

  try {
    // Start progress simulation
    simulateProgress()

    const importRequest: YnabImportRequest = {
      budgetName: budgetName.value.trim(),
      currency: 'USD',
      currencyPlacement: 'BEFORE',
      numberFormat: 'DOT_COMMA',
      dateFormat: 'US_SLASH'
    }

    const result = await BudgetService.importFromYnab(selectedFile.value, importRequest)

    // Complete all steps
    completeAllSteps()

    importResult.value = result

    if (result.success && result.budget) {
      // Add budget to store
      budgetStore.addBudget(result.budget)
      emit('imported', result.budget)
    }
  } catch (error) {
    console.error('Import error:', error)
    importResult.value = {
      success: false,
      error: 'Import failed',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  } finally {
    isProcessing.value = false
  }
}

const resetProgress = () => {
  importSteps.value.forEach(step => {
    step.status = 'pending'
  })
  overallProgress.value = 0
  currentProgressMessage.value = 'Preparing import...'
}

const simulateProgress = () => {
  const stepDurations = [1500, 1000, 2000] // milliseconds for each step
  let currentStepIndex = 0

  const advanceStep = () => {
    if (currentStepIndex < importSteps.value.length) {
      // Mark current step as active
      if (currentStepIndex > 0) {
        importSteps.value[currentStepIndex - 1].status = 'complete'
      }

      const currentStep = importSteps.value[currentStepIndex]
      currentStep.status = 'active'
      currentProgressMessage.value = currentStep.description || currentStep.title

      // Update overall progress
      overallProgress.value = ((currentStepIndex + 0.5) / importSteps.value.length) * 100

      currentStepIndex++

      if (currentStepIndex < importSteps.value.length) {
        setTimeout(advanceStep, stepDurations[currentStepIndex - 1])
      }
    }
  }

  advanceStep()
}

const completeAllSteps = () => {
  importSteps.value.forEach(step => {
    step.status = 'complete'
  })
  overallProgress.value = 100
  currentProgressMessage.value = 'Import completed successfully!'
}

const getStepClasses = (step: any, index: number) => {
  if (step.status === 'active') {
    return 'bg-primary/5 border border-primary/20'
  } else if (step.status === 'complete') {
    return 'bg-green-50 border border-green-200'
  }
  return 'bg-muted/30'
}

const getStepIconClasses = (step: any, index: number) => {
  if (step.status === 'active') {
    return 'bg-primary text-white'
  } else if (step.status === 'complete') {
    return 'bg-green-500 text-white'
  }
  return 'bg-muted text-muted-foreground'
}

const getStepTextClasses = (step: any) => {
  if (step.status === 'active') {
    return 'text-primary'
  } else if (step.status === 'complete') {
    return 'text-green-700'
  }
  return 'text-muted-foreground'
}

const goToBudget = () => {
  if (importResult.value?.budget) {
    router.push(`/budget/${importResult.value.budget.id}`)
    close()
  }
}

const resetImport = () => {
  importResult.value = null
  clearFile()
}

const close = () => {
  emit('close')

  // Reset state when modal closes
  setTimeout(() => {
    selectedFile.value = null
    budgetName.value = ''
    budgetNameError.value = ''
    isDragOver.value = false
    isProcessing.value = false
    importResult.value = null
  }, 300)
}
</script>
