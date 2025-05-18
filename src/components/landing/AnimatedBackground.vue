<template>
  <div class="animated-background">
    <div class="gradient-orb orb1"></div>
    <div class="gradient-orb orb2"></div>
    <div class="gradient-orb orb3"></div>
    <div class="grid-overlay"></div>
  </div>
</template>

<script setup lang="ts">
// No props or logic needed for this component
</script>

<style scoped>
.animated-background {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: -1;
  background-color: var(--background);
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.5;
  animation: float 20s infinite ease-in-out;
}

.orb1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
  top: -100px;
  left: -100px;
  animation-delay: 0s;
}

.orb2 {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, var(--accent) 0%, transparent 70%);
  bottom: -200px;
  right: -100px;
  animation-delay: -5s;
}

.orb3 {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, var(--chart-3) 0%, transparent 70%);
  top: 40%;
  left: 60%;
  animation-delay: -10s;
}

.grid-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: 
    linear-gradient(to right, var(--border) 1px, transparent 1px),
    linear-gradient(to bottom, var(--border) 1px, transparent 1px);
  background-size: 40px 40px;
  opacity: 0.1;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(5%, 5%) scale(1.05);
  }
  50% {
    transform: translate(0, 10%) scale(0.95);
  }
  75% {
    transform: translate(-5%, 5%) scale(1.05);
  }
}

/* Dark mode adjustments */
:is(.dark *) .grid-overlay {
  opacity: 0.05;
}

:is(.dark *) .gradient-orb {
  opacity: 0.3;
}
</style>
