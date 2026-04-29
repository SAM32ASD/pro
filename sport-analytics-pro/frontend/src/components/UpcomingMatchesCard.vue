<template>
  <div class="card">

    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-white flex items-center gap-2">
        📅 Prochains Matchs
      </h2>
      <!-- Toggle équipe -->
      <div class="flex gap-2">
        <button
          @click="activeTeam = 'home'"
          :class="['px-3 py-1 rounded-lg text-xs font-semibold transition-all',
            activeTeam === 'home'
              ? 'bg-emerald-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600']"
        >
          {{ homeTeamName }}
        </button>
        <button
          @click="activeTeam = 'away'"
          :class="['px-3 py-1 rounded-lg text-xs font-semibold transition-all',
            activeTeam === 'away'
              ? 'bg-cyan-500 text-white'
              : 'bg-slate-700 text-slate-400 hover:bg-slate-600']"
        >
          {{ awayTeamName }}
        </button>
      </div>
    </div>

    <!-- Liste des matchs -->
    <div v-if="currentFixtures.length" class="space-y-3">
      <div
        v-for="match in currentFixtures"
        :key="match.id ?? match.date"
        class="flex items-center gap-3 p-3 bg-slate-700/40 rounded-xl hover:bg-slate-700/70 transition-colors"
      >
        <!-- Date + heure -->
        <div class="w-20 shrink-0 text-center">
          <p class="text-xs font-semibold text-white">{{ formatDay(match.date) }}</p>
          <p class="text-xs text-slate-400">{{ formatTime(match.date) }}</p>
        </div>

        <!-- Logo domicile -->
        <img v-if="match.homeLogo" :src="match.homeLogo" class="w-7 h-7 object-contain shrink-0">
        <div v-else class="w-7 h-7 shrink-0" />

        <!-- Équipes -->
        <div class="flex-1 text-center">
          <p class="text-sm font-semibold text-white leading-tight">
            {{ match.homeTeam }}
            <span class="text-slate-500 font-normal mx-1">vs</span>
            {{ match.awayTeam }}
          </p>
          <p v-if="match.competition" class="text-xs text-slate-500 mt-0.5 truncate">
            {{ match.competition }}
          </p>
        </div>

        <!-- Logo extérieur -->
        <img v-if="match.awayLogo" :src="match.awayLogo" class="w-7 h-7 object-contain shrink-0">
        <div v-else class="w-7 h-7 shrink-0" />

        <!-- Badge domicile/extérieur -->
        <span
          class="shrink-0 px-2 py-0.5 rounded text-xs font-bold"
          :class="isHomeGame(match) ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-400'"
        >
          {{ isHomeGame(match) ? 'DOM' : 'EXT' }}
        </span>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="text-center py-10 text-slate-500">
      <div class="text-4xl mb-3">📅</div>
      <p class="text-sm">Aucun match à venir disponible</p>
    </div>

  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  homeFixtures: {
    type: Array,
    default: () => []
  },
  awayFixtures: {
    type: Array,
    default: () => []
  },
  homeTeamName: {
    type: String,
    default: 'Domicile'
  },
  awayTeamName: {
    type: String,
    default: 'Extérieur'
  }
})

const activeTeam = ref('home')

const currentFixtures = computed(() =>
  activeTeam.value === 'home' ? props.homeFixtures : props.awayFixtures
)

const activeTeamName = computed(() =>
  activeTeam.value === 'home' ? props.homeTeamName : props.awayTeamName
)

function formatDay(dateStr) {
  if (!dateStr) return '–'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short'
  })
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const h = d.getHours()
  const m = d.getMinutes()
  if (h === 0 && m === 0) return 'TBD'
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function isHomeGame(match) {
  const name = activeTeamName.value.toLowerCase()
  return match.homeTeam?.toLowerCase().includes(name) ||
         name.includes(match.homeTeam?.toLowerCase() ?? '')
}
</script>