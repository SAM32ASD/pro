<template>
  <div class="card border-2 transition-all hover:shadow-xl" :class="filterResult.isRecommended ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'">
    <!-- En-tête avec verdict -->
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
        <div
          class="w-14 h-14 rounded-full flex items-center justify-center text-3xl shadow-lg transition-transform hover:scale-110"
          :class="filterResult.isRecommended ? 'bg-emerald-500/30 animate-pulse' : 'bg-red-500/20'"
        >
          {{ filterResult.isRecommended ? '✅' : '❌' }}
        </div>
        <div>
          <h3 class="text-2xl font-bold mb-1" :class="filterResult.isRecommended ? 'text-emerald-400' : 'text-red-400'">
            {{ filterResult.recommendation }}
          </h3>
          <p class="text-sm text-slate-400 flex items-center gap-2">
            <span class="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
            Filtre: Over 0.5 MT + Over 1.5 Match
          </p>
        </div>
      </div>
      <div v-if="filterResult.isRecommended" class="text-right">
        <div class="text-3xl font-bold text-emerald-400">{{ getGlobalScore() }}</div>
        <div class="text-xs text-slate-500">Score global</div>
      </div>
    </div>

    <!-- Critères détaillés -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      <!-- Critère 1: Mi-temps -->
      <div 
        class="p-4 rounded-xl border"
        :class="filterResult.criteria.firstHalfOver05.met ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">Over 0.5 Mi-temps</span>
          <span :class="filterResult.criteria.firstHalfOver05.met ? 'text-emerald-400' : 'text-red-400'">
            {{ filterResult.criteria.firstHalfOver05.probability }}%
          </span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2">
          <div 
            class="h-full rounded-full transition-all"
            :class="filterResult.criteria.firstHalfOver05.met ? 'bg-emerald-500' : 'bg-red-500'"
            :style="{ width: filterResult.criteria.firstHalfOver05.probability + '%' }"
          ></div>
        </div>
        <p class="text-xs text-slate-400 mt-2">
          Confiance: {{ filterResult.criteria.firstHalfOver05.confidence }}
        </p>
      </div>

      <!-- Critère 2: Match complet -->
      <div 
        class="p-4 rounded-xl border"
        :class="filterResult.criteria.matchOver15.met ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'"
      >
        <div class="flex items-center justify-between mb-2">
          <span class="font-medium">Over 1.5 Match</span>
          <span :class="filterResult.criteria.matchOver15.met ? 'text-emerald-400' : 'text-red-400'">
            {{ filterResult.criteria.matchOver15.probability }}%
          </span>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-2">
          <div 
            class="h-full rounded-full transition-all"
            :class="filterResult.criteria.matchOver15.met ? 'bg-emerald-500' : 'bg-red-500'"
            :style="{ width: filterResult.criteria.matchOver15.probability + '%' }"
          ></div>
        </div>
        <p class="text-xs text-slate-400 mt-2">
          Confiance: {{ filterResult.criteria.matchOver15.confidence }}
        </p>
      </div>
    </div>

    <!-- Statistiques détaillées avec icônes -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div class="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600/30 hover:border-emerald-500/30 transition-all">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">🏠</span>
          <p class="text-xs text-slate-400 uppercase tracking-wider">Équipe domicile</p>
        </div>
        <p class="text-2xl font-bold text-white mb-1">{{ goalPatterns?.home?.avgTotalGoals || 0 }} <span class="text-sm text-slate-400">buts/match</span></p>
        <div class="space-y-1 text-xs">
          <p class="text-emerald-400">⚡ {{ goalPatterns?.home?.over05HT || 0 }}% over 0.5 MT</p>
          <p class="text-blue-400">🎯 {{ goalPatterns?.home?.over15Match || 0 }}% over 1.5</p>
          <p class="text-purple-400">🔥 {{ goalPatterns?.home?.bttsRate || 0 }}% BTTS</p>
        </div>
      </div>

      <div class="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600/30 hover:border-yellow-500/30 transition-all">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">🤝</span>
          <p class="text-xs text-slate-400 uppercase tracking-wider">Historique H2H</p>
        </div>
        <p class="text-2xl font-bold text-white mb-1">{{ goalPatterns?.h2h?.matchesPlayed || 0 }} <span class="text-sm text-slate-400">matchs</span></p>
        <div class="space-y-1 text-xs">
          <p class="text-yellow-400">📊 {{ goalPatterns?.h2h?.avgTotalGoals || 0 }} buts/match</p>
          <p class="text-emerald-400">⚡ {{ goalPatterns?.h2h?.over05HT || 0 }}% over 0.5 MT</p>
          <p class="text-blue-400">🎯 {{ goalPatterns?.h2h?.over15Match || 0 }}% over 1.5</p>
        </div>
      </div>

      <div class="bg-gradient-to-br from-slate-700/50 to-slate-800/50 rounded-lg p-4 border border-slate-600/30 hover:border-orange-500/30 transition-all">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-xl">✈️</span>
          <p class="text-xs text-slate-400 uppercase tracking-wider">Équipe extérieur</p>
        </div>
        <p class="text-2xl font-bold text-white mb-1">{{ goalPatterns?.away?.avgTotalGoals || 0 }} <span class="text-sm text-slate-400">buts/match</span></p>
        <div class="space-y-1 text-xs">
          <p class="text-emerald-400">⚡ {{ goalPatterns?.away?.over05HT || 0 }}% over 0.5 MT</p>
          <p class="text-blue-400">🎯 {{ goalPatterns?.away?.over15Match || 0 }}% over 1.5</p>
          <p class="text-purple-400">🔥 {{ goalPatterns?.away?.bttsRate || 0 }}% BTTS</p>
        </div>
      </div>
    </div>

    <!-- Raisonnement -->
    <div class="space-y-2">
      <h4 class="font-medium text-slate-300 mb-2">Analyse détaillée</h4>
      <div 
        v-for="(reason, idx) in filterResult.reasoning" 
        :key="idx"
        class="text-sm p-2 rounded"
        :class="reason.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-300' : 'bg-red-500/10 text-red-300'"
      >
        {{ reason }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  filterResult: {
    type: Object,
    required: true
  },
  goalPatterns: {
    type: Object,
    default: null
  }
})

const getGlobalScore = () => {
  if (!props.filterResult || !props.filterResult.criteria) return '0/100'
  const firstHalf = props.filterResult.criteria.firstHalfOver05?.probability || 0
  const match = props.filterResult.criteria.matchOver15?.probability || 0
  const average = Math.round((firstHalf + match) / 2)
  return `${average}/100`
}
</script>