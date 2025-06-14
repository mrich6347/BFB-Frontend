import { defineStore } from 'pinia';
import AutoAssignService, {
  type AutoAssignConfigurationSummary,
  type AutoAssignConfigurationResponse,
  type CreateAutoAssignConfigurationDto,
  type UpdateAutoAssignConfigurationDto,
  type ApplyAutoAssignConfigurationDto
} from '@/services/auto-assign.service';
import { useBudgetStore } from './budget.store';

interface AutoAssignState {
  configurations: AutoAssignConfigurationSummary[];
  currentConfiguration: AutoAssignConfigurationResponse | null;
  isLoading: boolean;
}

export const useAutoAssignStore = defineStore('autoAssign', {
  state: (): AutoAssignState => ({
    configurations: [],
    currentConfiguration: null,
    isLoading: false
  }),

  getters: {
    getConfigurationByName: (state) => (name: string) => {
      return state.configurations.find(config => config.name === name);
    },

    hasConfigurations: (state) => {
      return state.configurations.length > 0;
    }
  },

  actions: {

    async loadConfigurations(budgetId: string) {
      this.isLoading = true;
      try {
        this.configurations = await AutoAssignService.getConfigurationsByBudget(budgetId);
      } catch (error) {
        console.error('Failed to load auto-assign configurations:', error);
        this.configurations = [];
      } finally {
        this.isLoading = false;
      }
    },

    async loadConfiguration(budgetId: string, name: string) {
      try {
        this.currentConfiguration = await AutoAssignService.getConfigurationByName(budgetId, name);
        return this.currentConfiguration;
      } catch (error) {
        console.error('Failed to load auto-assign configuration:', error);
        this.currentConfiguration = null;
        return null;
      }
    },

    async createConfiguration(request: CreateAutoAssignConfigurationDto) {
      try {
        const newConfig = await AutoAssignService.createConfiguration(request);

        // Add to configurations list (optimistic update)
        const summary: AutoAssignConfigurationSummary = {
          name: newConfig.name,
          budget_id: newConfig.budget_id,
          user_id: newConfig.user_id,
          item_count: newConfig.items.length,
          total_amount: newConfig.items.reduce((sum, item) => sum + item.amount, 0),
          created_at: newConfig.created_at,
          updated_at: newConfig.updated_at
        };

        this.configurations.unshift(summary); // Add to beginning
        this.currentConfiguration = newConfig;

        return newConfig;
      } catch (error) {
        console.error('Failed to create auto-assign configuration:', error);
        throw error;
      }
    },

    async updateConfiguration(budgetId: string, name: string, request: UpdateAutoAssignConfigurationDto) {
      try {
        const updatedConfig = await AutoAssignService.updateConfiguration(budgetId, name, request);

        // Update configurations list
        const index = this.configurations.findIndex(config => config.name === name);
        if (index !== -1) {
          const summary: AutoAssignConfigurationSummary = {
            name: updatedConfig.name,
            budget_id: updatedConfig.budget_id,
            user_id: updatedConfig.user_id,
            item_count: updatedConfig.items.length,
            total_amount: updatedConfig.items.reduce((sum, item) => sum + item.amount, 0),
            created_at: updatedConfig.created_at,
            updated_at: updatedConfig.updated_at
          };
          this.configurations[index] = summary;
        }

        // Update current configuration if it matches
        if (this.currentConfiguration?.name === name) {
          this.currentConfiguration = updatedConfig;
        }

        return updatedConfig;
      } catch (error) {
        console.error('Failed to update auto-assign configuration:', error);
        throw error;
      }
    },

    async deleteConfiguration(budgetId: string, name: string) {
      try {
        await AutoAssignService.deleteConfiguration(budgetId, name);

        // Remove from configurations list
        this.configurations = this.configurations.filter(config => config.name !== name);

        // Clear current configuration if it matches
        if (this.currentConfiguration?.name === name) {
          this.currentConfiguration = null;
        }
      } catch (error) {
        console.error('Failed to delete auto-assign configuration:', error);
        throw error;
      }
    },

    async applyConfiguration(request: ApplyAutoAssignConfigurationDto) {
      try {
        const result = await AutoAssignService.applyConfiguration(request);

        // Update Ready to Assign in budget store
        const budgetStore = useBudgetStore();
        budgetStore.setReadyToAssign(result.readyToAssign);

        return result;
      } catch (error) {
        console.error('Failed to apply auto-assign configuration:', error);
        throw error;
      }
    },

    setConfigurations(configurations: AutoAssignConfigurationSummary[]) {
      this.configurations = configurations;
      this.isLoading = false;
    },

    reset() {
      this.configurations = [];
      this.currentConfiguration = null;
      this.isLoading = false;
    }
  }
});
