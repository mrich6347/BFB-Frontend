import { defineStore } from 'pinia';
import CategoryGroupService from '@/services/category-group.service';
import CategoryService from '@/services/category.service';
import { MainDataService } from '@/services/common/mainData.service';
import type { CategoryGroupResponse, CreateCategoryGroupDto, UpdateCategoryGroupDto } from '@/types/DTO/category-group.dto';
import type { CategoryResponse, CreateCategoryDto, UpdateCategoryDto, CategoryWithReadyToAssignResponse, CategoryUpdateWithAffectedCategoriesResponse } from '@/types/DTO/category.dto';
import type { CategoryBalanceResponse } from '@/types/DTO/category-balance.dto';
import { useBudgetStore } from './budget.store';

export const useCategoryStore = defineStore('categoryStore', {
  state: () => ({
    categoryGroups: [] as CategoryGroupResponse[],
    categories: [] as CategoryResponse[],
    categoryBalances: [] as CategoryBalanceResponse[],
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

    categoryExistsByNameInBudget: (state) => (name: string, budgetId: string) => {
      return state.categories.find(
        category => category.name.toLowerCase() === name.toLowerCase() && category.budget_id === budgetId
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
    },

    // Get category groups with conditional display for Credit Card Payments
    visibleCategoryGroups: (state) => (accounts: any[]) => {
      const hasCreditCards = accounts.some(account => account.account_type === 'CREDIT');

      return state.categoryGroups
        .filter(group => {
          // Hide Credit Card Payments group if no credit card accounts exist
          if (group.name === 'Credit Card Payments' && !hasCreditCards) {
            return false;
          }
          return true;
        })
        .sort((a, b) => a.display_order - b.display_order);
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

    async fetchCategoryBalances(budgetId: string) {
      if (!budgetId) {
        console.error('Cannot fetch category balances: budgetId is undefined');
        return;
      }

      try {
        // Use the main data service to get fresh category balances
        const mainData = await MainDataService.getMainData(budgetId);
        if (mainData?.categoryBalances) {
          this.setCategoryBalances(mainData.categoryBalances);
        }
      } catch (error) {
        console.error('Failed to fetch category balances:', error);
        throw error;
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
      const index = this.categoryGroups.findIndex(group => group.id === id);

      if (index === -1) {
        throw new Error('Category group not found');
      }

      // Store original category group for potential rollback
      const originalCategoryGroup = { ...this.categoryGroups[index] };

      try {
        // Optimistically update the UI immediately
        this.categoryGroups[index] = {
          ...this.categoryGroups[index],
          ...request,
          updated_at: new Date()
        };

        // Make the actual API call in the background
        const response = await CategoryGroupService.updateCategoryGroup(id, request);

        // Replace with the real response from the server
        this.categoryGroups[index] = response;

        return response;
      } catch (error) {
        // If the API call fails, revert to the original category group
        console.error('Failed to update category group:', error);
        this.categoryGroups[index] = originalCategoryGroup;
        throw error;
      }
    },

    async deleteCategoryGroup(id: string) {
      const response = await CategoryGroupService.deleteCategoryGroup(id);
      this.categoryGroups = this.categoryGroups.filter(group => group.id !== id);

      // Update categories with the moved categories from the response
      if (response.movedCategories && response.movedCategories.length > 0) {
        // Remove the old categories and add the updated ones
        this.categories = this.categories.filter(category =>
          !response.movedCategories.some(moved => moved.id === category.id)
        );
        this.categories.push(...response.movedCategories);
      } else {
        // Fallback: remove all categories in this group if no moved categories returned
        this.categories = this.categories.filter(category => category.category_group_id !== id);
      }
    },

    async hideCategoryGroup(id: string) {
      // Store original state for rollback
      const originalCategories = [...this.categories];
      const originalGroups = [...this.categoryGroups];

      try {
        // Make the actual API call
        const response = await CategoryGroupService.hideCategoryGroup(id);

        // Remove the hidden group
        this.categoryGroups = this.categoryGroups.filter(group => group.id !== id);

        // Update categories with the moved categories from the response
        if (response.movedCategories && response.movedCategories.length > 0) {
          // Remove the old categories and add the updated ones
          this.categories = this.categories.filter(category =>
            !response.movedCategories.some(moved => moved.id === category.id)
          );
          this.categories.push(...response.movedCategories);
        } else {
          // Fallback: remove all categories in this group if no moved categories returned
          this.categories = this.categories.filter(category => category.category_group_id !== id);
        }
      } catch (error) {
        // If the API call fails, revert to the original state
        console.error('Failed to hide category group:', error);
        this.categories = originalCategories;
        this.categoryGroups = originalGroups;
        throw error;
      }
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

        // Update Ready to Assign in budget store
        const budgetStore = useBudgetStore();
        budgetStore.setReadyToAssign(response.readyToAssign);

        // Replace the temporary category with the real one
        const tempIndex = this.categories.findIndex(category => category.id === tempId);
        if (tempIndex !== -1) {
          this.categories[tempIndex] = response.category;
        }

        // After successful creation, reorder all categories in this group on the server to match our optimistic update
        const categoryIds = this.categories
          .filter(category => category.category_group_id === response.category.category_group_id)
          .sort((a, b) => a.display_order - b.display_order)
          .map(category => category.id);

        // Fire and forget - don't await this call
        CategoryService.reorderCategories({ category_ids: categoryIds })
          .catch(error => console.error('Failed to reorder categories after creation:', error));

        return response.category;
      } catch (error) {
        // If the API call fails, revert to the original state
        console.error('Failed to create category:', error);
        this.categories = originalCategories;
        throw error;
      }
    },

    async updateCategory(id: string, request: UpdateCategoryDto) {
      const index = this.categories.findIndex(category => category.id === id);

      if (index === -1) {
        throw new Error('Category not found');
      }

      // Store original category for potential rollback
      const originalCategory = { ...this.categories[index] };

      try {
        // Optimistically update the UI immediately
        this.categories[index] = {
          ...this.categories[index],
          ...request,
          updated_at: new Date()
        };

        // Make the actual API call in the background
        const response = await CategoryService.updateCategory(id, request);

        // Update Ready to Assign in budget store if needed
        if (response.readyToAssign !== undefined) {
          const budgetStore = useBudgetStore();
          budgetStore.setReadyToAssign(response.readyToAssign);
        }

        // Replace with the real response from the server
        this.categories[index] = response.category;

        return response.category;
      } catch (error) {
        // If the API call fails, revert to the original category
        console.error('Failed to update category:', error);
        this.categories[index] = originalCategory;
        throw error;
      }
    },

    async hideCategory(id: string) {
      // Get the category being hidden
      const categoryToHide = this.categories.find(category => category.id === id);
      if (!categoryToHide) {
        throw new Error('Category not found');
      }

      // Find the Hidden Categories group
      const hiddenGroup = this.categoryGroups.find(group =>
        group.name === 'Hidden Categories' && group.is_system_group
      );
      if (!hiddenGroup) {
        throw new Error('Hidden Categories group not found');
      }

      // Store original state for rollback
      const originalCategory = { ...categoryToHide };

      // Optimistically update the UI immediately - move category to Hidden Categories group
      const categoryIndex = this.categories.findIndex(cat => cat.id === id);
      if (categoryIndex !== -1) {
        this.categories[categoryIndex] = {
          ...this.categories[categoryIndex],
          category_group_id: hiddenGroup.id
        };
      }

      try {
        // Make the actual API call
        const response = await CategoryService.hideCategory(id);

        // Update Ready to Assign with the accurate value from the backend
        const budgetStore = useBudgetStore();
        budgetStore.setReadyToAssign(response.readyToAssign);
      } catch (error) {
        // If the API call fails, revert to the original state
        console.error('Failed to hide category:', error);
        const categoryIndex = this.categories.findIndex(cat => cat.id === id);
        if (categoryIndex !== -1) {
          this.categories[categoryIndex] = originalCategory;
        }
        throw error;
      }
    },

    async unhideCategory(id: string, targetGroupId?: string) {
      // Get the category being unhidden
      const categoryToUnhide = this.categories.find(category => category.id === id);
      if (!categoryToUnhide) {
        throw new Error('Category not found');
      }

      // If no target group specified, use the first non-system group
      let targetGroup = targetGroupId;
      if (!targetGroup) {
        const firstGroup = this.categoryGroups.find(group => !group.is_system_group);
        if (!firstGroup) {
          throw new Error('No available category group to move to');
        }
        targetGroup = firstGroup.id;
      }

      // Store original state for rollback
      const originalCategory = { ...categoryToUnhide };

      // Optimistically update the UI immediately - move category to target group
      const categoryIndex = this.categories.findIndex(cat => cat.id === id);
      if (categoryIndex !== -1) {
        this.categories[categoryIndex] = {
          ...this.categories[categoryIndex],
          category_group_id: targetGroup
        };
      }

      try {
        // Make the actual API call
        const response = await CategoryService.unhideCategory(id, targetGroup);

        // Update Ready to Assign with the accurate value from the backend
        const budgetStore = useBudgetStore();
        budgetStore.setReadyToAssign(response.readyToAssign);
      } catch (error) {
        // If the API call fails, revert to the original state
        console.error('Failed to unhide category:', error);
        const categoryIndex = this.categories.findIndex(cat => cat.id === id);
        if (categoryIndex !== -1) {
          this.categories[categoryIndex] = originalCategory;
        }
        throw error;
      }
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

    async updateCategoryBalance(categoryId: string, assigned: number) {
      // Get current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Find existing balance or create a new one (all balances are current month)
      let balanceIndex = this.categoryBalances.findIndex(b => b.category_id === categoryId);

      let originalBalance: CategoryBalanceResponse | null = null;
      let assignedDifference = 0;

      if (balanceIndex !== -1) {
        // Store original for rollback
        originalBalance = { ...this.categoryBalances[balanceIndex] };

        // Calculate the difference in assigned amount
        assignedDifference = assigned - originalBalance.assigned;

        // Update assigned amount
        this.categoryBalances[balanceIndex].assigned = assigned;

        // Update available by adding the difference (like YNAB)
        this.categoryBalances[balanceIndex].available = originalBalance.available + assignedDifference;
      } else {
        // Create new balance record optimistically
        const category = this.categories.find(c => c.id === categoryId);
        if (category) {
          assignedDifference = assigned; // New record, so difference is the full assigned amount

          const newBalance: CategoryBalanceResponse = {
            id: 'temp-' + Date.now(),
            category_id: categoryId,
            budget_id: category.budget_id,
            user_id: '', // Will be set by backend
            year,
            month,
            assigned,
            activity: 0,
            available: assigned, // New balance, so available equals assigned
            created_at: new Date(),
            updated_at: new Date()
          };

          this.categoryBalances.push(newBalance);
          balanceIndex = this.categoryBalances.length - 1;
        }
      }

      try {
        // Send update to backend - only update assigned, let backend calculate available
        const response = await CategoryService.updateCategoryBalance(categoryId, { assigned }, year, month);

        // Update Ready to Assign in budget store
        const budgetStore = useBudgetStore();
        budgetStore.setReadyToAssign(response.readyToAssign);

        // Update affected payment categories immediately (optimistic update)
        if (response.affectedCategories && response.affectedCategories.length > 0) {
          console.log(`🎯 Updating ${response.affectedCategories.length} affected payment categories`);

          for (const affectedCategory of response.affectedCategories) {
            // Find and update the affected category balance
            const affectedBalanceIndex = this.categoryBalances.findIndex(b => b.category_id === affectedCategory.id);

            if (affectedBalanceIndex !== -1) {
              // Update existing balance
              this.categoryBalances[affectedBalanceIndex] = {
                ...this.categoryBalances[affectedBalanceIndex],
                assigned: affectedCategory.assigned,
                activity: affectedCategory.activity,
                available: affectedCategory.available
              };
            } else {
              // Create new balance record
              const newBalance: CategoryBalanceResponse = {
                id: 'temp-affected-' + Date.now(),
                category_id: affectedCategory.id,
                budget_id: affectedCategory.budget_id,
                user_id: affectedCategory.user_id,
                year,
                month,
                assigned: affectedCategory.assigned,
                activity: affectedCategory.activity,
                available: affectedCategory.available,
                created_at: new Date(),
                updated_at: new Date()
              };
              this.categoryBalances.push(newBalance);
            }
          }
        }
      } catch (error) {
        // If the backend update fails, revert to the original values
        console.error('Failed to update category balance:', error);

        if (originalBalance) {
          // Restore original balance
          this.categoryBalances[balanceIndex] = originalBalance;
        } else {
          // Remove the newly created balance
          this.categoryBalances.splice(balanceIndex, 1);
        }

        throw error;
      }
    },

    async moveMoney(sourceCategoryId: string, destinationCategoryId: string, amount: number) {
      // Get current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Find the balance records (all balances are current month)
      let sourceBalanceIndex = this.categoryBalances.findIndex(b => b.category_id === sourceCategoryId);
      let destinationBalanceIndex = this.categoryBalances.findIndex(b => b.category_id === destinationCategoryId);

      if (sourceBalanceIndex === -1) {
        throw new Error('Source category balance not found');
      }

      // Store original values for rollback
      const originalSourceBalance = { ...this.categoryBalances[sourceBalanceIndex] };
      let originalDestinationBalance: CategoryBalanceResponse | null = null;

      if (destinationBalanceIndex !== -1) {
        originalDestinationBalance = { ...this.categoryBalances[destinationBalanceIndex] };
      }

      // Optimistically update the UI
      this.categoryBalances[sourceBalanceIndex].available -= amount;

      if (destinationBalanceIndex !== -1) {
        // Update existing destination balance
        this.categoryBalances[destinationBalanceIndex].available += amount;
      } else {
        // Create new destination balance
        const destinationCategory = this.categories.find(c => c.id === destinationCategoryId);
        if (destinationCategory) {
          const newBalance: CategoryBalanceResponse = {
            id: 'temp-' + Date.now(),
            category_id: destinationCategoryId,
            budget_id: destinationCategory.budget_id,
            user_id: '', // Will be set by backend
            year,
            month,
            assigned: 0,
            activity: 0,
            available: amount,
            created_at: new Date(),
            updated_at: new Date()
          };

          this.categoryBalances.push(newBalance);
          destinationBalanceIndex = this.categoryBalances.length - 1;
        }
      }

      try {
        // Send update to backend
        await CategoryService.moveMoney(sourceCategoryId, destinationCategoryId, amount, year, month);
      } catch (error) {
        // If the backend update fails, revert to the original values
        console.error('Failed to move money:', error);

        // Restore source balance
        this.categoryBalances[sourceBalanceIndex] = originalSourceBalance;

        if (originalDestinationBalance) {
          // Restore original destination balance
          this.categoryBalances[destinationBalanceIndex] = originalDestinationBalance;
        } else {
          // Remove the newly created destination balance
          this.categoryBalances.splice(destinationBalanceIndex, 1);
        }

        throw error;
      }
    },

    async moveMoneyToReadyToAssign(sourceCategoryId: string, amount: number) {
      // Get current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Find the balance record (all balances are current month)
      let sourceBalanceIndex = this.categoryBalances.findIndex(b => b.category_id === sourceCategoryId);

      if (sourceBalanceIndex === -1) {
        throw new Error('Source category balance not found');
      }

      // Store original balance for rollback
      const originalSourceBalance = { ...this.categoryBalances[sourceBalanceIndex] };

      // Validate that source has enough available money
      if ((originalSourceBalance.available || 0) < amount) {
        throw new Error('Insufficient available balance in source category');
      }

      // Update source balance optimistically (subtract amount from both available and assigned)
      this.categoryBalances[sourceBalanceIndex].available -= amount;
      this.categoryBalances[sourceBalanceIndex].assigned -= amount;

      try {
        // Send update to backend
        await CategoryService.moveMoneyToReadyToAssign(sourceCategoryId, amount, year, month);

        // Update Ready to Assign in budget store
        const budgetStore = useBudgetStore();
        budgetStore.setReadyToAssign(budgetStore.readyToAssign + amount);
      } catch (error) {
        // If the backend update fails, revert to the original values
        console.error('Failed to move money to Ready to Assign:', error);

        // Restore source balance (both available and assigned)
        this.categoryBalances[sourceBalanceIndex] = originalSourceBalance;

        throw error;
      }
    },

    async pullFromReadyToAssign(destinationCategoryId: string, amount: number) {
      // Get current month
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;

      // Validate that Ready to Assign has enough money
      const budgetStore = useBudgetStore();
      if (budgetStore.readyToAssign < amount) {
        throw new Error('Insufficient Ready to Assign balance');
      }

      // Find or create the destination balance record
      let destinationBalanceIndex = this.categoryBalances.findIndex(b => b.category_id === destinationCategoryId);
      let originalDestinationBalance: CategoryBalanceResponse | null = null;
      let wasNewBalance = false;

      if (destinationBalanceIndex === -1) {
        // Create new balance record
        const newBalance: CategoryBalanceResponse = {
          id: `temp-${Date.now()}`, // Temporary ID
          category_id: destinationCategoryId,
          budget_id: budgetStore.currentBudget?.id || '',
          user_id: '', // Will be set by backend
          year,
          month,
          assigned: amount,
          activity: 0,
          available: amount,
          created_at: new Date(),
          updated_at: new Date()
        };

        this.categoryBalances.push(newBalance);
        destinationBalanceIndex = this.categoryBalances.length - 1;
        wasNewBalance = true;
      } else {
        // Store original balance for rollback
        originalDestinationBalance = { ...this.categoryBalances[destinationBalanceIndex] };

        // Update existing balance optimistically
        this.categoryBalances[destinationBalanceIndex].assigned = (originalDestinationBalance.assigned || 0) + amount;
        this.categoryBalances[destinationBalanceIndex].available = (originalDestinationBalance.available || 0) + amount;
      }

      // Update Ready to Assign optimistically
      const originalReadyToAssign = budgetStore.readyToAssign;
      budgetStore.setReadyToAssign(originalReadyToAssign - amount);

      try {
        // Send update to backend
        await CategoryService.pullFromReadyToAssign(destinationCategoryId, amount, year, month);
      } catch (error) {
        // If the backend update fails, revert to the original values
        console.error('Failed to pull money from Ready to Assign:', error);

        if (wasNewBalance) {
          // Remove the newly created balance
          this.categoryBalances.splice(destinationBalanceIndex, 1);
        } else if (originalDestinationBalance) {
          // Restore original destination balance
          this.categoryBalances[destinationBalanceIndex] = originalDestinationBalance;
        }

        // Restore Ready to Assign
        budgetStore.setReadyToAssign(originalReadyToAssign);

        throw error;
      }
    },

    setCategoryGroups(categoryGroups: CategoryGroupResponse[]) {
      this.categoryGroups = categoryGroups;
    },

    setCategories(categories: CategoryResponse[]) {
      this.categories = categories;
    },

    setCategoryBalances(categoryBalances: CategoryBalanceResponse[]) {
      this.categoryBalances = categoryBalances;
    },

    setIsLoading(isLoading: boolean) {
      this.isLoading = isLoading;
    },

    reset() {
      this.categoryGroups = [];
      this.categories = [];
      this.categoryBalances = [];
      this.isLoading = true;
    },

    // Helper methods to get categories with balances (all balances are current month now)
    getCategoriesWithBalances(): CategoryResponse[] {
      return this.categories.map(category => {
        // Find balance for this category (all balances are current month)
        const balance = this.categoryBalances.find(b => b.category_id === category.id);

        return {
          ...category,
          assigned: balance?.assigned || 0,
          activity: balance?.activity || 0,
          available: balance?.available || 0
        };
      });
    },

    getCategoriesByGroupWithBalances(groupId: string): CategoryResponse[] {
      return this.getCategoriesWithBalances()
        .filter(category => category.category_group_id === groupId)
        .sort((a, b) => a.display_order - b.display_order);
    },

    getGroupTotalsWithBalances(groupId: string) {
      const groupCategories = this.getCategoriesByGroupWithBalances(groupId);

      return {
        assigned: groupCategories.reduce((sum, category) => sum + (category.assigned || 0), 0),
        activity: groupCategories.reduce((sum, category) => sum + (category.activity || 0), 0),
        available: groupCategories.reduce((sum, category) => sum + (category.available || 0), 0)
      };
    }
  }
});
