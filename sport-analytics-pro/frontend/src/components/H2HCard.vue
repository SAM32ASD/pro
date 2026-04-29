<template>
  <div class="card">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white flex items-center gap-2">
        ⚔️ Confrontations Directes
      </h2>
      <span v-if="matchCount" class="px-3 py-1 bg-slate-700 text-slate-300 rounded-full text-xs font-semibold">
        {{ matchCount }} matchs
      </span>
    </div>

    <!-- Bilan global -->
    <div v-if="h2h" class="mb-6">

      <!-- Noms + scores -->
      <div class="flex items-center justify-between mb-3 gap-2">
        <div class="flex-1 text-center">
          <p class="text-sm font-semibold text-white truncate">{{ h2h.homeTeam }}</p>
          <p class="text-3xl font-bold text-emerald-400">{{ h2h.homeWins }}</p>
          <p class="text-xs text-slate-400">Victoires</p>
        </div>
        <div class="text-center px-4">
          <p class="text-2xl font-bold text-slate-400">{{ h2h.draws }}</p>
          <p class="text-xs text-slate-500">Nuls</p>
        </div>
        <div class="flex-1 text-center">
          <p class="text-sm font-semibold text-white truncate">{{ h2h.awayTeam }}</p>
          <p class="text-3xl font-bold text-cyan-400">{{ h2h.awayWins }}</p>
          <p class="text-xs text-slate-400">Victoires</p>
        </div>
      </div>

      <!-- Barre de progression -->
      <div class="flex h-2 rounded-full overflow-hidden gap-0.5 mb-4">
        <div
          class="bg-emerald-500 transition-all duration-700 rounded-l-full"
          :style="{ width: homeWinPct + '%' }"
        />
        <div
          class="bg-slate-500 transition-all duration-700"
          :style="{ width: drawPct + '%' }"
        />
        <div
          class="bg-cyan-500 transition-all duration-700 rounded-r-full"
          :style="{ width: awayWinPct + '%' }"
        />
      </div>

      <!-- Statistiques buts (football) -->
      <div v-if="sport === 'football' && h2h.goalPatterns" class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-slate-700/50 rounded-lg p-3 text-center">
          <p class="text-xs text-slate-400 mb-1">Buts/match</p>
          <p class="text-xl font-bold text-cyan-400">{{ h2h.goalPatterns.avgTotalGoals ?? '–' }}</p>
        </div>
        <div class="bg-slate-700/50 rounded-lg p-3 text-center">
          <p class="text-xs text-slate-400 mb-1">Over 1.5</p>
          <p class="text-xl font-bold text-emerald-400">{{ h2h.goalPatterns.over15 ?? '–' }}%</p>
        </div>
        <div class="bg-slate-700/50 rounded-lg p-3 text-center">
          <p class="text-xs text-slate-400 mb-1">Over 2.5</p>
          <p class="text-xl font-bold text-orange-400">{{ h2h.goalPatterns.over25 ?? '–' }}%</p>
        </div>
      </div>

      <!-- Statistiques points (basketball) -->
      <div v-if="sport === 'basketball' && h2h.goalPatterns" class="grid grid-cols-3 gap-3 mb-4">
        <div class="bg-slate-700/50 rounded-lg p-3 text-center">
          <p class="text-xs text-slate-400 mb-1">Pts/match</p>
          <p class="text-xl font-bold text-cyan-400">{{ h2h.goalPatterns.avgTotalGoals ?? '–' }}</p>
        </div>
        <div class="bg-slate-700/50 rounded-lg p-3 text-center">
          <p class="text-xs text-slate-400 mb-1">Over 180.5</p>
          <p class="text-xl font-bold text-emerald-400">{{ h2h.goalPatterns.over180 ?? '–' }}%</p>
        </div>
        <div class="bg-slate-700/50 rounded-lg p-3 text-center">
          <p class="text-xs text-slate-400 mb-1">Over 210.5</p>
          <p class="text-xl font-bold text-orange-400">{{ h2h.goalPatterns.over210 ?? '–' }}%</p>
        </div>
      </div>
    </div>

    <!-- Dernières rencontres -->
    <div v-if="h2h?.recentMatches?.length">
      <h3 class="text-sm font-semibold uppercase text-slate-400 tracking-widest mb-3">
        Dernières rencontres
      </h3>
      <div class="space-y-2">
        <div
          v-for="match in h2h.recentMatches"
          :key="match.id ?? match.date"
          class="flex items-center gap-3 p-3 bg-slate-700/40 rounded-xl hover:bg-slate-700/70 transition-colors text-sm"
        >
          <!-- Date -->
          <span class="text-xs text-slate-500 w-20 shrink-0">{{ formatDate(match.date) }}</span>

          <!-- Équipe domicile -->
          <span
            class="flex-1 text-right font-medium truncate"
            :class="resultClass(match, 'home')"
          >
            {{ match.homeTeam }}
          </span>

          <!-- Score -->
          <span class="font-bold text-white bg-slate-800 px-3 py-1 rounded-lg text-xs shrink-0">
            {{ match.homeScore }} – {{ match.awayScore }}
          </span>

          <!-- Équipe extérieur -->
          <span
            class="flex-1 font-medium truncate"
            :class="resultClass(match, 'away')"
          >
            {{ match.awayTeam }}
          </span>

          <!-- Compétition -->
          <span v-if="match.competition" class="text-xs text-slate-500 hidden md:block shrink-0 max-w-[100px] truncate">
            {{ match.competition }}
          </span>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else-if="!h2h" class="text-center py-10 text-slate-500">
      <div class="text-4xl mb-3">⚔️</div>
      <p>Aucune donnée de confrontation disponible</p>
    </div>

  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  h2h: {
    type: Object,
    default: null,
    // Forme attendue :
    // {
    //   homeTeam: String,
    //   awayTeam: String,
    //   homeWins: Number,
    //   awayWins: Number,
    //   draws: Number,
    //   goalPatterns: { avgTotalGoals, over15, over25, over180, over210, matchesPlayed },
    //   recentMatches: [{ id?, date, homeTeam, awayTeam, homeScore, awayScore, competition? }]
    // }
  },
  sport: {
    type: String,
    default: 'football' // 'football' | 'basketball'
  }
})

const matchCount = computed(() => {
  if (!props.h2h) return 0
  return (props.h2h.homeWins ?? 0) + (props.h2h.awayWins ?? 0) + (props.h2h.draws ?? 0)
})

const homeWinPct = computed(() =>
  matchCount.value ? (props.h2h.homeWins / matchCount.value) * 100 : 0
)
const awayWinPct = computed(() =>
  matchCount.value ? (props.h2h.awayWins / matchCount.value) * 100 : 0
)
const drawPct = computed(() =>
  matchCount.value ? (props.h2h.draws / matchCount.value) * 100 : 0
)

function formatDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function resultClass(match, side) {
  const homeWon = match.homeScore > match.awayScore
  const awayWon = match.awayScore > match.homeScore
  if (side === 'home') {
    return homeWon ? 'text-emerald-400' : awayWon ? 'text-slate-500' : 'text-slate-300'
  }
  return awayWon ? 'text-cyan-400' : homeWon ? 'text-slate-500' : 'text-slate-300'
}
</script>