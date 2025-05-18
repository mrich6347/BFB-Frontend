<template>
  <div class="isometric-container">
    <!-- Main Platform -->
    <div class="platform">
      <!-- Laptop -->
      <div class="laptop" ref="laptop">
        <div class="laptop-screen">
          <div class="laptop-content">
            <div class="laptop-chart"></div>
            <div class="laptop-bars">
              <div class="laptop-bar"></div>
              <div class="laptop-bar"></div>
              <div class="laptop-bar"></div>
            </div>
          </div>
        </div>
        <div class="laptop-base"></div>
      </div>
      
      <!-- Data Blocks -->
      <div class="data-block block-1" ref="block1">
        <div class="glow"></div>
        <div class="icon">$</div>
      </div>
      
      <div class="data-block block-2" ref="block2">
        <div class="glow"></div>
        <div class="icon">%</div>
      </div>
      
      <div class="data-block block-3" ref="block3">
        <div class="glow"></div>
        <div class="icon">#</div>
      </div>
      
      <!-- Connection Lines -->
      <div class="connection-line line-1" ref="line1"></div>
      <div class="connection-line line-2" ref="line2"></div>
      <div class="connection-line line-3" ref="line3"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { animate, stagger } from 'motion'

const laptop = ref(null)
const block1 = ref(null)
const block2 = ref(null)
const block3 = ref(null)
const line1 = ref(null)
const line2 = ref(null)
const line3 = ref(null)

onMounted(() => {
  // Animate laptop
  animate(
    laptop.value,
    { y: [20, 0], opacity: [0, 1] },
    { duration: 1, easing: 'ease-out' }
  )
  
  // Animate blocks with stagger
  animate(
    [block1.value, block2.value, block3.value],
    { y: [30, 0], opacity: [0, 1] },
    { delay: stagger(0.2), duration: 0.8, easing: 'ease-out', delay: 0.5 }
  )
  
  // Animate connection lines
  animate(
    [line1.value, line2.value, line3.value],
    { opacity: [0, 1], pathLength: [0, 1] },
    { delay: stagger(0.2), duration: 1.2, easing: 'ease-out', delay: 0.8 }
  )
  
  // Continuous floating animation for all elements
  setInterval(() => {
    animate(
      laptop.value,
      { y: [0, -10, 0] },
      { duration: 4, easing: 'ease-in-out' }
    )
    
    animate(
      [block1.value, block2.value, block3.value],
      { y: [0, -8, 0] },
      { delay: stagger(0.5), duration: 3, easing: 'ease-in-out' }
    )
  }, 4000)
})
</script>

<style scoped>
.isometric-container {
  position: relative;
  width: 100%;
  height: 400px;
  perspective: 1000px;
  transform-style: preserve-3d;
}

.platform {
  position: absolute;
  width: 100%;
  height: 100%;
  transform: rotateX(60deg) rotateZ(-45deg);
  transform-style: preserve-3d;
}

/* Laptop styling */
.laptop {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) translateZ(20px);
  transform-style: preserve-3d;
}

.laptop-screen {
  width: 120px;
  height: 80px;
  background: #1a1a2e;
  border: 2px solid #4a4a6a;
  border-radius: 5px;
  transform: translateZ(5px);
  overflow: hidden;
  box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
}

.laptop-content {
  padding: 5px;
}

.laptop-chart {
  height: 30px;
  background: linear-gradient(90deg, #4361ee, #3a0ca3);
  margin-bottom: 5px;
  border-radius: 2px;
}

.laptop-bars {
  display: flex;
  justify-content: space-between;
}

.laptop-bar {
  width: 30%;
  height: 20px;
  background: #4cc9f0;
  border-radius: 2px;
}

.laptop-base {
  width: 140px;
  height: 10px;
  background: #2a2a3a;
  transform: translateY(80px) rotateX(-90deg);
  transform-origin: top;
}

/* Data blocks styling */
.data-block {
  position: absolute;
  width: 50px;
  height: 50px;
  background: rgba(30, 30, 60, 0.8);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 24px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  transform-style: preserve-3d;
  overflow: hidden;
}

.block-1 {
  top: 30%;
  left: 20%;
  background: linear-gradient(135deg, #4361ee, #3a0ca3);
  box-shadow: 0 0 20px rgba(67, 97, 238, 0.6);
}

.block-2 {
  top: 60%;
  left: 30%;
  background: linear-gradient(135deg, #f72585, #7209b7);
  box-shadow: 0 0 20px rgba(247, 37, 133, 0.6);
}

.block-3 {
  top: 40%;
  left: 70%;
  background: linear-gradient(135deg, #4cc9f0, #4361ee);
  box-shadow: 0 0 20px rgba(76, 201, 240, 0.6);
}

.glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: radial-gradient(circle at center, rgba(255, 255, 255, 0.8), transparent 70%);
  opacity: 0.2;
  mix-blend-mode: overlay;
}

/* Connection lines */
.connection-line {
  position: absolute;
  height: 2px;
  background: linear-gradient(90deg, #4cc9f0, #f72585);
  box-shadow: 0 0 10px rgba(76, 201, 240, 0.8);
  transform-origin: left;
}

.line-1 {
  top: 40%;
  left: 25%;
  width: 100px;
  transform: rotate(30deg);
}

.line-2 {
  top: 55%;
  left: 35%;
  width: 150px;
  transform: rotate(-20deg);
}

.line-3 {
  top: 35%;
  left: 55%;
  width: 80px;
  transform: rotate(10deg);
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .isometric-container {
    height: 300px;
  }
  
  .laptop-screen {
    width: 80px;
    height: 60px;
  }
  
  .laptop-base {
    width: 100px;
  }
  
  .data-block {
    width: 40px;
    height: 40px;
    font-size: 18px;
  }
}
</style>
