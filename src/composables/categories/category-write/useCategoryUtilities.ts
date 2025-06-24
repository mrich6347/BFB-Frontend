import { useCategoryStore } from '@/stores/category.store'

export const useCategoryUtilities = () => {
  const categoryStore = useCategoryStore()

  const setIsLoading = (loading: boolean) => {
    categoryStore.setIsLoading(loading)
  }

  const resetCategoryData = () => {
    categoryStore.reset()
  }

  return {
    setIsLoading,
    resetCategoryData
  }
}
