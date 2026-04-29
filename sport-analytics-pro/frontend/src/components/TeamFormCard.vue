<template>
  <div class="card" :class="isHome ? 'border-l-4 border-emerald-500' : 'border-r-4 border-cyan-500'">
    <div class="flex items-center gap-4 mb-4">
      <img :src="team.logo" class="w-12 h-12 object-contain">
      <div>
        <h3 class="font-bold text-lg">{{ team.name }}</h3>
        <span class="text-xs text-slate-400">{{ isHome ? 'Domicile' : 'Extérieur' }}</span>
      </div>
    </div>

    <!-- Forme récente (5 derniers matchs) -->
    <div v-if="form && form.length" class="mb-4">
      <div class="text-xs text-slate-400 uppercase mb-2">Forme récente</div>
      <div class="flex gap-1">
        <div 
          v-for="(match, idx) in form.slice(0, 5)" 
          :key="idx"
          :class="['w-8 h-8 rounded flex items-center justify-center text-xs font-bold',
            match.result === 'W' ? 'bg-emerald-500/20 text-emerald-400' :
            match.result === 'D' ? 'bg-yellow-500/20 text-yellow-400' :
            'bg-red-500/20 text-red-400']"
        >
          {{ match.result }}
        </div>
      </div>
    </div>

    <!-- Stats rapides -->
    <div class="grid grid-cols-2 gap-2 text-center">
      <div class="bg-slate-800 rounded p-2">
        <div class="text-2xl font-bold text-emerald-400">{{ stats.wins || 0 }}</div>
        <div class="text-xs text-slate-400">Victoires</div>
      </div>
      <div class="bg-slate-800 rounded p-2">
        <div class="text-2xl font-bold text-cyan-400">{{ stats.goalsFor || 0 }}</div>
        <div class="text-xs text-slate-400">Buts marqués</div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  team: Object,
  isHome: Boolean,
  sport: String,
  form: {
    type: Array,
    default: () => []
  },
  stats: {
    type: Object,
    default: () => ({})
  }
})
</script>