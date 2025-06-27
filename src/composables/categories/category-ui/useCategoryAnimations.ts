export function useCategoryAnimations() {
  // Method to flash categories with green background when money is assigned
  const flashCategoriesWithMoney = (categoryIds: string[]) => {
    categoryIds.forEach((categoryId, index) => {
      // Stagger the animations slightly for a nice effect
      setTimeout(() => {
        const categoryElement = document.querySelector(`[data-category-id="${categoryId}"]`)
        if (categoryElement) {
          categoryElement.classList.add('flash-money-added')

          // Remove the class after animation completes
          setTimeout(() => {
            categoryElement.classList.remove('flash-money-added')
          }, 1000)
        }
      }, index * 100) // 100ms delay between each category flash
    })
  }

  const getBadgeVariant = (amount: number | undefined | null): 'positive' | 'negative' | 'neutral' => {
    // Handle null, undefined, or NaN values
    if (amount === null || amount === undefined || isNaN(amount)) {
      amount = 0
    }

    if (amount < 0) return 'negative'
    if (amount === 0) return 'neutral'
    return 'positive'
  }

  return {
    flashCategoriesWithMoney,
    getBadgeVariant
  }
}
