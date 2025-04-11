<template>
  <div class="p-8">
    <div class="flex justify-between items-center mb-6">
      <h1 class="text-2xl font-bold">Dashboard</h1>
      <button 
        @click="handleLogout" 
        class="bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-lg font-medium transition duration-200"
      >
        Logout
      </button>
    </div>
    <p v-if="loading">Loading...</p>
    <p v-else>Welcome {{ user?.user_metadata?.name || user?.email || 'to your dashboard' }}!</p>
  </div>
</template>

<script setup lang="ts">
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import type { User } from '@supabase/supabase-js'
const router = useRouter()
const user = ref<User | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await supabase.auth.getUser()
    user.value = data.user
  } catch (error) {
    console.error('Error fetching user:', error)
  } finally {
    loading.value = false
  }
})

const handleLogout = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    console.log('Logged out successfully')
    router.push('/')
  } catch (error) {
    console.error('Error logging out:', error)
  }
}
</script>

