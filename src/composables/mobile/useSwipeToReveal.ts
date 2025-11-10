import { ref } from 'vue'

const SWIPE_THRESHOLD = -80 // How far to swipe to reveal edit button
const SWIPE_VELOCITY_THRESHOLD = 0.3 // Minimum velocity to trigger swipe

export function useSwipeToReveal() {
  // Swipe state management
  const swipeStates = ref<Record<string, { offset: number, startX: number, startTime: number, isSwiping: boolean }>>({})
  const transactionRefs = ref<Record<string, HTMLElement>>({})

  const setTransactionRef = (id: string, el: any) => {
    if (el) {
      transactionRefs.value[id] = el
    }
  }

  const getSwipeOffset = (id: string) => {
    return swipeStates.value[id]?.offset || 0
  }

  const isSwiping = (id: string) => {
    return swipeStates.value[id]?.isSwiping || false
  }

  const closeAllSwipes = () => {
    // Close all open swipes
    Object.keys(swipeStates.value).forEach(id => {
      if (swipeStates.value[id]?.offset !== 0) {
        swipeStates.value[id] = {
          ...swipeStates.value[id],
          offset: 0,
          isSwiping: false
        }
      }
    })
  }

  const closeOtherSwipes = (currentId: string) => {
    // Close all swipes except the current one
    Object.keys(swipeStates.value).forEach(id => {
      if (id !== currentId && swipeStates.value[id]?.offset !== 0) {
        swipeStates.value[id] = {
          ...swipeStates.value[id],
          offset: 0,
          isSwiping: false
        }
      }
    })
  }

  const handleTouchStart = (event: TouchEvent, id: string) => {
    // Close other open swipes when starting a new swipe
    closeOtherSwipes(id)

    const touch = event.touches[0]
    swipeStates.value[id] = {
      offset: swipeStates.value[id]?.offset || 0,
      startX: touch.clientX,
      startTime: Date.now(),
      isSwiping: true
    }
  }

  const handleTouchMove = (event: TouchEvent, id: string) => {
    const state = swipeStates.value[id]
    if (!state) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - state.startX
    const currentOffset = state.offset || 0

    // Only allow swiping left (negative direction)
    const newOffset = Math.min(0, Math.max(SWIPE_THRESHOLD, currentOffset + deltaX))

    swipeStates.value[id] = {
      ...state,
      offset: newOffset,
      startX: touch.clientX,
      isSwiping: true
    }
  }

  const handleTouchEnd = (id: string) => {
    const state = swipeStates.value[id]
    if (!state) return

    const duration = Date.now() - state.startTime
    const distance = state.offset
    const velocity = Math.abs(distance) / duration

    // Snap to open or closed based on threshold or velocity
    if (state.offset < SWIPE_THRESHOLD / 2 || velocity > SWIPE_VELOCITY_THRESHOLD) {
      // Snap to open (reveal edit button)
      swipeStates.value[id] = { ...state, offset: SWIPE_THRESHOLD, isSwiping: false }
    } else {
      // Snap to closed
      swipeStates.value[id] = { ...state, offset: 0, isSwiping: false }
    }
  }

  const closeSwipe = (id: string) => {
    swipeStates.value[id] = { offset: 0, startX: 0, startTime: 0, isSwiping: false }
  }

  return {
    setTransactionRef,
    getSwipeOffset,
    isSwiping,
    closeAllSwipes,
    closeOtherSwipes,
    closeSwipe,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd
  }
}

