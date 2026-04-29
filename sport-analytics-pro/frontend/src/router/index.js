import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/HomeView.vue'),
    meta: { 
      title: 'Accueil - Sport Analytics Pro' 
    }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue'),
    meta: { 
      title: 'Connexion - Sport Analytics Pro',
      guestOnly: true 
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue'),
    meta: { 
      title: 'Inscription - Sport Analytics Pro',
      guestOnly: true 
    }
  },
  {
    path: '/matches',
    name: 'Matches',
    component: () => import('../views/MatchesView.vue'),
    meta: {
      title: 'Matchs du jour - Sport Analytics Pro'
    }
  },
  {
    path: '/analysis',
    name: 'analysis',
    component: () => import('../views/AnalysisView.vue'),
    meta: {
      title: 'Analyse de Match - Sport Analytics Pro',
      requiresAuth: true
    }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { 
      title: 'Mon Profil - Sport Analytics Pro',
      requiresAuth: true 
    }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/HistoryView.vue'),
    meta: { 
      title: 'Historique - Sport Analytics Pro',
      requiresAuth: true 
    }
  },
  // Route 404
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: { 
      title: 'Page non trouvée - Sport Analytics Pro' 
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Attendre l'initialisation du store
  if (!authStore.isInitialized) {
    await authStore.init()
  }
  
  // Mettre à jour le titre de la page
  if (to.meta.title) {
    document.title = to.meta.title
  }
  
  // Redirection si route nécessite authentification
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next({ 
      name: 'Login', 
      query: { redirect: to.fullPath } 
    })
    return
  }
  
  // Redirection si route réservée aux invités (login/register) et user connecté
  if (to.meta.guestOnly && authStore.isAuthenticated) {
    next({ name: 'Matches' })
    return
  }

  // Si utilisateur va sur / et est connecté, rediriger vers Matches
  if (to.path === '/' && authStore.isAuthenticated) {
    next({ name: 'Matches' })
    return
  }
  
  next()
})

export default router