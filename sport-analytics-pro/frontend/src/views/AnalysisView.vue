<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-4xl font-bold mb-2 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
        🎯 Analyse Détaillée
      </h1>
      <p class="text-slate-400">
        Analyse des 12 derniers matchs + 10 confrontations directes
      </p>
    </div>

    <!-- Formulaire de sélection -->
    <div class="card mb-8">
      <h2 class="text-xl font-bold mb-4 flex items-center gap-2">
        <span>⚙️</span> Configuration de l'analyse
      </h2>

      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Sport -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Sport</label>
          <select v-model="form.sport" class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all">
            <option value="football">⚽ Football</option>
            <option value="basketball">🏀 Basketball</option>
          </select>
        </div>

        <!-- Équipe domicile -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Équipe domicile</label>
          <input
            v-model="form.homeTeamId"
            type="number"
            placeholder="ID équipe domicile"
            class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
          >
        </div>

        <!-- Équipe extérieur -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Équipe extérieur</label>
          <input
            v-model="form.awayTeamId"
            type="number"
            placeholder="ID équipe extérieur"
            class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
          >
        </div>

        <!-- Saison -->
        <div>
          <label class="block text-sm font-medium text-slate-300 mb-2">Saison</label>
          <input
            v-model="form.season"
            type="number"
            placeholder="2024"
            class="w-full px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/50 outline-none transition-all"
          >
        </div>
      </div>

      <button
        @click="analyzeMatch"
        :disabled="loading || !isFormValid"
        class="mt-6 w-full py-3 px-6 rounded-lg font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        :class="loading ? 'bg-slate-600' : 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 shadow-lg'"
      >
        <span v-if="loading" class="flex items-center justify-center gap-2">
          <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Analyse en cours...
        </span>
        <span v-else class="flex items-center justify-center gap-2">
          <span>🔍</span> Lancer l'analyse
        </span>
      </button>
    </div>

    <!-- Erreur -->
    <div v-if="error" class="card bg-red-500/10 border-2 border-red-500/50 mb-8">
      <div class="flex items-center gap-3">
        <span class="text-3xl">⚠️</span>
        <div>
          <h3 class="font-bold text-red-400 mb-1">Erreur lors de l'analyse</h3>
          <p class="text-sm text-red-300">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- Résultats -->
    <div v-if="analysis" class="space-y-8">

      <!-- 🔥 FILTRE DE BUTS - SECTION PRINCIPALE -->
      <div v-if="analysis.goalFilter && form.sport === 'football'">
        <GoalFilterCard
          :filterResult="analysis.goalFilter"
          :goalPatterns="analysis"
        />
      </div>

      <!-- Affichage des équipes -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Équipe domicile -->
        <TeamFormCard
          v-if="analysis.homeTeam"
          :team="analysis.homeTeam"
          teamType="home"
          :sport="form.sport"
        />

        <!-- Équipe extérieur -->
        <TeamFormCard
          v-if="analysis.awayTeam"
          :team="analysis.awayTeam"
          teamType="away"
          :sport="form.sport"
        />
      </div>

      <!-- Historique H2H -->
      <div v-if="analysis.h2h">
        <H2HCard :h2h="analysis.h2h" :sport="form.sport" />
      </div>

      <!-- Prédictions -->
      <div class="card">
        <h2 class="text-2xl font-bold mb-6 flex items-center gap-2">
          <span>🎲</span> Prédictions & Pronostics
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="(pred, index) in analysis.predictions"
            :key="index"
            class="p-4 rounded-xl border transition-all hover:scale-105 hover:shadow-lg"
            :class="getPredictionClass(pred)"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-medium uppercase tracking-wider text-slate-400">
                {{ pred.type.replace(/_/g, ' ') }}
              </span>
              <span
                v-if="pred.isRecommended"
                class="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full font-bold animate-pulse"
              >
                ⭐ TOP
              </span>
            </div>

            <div class="text-center mb-3">
              <div class="text-3xl font-bold mb-1" :class="getConfidenceColor(pred.confidence)">
                {{ pred.prediction }}
              </div>
              <div class="text-sm text-slate-400">
                {{ pred.confidence }}% confiance
              </div>
            </div>

            <!-- Barre de confiance -->
            <div class="w-full bg-slate-700 rounded-full h-2 mb-3">
              <div
                class="h-full rounded-full transition-all"
                :class="getConfidenceBarColor(pred.confidence)"
                :style="{ width: pred.confidence + '%' }"
              ></div>
            </div>

            <!-- Raisonnement -->
            <p v-if="pred.reasoning" class="text-xs text-slate-400 italic">
              {{ pred.reasoning }}
            </p>

            <!-- Cotes estimées -->
            <div v-if="pred.odds" class="mt-3 pt-3 border-t border-slate-700">
              <div class="flex items-center justify-between text-xs">
                <span class="text-slate-500">Cote estimée:</span>
                <span class="font-bold text-yellow-400">{{ pred.odds }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Métadonnées -->
      <div class="card bg-slate-800/50 border-slate-700">
        <div class="flex items-center justify-between text-sm text-slate-400">
          <span>📅 Analyse générée le {{ formatDate(analysis.generatedAt) }}</span>
          <span>🔬 Algorithmes: Poisson, Elo, Monte Carlo</span>
        </div>
      </div>

    </div>

    <!-- État vide -->
    <div v-else-if="!loading" class="text-center py-16">
      <div class="text-6xl mb-4">📊</div>
      <h3 class="text-2xl font-bold text-slate-300 mb-2">Aucune analyse en cours</h3>
      <p class="text-slate-500 mb-6">Configurez les paramètres ci-dessus et lancez l'analyse</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import GoalFilterCard from '../components/GoalFilterCard.vue'
import TeamFormCard from '../components/TeamFormCard.vue'
import H2HCard from '../components/H2HCard.vue'
import axios from 'axios'

const authStore = useAuthStore()

const form = ref({
  sport: 'football',
  homeTeamId: '',
  awayTeamId: '',
  season: new Date().getFullYear()
})

const loading = ref(false)
const error = ref(null)
const analysis = ref(null)

const isFormValid = computed(() => {
  return form.value.homeTeamId && form.value.awayTeamId && form.value.season
})

const analyzeMatch = async () => {
  if (!isFormValid.value) return

  loading.value = true
  error.value = null
  analysis.value = null

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/analysis/match`,
      form.value,
      {
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      }
    )

    analysis.value = response.data.data
  } catch (err) {
    error.value = err.response?.data?.error || err.message || 'Erreur lors de l\'analyse'
    if (import.meta.env.DEV) {
      console.error('Erreur analyse:', err)
    }
  } finally {
    loading.value = false
  }
}

const getPredictionClass = (pred) => {
  if (pred.isRecommended) {
    return 'bg-emerald-500/10 border-emerald-500/50 shadow-emerald-500/20'
  }
  if (pred.confidence >= 70) {
    return 'bg-blue-500/10 border-blue-500/30'
  }
  return 'bg-slate-700/50 border-slate-600'
}

const getConfidenceColor = (confidence) => {
  if (confidence >= 75) return 'text-emerald-400'
  if (confidence >= 60) return 'text-blue-400'
  if (confidence >= 50) return 'text-yellow-400'
  return 'text-slate-400'
}

const getConfidenceBarColor = (confidence) => {
  if (confidence >= 75) return 'bg-emerald-500'
  if (confidence >= 60) return 'bg-blue-500'
  if (confidence >= 50) return 'bg-yellow-500'
  return 'bg-slate-500'
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>
