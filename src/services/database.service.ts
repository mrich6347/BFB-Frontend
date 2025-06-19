import api from './common/api'

export class DatabaseService {
  private static readonly BASE_PATH = '/database-management'

  /**
   * Wipes all user data from the database
   * This is a destructive operation and should be used with caution
   */
  static async nukeDatabase(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`${this.BASE_PATH}/nuke`)
    return response.data
  }

  /**
   * Populates the database with comprehensive sample data
   * This will first wipe existing data, then create a realistic budget with months of activity
   */
  static async populateDatabase(): Promise<{ success: boolean; message: string }> {
    const response = await api.post<{ success: boolean; message: string }>(`${this.BASE_PATH}/populate`)
    return response.data
  }
}
