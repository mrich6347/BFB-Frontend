<template>
  <button
    class="inline-flex items-center justify-center rounded-md w-10 h-10 bg-background"
    @click="toggleTheme"
    aria-label="Toggle theme"
  >
    <SunIcon v-if="isDark" class="text-foreground" size="20" aria-hidden="true" />
    <MoonIcon v-else class="text-foreground" size="20" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
import { useTheme } from '@/composables/common/useTheme'
import { SunIcon, MoonIcon } from 'lucide-vue-next'

const { isDark, toggleTheme } = useTheme()
</script> 