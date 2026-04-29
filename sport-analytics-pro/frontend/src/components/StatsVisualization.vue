<template>
  <div class="space-y-6">
    <!-- En-tête -->
    <div class="flex items-center justify-between">
      <h3 class="text-xl font-bold text-white">{{ title }}</h3>
      <div class="text-sm text-slate-400">{{ subtitle }}</div>
    </div>

    <!-- Graphique en barres comparatif -->
    <div v-if="type === 'comparison'" class="space-y-4">
      <div v-for="(stat, index) in stats" :key="index" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-300 font-medium">{{ stat.label }}</span>
          <div class="flex items-center gap-4">
            <span class="text-blue-400 font-bold">{{ stat.home }}{{ stat.unit }}</span>
            <span class="text-slate-600">vs</span>
            <span class="text-orange-400 font-bold">{{ stat.away }}{{ stat.unit }}</span>
          </div>
        </div>

        <!-- Barres comparatives -->
        <div class="grid grid-cols-2 gap-2">
          <!-- Barre domicile -->
          <div class="relative">
            <div class="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-700 ease-out"
                :style="{ width: getBarWidth(stat.home, stat.max) + '%' }"
              ></div>
            </div>
          </div>

          <!-- Barre extérieur -->
          <div class="relative">
            <div class="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-orange-500 to-orange-400 rounded-full transition-all duration-700 ease-out"
                :style="{ width: getBarWidth(stat.away, stat.max) + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Graphique circulaire (pourcentage) -->
    <div v-else-if="type === 'circular'" class="grid grid-cols-2 md:grid-cols-3 gap-4">
      <div v-for="(item, index) in circularData" :key="index" class="text-center">
        <!-- Cercle de progression -->
        <div class="relative inline-flex items-center justify-center mb-2">
          <svg class="w-24 h-24 transform -rotate-90">
            <!-- Cercle de fond -->
            <circle
              cx="48"
              cy="48"
              r="42"
              stroke="currentColor"
              stroke-width="6"
              fill="none"
              class="text-slate-700"
            />
            <!-- Cercle de progression -->
            <circle
              cx="48"
              cy="48"
              r="42"
              stroke="currentColor"
              stroke-width="6"
              fill="none"
              :class="getCircleColor(item.value)"
              :stroke-dasharray="getCircumference()"
              :stroke-dashoffset="getStrokeDashoffset(item.value)"
              class="transition-all duration-1000 ease-out"
            />
          </svg>
          <!-- Texte au centre -->
          <div class="absolute inset-0 flex items-center justify-center">
            <span class="text-2xl font-bold" :class="getTextColor(item.value)">
              {{ Math.round(item.value) }}%
            </span>
          </div>
        </div>

        <div class="text-sm font-medium text-slate-300">{{ item.label }}</div>
        <div class="text-xs text-slate-500">{{ item.description }}</div>
      </div>
    </div>

    <!-- Graphique en ligne (tendance) -->
    <div v-else-if="type === 'line'" class="space-y-4">
      <div class="relative h-48 bg-slate-800/50 rounded-lg p-4">
        <!-- Grille de fond -->
        <div class="absolute inset-0 flex flex-col justify-between p-4">
          <div v-for="i in 5" :key="i" class="border-t border-slate-700/50"></div>
        </div>

        <!-- Ligne de tendance -->
        <svg class="w-full h-full" viewBox="0 0 300 150" preserveAspectRatio="none">
          <polyline
            :points="getLinePoints()"
            fill="none"
            stroke="url(#lineGradient)"
            stroke-width="3"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="transition-all duration-1000"
          />

          <!-- Zone sous la courbe -->
          <polygon
            :points="getAreaPoints()"
            fill="url(#areaGradient)"
            class="transition-all duration-1000"
          />

          <!-- Définition des gradients -->
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#10b981;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#06b6d4;stop-opacity:1" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style="stop-color:#10b981;stop-opacity:0.3" />
              <stop offset="100%" style="stop-color:#10b981;stop-opacity:0" />
            </linearGradient>
          </defs>
        </svg>

        <!-- Points de données -->
        <div class="absolute inset-0 flex items-end justify-between p-4">
          <div
            v-for="(point, index) in lineData"
            :key="index"
            class="flex flex-col items-center gap-1"
            :style="{ height: point.value + '%' }"
          >
            <div
              class="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-lg animate-pulse"
            ></div>
          </div>
        </div>
      </div>

      <!-- Légendes -->
      <div class="flex items-center justify-between text-xs text-slate-400">
        <div v-for="(point, index) in lineData" :key="index" class="text-center">
          <div class="font-bold text-white">{{ point.value }}</div>
          <div>{{ point.label }}</div>
        </div>
      </div>
    </div>

    <!-- Tableau de statistiques -->
    <div v-else-if="type === 'table'" class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-700">
            <th class="text-left py-3 px-4 text-slate-400 font-medium">Statistique</th>
            <th class="text-center py-3 px-4 text-blue-400 font-medium">Domicile</th>
            <th class="text-center py-3 px-4 text-orange-400 font-medium">Extérieur</th>
            <th class="text-center py-3 px-4 text-emerald-400 font-medium">Différence</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(row, index) in tableData"
            :key="index"
            class="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
          >
            <td class="py-3 px-4 font-medium text-slate-300">{{ row.label }}</td>
            <td class="py-3 px-4 text-center text-blue-400 font-bold">{{ row.home }}</td>
            <td class="py-3 px-4 text-center text-orange-400 font-bold">{{ row.away }}</td>
            <td class="py-3 px-4 text-center">
              <span
                :class="getDiffClass(row.diff)"
                class="px-2 py-1 rounded-full text-xs font-bold"
              >
                {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: {
    type: String,
    default: 'Statistiques'
  },
  subtitle: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'comparison', // comparison, circular, line, table
    validator: (value) => ['comparison', 'circular', 'line', 'table'].includes(value)
  },
  stats: {
    type: Array,
    default: () => []
  },
  circularData: {
    type: Array,
    default: () => []
  },
  lineData: {
    type: Array,
    default: () => []
  },
  tableData: {
    type: Array,
    default: () => []
  }
})

