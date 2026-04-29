<template>
  <div class="min-h-screen flex items-center justify-center px-4 bg-[#0d1117]">
    <div class="w-full max-w-md">
      <!-- Logo et titre -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Sport Analytics Pro
        </h1>
        <p class="text-slate-400">Connectez-vous pour accéder aux analyses</p>
      </div>

      <div class="bg-[#161b22] rounded-xl p-8 shadow-2xl border border-[#30363d]">
        <h2 class="text-2xl font-bold mb-6 text-center text-white">Connexion</h2>
        
        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email -->
          <div>
            <label for="email" class="block text-sm font-medium text-slate-300 mb-2">
              Adresse email
            </label>
            <input 
              id="email"
              v-model="form.email" 
              type="email" 
              required
              autocomplete="email"
              placeholder="votre@email.com"
              class="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': error }"
            >
          </div>

          <!-- Mot de passe -->
          <div>
            <label for="password" class="block text-sm font-medium text-slate-300 mb-2">
              Mot de passe
            </label>
            <div class="relative">
              <input 
                id="password"
                v-model="form.password" 
                :type="showPassword ? 'text' : 'password'"
                required
                autocomplete="current-password"
                placeholder="••••••••"
                class="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                :class="{ 'border-red-500': error }"
              >
              <button 
                type="button"
                @click="showPassword = !showPassword"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
              >
                <span v-if="showPassword">🙈</span>
                <span v-else>👁️</span>
              </button>
            </div>
          </div>

          <!-- Options -->
          <div class="flex items-center justify-between text-sm">
            <label class="flex items-center gap-2 cursor-pointer">
              <input 
                v-model="form.rememberMe" 
                type="checkbox"
                class="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
              >
              <span class="text-slate-400">Se souvenir de moi</span>
            </label>
            <a href="#" class="text-blue-400 hover:text-emerald-300 transition-colors">
              Mot de passe oublié ?
            </a>
          </div>

          <!-- Bouton de connexion -->
          <button 
            type="submit" 
            :disabled="loading || !isValid"
            class="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg 
              v-if="loading" 
              class="animate-spin h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ loading ? 'Connexion...' : 'Se connecter' }}</span>
          </button>
        </form>

        <!-- Message d'erreur -->
        <div 
          v-if="error" 
          class="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center"
        >
          {{ error }}
        </div>

        <!-- Lien d'inscription -->
        <p class="mt-6 text-center text-slate-400 text-sm">
          Pas encore de compte ? 
          <router-link to="/register" class="text-blue-400 hover:text-emerald-300 font-medium transition-colors">
            Créer un compte
          </router-link>
        </p>
      </div>

      <!-- Démo -->
      <div class="mt-8 text-center">
        <p class="text-xs text-slate-500 mb-2">Compte démo</p>
        <button 
          @click="fillDemoCredentials"
          type="button"
          class="text-xs text-slate-400 hover:text-white underline transition-colors"
        >
          Remplir avec des identifiants de test
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRoute, useRouter } from 'vue-router'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

// Utiliser directement le store pour la réactivité
const form = ref({
  email: '',
  password: '',
  rememberMe: false
})

const showPassword = ref(false)

// Computeds depuis le store
const loading = computed(() => authStore.loading)
const error = computed(() => authStore.error)

const isValid = computed(() => {
  return form.value.email.length > 0 && 
         form.value.password.length >= 8 &&
         /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.email)
})

onMounted(() => {
  authStore.clearError()

  // Redirection immédiate si déjà connecté
  if (authStore.isAuthenticated) {
    router.replace('/matches')
  }
})

const handleLogin = async () => {
  authStore.clearError()

  const result = await authStore.login({
    email: form.value.email,
    password: form.value.password
  })

  if (result.success) {
    // Rediriger vers Matchs avec navigation normale
    const redirectPath = route.query.redirect || '/matches'
    await router.push(redirectPath)
  }
}

const fillDemoCredentials = () => {
  form.value.email = 'demo@sportanalytics.com'
  form.value.password = 'demo123456'
}
</script>