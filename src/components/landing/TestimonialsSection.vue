<template>
  <div class="testimonials-container">
    <div class="testimonials-track" ref="track">
      <!-- Testimonial Cards -->
      <div 
        v-for="(testimonial, index) in testimonials" 
        :key="index" 
        class="testimonial-card"
        ref="cards"
      >
        <div class="card-content">
          <div class="quote-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-primary/50">
              <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
              <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
            </svg>
          </div>
          <p class="testimonial-text">{{ testimonial.text }}</p>
          <div class="testimonial-author">
            <div class="author-avatar" :style="{ backgroundColor: testimonial.avatarColor }">
              {{ testimonial.initials }}
            </div>
            <div class="author-info">
              <p class="author-name">{{ testimonial.name }}</p>
              <p class="author-title">{{ testimonial.title }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Navigation Dots -->
    <div class="navigation-dots">
      <button 
        v-for="(_, index) in testimonials" 
        :key="index"
        class="nav-dot"
        :class="{ 'active': currentIndex === index }"
        @click="goToSlide(index)"
      ></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { animate, stagger } from 'motion'

const testimonials = [
  {
    text: "BFB has completely transformed how I manage my finances. The intuitive interface makes budgeting actually enjoyable!",
    name: "Sarah Johnson",
    title: "Small Business Owner",
    initials: "SJ",
    avatarColor: "#4361ee"
  },
  {
    text: "I've tried many budgeting apps, but BFB stands out with its simplicity and powerful features. I'm saving more than ever.",
    name: "Michael Chen",
    title: "Software Engineer",
    initials: "MC",
    avatarColor: "#f72585"
  },
  {
    text: "The category system in BFB helped me identify where my money was going. I've cut unnecessary spending by 30%!",
    name: "Alex Rivera",
    title: "Marketing Specialist",
    initials: "AR",
    avatarColor: "#4cc9f0"
  },
  {
    text: "As someone who was always intimidated by budgeting, BFB made it approachable and straightforward. Highly recommend!",
    name: "Taylor Williams",
    title: "Healthcare Professional",
    initials: "TW",
    avatarColor: "#7209b7"
  }
]

const track = ref(null)
const cards = ref([])
const currentIndex = ref(0)
let autoplayInterval: number | null = null

const goToSlide = (index: number) => {
  currentIndex.value = index
  if (track.value && cards.value.length > 0) {
    const cardWidth = cards.value[0].offsetWidth
    const newPosition = -index * cardWidth
    
    animate(
      track.value,
      { x: newPosition },
      { duration: 0.6, easing: [0.16, 1, 0.3, 1] }
    )
  }
}

const nextSlide = () => {
  const nextIndex = (currentIndex.value + 1) % testimonials.length
  goToSlide(nextIndex)
}

onMounted(() => {
  // Initial animation of cards
  if (cards.value.length > 0) {
    animate(
      cards.value,
      { opacity: [0, 1], y: [20, 0] },
      { delay: stagger(0.1), duration: 0.8, easing: 'ease-out' }
    )
  }
  
  // Start autoplay
  autoplayInterval = window.setInterval(nextSlide, 5000)
})

onUnmounted(() => {
  // Clear autoplay interval
  if (autoplayInterval) {
    clearInterval(autoplayInterval)
  }
})
</script>

<style scoped>
.testimonials-container {
  position: relative;
  width: 100%;
  overflow: hidden;
  padding: 2rem 0;
}

.testimonials-track {
  display: flex;
  transition: transform 0.5s ease;
}

.testimonial-card {
  min-width: 100%;
  padding: 1rem;
}

.card-content {
  background-color: var(--card);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
  border: 1px solid var(--border);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.quote-icon {
  margin-bottom: 1rem;
  opacity: 0.7;
}

.testimonial-text {
  font-size: 1.125rem;
  line-height: 1.6;
  color: var(--foreground);
  margin-bottom: 1.5rem;
  flex-grow: 1;
}

.testimonial-author {
  display: flex;
  align-items: center;
  margin-top: auto;
}

.author-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  margin-right: 1rem;
}

.author-name {
  font-weight: 600;
  color: var(--foreground);
  margin-bottom: 0.25rem;
}

.author-title {
  font-size: 0.875rem;
  color: var(--muted-foreground);
}

.navigation-dots {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
  gap: 0.5rem;
}

.nav-dot {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background-color: var(--muted);
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
}

.nav-dot.active {
  background-color: var(--primary);
  transform: scale(1.2);
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .testimonials-container {
    padding: 3rem 0;
  }
  
  .testimonial-card {
    padding: 1.5rem;
  }
}
</style>
