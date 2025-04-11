<template>
  <div class="min-h-screen flex items-center justify-center p-4 bg-background">
    <div class="max-w-md w-full space-y-8 p-8 bg-card rounded-xl shadow-lg">
      <div class="text-center space-y-4">
        <!-- Warning Icon -->
        <div class="flex justify-center">
          <div class="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </div>

        <h2 class="text-3xl font-bold text-foreground">Account Suspended</h2>
        <p class="text-muted-foreground">
          Your account has been temporarily suspended due to a violation of our terms of service.
        </p>

        <div class="pt-4">
          <p class="text-sm text-muted-foreground">
            If you believe this is a mistake or would like to appeal this decision,
            please contact our support team.
          </p>
        </div>

        <div class="pt-6">
          <router-link 
            to="/login" 
            class="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
          >
            Return to Login
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
</script> 