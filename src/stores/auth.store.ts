import { defineStore } from 'pinia'
import { supabase } from '@/lib/supabaseClient'
import type { User, Session } from '@supabase/supabase-js'
import router from '@/router'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as Session | null,
    user: null as User | null,
    loading: true,
    lastBanCheck: null as Date | null
  }),

  getters: {
    isAuthenticated: (state) => !!state.session,
    getAccessToken: (state) => state.session?.access_token
  },

  actions: {
    async initialize() {
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      this.session = session
      this.user = session?.user ?? null
      this.loading = false

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        this.session = session
        this.user = session?.user ?? null

        if (event === 'SIGNED_OUT') {
          this.reset()
          router.push('/login')
        } else if (event === 'SIGNED_IN') {
          await this.checkBanStatus()
        }
      })
    },

    async checkBanStatus() {
      // Only check if enough time has passed (e.g., 5 minutes)
      const now = new Date()
      if (this.lastBanCheck && now.getTime() - this.lastBanCheck.getTime() < 5 * 60 * 1000) {
        return
      }

      if (this.session?.access_token) {
        const { data: userData } = await supabase.auth.getUser(this.session.access_token)
        this.lastBanCheck = now

        if (userData?.user && 'banned_until' in userData.user) {
          const bannedUntil = new Date(userData.user.banned_until as string)
          if (bannedUntil > now) {
            await this.signOut()
            router.push('/banned')
          }
        }
      }
    },

    async signOut() {
      await supabase.auth.signOut()
      this.reset()
    },

    reset() {
      this.session = null
      this.user = null
      this.lastBanCheck = null
      this.loading = true
    }
  }
}) 