<template>
  <div v-if="loading" class="fixed inset-0 bg-background flex items-center justify-center z-50">
    <!-- Single clean spinner -->
    <div class="w-8 h-8 border-2 border-muted rounded-full border-t-primary animate-spin"></div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  loading: boolean
}>()
</script>

<style scoped>
/* Custom spin animation for smoother rotation */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.animate-spin {
  animation: spin 1s linear infinite;
}
</style>
