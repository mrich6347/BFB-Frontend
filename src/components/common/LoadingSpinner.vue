<template>
  <div class="flex flex-col items-center gap-4">
    <div class="relative">
      <!-- Outer spinning ring -->
      <div class="w-12 h-12 rounded-full border-4 border-primary/30 animate-[spin_2s_linear_infinite]"></div>
      <!-- Inner spinning ring -->
      <div class="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-t-primary border-l-primary border-r-transparent border-b-transparent animate-[spin_1s_linear_infinite]"></div>
    </div>
    <slot>
      <p class="text-muted-foreground text-sm">Loading...</p>
    </slot>
  </div>
</template>

<script setup lang="ts">
// Component can accept custom text through slots
</script> 