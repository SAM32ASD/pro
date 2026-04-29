import { defineStore } from 'pinia'
import axios from 'axios'
import logger from '../utils/logger'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// Configuration axios par défaut
axios.defaults.baseURL = API_URL

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    refreshToken: localStorage.getItem('refreshToken') || null,
    loading: false,
    error: null,
    isInitialized: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.token && !!state.user,
    userPlan: (state) => state.user?.plan || 'free',
    isAdmin: (state) => state.user?.role === 'admin',
    
    // Headers pour les requêtes authentifiées
    authHeaders: (state) => ({
      Authorization: `Bearer ${state.token}`
    })
  },

  actions: {
    /**
     * Initialisation du store (appelé au démarrage de l'app)
     */
    async init() {
      if (this.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        // Récupérer user depuis localStorage si disponible
        const storedUser = localStorage.getItem('user')
        if (storedUser) {
          try {
            this.user = JSON.parse(storedUser)
          } catch (e) {
            logger.error('Erreur parsing user:', e)
          }
        }
        // Note: fetchProfile() commenté car la route n'existe pas dans le backend
        // Si besoin, décommenter quand la route sera créée
      }
      this.isInitialized = true
    },

    /**
     * Connexion utilisateur
     */
    async login(credentials) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/auth/login', credentials)
        
        // IMPORTANT: Adapté à la structure de votre backend
        // Votre backend retourne: { status: 'success', data: { user, tokens: { accessToken, refreshToken } } }
        const { user, tokens } = response.data.data
        
        this.token = tokens.accessToken
        this.refreshToken = tokens.refreshToken
        this.user = user

        // Stockage local
        localStorage.setItem('token', tokens.accessToken)
        localStorage.setItem('refreshToken', tokens.refreshToken)
        localStorage.setItem('user', JSON.stringify(user))

        // Configuration axios
        axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`

        // Précharger les matchs pour une meilleure UX
        try {
          const { useAnalysisStore } = await import('./analysis')
          const analysisStore = useAnalysisStore()
          // Ne pas bloquer la connexion si le préchargement échoue
          analysisStore.fetchTodayMatches().catch(err => {
            logger.warn('Préchargement des matchs échoué:', err)
          })
        } catch (err) {
          logger.warn('Erreur lors du préchargement:', err)
        }

        return { success: true, user }
        
      } catch (error) {
        this.error = this.parseError(error)
        return { success: false, error: this.error }
        
      } finally {
        this.loading = false
      }
    },

    /**
     * Inscription utilisateur
     */
    async register(userData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post('/auth/register', userData)
        
        // Auto-login après inscription si votre backend retourne les tokens
        // Sinon, juste retourner succès
        if (response.data.data?.tokens) {
          const { user, tokens } = response.data.data
          
          this.token = tokens.accessToken
          this.refreshToken = tokens.refreshToken
          this.user = user

          localStorage.setItem('token', tokens.accessToken)
          localStorage.setItem('refreshToken', tokens.refreshToken)
          localStorage.setItem('user', JSON.stringify(user))
          axios.defaults.headers.common['Authorization'] = `Bearer ${tokens.accessToken}`
        }
        
        return { success: true, user: response.data.data?.user || null }
        
      } catch (error) {
        this.error = this.parseError(error)
        return { success: false, error: this.error }
        
      } finally {
        this.loading = false
      }
    },

    /**
     * Rafraîchir le token d'accès
     */
    async refreshAccessToken() {
      if (!this.refreshToken) {
        throw new Error('Pas de refresh token disponible')
      }

      try {
        const response = await axios.post('/auth/refresh', {
          refreshToken: this.refreshToken
        })

        const { accessToken, refreshToken } = response.data.data

        this.token = accessToken
        this.refreshToken = refreshToken

        localStorage.setItem('token', accessToken)
        localStorage.setItem('refreshToken', refreshToken)
        axios.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`

        return { success: true }

      } catch (error) {
        // Refresh échoué, déconnexion forcée
        this.logout()
        throw error
      }
    },

    /**
     * Récupérer le profil utilisateur
     */
    async fetchProfile() {
      try {
        const response = await axios.get('/auth/profile', {
          headers: this.authHeaders
        })
        
        this.user = response.data.data?.user || response.data.user
        return this.user
        
      } catch (error) {
        if (error.response?.status === 401) {
          // Tentative de refresh si token expiré
          try {
            await this.refreshAccessToken()
            // Retry avec nouveau token
            const retryResponse = await axios.get('/auth/profile', {
              headers: this.authHeaders
            })
            this.user = retryResponse.data.data?.user || retryResponse.data.user
            return this.user
          } catch (refreshError) {
            throw new Error('Session expirée')
          }
        }
        throw error
      }
    },

    /**
     * Mettre à jour le profil (nom, email)
     */
    async updateProfile(profileData) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.put('/auth/profile', profileData, {
          headers: this.authHeaders
        })
        
        // Mettre à jour les données utilisateur
        this.user = response.data.data?.user || response.data.user
        
        // Si un nouveau token a été généré (changement d'email), le mettre à jour
        if (response.data.data?.tokens?.accessToken) {
          this.token = response.data.data.tokens.accessToken
          localStorage.setItem('token', this.token)
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        }
        
        return { 
          success: true, 
          message: 'Profil mis à jour avec succès',
          user: this.user 
        }
        
      } catch (error) {
        this.error = this.parseError(error)
        return { success: false, error: this.error }
        
      } finally {
        this.loading = false
      }
    },

    /**
     * Changer le mot de passe
     */
    async changePassword(passwordData) {
      this.loading = true
      this.error = null
      
      try {
        await axios.put('/auth/password', passwordData, {
          headers: this.authHeaders
        })
        
        return { 
          success: true, 
          message: 'Mot de passe modifié avec succès' 
        }
        
      } catch (error) {
        this.error = this.parseError(error)
        return { success: false, error: this.error }
        
      } finally {
        this.loading = false
      }
    },

    /**
     * Déconnexion
     */
    async logout() {
      try {
        // Appel au serveur pour blacklist du token
        if (this.token) {
          await axios.post('/auth/logout', {}, {
            headers: this.authHeaders
          }).catch(() => {}) // Ignorer les erreurs
        }
      } finally {
        // Nettoyage local dans tous les cas
        this.user = null
        this.token = null
        this.refreshToken = null
        this.error = null
        
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')

        delete axios.defaults.headers.common['Authorization']
      }
    },

    /**
     * Supprimer le compte
     */
    async deleteAccount(password) {
      this.loading = true
      
      try {
        await axios.delete('/auth/account', {
          headers: this.authHeaders,
          data: { password }
        })
        
        // Déconnexion après suppression
        this.logout()
        
        return { success: true, message: 'Compte supprimé' }
        
      } catch (error) {
        return { 
          success: false, 
          error: this.parseError(error) 
        }
        
      } finally {
        this.loading = false
      }
    },

    /**
     * Effacer les erreurs
     */
    clearError() {
      this.error = null
    },

    /**
     * Parser les erreurs API
     */
    parseError(error) {
      // Gestion spécifique de votre format d'erreur backend
      if (error.response?.data?.message) {
        return error.response.data.message
      }
      if (error.response?.data?.error) {
        return error.response.data.error
      }
      if (error.message) {
        return error.message
      }
      return 'Une erreur est survenue'
    }
  }
})