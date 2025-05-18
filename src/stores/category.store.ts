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
      return state.categories.reduce((sum, category) => sum + category.assigned, 0);
    },
    
    getTotalActivity: (state) => {
      return state.categories.reduce((sum, category) => sum + category.activity, 0);
    },
    
    getTotalAvailable: (state) => {
      return state.categories.reduce((sum, category) => sum + category.available, 0);
    },
    
    getGroupTotals: (state) => (groupId: string) => {
      const groupCategories = state.categories.filter(category => category.category_group_id === groupId);
      
      return {
        assigned: groupCategories.reduce((sum, category) => sum + category.assigned, 0),
        activity: groupCategories.reduce((sum, category) => sum + category.activity, 0),
        available: groupCategories.reduce((sum, category) => sum + category.available, 0)
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
      const response = await CategoryGroupService.createCategoryGroup(request);
      this.categoryGroups.push(response);
      return response;
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
      const response = await CategoryService.createCategory(request);
      this.categories.push(response);
      return response;
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
      await CategoryGroupService.reorderCategoryGroups({ category_group_ids: groupIds });
      
      // Update local display_order values
      groupIds.forEach((id, index) => {
        const groupIndex = this.categoryGroups.findIndex(group => group.id === id);
        if (groupIndex !== -1) {
          this.categoryGroups[groupIndex].display_order = index;
        }
      });
    },
    
    async reorderCategories(categoryIds: string[]) {
      await CategoryService.reorderCategories({ category_ids: categoryIds });
      
      // Update local display_order values
      categoryIds.forEach((id, index) => {
        const categoryIndex = this.categories.findIndex(category => category.id === id);
        if (categoryIndex !== -1) {
          this.categories[categoryIndex].display_order = index;
        }
      });
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