const getBarWidth = (value, max) => {
  return Math.min(100, (value / max) * 100)
}

const getCircumference = () => {
  const radius = 42
  return 2 * Math.PI * radius
}

const getStrokeDashoffset = (percentage) => {
  const circumference = getCircumference()
  return circumference - (percentage / 100) * circumference
}

const getCircleColor = (value) => {
  if (value >= 75) return 'text-emerald-500'
  if (value >= 60) return 'text-blue-500'
  if (value >= 50) return 'text-yellow-500'
  return 'text-slate-500'
}

const getTextColor = (value) => {
  if (value >= 75) return 'text-emerald-400'
  if (value >= 60) return 'text-blue-400'
  if (value >= 50) return 'text-yellow-400'
  return 'text-slate-400'
}

const getLinePoints = () => {
  if (!props.lineData || props.lineData.length === 0) return ''

  const width = 300
  const height = 150
  const points = props.lineData.map((point, index) => {
    const x = (index / (props.lineData.length - 1)) * width
    const y = height - (point.value / 100) * height
    return `${x},${y}`
  })

  return points.join(' ')
}

const getAreaPoints = () => {
  const linePoints = getLinePoints()
  if (!linePoints) return ''

  const lastX = 300
  return `0,150 ${linePoints} ${lastX},150`
}

const getDiffClass = (diff) => {
  if (diff > 0) return 'bg-emerald-500/20 text-emerald-400'
  if (diff < 0) return 'bg-red-500/20 text-red-400'
  return 'bg-slate-500/20 text-slate-400'
}
</script>
