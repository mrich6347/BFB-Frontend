<template>
  <div>
    <Sidebar />
  </div>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
const router = useRoute()

onMounted(() => {
  console.log("BUDGETID ", router.params.id)
})

</script>
