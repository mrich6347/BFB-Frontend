<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RouterView } from 'vue-router'
import { useTheme } from '@/composables/common/useTheme'

// Initialize color theme
useTheme()

const route = useRoute()
const router = useRouter()

onMounted(async () => {
  try {
    // always redirect to dashboard for now
    // TODO - automatically load onto last visited budget
    await router.push('/dashboard')
  } catch (error) {
    console.error('App initialization error:', error)
  }
})
</script>

<template>
  <RouterView/>
</template>
