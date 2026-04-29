<template>
  <div class="max-w-4xl mx-auto py-8 px-4">
    <!-- En-tête -->
    <div class="mb-8">
      <h1 class="text-3xl font-bold text-white">
        Mon Profil
      </h1>
      <p class="text-slate-400 mt-2">Gérez vos informations personnelles et sécurité</p>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Colonne gauche: Informations -->
      <div class="lg:col-span-2 space-y-6">
        
        <!-- Informations personnelles -->
        <div class="card">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 text-xl">
              👤
            </div>
            <div>
              <h2 class="text-xl font-bold">Informations personnelles</h2>
              <p class="text-sm text-slate-400">Modifiez vos informations de base</p>
            </div>
          </div>

          <form @submit.prevent="updateProfile" class="space-y-4">
            <!-- Nom -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Nom complet
              </label>
              <input 
                v-model="profileForm.name" 
                type="text"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                :class="{ 'border-emerald-500': profileChanged.name }"
              >
            </div>

            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Adresse email
              </label>
              <input 
                v-model="profileForm.email" 
                type="email"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                :class="{ 'border-emerald-500': profileChanged.email }"
              >
              <p v-if="profileChanged.email" class="text-xs text-emerald-400 mt-1">
                ⚠️ Un nouveau token sera généré si vous changez d'email
              </p>
            </div>

            <!-- Plan actuel -->
            <div class="p-4 bg-slate-700/50 rounded-lg">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm text-slate-400">Plan actuel</p>
                  <p class="font-bold text-emerald-400 capitalize">{{ authStore.userPlan }}</p>
                </div>
                <button 
                  type="button"
                  class="text-sm text-emerald-400 hover:text-emerald-300 underline"
                >
                  Upgrader
                </button>
              </div>
            </div>

            <!-- Bouton sauvegarder -->
            <div class="flex items-center gap-4 pt-2">
              <button 
                type="submit" 
                :disabled="!hasProfileChanges || loadingProfile"
                class="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span v-if="loadingProfile">Sauvegarde...</span>
                <span v-else>💾 Sauvegarder</span>
              </button>
              
              <button 
                v-if="hasProfileChanges"
                type="button"
                @click="resetProfileForm"
                class="text-slate-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
            </div>
          </form>

          <!-- Message de résultat -->
          <div 
            v-if="profileMessage" 
            :class="[
              'mt-4 p-3 rounded-lg text-sm',
              profileSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            ]"
          >
            {{ profileMessage }}
          </div>
        </div>

        <!-- Sécurité - Mot de passe -->
        <div class="card border-orange-500/20">
          <div class="flex items-center gap-3 mb-6">
            <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 text-xl">
              🔒
            </div>
            <div>
              <h2 class="text-xl font-bold text-orange-400">Sécurité</h2>
              <p class="text-sm text-slate-400">Changez votre mot de passe</p>
            </div>
          </div>

          <form @submit.prevent="changePassword" class="space-y-4">
            <!-- Mot de passe actuel -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Mot de passe actuel
              </label>
              <div class="relative">
                <input 
                  v-model="passwordForm.currentPassword" 
                  :type="showCurrentPassword ? 'text' : 'password'"
                  required
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all pr-10"
                >
                <button 
                  type="button"
                  @click="showCurrentPassword = !showCurrentPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {{ showCurrentPassword ? '🙈' : '👁️' }}
                </button>
              </div>
            </div>

            <!-- Nouveau mot de passe -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Nouveau mot de passe
              </label>
              <div class="relative">
                <input 
                  v-model="passwordForm.newPassword" 
                  :type="showNewPassword ? 'text' : 'password'"
                  required
                  minlength="8"
                  class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all pr-10"
                  :class="{ 'border-emerald-500': passwordValid }"
                >
                <button 
                  type="button"
                  @click="showNewPassword = !showNewPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {{ showNewPassword ? '🙈' : '👁️' }}
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
            </div>

            <!-- Confirmation -->
            <div>
              <label class="block text-sm font-medium text-slate-300 mb-2">
                Confirmer le nouveau mot de passe
              </label>
              <input 
                v-model="passwordForm.confirmPassword" 
                :type="showNewPassword ? 'text' : 'password'"
                required
                class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-orange-500 focus:outline-none transition-all"
                :class="{ 'border-red-500': passwordMismatch, 'border-emerald-500': passwordsMatch }"
              >
              <p v-if="passwordMismatch" class="text-xs text-red-400 mt-1">
                Les mots de passe ne correspondent pas
              </p>
            </div>

            <!-- Bouton -->
            <button 
              type="submit" 
              :disabled="!canChangePassword || loadingPassword"
              class="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loadingPassword">Modification...</span>
              <span v-else>🔐 Changer le mot de passe</span>
            </button>
          </form>

          <!-- Message résultat -->
          <div 
            v-if="passwordMessage" 
            :class="[
              'mt-4 p-3 rounded-lg text-sm',
              passwordSuccess ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'
            ]"
          >
            {{ passwordMessage }}
          </div>
        </div>
      </div>

      <!-- Colonne droite: Statistiques et danger -->
      <div class="space-y-6">
        <!-- Statistiques -->
        <div class="card">
          <h3 class="font-bold mb-4 text-slate-300">Statistiques</h3>
          <div class="space-y-3">
            <div class="flex justify-between">
              <span class="text-slate-400">Membre depuis</span>
              <span class="font-medium">{{ memberSince }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Analyses effectuées</span>
              <span class="font-medium text-emerald-400">{{ stats.analyses }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Prédictions gagnées</span>
              <span class="font-medium text-emerald-400">{{ stats.won }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-400">Précision</span>
              <span class="font-medium">{{ stats.accuracy }}%</span>
            </div>
          </div>
        </div>

        <!-- Zone danger -->
        <div class="card border-red-500/30 bg-red-500/5">
          <h3 class="font-bold mb-4 text-red-400 flex items-center gap-2">
            ⚠️ Zone de danger
          </h3>
          <p class="text-sm text-slate-400 mb-4">
            La suppression de votre compte est irréversible. Toutes vos données seront perdues.
          </p>
          <button 
            @click="showDeleteModal = true"
            class="w-full py-2 px-4 border border-red-500 text-red-400 rounded-lg hover:bg-red-500 hover:text-white transition-all"
          >
            Supprimer mon compte
          </button>
        </div>
      </div>
    </div>

    <!-- Modal de suppression -->
    <div 
      v-if="showDeleteModal" 
      class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <div class="card max-w-md w-full">
        <h3 class="text-xl font-bold text-red-400 mb-4">⚠️ Confirmer la suppression</h3>
        <p class="text-slate-300 mb-4">
          Cette action est irréversible. Pour confirmer, entrez votre mot de passe :
        </p>
        <input 
          v-model="deletePassword" 
          type="password"
          placeholder="Votre mot de passe"
          class="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-red-500"
        >
        <div class="flex gap-3">
          <button 
            @click="deleteAccount"
            :disabled="!deletePassword || deleting"
            class="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
          >
            {{ deleting ? 'Suppression...' : 'Confirmer la suppression' }}
          </button>
          <button 
            @click="showDeleteModal = false"
            class="flex-1 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-500"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

const authStore = useAuthStore()
const router = useRouter()

// Formulaire profil
const profileForm = ref({
  name: '',
  email: ''
})

const originalProfile = ref({
  name: '',
  email: ''
})

// Formulaire mot de passe
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

// États UI
const loadingProfile = ref(false)
const loadingPassword = ref(false)
const profileMessage = ref('')
const profileSuccess = ref(false)
const passwordMessage = ref('')
const passwordSuccess = ref(false)

const showCurrentPassword = ref(false)
const showNewPassword = ref(false)

const showDeleteModal = ref(false)
const deletePassword = ref('')
const deleting = ref(false)

// Statistiques (à récupérer de l'API)
const stats = ref({
  analyses: 0,
  won: 0,
  accuracy: 0
})

onMounted(() => {
  if (authStore.user) {
    profileForm.value.name = authStore.user.name || ''
    profileForm.value.email = authStore.user.email || ''
    originalProfile.value = { ...profileForm.value }
  }
})

// Computed
const profileChanged = computed(() => ({
  name: profileForm.value.name !== originalProfile.value.name,
  email: profileForm.value.email !== originalProfile.value.email
}))

const hasProfileChanges = computed(() => {
  return profileForm.value.name !== originalProfile.value.name ||
         profileForm.value.email !== originalProfile.value.email
})

const passwordValid = computed(() => {
  return passwordForm.value.newPassword.length >= 8
})

const passwordMismatch = computed(() => {
  return passwordForm.value.confirmPassword && 
         passwordForm.value.newPassword !== passwordForm.value.confirmPassword
})

const passwordsMatch = computed(() => {
  return passwordForm.value.confirmPassword && 
         passwordForm.value.newPassword === passwordForm.value.confirmPassword
})

const canChangePassword = computed(() => {
  return passwordForm.value.currentPassword &&
         passwordForm.value.newPassword.length >= 8 &&
         passwordForm.value.newPassword === passwordForm.value.confirmPassword
})

const passwordStrength = computed(() => {
  const pwd = passwordForm.value.newPassword
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
  if (passwordStrength.value <= 25) return 'Faible'
  if (passwordStrength.value <= 50) return 'Moyen'
  if (passwordStrength.value <= 75) return 'Bon'
  return 'Excellent'
})

const memberSince = computed(() => {
  if (!authStore.user?.created_at) return 'Inconnu'
  return format(new Date(authStore.user.created_at), 'dd MMMM yyyy', { locale: fr })
})

// Méthodes
const resetProfileForm = () => {
  profileForm.value = { ...originalProfile.value }
  profileMessage.value = ''
}

const updateProfile = async () => {
  loadingProfile.value = true
  profileMessage.value = ''
  
  const result = await authStore.updateProfile({
    name: profileForm.value.name,
    email: profileForm.value.email
  })
  
  profileSuccess.value = result.success
  profileMessage.value = result.message || result.error
  
  if (result.success) {
    originalProfile.value = { ...profileForm.value }
  }
  
  loadingProfile.value = false
}

const changePassword = async () => {
  loadingPassword.value = true
  passwordMessage.value = ''
  
  const result = await authStore.changePassword({
    currentPassword: passwordForm.value.currentPassword,
    newPassword: passwordForm.value.newPassword
  })
  
  passwordSuccess.value = result.success
  passwordMessage.value = result.message || result.error
  
  if (result.success) {
    // Réinitialiser le formulaire
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }
  }
  
  loadingPassword.value = false
}

const deleteAccount = async () => {
  deleting.value = true
  
  const result = await authStore.deleteAccount(deletePassword.value)
  
  if (result.success) {
    router.push('/')
  } else {
    alert(result.error)
    deleting.value = false
  }
}
</script>