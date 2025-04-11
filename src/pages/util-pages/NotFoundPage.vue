<template>
  <div class="min-h-screen bg-background">
    
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center px-4">
        <h1 class="text-9xl font-bold text-foreground mb-4">404</h1>
        <div class="w-24 h-1 mx-auto my-6 bg-primary"></div>
        <h2 class="mb-8 text-2xl font-semibold text-foreground">
          Page Not Found
        </h2>
        <p class="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <router-link 
          to="/" 
          class="px-6 py-3 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-md transition duration-300"
        >
          Go Home
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script> 