import { supabase } from '@/lib/supabaseClient'
import router from '@/router'

export class AuthService {
  async logout(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Error during logout:', error)
      throw error
    }
  }
}

// Create a singleton instance
export const authService = new AuthService()
