import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { RetirementSettingsResponse } from '../types/DTO/retirement-settings.dto'

export const useRetirementSettingsStore = defineStore('retirementSettings', () => {
  // State
  const retirementSettings = ref<RetirementSettingsResponse | null>(null)

  // Actions
  const setRetirementSettings = (settings: RetirementSettingsResponse | null) => {
    retirementSettings.value = settings
  }

  const reset = () => {
    retirementSettings.value = null
  }

  return {
    // State
    retirementSettings,

    // Actions
    setRetirementSettings,
    reset
  }
})

