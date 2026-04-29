<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md">
      <!-- Logo et titre -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          Sport Analytics Pro
        </h1>
        <p class="text-slate-400">Créez votre compte pour commencer</p>
      </div>

      <div class="card">
        <h2 class="text-2xl font-bold mb-6 text-center">Inscription</h2>
        
        <form @submit.prevent="handleRegister" class="space-y-5">
          <!-- Nom -->
          <div>
            <label for="name" class="block text-sm font-medium text-slate-300 mb-2">
              Nom complet
            </label>
            <input 
              id="name"
              v-model="form.name" 
              type="text" 
              required
              autocomplete="name"
              placeholder="Jean Dupont"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': errors.name }"
            >
            <p v-if="errors.name" class="text-xs text-red-400 mt-1">{{ errors.name }}</p>
          </div>

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
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': errors.email }"
            >
            <p v-if="errors.email" class="text-xs text-red-400 mt-1">{{ errors.email }}</p>
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
                autocomplete="new-password"
                placeholder="••••••••"
                minlength="8"
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all pr-10"
                :class="{ 'border-red-500': errors.password }"
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
            
            <!-- Indicateur de force -->
            <div class="mt-2 flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-600 rounded-full overflow-hidden">
                <div 
                  class="h-full transition-all duration-300"
                  :class="passwordStrengthClass"
                  :style="{ width: passwordStrength + '%' }"
                ></div>
              </div>
              <span class="text-xs text-slate-400">{{ passwordStrengthLabel }}</span>
            </div>
            <p class="text-xs text-slate-500 mt-1">Minimum 8 caractères</p>
            <p v-if="errors.password" class="text-xs text-red-400 mt-1">{{ errors.password }}</p>
          </div>

          <!-- Confirmation mot de passe -->
          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-slate-300 mb-2">
              Confirmer le mot de passe
            </label>
            <input 
              id="confirmPassword"
              v-model="form.confirmPassword" 
              :type="showPassword ? 'text' : 'password'"
              required
              autocomplete="new-password"
              placeholder="••••••••"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              :class="{ 'border-red-500': errors.confirmPassword }"
            >
            <p v-if="errors.confirmPassword" class="text-xs text-red-400 mt-1">{{ errors.confirmPassword }}</p>
          </div>

          <!-- Conditions -->
          <label class="flex items-start gap-2 cursor-pointer">
            <input 
              v-model="form.acceptTerms" 
              type="checkbox"
              required
              class="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500"
            >
            <span class="text-sm text-slate-400">
              J'accepte les 
              <a href="#" class="text-blue-400 hover:text-emerald-300">conditions d'utilisation</a>
              et la 
              <a href="#" class="text-blue-400 hover:text-emerald-300">politique de confidentialité</a>
            </span>
          </label>

          <!-- Bouton d'inscription -->
          <button 
            type="submit" 
            :disabled="authStore.loading || !isValid"
            class="w-full btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg 
              v-if="authStore.loading" 
              class="animate-spin h-5 w-5" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ authStore.loading ? 'Création du compte...' : 'Créer mon compte' }}</span>
          </button>
        </form>

        <!-- Message d'erreur global -->
        <div 
          v-if="authStore.error" 
          class="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-center"
        >
          {{ authStore.error }}
        </div>

        <!-- Lien de connexion -->
        <p class="mt-6 text-center text-slate-400 text-sm">
          Déjà un compte ? 
          <router-link to="/login" class="text-blue-400 hover:text-emerald-300 font-medium transition-colors">
            Se connecter
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const authStore = useAuthStore()
const router = useRouter()

const form = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
})

const errors = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const showPassword = ref(false)

// Validation email
const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Validation du formulaire
const isValid = computed(() => {
  return form.value.name.length >= 2 &&
         isValidEmail(form.value.email) &&
         form.value.password.length >= 8 &&
         form.value.password === form.value.confirmPassword &&
         form.value.acceptTerms
})

// Force du mot de passe
const passwordStrength = computed(() => {
  const pwd = form.value.password
  if (!pwd) return 0
  
  let strength = 0
  if (pwd.length >= 8) strength += 25
  if (pwd.length >= 12) strength += 25
  if (/[A-Z]/.test(pwd)) strength += 25
  if (/[0-9!@#$%^&*]/.test(pwd)) strength += 25
  
  return strength
})

const passwordStrengthClass = computed(() => {
  if (passwordStrength.value <= 25) return 'bg-red-500'
  if (passwordStrength.value <= 50) return 'bg-orange-500'
  if (passwordStrength.value <= 75) return 'bg-yellow-500'
  return 'bg-emerald-500'
})

const passwordStrengthLabel = computed(() => {
  if (passwordStrength.value === 0) return 'Vide'
  if (passwordStrength.value <= 25) return 'Faible'
  if (passwordStrength.value <= 50) return 'Moyen'
  if (passwordStrength.value <= 75) return 'Bon'
  return 'Excellent'
})

onMounted(() => {
  authStore.clearError()
  if (authStore.isAuthenticated) {
    router.push('/analysis')
  }
})

const validateForm = () => {
  errors.value = { name: '', email: '', password: '', confirmPassword: '' }
  
  let valid = true
  
  if (form.value.name.length < 2) {
    errors.value.name = 'Le nom doit faire au moins 2 caractères'
    valid = false
  }
  
  if (!isValidEmail(form.value.email)) {
    errors.value.email = 'Veuillez entrer un email valide'
    valid = false
  }
  
  if (form.value.password.length < 8) {
    errors.value.password = 'Le mot de passe doit faire au moins 8 caractères'
    valid = false
  }
  
  if (form.value.password !== form.value.confirmPassword) {
    errors.value.confirmPassword = 'Les mots de passe ne correspondent pas'
    valid = false
  }
  
  return valid
}

const handleRegister = async () => {
  if (!validateForm()) return
  
  authStore.clearError()
  
  const result = await authStore.register({
    name: form.value.name,
    email: form.value.email,
    password: form.value.password
  })
  
  if (result.success) {
    router.push('/analysis')
  }
}
</script>