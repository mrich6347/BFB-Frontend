import { createRouter, createWebHistory } from 'vue-router'
import LandingPage from '../pages/LandingPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import SignUpPage from '../pages/SignUpPage.vue'
import DashboardPage from '../pages/DashboardPage.vue'
import NotFoundPage from '../pages/util-pages/NotFoundPage.vue'
import BannedPage from '../pages/util-pages/BannedPage.vue'
import BudgetPage from '../pages/BudgetPage.vue'
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
    path: '/budget/:id',
    name: 'Budget',
    component: BudgetPage,
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
  // TODO: Add routes for authenticated areas (e.g., dashboard)
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard for protected routes
router.beforeEach(async (to, from, next) => {
  if (to.meta.requiresAuth) {
    const { data } = await supabase.auth.getSession()
    if (!data.session) {
      // User is not authenticated, redirect to landing page
      return next({ path: '/' })
    }
  }
  // Proceed as normal
  next()
})

export default router
