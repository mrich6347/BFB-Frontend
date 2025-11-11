import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import SignUpPage from '../pages/SignUpPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import NotFoundPage from '../pages/util-pages/NotFoundPage.vue'
import BannedPage from '../pages/util-pages/BannedPage.vue'
import BudgetPage from '../pages/BudgetPage.vue'
import NetWorthPage from '../pages/NetWorthPage.vue'
import AccountPage from '../pages/AccountPage.vue'
import ProfileSettingsPage from '../pages/ProfileSettingsPage.vue'
import SharedGoalsPage from '../pages/SharedGoalsPage.vue'
import RetirementPlanPage from '../pages/RetirementPlanPage.vue'
import CalendarPage from '../pages/CalendarPage.vue'
import MobileAccountsPage from '../pages/MobileAccountsPage.vue'
import { supabase } from '../lib/supabaseClient'



const routes = [
  {
    path: '/',
    name: 'Landing',
    component: LandingPage,
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage,
  },
  {
    path: '/signup',
    name: 'SignUp',
    component: SignUpPage,
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/budget/:budgetId',
    name: 'Budget',
    component: BudgetPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/net-worth',
    name: 'NetWorth',
    component: NetWorthPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/budget/:budgetId/account/:accountId',
    name: 'Account',
    component: AccountPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/profile-settings',
    name: 'ProfileSettings',
    component: ProfileSettingsPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/shared-goals',
    name: 'SharedGoals',
    component: SharedGoalsPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/retirement-plan',
    name: 'RetirementPlan',
    component: RetirementPlanPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/calendar',
    name: 'Calendar',
    component: CalendarPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/accounts',
    name: 'Accounts',
    component: MobileAccountsPage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/banned',
    name: 'Banned',
    component: BannedPage
  },
  // Catch-all 404 route
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFoundPage
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // Always scroll to top when navigating to a new route
    // This ensures consistent behavior on mobile Safari
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0, left: 0 }
    }
  },
})

// Navigation guard for protected routes and last visited budget redirect
router.beforeEach(async (to, from, next) => {
  // Get current session from local storage
  const { data } = await supabase.auth.getSession()
  const isAuthenticated = !!data.session

  // Handle protected routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    // User is not authenticated, redirect to landing page
    return next({ path: '/' })
  }

  // No automatic redirects - keep it simple
  // App.vue handles redirecting to dashboard

  // Proceed as normal
  next()
})

export default router
