<template>
  <div class="match-quality-card">
    <!-- Score de qualité global -->
    <div class="quality-header mb-4 p-4 rounded-xl" :class="getGradeClass(quality.grade.color)">
      <div class="flex items-center justify-between">
        <div>
          <div class="text-sm text-slate-300 mb-1">Score de Qualité</div>
          <div class="flex items-center gap-3">
            <div class="text-4xl font-bold">{{ quality.total }}<span class="text-2xl">/100</span></div>
            <div>
              <div class="text-2xl font-bold">{{ quality.grade.grade }}</div>
              <div class="text-xs opacity-75">{{ quality.grade.label }}</div>
            </div>
          </div>
        </div>
        <div class="text-5xl">{{ getGradeEmoji(quality.grade.grade) }}</div>
      </div>

      <!-- Barre de progression -->
      <div class="mt-3 bg-slate-700/50 rounded-full h-2">
        <div
          class="h-full rounded-full transition-all duration-500"
          :class="`bg-${quality.grade.color}-500`"
          :style="{ width: quality.percentage + '%' }"
        ></div>
      </div>
    </div>

    <!-- Facteurs détaillés -->
    <div class="factors-grid grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
      <div
        v-for="factor in quality.factors"
        :key="factor.name"
        class="factor-item p-3 rounded-lg bg-slate-700/30 border border-slate-600/50"
      >
        <div class="text-xs text-slate-400 mb-1">{{ factor.name }}</div>
        <div class="flex items-center justify-between mb-2">
          <div class="font-bold text-white">{{ factor.score }}/{{ factor.max }}</div>
          <div class="text-xs" :class="getFactorColor(factor.percentage)">
            {{ factor.percentage }}%
          </div>
        </div>
        <div class="w-full bg-slate-700 rounded-full h-1">
          <div
            class="h-full rounded-full transition-all"
            :class="getFactorBarColor(factor.percentage)"
            :style="{ width: factor.percentage + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Recommandations -->
    <div v-if="recommendations.length > 0" class="recommendations">
      <div class="text-sm font-bold text-slate-300 mb-2">📌 Recommandations</div>
      <div class="space-y-2">
        <div
          v-for="(rec, idx) in recommendations"
          :key="idx"
          class="rec-item p-3 rounded-lg border transition-all hover:scale-[1.02]"
          :class="getRecommendationClass(rec.priority)"
        >
          <div class="flex items-start gap-2">
            <span class="text-xl">{{ rec.icon }}</span>
            <div class="flex-1">
              <div class="font-bold text-sm">{{ rec.title }}</div>
              <div class="text-xs opacity-75 mt-1">{{ rec.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Critères d'analyse -->
    <div v-if="showDetailedCriteria" class="criteria-details mt-4 pt-4 border-t border-slate-700">
      <div class="text-sm font-bold text-slate-300 mb-3">📊 Analyse détaillée</div>

      <div class="space-y-3">
        <!-- Confiance globale -->
        <div class="criterion-row flex items-center justify-between p-2 rounded bg-slate-700/20">
          <div class="flex items-center gap-2">
            <span>{{ criteria.overallConfidence.icon }}</span>
            <span class="text-sm">{{ criteria.overallConfidence.label }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="text-sm font-bold">{{ criteria.overallConfidence.value }}%</div>
            <span
              class="text-xs px-2 py-1 rounded"
              :class="`bg-${criteria.overallConfidence.status.color}-500/20 text-${criteria.overallConfidence.status.color}-400`"
            >
              {{ criteria.overallConfidence.status.label }}
            </span>
          </div>
        </div>

        <!-- Avantage domicile -->
        <div class="criterion-row flex items-center justify-between p-2 rounded bg-slate-700/20">
          <div class="flex items-center gap-2">
            <span>{{ criteria.homeAdvantage.icon }}</span>
            <span class="text-sm">{{ criteria.homeAdvantage.label }}</span>
          </div>
          <div class="text-sm font-bold">{{ criteria.homeAdvantage.value }}%</div>
        </div>

        <!-- Scoring attendu (adapté au sport) -->
        <div class="criterion-row flex items-center justify-between p-2 rounded bg-slate-700/20">
          <div class="flex items-center gap-2">
            <span>{{ criteria.scoring.icon }}</span>
            <span class="text-sm">{{ criteria.scoring.label }}</span>
          </div>
          <div class="flex items-center gap-2">
            <div class="text-sm font-bold">{{ criteria.scoring.value }}</div>
            <span
              class="text-xs px-2 py-1 rounded"
              :class="`bg-${criteria.scoring.status.color}-500/20 text-${criteria.scoring.status.color}-400`"
            >
              {{ criteria.scoring.status.label }}
            </span>
          </div>
        </div>

        <!-- Niveau ligue -->
        <div class="criterion-row flex items-center justify-between p-2 rounded bg-slate-700/20">
          <div class="flex items-center gap-2">
            <span>{{ criteria.leagueLevel.icon }}</span>
            <span class="text-sm">{{ criteria.leagueLevel.label }}</span>
          </div>
          <div class="text-xs text-slate-400">
            {{ criteria.leagueLevel.country }} • {{ criteria.leagueLevel.value.label }}
          </div>
        </div>
      </div>
    </div>

    <!-- Toggle détails -->
    <button
      v-if="!showDetailedCriteria"
      @click="$emit('toggle-details')"
      class="mt-3 w-full py-2 text-xs text-slate-400 hover:text-white transition-colors"
    >
      🔽 Voir l'analyse détaillée
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  quality: {
    type: Object,
    required: true
  },
  recommendations: {
    type: Array,
    default: () => []
  },
  criteria: {
    type: Object,
    required: true
  },
  showDetailedCriteria: {
    type: Boolean,
    default: false
  }
})

defineEmits(['toggle-details'])

const getGradeClass = (color) => {
  const classes = {
    emerald: 'bg-emerald-500/20 border-2 border-emerald-500/50',
    green: 'bg-green-500/20 border-2 border-green-500/50',
    blue: 'bg-blue-500/20 border-2 border-blue-500/50',
    yellow: 'bg-yellow-500/20 border-2 border-yellow-500/50',
    orange: 'bg-orange-500/20 border-2 border-orange-500/50',
    red: 'bg-red-500/20 border-2 border-red-500/50'
  }
  return classes[color] || classes.blue
}

const getGradeEmoji = (grade) => {
  const emojis = {
    'A+': '🏆',
    'A': '⭐',
    'B': '👍',
    'C': '👌',
    'D': '🤔',
    'E': '⚠️'
  }
  return emojis[grade] || '📊'
}

const getFactorColor = (percentage) => {
  if (percentage >= 80) return 'text-emerald-400'
  if (percentage >= 60) return 'text-green-400'
  if (percentage >= 40) return 'text-yellow-400'
  return 'text-orange-400'
}

const getFactorBarColor = (percentage) => {
  if (percentage >= 80) return 'bg-emerald-500'
  if (percentage >= 60) return 'bg-green-500'
  if (percentage >= 40) return 'bg-yellow-500'
  return 'bg-orange-500'
}

const getRecommendationClass = (priority) => {
  if (priority === 'high') {
    return 'bg-emerald-500/10 border-emerald-500/50'
  }
  if (priority === 'medium') {
    return 'bg-blue-500/10 border-blue-500/30'
  }
  return 'bg-slate-700/50 border-slate-600'
}
</script>

<style scoped>
.match-quality-card {
  @apply rounded-xl bg-slate-800/50 p-4 border border-slate-700;
}

.factor-item:hover {
  @apply bg-slate-700/50 border-slate-500/50;
}

.rec-item {
  cursor: default;
}
</style>
