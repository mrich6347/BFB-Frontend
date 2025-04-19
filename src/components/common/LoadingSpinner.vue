<style scoped>
  .cube-loader {
    position: relative;
    /* u can choose any size */
    width: 75px;
    height: 75px;
    transform-style: preserve-3d;
    transform: rotateX(-30deg);
    animation: animate 4s linear infinite;
  }

  @keyframes animate {
    0% {
      transform: rotateX(-30deg) rotateY(0);
    }

    100% {
      transform: rotateX(-30deg) rotateY(360deg);
    }
  }

  .cube-loader .cube-wrapper {
    position: absolute;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
  }

  .cube-loader .cube-wrapper .cube-span {
    position: absolute;
    width: 100%;
    height: 100%;
    /* width 75px / 2 = 37.5px */
    transform: rotateY(calc(90deg * var(--i))) translateZ(37.5px);
    background: linear-gradient(
        to bottom,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%,
        var(--cube-color) 100%
      );
  }

  .cube-top {
    position: absolute;
    width: 75px;
    height: 75px;
    background: var(--cube-color) 100%;
    /* width 75px / 2 = 37.5px */
    transform: rotateX(90deg) translateZ(37.5px);
    transform-style: preserve-3d;
  }

  .cube-top::before {
    content: '';
    position: absolute;
    /* u can choose any size */
    width: 75px;
    height: 75px;
    background: var(--glow-color);
    transform: translateZ(-90px);
    filter: blur(10px);
    box-shadow: 0 0 10px var(--shadow-color),
                0 0 20px var(--glow-color),
                0 0 30px var(--shadow-color),
                0 0 40px var(--glow-color);
    opacity: var(--glow-opacity);
  }

  /* Theme-specific variables */
  .cube-container {
    --cube-color: var(--primary);
    --glow-color: color-mix(in srgb, var(--primary) 70%, black);
    --shadow-color: var(--card);
  }

  /* Light mode specific adjustments */
  :root .cube-container {
    --glow-opacity: 0.5;
    --glow-color: color-mix(in srgb, var(--primary) 60%, black);
    --shadow-color: transparent;
  }

  /* Dark mode specific adjustments */
  .dark .cube-container {
    --glow-opacity: 0.8;
    --glow-color: color-mix(in srgb, var(--primary) 70%, black);
    --shadow-color: var(--card);
  }
</style>

<template>
  <div class="fixed inset-0 flex items-center justify-center z-50 bg-background/50 backdrop-blur-sm">
    <div class="cube-container">
      <div class="cube-loader">
        <div class="cube-top"></div>
        <div class="cube-wrapper">
          <span class="cube-span" style="--i:0"></span>
          <span class="cube-span" style="--i:1"></span>
          <span class="cube-span" style="--i:2"></span>
          <span class="cube-span" style="--i:3"></span>
        </div>
      </div>
    </div>
  </div>
</template>
