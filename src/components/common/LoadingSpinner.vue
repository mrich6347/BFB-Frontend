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
      /* top: 0;
      left: 0; */
    transform-style: preserve-3d;
  }

  .cube-loader .cube-wrapper .cube-span {
    position: absolute;
    width: 100%;
    height: 100%;
      /* top: 0;
      left: 0; */
                                         /* width 75px / 2 = 37.5px */
    transform: rotateY(calc(90deg * var(--i))) translateZ(37.5px);
    background: linear-gradient(
        to bottom,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%,
        hsl(346.8, 77.2%, 49.8%) 100%
      );
  }

  .cube-top {
    position: absolute;
    width: 75px;
    height: 75px;
    background: hsl(346.8, 77.2%, 49.8%) 100%;
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
    background: hsl(346.8, 77.2%, 35%) 19.6%;
    transform: translateZ(-90px);
    filter: blur(10px);
    box-shadow: 0 0 10px #323232,
                  0 0 20px hsl(346.8, 77.2%, 35%) 19.6%,
                  0 0 30px #323232,
                  0 0 40px hsl(346.8, 77.2%, 35%) 19.6%;
  }
</style>

<template>
  <div class="fixed inset-0 flex items-center justify-center z-50">
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
</template>
