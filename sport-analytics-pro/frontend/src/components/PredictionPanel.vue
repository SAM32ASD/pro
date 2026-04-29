<template>
  <div>
    <!-- Quality Score -->
    <MatchQualityCard
      :quality="getMatchQuality(match)"
      :recommendations="getMatchRecommendations(match)"
      :criteria="getMatchCriteria(match)"
      :showDetailedCriteria="showDetailedAnalysis[match.id]"
      @toggle-details="toggleDetailedAnalysis(match.id)"
      class="mb-4"
    />

    <!-- FOOTBALL predictions -->
    <div v-if="match.sport === 'football' && getMatchPredictions(match).goalsPredictions" class="space-y-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-sm">&#9917;</span>
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Analyse Buts</h4>
      </div>
      <div :class="['p-3 rounded-lg border', getMatchPredictions(match).goalsPredictions.goalFilter.isRecommended ? 'bg-green-500/5 border-green-500/30' : 'bg-red-500/5 border-red-500/20']">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="text-lg">{{ getMatchPredictions(match).goalsPredictions.goalFilter.isRecommended ? '&#9989;' : '&#10060;' }}</span>
            <div>
              <div :class="['text-xs font-bold', getMatchPredictions(match).goalsPredictions.goalFilter.isRecommended ? 'text-green-400' : 'text-red-400']">
                {{ getMatchPredictions(match).goalsPredictions.goalFilter.isRecommended ? 'RECOMMANDE' : 'NON RECOMMANDE' }}
              </div>
              <div class="text-[10px] text-slate-500">Over 0.5 MT + Over 1.5 + Over 2.5 + BTTS</div>
            </div>
          </div>
          <div :class="['text-xl font-bold', getMatchPredictions(match).goalsPredictions.goalFilter.isRecommended ? 'text-green-400' : 'text-red-400']">
            {{ getMatchPredictions(match).goalsPredictions.goalFilter.score }}<span class="text-xs text-slate-500">/100</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div v-for="criterion in [
            { label: 'Over 0.5 MT', data: getMatchPredictions(match).goalsPredictions.over05HT },
            { label: 'Over 1.5', data: getMatchPredictions(match).goalsPredictions.over15 },
            { label: 'Over 2.5', data: getMatchPredictions(match).goalsPredictions.over25 },
            { label: 'BTTS', data: getMatchPredictions(match).goalsPredictions.btts }
          ]" :key="criterion.label" class="p-2 rounded bg-[#0d1117]/50">
            <div class="flex items-center justify-between text-[10px] mb-1">
              <span class="text-slate-400">{{ criterion.label }}</span>
              <span :class="['font-bold', criterion.data.recommended ? 'text-green-400' : 'text-red-400']">{{ criterion.data.probability }}%</span>
            </div>
            <div class="w-full bg-[#30363d] rounded-full h-1">
              <div :class="['h-full rounded-full transition-all duration-500', criterion.data.recommended ? 'bg-green-500' : 'bg-red-500']" :style="{ width: criterion.data.probability + '%' }"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- BASKETBALL predictions -->
    <div v-if="match.sport === 'basketball' && getMatchPredictions(match).basketballPredictions" class="space-y-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-sm">&#127936;</span>
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Analyse Basketball</h4>
      </div>
      <div class="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <div class="text-xs font-bold text-orange-400">Points attendus</div>
            <div class="text-[10px] text-slate-500">Total combine des deux equipes</div>
          </div>
          <div class="text-xl font-bold text-orange-400">
            {{ getMatchPredictions(match).basketballPredictions.expectedPoints.total }}
            <span class="text-xs text-slate-500">pts</span>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2 mb-3">
          <div class="p-2 rounded bg-[#0d1117]/50 text-center">
            <div class="text-[10px] text-slate-400 truncate">{{ match.homeTeam.name }}</div>
            <div class="text-sm font-bold text-white">{{ getMatchPredictions(match).basketballPredictions.expectedPoints.home }} pts</div>
          </div>
          <div class="p-2 rounded bg-[#0d1117]/50 text-center">
            <div class="text-[10px] text-slate-400 truncate">{{ match.awayTeam.name }}</div>
            <div class="text-sm font-bold text-white">{{ getMatchPredictions(match).basketballPredictions.expectedPoints.away }} pts</div>
          </div>
        </div>
        <div class="p-2 rounded bg-[#0d1117]/50 mb-3">
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-slate-400">Spread</span>
            <span class="text-xs font-bold text-yellow-400">
              {{ getMatchPredictions(match).basketballPredictions.spread.favorite === 'home' ? match.homeTeam.name : match.awayTeam.name }}
              {{ getMatchPredictions(match).basketballPredictions.spread.value }}
            </span>
          </div>
        </div>
        <div class="grid grid-cols-3 gap-2">
          <div v-for="line in [
            { label: 'O 195.5', data: getMatchPredictions(match).basketballPredictions.over195_5 },
            { label: 'O 205.5', data: getMatchPredictions(match).basketballPredictions.over205_5 },
            { label: 'O 215.5', data: getMatchPredictions(match).basketballPredictions.over215_5 }
          ]" :key="line.label" class="p-2 rounded bg-[#0d1117]/50 text-center">
            <div class="text-[10px] text-slate-400">{{ line.label }}</div>
            <div :class="['text-sm font-bold', line.data.recommended ? 'text-green-400' : 'text-slate-400']">{{ line.data.probability }}%</div>
            <div class="w-full bg-[#30363d] rounded-full h-1 mt-1">
              <div :class="['h-full rounded-full', line.data.recommended ? 'bg-green-500' : 'bg-slate-600']" :style="{ width: line.data.probability + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-[#30363d]">
          <div class="text-[10px] text-slate-500 mb-2">Points par quart-temps</div>
          <div class="grid grid-cols-4 gap-1.5">
            <div v-for="(pts, idx) in [
              getMatchPredictions(match).basketballPredictions.quarterAnalysis.q1Expected,
              getMatchPredictions(match).basketballPredictions.quarterAnalysis.q2Expected,
              getMatchPredictions(match).basketballPredictions.quarterAnalysis.q3Expected,
              getMatchPredictions(match).basketballPredictions.quarterAnalysis.q4Expected
            ]" :key="idx" class="text-center p-1.5 rounded bg-[#0d1117]/30">
              <div class="text-[9px] text-slate-500">Q{{ idx + 1 }}</div>
              <div class="text-xs font-bold text-orange-300">{{ pts }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- VOLLEYBALL predictions -->
    <div v-if="match.sport === 'volleyball' && getMatchPredictions(match).volleyballPredictions" class="space-y-3">
      <div class="flex items-center gap-2 mb-2">
        <span class="text-sm">&#127952;</span>
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Analyse Volleyball</h4>
      </div>
      <div class="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
        <div class="mb-3">
          <div class="text-[10px] text-slate-500 mb-2">Probabilite de victoire</div>
          <div class="flex items-center gap-2">
            <span class="text-xs text-slate-300 truncate flex-1 text-right">{{ match.homeTeam.name }}</span>
            <div class="flex-1 max-w-[200px] bg-[#30363d] rounded-full h-2 flex overflow-hidden">
              <div class="bg-blue-500 h-full transition-all" :style="{ width: getMatchPredictions(match).volleyballPredictions.winner.home + '%' }"></div>
              <div class="bg-red-500 h-full transition-all" :style="{ width: getMatchPredictions(match).volleyballPredictions.winner.away + '%' }"></div>
            </div>
            <span class="text-xs text-slate-300 truncate flex-1">{{ match.awayTeam.name }}</span>
          </div>
          <div class="flex items-center justify-between mt-1">
            <span class="text-xs font-bold text-blue-400">{{ getMatchPredictions(match).volleyballPredictions.winner.home }}%</span>
            <span class="text-xs font-bold text-red-400">{{ getMatchPredictions(match).volleyballPredictions.winner.away }}%</span>
          </div>
        </div>
        <div class="mb-3">
          <div class="text-[10px] text-slate-500 mb-2">Score en sets</div>
          <div class="grid grid-cols-3 gap-2">
            <div v-for="(prob, score) in getMatchPredictions(match).volleyballPredictions.setScores" :key="score" class="p-2 rounded bg-[#0d1117]/50 text-center">
              <div class="text-xs font-bold text-white">{{ score }}</div>
              <div class="text-sm font-bold text-blue-400">{{ prob }}%</div>
            </div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div class="p-2 rounded bg-[#0d1117]/50">
            <div class="flex items-center justify-between text-[10px] mb-1">
              <span class="text-slate-400">Over 2.5 sets</span>
              <span :class="['font-bold', getMatchPredictions(match).volleyballPredictions.over2_5Sets.recommended ? 'text-green-400' : 'text-slate-400']">{{ getMatchPredictions(match).volleyballPredictions.over2_5Sets.probability }}%</span>
            </div>
            <div class="w-full bg-[#30363d] rounded-full h-1">
              <div :class="['h-full rounded-full', getMatchPredictions(match).volleyballPredictions.over2_5Sets.recommended ? 'bg-green-500' : 'bg-slate-600']" :style="{ width: getMatchPredictions(match).volleyballPredictions.over2_5Sets.probability + '%' }"></div>
            </div>
          </div>
          <div class="p-2 rounded bg-[#0d1117]/50">
            <div class="flex items-center justify-between text-[10px] mb-1">
              <span class="text-slate-400">Over 3.5 sets</span>
              <span :class="['font-bold', getMatchPredictions(match).volleyballPredictions.over3_5Sets.recommended ? 'text-green-400' : 'text-slate-400']">{{ getMatchPredictions(match).volleyballPredictions.over3_5Sets.probability }}%</span>
            </div>
            <div class="w-full bg-[#30363d] rounded-full h-1">
              <div :class="['h-full rounded-full', getMatchPredictions(match).volleyballPredictions.over3_5Sets.recommended ? 'bg-green-500' : 'bg-slate-600']" :style="{ width: getMatchPredictions(match).volleyballPredictions.over3_5Sets.probability + '%' }"></div>
            </div>
          </div>
        </div>
        <div class="mt-3 pt-3 border-t border-[#30363d] flex items-center justify-around text-center">
          <div>
            <div class="text-[10px] text-slate-500">Sets attendus</div>
            <div class="text-sm font-bold text-blue-300">{{ getMatchPredictions(match).volleyballPredictions.expectedSets }}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-500">Pts/set</div>
            <div class="text-sm font-bold text-blue-300">{{ getMatchPredictions(match).volleyballPredictions.expectedPointsPerSet }}</div>
          </div>
          <div>
            <div class="text-[10px] text-slate-500">Confiance</div>
            <div class="text-sm font-bold" :class="getMatchPredictions(match).volleyballPredictions.confidence > 55 ? 'text-green-400' : 'text-yellow-400'">{{ getMatchPredictions(match).volleyballPredictions.confidence }}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- TENNIS predictions -->
    <div v-if="match.sport === 'tennis' && match.prediction" class="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-sm">&#127934;</span>
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Pronostic Tennis</h4>
        <span v-if="match.tennis?.surface" class="ml-auto text-[10px] px-2 py-0.5 rounded bg-[#30363d] text-slate-300">{{ match.tennis.surface }}</span>
      </div>
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-white font-medium truncate flex-1">{{ match.homeTeam.name }}</span>
          <span class="text-green-400 font-bold ml-2">{{ match.prediction.probabilities.home }}%</span>
        </div>
        <div class="w-full bg-[#30363d] rounded-full h-2 flex overflow-hidden">
          <div class="bg-green-500 h-full transition-all" :style="{ width: match.prediction.probabilities.home + '%' }"></div>
          <div class="bg-slate-500 h-full transition-all" :style="{ width: match.prediction.probabilities.draw + '%' }"></div>
          <div class="bg-red-500 h-full transition-all" :style="{ width: match.prediction.probabilities.away + '%' }"></div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white font-medium truncate flex-1">{{ match.awayTeam.name }}</span>
          <span class="text-red-400 font-bold ml-2">{{ match.prediction.probabilities.away }}%</span>
        </div>
      </div>
      <div class="mt-2 text-center">
        <span class="text-[10px] text-slate-400">Confiance: </span>
        <span class="text-xs font-bold" :class="match.prediction.confidence > 65 ? 'text-green-400' : 'text-yellow-400'">{{ match.prediction.confidence }}%</span>
      </div>
    </div>

    <!-- Generic sport prediction -->
    <div v-if="!['football','basketball','volleyball','tennis'].includes(match.sport)" class="p-3 rounded-lg border border-[#30363d] bg-[#0d1117]/50">
      <div class="flex items-center gap-2 mb-3">
        <span class="text-sm">{{ getSportIcon() }}</span>
        <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Pronostic</h4>
      </div>
      <div v-if="getMatchPredictions(match).mainPrediction" class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-white font-medium truncate flex-1">{{ match.homeTeam.name }}</span>
          <span class="text-green-400 font-bold ml-2">{{ getMatchPredictions(match).mainPrediction.probabilities.home }}%</span>
        </div>
        <div class="w-full bg-[#30363d] rounded-full h-2 flex overflow-hidden">
          <div class="bg-green-500 h-full transition-all" :style="{ width: getMatchPredictions(match).mainPrediction.probabilities.home + '%' }"></div>
          <div v-if="getMatchPredictions(match).mainPrediction.probabilities.draw" class="bg-slate-500 h-full transition-all" :style="{ width: getMatchPredictions(match).mainPrediction.probabilities.draw + '%' }"></div>
          <div class="bg-red-500 h-full transition-all" :style="{ width: getMatchPredictions(match).mainPrediction.probabilities.away + '%' }"></div>
        </div>
        <div class="flex items-center justify-between text-sm">
          <span class="text-white font-medium truncate flex-1">{{ match.awayTeam.name }}</span>
          <span class="text-red-400 font-bold ml-2">{{ getMatchPredictions(match).mainPrediction.probabilities.away }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import MatchQualityCard from './MatchQualityCard.vue'

defineProps({
  match: { type: Object, required: true },
  getMatchPredictions: { type: Function, required: true },
  getMatchQuality: { type: Function, required: true },
  getMatchRecommendations: { type: Function, required: true },
  getMatchCriteria: { type: Function, required: true },
  showDetailedAnalysis: { type: Object, required: true },
  toggleDetailedAnalysis: { type: Function, required: true },
  getSportIcon: { type: Function, required: true }
})
</script>
