<template>
  <div class="stats-container">
    <div class="stats-grid">
      <div 
        v-for="(stat, index) in stats" 
        :key="index" 
        class="stat-card"
        ref="statCards"
      >
        <div class="stat-icon" :style="{ backgroundColor: stat.iconBg }">
          <component :is="stat.icon" class="h-6 w-6" :class="stat.iconColor" />
        </div>
        <div class="stat-value" ref="statValues">{{ stat.displayValue }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { animate, stagger } from 'motion'
import { 
  UsersIcon, 
  TrendingUpIcon, 
  BarChart2Icon, 
  AwardIcon 
} from 'lucide-vue-next'

// Define the stats with their final values
const stats = [
  {
    value: 25000,
    displayValue: '0',
    label: 'Active Users',
    icon: UsersIcon,
    iconBg: 'rgba(67, 97, 238, 0.1)',
    iconColor: 'text-primary'
  },
  {
    value: 40,
    displayValue: '0',
    label: 'Average Savings Increase',
    suffix: '%',
    icon: TrendingUpIcon,
    iconBg: 'rgba(247, 37, 133, 0.1)',
    iconColor: 'text-accent'
  },
  {
    value: 1500000,
    displayValue: '0',
    label: 'Dollars Budgeted',
    prefix: '$',
    icon: BarChart2Icon,
    iconBg: 'rgba(76, 201, 240, 0.1)',
    iconColor: 'text-chart-3'
  },
  {
    value: 99,
    displayValue: '0',
    label: 'Customer Satisfaction',
    suffix: '%',
    icon: AwardIcon,
    iconBg: 'rgba(114, 9, 183, 0.1)',
    iconColor: 'text-chart-2'
  }
]

const statCards = ref([])
const statValues = ref([])

const animateValue = (element: HTMLElement, start: number, end: number, duration: number, prefix = '', suffix = '') => {
  const startTime = performance.now()
  const updateValue = (timestamp: number) => {
    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    
    // Use easeOutExpo for a nice deceleration effect
    const easeOutExpo = 1 - Math.pow(2, -10 * progress)
    
    const currentValue = Math.floor(start + (end - start) * easeOutExpo)
    
    // Format the number with commas
    const formattedValue = currentValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
    element.textContent = `${prefix}${formattedValue}${suffix}`
    
    if (progress < 1) {
      requestAnimationFrame(updateValue)
    }
  }
  
  requestAnimationFrame(updateValue)
}

onMounted(() => {
  // Animate the cards appearance
  if (statCards.value.length > 0) {
    animate(
      statCards.value,
      { opacity: [0, 1], y: [30, 0] },
      { delay: stagger(0.1), duration: 0.8, easing: 'ease-out' }
    )
  }
  
  // Animate the stat values counting up
  if (statValues.value.length > 0) {
    statValues.value.forEach((element, index) => {
      const stat = stats[index]
      
      // Start the animation after a delay based on the card's stagger
      setTimeout(() => {
        animateValue(
          element, 
          0, 
          stat.value, 
          2000, 
          stat.prefix || '', 
          stat.suffix || ''
        )
      }, 300 + index * 100)
    })
  }
})
</script>

<style scoped>
.stats-container {
  width: 100%;
  padding: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 1.5rem;
}

.stat-card {
  background-color: var(--card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--foreground);
  margin-bottom: 0.5rem;
  line-height: 1;
}

.stat-label {
  font-size: 1rem;
  color: var(--muted-foreground);
}

/* Responsive adjustments */
@media (min-width: 640px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
  
  .stat-card {
    padding: 2rem;
  }
  
  .stat-value {
    font-size: 3rem;
  }
}
</style>
