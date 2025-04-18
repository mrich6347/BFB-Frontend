<script setup lang="ts">
import { useTheme } from '@/composables/common/useTheme'
import { RouterView } from 'vue-router'

// Initialize theme
useTheme()
</script>

<template>
  <RouterView />
</template>

<style scoped>
</style>
