import { defineStore } from 'pinia';
import CategoryGroupService from '@/services/category-group.service';
import CategoryService from '@/services/category.service';
import type { CategoryGroupResponse, CreateCategoryGroupDto, UpdateCategoryGroupDto } from '@/types/DTO/category-group.dto';
import type { CategoryResponse, CreateCategoryDto, UpdateCategoryDto } from '@/types/DTO/category.dto';

export const useCategoryStore = defineStore('categoryStore', {
  state: () => ({
    categoryGroups: [] as CategoryGroupResponse[],
    categories: [] as CategoryResponse[],
    isLoading: true
  }),

  getters: {
    getCategoryGroupById: (state) => (id: string) => {
      return state.categoryGroups.find(group => group.id === id);
    },

    getCategoriesByGroupId: (state) => (groupId: string) => {
      return state.categories.filter(category => category.category_group_id === groupId)
        .sort((a, b) => a.display_order - b.display_order);
    },

    categoryGroupExistsByName: (state) => (name: string, budgetId: string) => {
      return state.categoryGroups.find(
        group => group.name.toLowerCase() === name.toLowerCase() && group.budget_id === budgetId
      );
    },

    categoryExistsByName: (state) => (name: string, groupId: string) => {
      return state.categories.find(
        category => category.name.toLowerCase() === name.toLowerCase() && category.category_group_id === groupId
      );
    },

    getTotalAssigned: (state) => {
      return state.categories.reduce((sum, category) => sum + (category.assigned || 0), 0);
    },

    getTotalActivity: (state) => {
      return state.categories.reduce((sum, category) => sum + (category.activity || 0), 0);
    },

    getTotalAvailable: (state) => {
      return state.categories.reduce((sum, category) => sum + (category.available || 0), 0);
    },

    getGroupTotals: (state) => (groupId: string) => {
      const groupCategories = state.categories.filter(category => category.category_group_id === groupId);

      return {
        assigned: groupCategories.reduce((sum, category) => sum + (category.assigned || 0), 0),
        activity: groupCategories.reduce((sum, category) => sum + (category.activity || 0), 0),
        available: groupCategories.reduce((sum, category) => sum + (category.available || 0), 0)
      };
    },

    sortedCategoryGroups: (state) => {
      return [...state.categoryGroups].sort((a, b) => a.display_order - b.display_order);
    }
  },

  actions: {
    async fetchCategoryGroups(budgetId: string) {
      this.isLoading = true;
      try {
        const categoryGroups = await CategoryGroupService.getAllCategoryGroups(budgetId);
        this.categoryGroups = categoryGroups;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchCategories(budgetId: string) {
      this.isLoading = true;
      try {
        const categories = await CategoryService.getCategoriesByBudget(budgetId);
        this.categories = categories;
      } finally {
        this.isLoading = false;
      }
    },

    async fetchAllCategoryData(budgetId: string) {
      this.isLoading = true;
      try {
        const [categoryGroups, categories] = await Promise.all([
          CategoryGroupService.getAllCategoryGroups(budgetId),
          CategoryService.getCategoriesByBudget(budgetId)
        ]);

        this.categoryGroups = categoryGroups;
        this.categories = categories;
      } finally {
        this.isLoading = false;
      }
    },

    async createCategoryGroup(request: CreateCategoryGroupDto) {
      // Create a temporary ID for optimistic updates
      const tempId = 'temp-' + Date.now();

      // Create a temporary response for optimistic UI update
      const tempResponse: CategoryGroupResponse = {
        id: tempId,
        name: request.name,
        budget_id: request.budget_id,
        display_order: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Store original groups in case we need to revert
      const originalGroups = [...this.categoryGroups];

      try {
        // Optimistically update the UI
        // Update display_order for existing groups locally
        this.categoryGroups.forEach(group => {
          if (group.budget_id === request.budget_id) {
            group.display_order += 1;
          }
        });

        // Add the temporary group to the array
        this.categoryGroups.push(tempResponse);

        // Set display_order to 0 to place it at the top
        const createRequest = {
          ...request,
          display_order: 0
        };

        // Make the actual API call in the background
        const response = await CategoryGroupService.createCategoryGroup(createRequest);

        // Replace the temporary group with the real one
        const tempIndex = this.categoryGroups.findIndex(group => group.id === tempId);
        if (tempIndex !== -1) {
          this.categoryGroups[tempIndex] = response;
        }

        // After successful creation, reorder all groups on the server to match our optimistic update
        const groupIds = this.categoryGroups
          .filter(group => group.budget_id === response.budget_id)
          .sort((a, b) => a.display_order - b.display_order)
          .map(group => group.id);

        // Fire and forget - don't await this call
        CategoryGroupService.reorderCategoryGroups({ group_ids: groupIds })
          .catch(error => console.error('Failed to reorder category groups after creation:', error));

        return response;
      } catch (error) {
        // If the API call fails, revert to the original state
        console.error('Failed to create category group:', error);
        this.categoryGroups = originalGroups;
        throw error;
      }
    },

    async updateCategoryGroup(id: string, request: UpdateCategoryGroupDto) {
      const response = await CategoryGroupService.updateCategoryGroup(id, request);
      const index = this.categoryGroups.findIndex(group => group.id === id);

      if (index !== -1) {
        this.categoryGroups[index] = response;
      }

      return response;
    },

    async deleteCategoryGroup(id: string) {
      await CategoryGroupService.deleteCategoryGroup(id);
      this.categoryGroups = this.categoryGroups.filter(group => group.id !== id);
      // Also remove all categories in this group
      this.categories = this.categories.filter(category => category.category_group_id !== id);
    },

    async createCategory(request: CreateCategoryDto) {
      // Create a temporary ID for optimistic updates
      const tempId = 'temp-' + Date.now();

      // Create a temporary response for optimistic UI update
      const tempResponse: CategoryResponse = {
        id: tempId,
        name: request.name,
        category_group_id: request.category_group_id,
        budget_id: request.budget_id,
        display_order: 0,
        assigned: 0,
        activity: 0,
        available: 0,
        created_at: new Date(),
        updated_at: new Date()
      };

      // Store original categories in case we need to revert
      const originalCategories = [...this.categories];

      try {
        // Optimistically update the UI
        // Update display_order for existing categories in the group locally
        this.categories.forEach(category => {
          if (category.category_group_id === request.category_group_id) {
            category.display_order += 1;
          }
        });

        // Add the temporary category to the array
        this.categories.push(tempResponse);

        // Set display_order to 0 to place it at the top
        const createRequest = {
          ...request,
          display_order: 0
        };

        // Make the actual API call in the background
        const response = await CategoryService.createCategory(createRequest);

        // Replace the temporary category with the real one
        const tempIndex = this.categories.findIndex(category => category.id === tempId);
        if (tempIndex !== -1) {
          this.categories[tempIndex] = response;
        }

        // After successful creation, reorder all categories in this group on the server to match our optimistic update
        const categoryIds = this.categories
          .filter(category => category.category_group_id === response.category_group_id)
          .sort((a, b) => a.display_order - b.display_order)
          .map(category => category.id);

        // Fire and forget - don't await this call
        CategoryService.reorderCategories({ category_ids: categoryIds })
          .catch(error => console.error('Failed to reorder categories after creation:', error));

        return response;
      } catch (error) {
        // If the API call fails, revert to the original state
        console.error('Failed to create category:', error);
        this.categories = originalCategories;
        throw error;
      }
    },

    async updateCategory(id: string, request: UpdateCategoryDto) {
      const response = await CategoryService.updateCategory(id, request);
      const index = this.categories.findIndex(category => category.id === id);

      if (index !== -1) {
        this.categories[index] = response;
      }

      return response;
    },

    async deleteCategory(id: string) {
      await CategoryService.deleteCategory(id);
      this.categories = this.categories.filter(category => category.id !== id);
    },

    async reorderCategoryGroups(groupIds: string[]) {
      await CategoryGroupService.reorderCategoryGroups({ group_ids: groupIds });

      // Update local display_order values
      groupIds.forEach((id, index) => {
        const groupIndex = this.categoryGroups.findIndex(group => group.id === id);
        if (groupIndex !== -1) {
          this.categoryGroups[groupIndex].display_order = index;
        }
      });
    },

    async reorderCategories(categoryIds: string[]) {
      // Optimistically update the UI first for immediate feedback
      const originalCategories = [...this.categories];

      try {
        // Update local display_order values immediately
        categoryIds.forEach((id, index) => {
          const categoryIndex = this.categories.findIndex(category => category.id === id);
          if (categoryIndex !== -1) {
            this.categories[categoryIndex].display_order = index;
          }
        });

        // Then send the update to the backend
        await CategoryService.reorderCategories({ category_ids: categoryIds });
      } catch (error) {
        // If the backend update fails, revert to the original order
        console.error('Failed to reorder categories:', error);
        this.categories = originalCategories;
        throw error;
      }
    },

    async updateCategoryBalance(categoryId: string, assigned: number, year: number, month: number) {
      // Optimistically update the UI first
      const categoryIndex = this.categories.findIndex(category => category.id === categoryId);
      const originalAssigned = categoryIndex !== -1 ? this.categories[categoryIndex].assigned : 0;
      const originalAvailable = categoryIndex !== -1 ? this.categories[categoryIndex].available : 0;

      if (categoryIndex !== -1) {
        // Calculate the difference in assigned amount
        const assignedDifference = assigned - originalAssigned;

        // Update assigned amount
        this.categories[categoryIndex].assigned = assigned;

        // Update available by adding the difference (like YNAB)
        this.categories[categoryIndex].available = originalAvailable + assignedDifference;
      }

      try {
        // Send update to backend - only update assigned, let backend calculate available
        await CategoryService.updateCategoryBalance(categoryId, { assigned }, year, month);
      } catch (error) {
        // If the backend update fails, revert to the original values
        console.error('Failed to update category balance:', error);
        if (categoryIndex !== -1) {
          this.categories[categoryIndex].assigned = originalAssigned;
          this.categories[categoryIndex].available = originalAvailable;
        }
        throw error;
      }
    },

    setCategoryGroups(categoryGroups: CategoryGroupResponse[]) {
      this.categoryGroups = categoryGroups;
    },

    setCategories(categories: CategoryResponse[]) {
      this.categories = categories;
    },

    setIsLoading(isLoading: boolean) {
      this.isLoading = isLoading;
    },

    reset() {
      this.categoryGroups = [];
      this.categories = [];
      this.isLoading = true;
    }
  }
});
