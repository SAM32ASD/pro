<template>
  <div class="card">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white flex items-center gap-2">
        🕘 Analyses Récentes
        <span v-if="store.sortedHistory.length" class="px-2 py-0.5 bg-slate-700 text-slate-400 rounded-full text-xs font-normal">
          {{ store.sortedHistory.length }}
        </span>
      </h2>
      <button
        v-if="store.sortedHistory.length"
        @click="confirmClear = true"
        class="text-xs text-slate-500 hover:text-red-400 transition-colors"
      >
        Tout effacer
      </button>
    </div>

    <!-- Confirmation effacement -->
    <div v-if="confirmClear" class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between gap-3">
      <p class="text-sm text-red-400">Effacer tout l'historique ?</p>
      <div class="flex gap-2">
        <button @click="store.clearHistory(); confirmClear = false"
          class="px-3 py-1 bg-red-500 text-white rounded-lg text-xs font-semibold hover:bg-red-600 transition-colors">
          Confirmer
        </button>
        <button @click="confirmClear = false"
          class="px-3 py-1 bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-600 transition-colors">
          Annuler
        </button>
      </div>
    </div>

    <!-- Liste -->
    <div v-if="store.sortedHistory.length" class="space-y-3">
      <div
        v-for="entry in store.sortedHistory"
        :key="entry.id"
        class="group relative flex items-center gap-4 p-4 bg-slate-700/40 rounded-xl hover:bg-slate-700/70 transition-all cursor-pointer border border-transparent hover:border-slate-600"
        @click="$emit('reanalyze', entry)"
      >
        <!-- Logos équipes -->
        <div class="flex items-center gap-2 shrink-0">
          <img v-if="entry.homeTeamLogo" :src="entry.homeTeamLogo" class="w-8 h-8 object-contain">
          <div v-else class="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs text-slate-400">
            {{ entry.homeTeamName?.[0] }}
          </div>
          <span class="text-slate-500 text-xs font-bold">vs</span>
          <img v-if="entry.awayTeamLogo" :src="entry.awayTeamLogo" class="w-8 h-8 object-contain">
          <div v-else class="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-xs text-slate-400">
            {{ entry.awayTeamName?.[0] }}
          </div>
        </div>

        <!-- Infos -->
        <div class="flex-1 min-w-0">
          <p class="text-sm font-semibold text-white truncate">
            {{ entry.homeTeamName }} <span class="text-slate-500 font-normal">vs</span> {{ entry.awayTeamName }}
          </p>
          <div class="flex items-center gap-2 mt-1 flex-wrap">
            <span class="text-xs text-slate-500">{{ formatDate(entry.analyzedAt) }}</span>
            <span class="text-xs px-2 py-0.5 rounded-full"
              :class="entry.sport === 'football' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-orange-500/20 text-orange-400'">
              {{ entry.sport === 'football' ? '⚽' : '🏀' }} {{ entry.season }}/{{ parseInt(entry.season) + 1 }}
            </span>
            <!-- Badge recommandation -->
            <span v-if="entry.summary?.isRecommended"
              class="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full font-semibold">
              🔥 VALUE BET
            </span>
            <span v-else-if="entry.summary?.recommendation"
              class="text-xs px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full">
              ❌ Non recommandé
            </span>
          </div>
        </div>

        <!-- Bouton rejouer -->
        <div class="shrink-0 flex items-center gap-2">
          <span class="text-xs text-slate-500 group-hover:text-emerald-400 transition-colors hidden sm:block">
            Relancer →
          </span>
          <button
            @click.stop="store.removeFromHistory(entry.id)"
            class="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-red-400 text-slate-500"
            title="Supprimer"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-10 text-slate-500">
      <div class="text-4xl mb-3">🕘</div>
      <p class="text-sm">Aucune analyse effectuée pour le moment</p>
      <p class="text-xs mt-1 text-slate-600">Vos analyses apparaîtront ici après chaque recherche</p>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAnalysisStore } from '../stores/analysis'

const store = useAnalysisStore()
const confirmClear = ref(false)

defineEmits(['reanalyze'])

function formatDate(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) {
    return `Aujourd'hui à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Hier à ${d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  }
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) +
    ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}
</script>