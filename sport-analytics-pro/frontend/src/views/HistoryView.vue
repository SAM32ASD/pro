<template>
  <div class="max-w-7xl mx-auto px-4 py-8">
    <!-- Header -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2 text-white">
            Historique
          </h1>
          <p class="text-slate-400">
            Matchs terminés aujourd'hui et analyses précédentes
          </p>
        </div>

        <!-- Toggle entre Matchs de la journée, Analyses et Bilan -->
        <div class="flex gap-2">
          <button
            @click="viewMode = 'matches'"
            :class="['px-4 py-2 rounded-lg font-semibold transition-all',
              viewMode === 'matches'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
          >
            📅 Matchs du jour
          </button>
          <button
            @click="viewMode = 'analyses'"
            :class="['px-4 py-2 rounded-lg font-semibold transition-all',
              viewMode === 'analyses'
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
          >
            📊 Mes analyses
          </button>
          <button
            @click="viewMode = 'stats'"
            :class="['px-4 py-2 rounded-lg font-semibold transition-all',
              viewMode === 'stats'
                ? 'bg-purple-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
          >
            📈 Bilan
          </button>
        </div>
      </div>
    </div>

    <!-- MODE BILAN: Statistiques cumulées persistantes -->
    <div v-if="viewMode === 'stats'" class="space-y-6">

      <!-- En-tête résumé -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">📊</div>
            <div class="flex-1">
              <div class="text-3xl font-bold text-blue-400">{{ cStats.over05HT.total }}</div>
              <div class="text-xs text-slate-400">Matchs suivis</div>
              <div class="text-xs text-slate-500 mt-1">
                ✅ {{ cStats.over05HT.won + cStats.over05HT.lost }} terminés | ⏳ {{ cStats.over05HT.pending }} en attente
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/30">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">✅</div>
            <div class="flex-1">
              <div class="text-3xl font-bold text-emerald-400">{{ globalSuccessRate }}%</div>
              <div class="text-xs text-slate-400">Taux global (combiné)</div>
              <div class="text-xs text-slate-500 mt-1">
                {{ cStats.combined.won }}W / {{ cStats.combined.lost }}L
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">🎯</div>
            <div class="flex-1">
              <div class="text-3xl font-bold text-purple-400">{{ bestCategory.rate }}%</div>
              <div class="text-xs text-slate-400">Meilleur taux</div>
              <div class="text-xs text-slate-500 mt-1">{{ bestCategory.label }}</div>
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-500/30">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-2xl">🏆</div>
            <div class="flex-1">
              <div class="text-3xl font-bold text-cyan-400">{{ totalWins }}</div>
              <div class="text-xs text-slate-400">Total pronostics gagnés</div>
              <div class="text-xs text-slate-500 mt-1">Tous critères confondus</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bilan détaillé par critère -->
      <div class="card">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-white flex items-center gap-2">
            <span>⚽</span>
            <span>Bilan par Critère (progressif)</span>
          </h3>
          <button
            @click="confirmClearTracking"
            v-if="cStats.over05HT.total > 0"
            class="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-medium">
            Réinitialiser
          </button>
        </div>

        <!-- Onglets Criteres simples / Combines -->
        <div class="flex items-center gap-2 mb-4">
          <button
            @click="statsTab = 'simple'"
            :class="['px-4 py-2 rounded-lg font-semibold text-sm transition-all',
              statsTab === 'simple' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600']">
            Criteres simples
          </button>
          <button
            @click="statsTab = 'combines'"
            :class="['px-4 py-2 rounded-lg font-semibold text-sm transition-all',
              statsTab === 'combines' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600']">
            Combines
          </button>
        </div>

        <!-- ====== CRITERES SIMPLES ====== -->
        <div v-if="statsTab === 'simple'" class="space-y-6">
          <div v-for="item in simpleCriteria" :key="item.key"
            class="p-4 rounded-lg bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50">
            <div class="flex items-center justify-between mb-3">
              <h4 class="font-bold text-lg" :class="item.color">{{ item.label }}</h4>
              <div class="text-2xl font-bold" :class="getStatColor(rateOf(item.key))">{{ rateOf(item.key) }}%</div>
            </div>
            <div class="grid grid-cols-4 gap-4 text-center">
              <div><div class="text-2xl font-bold text-white">{{ getStat(item.key).total }}</div><div class="text-xs text-slate-400">Total</div></div>
              <div><div class="text-2xl font-bold text-emerald-400">{{ getStat(item.key).won }}</div><div class="text-xs text-slate-400">Gagnes</div></div>
              <div><div class="text-2xl font-bold text-red-400">{{ getStat(item.key).lost }}</div><div class="text-xs text-slate-400">Perdus</div></div>
              <div><div class="text-2xl font-bold text-yellow-400">{{ getStat(item.key).pending }}</div><div class="text-xs text-slate-400">En attente</div></div>
            </div>
            <div class="mt-3 w-full bg-slate-700 rounded-full h-2.5">
              <div :class="['h-2.5 rounded-full transition-all duration-500', item.barColor]" :style="{ width: `${rateOf(item.key)}%` }"></div>
            </div>
          </div>
        </div>

        <!-- ====== COMBINES ====== -->
        <div v-if="statsTab === 'combines'" class="space-y-6">
          <div v-for="item in combineCriteria" :key="item.key"
            :class="['p-4 rounded-lg border-2', item.borderClass]">
            <div class="flex items-center justify-between mb-3">
              <div>
                <h4 class="font-bold text-lg" :class="item.color">{{ item.label }}</h4>
                <p class="text-[11px] text-slate-500 mt-0.5">{{ item.desc }}</p>
              </div>
              <div class="text-2xl font-bold" :class="getStatColor(rateOf(item.key))">{{ rateOf(item.key) }}%</div>
            </div>
            <div class="grid grid-cols-4 gap-4 text-center">
              <div><div class="text-2xl font-bold text-white">{{ getStat(item.key).total }}</div><div class="text-xs text-slate-400">Total</div></div>
              <div><div class="text-2xl font-bold text-emerald-400">{{ getStat(item.key).won }}</div><div class="text-xs text-slate-400">Gagnes</div></div>
              <div><div class="text-2xl font-bold text-red-400">{{ getStat(item.key).lost }}</div><div class="text-xs text-slate-400">Perdus</div></div>
              <div><div class="text-2xl font-bold text-yellow-400">{{ getStat(item.key).pending }}</div><div class="text-xs text-slate-400">En attente</div></div>
            </div>
            <div class="mt-3 w-full bg-slate-700 rounded-full h-2.5">
              <div :class="['h-2.5 rounded-full transition-all duration-500', item.barColor]" :style="{ width: `${rateOf(item.key)}%` }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Historique des matchs trackés -->
      <div v-if="store.trackedMatches.length > 0" class="card">
        <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
          <span>📋</span>
          <span>Matchs suivis ({{ store.trackedMatches.length }})</span>
        </h3>
        <div class="space-y-3 max-h-[600px] overflow-y-auto">
          <div
            v-for="tracked in store.trackedMatches.slice(0, 50)"
            :key="tracked.matchId"
            class="p-3 rounded-lg border transition-all"
            :class="tracked.status === 'resolved'
              ? 'bg-slate-800/30 border-slate-700/50'
              : 'bg-yellow-500/5 border-yellow-500/30'">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <img v-if="tracked.homeTeam.logo" :src="tracked.homeTeam.logo" class="w-7 h-7 object-contain" alt="" />
                <span class="font-semibold text-white text-sm truncate">{{ tracked.homeTeam.name }}</span>
                <span v-if="tracked.status === 'resolved'" class="text-lg font-bold text-white">{{ tracked.scoreHome }} - {{ tracked.scoreAway }}</span>
                <span v-else class="text-sm text-slate-500">vs</span>
                <span class="font-semibold text-white text-sm truncate">{{ tracked.awayTeam.name }}</span>
                <img v-if="tracked.awayTeam.logo" :src="tracked.awayTeam.logo" class="w-7 h-7 object-contain" alt="" />
              </div>
              <div class="flex items-center gap-2">
                <span v-if="tracked.status === 'pending'" class="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold">En attente</span>
                <span v-else class="px-2 py-0.5 rounded-full bg-slate-600/50 text-slate-300 text-xs font-bold">Terminé</span>
                <button @click="store.removeTrackedMatch(tracked.matchId)" class="text-red-400 hover:text-red-300 text-xs">✕</button>
              </div>
            </div>
            <div v-if="tracked.status === 'resolved'" class="flex items-center gap-2 text-xs flex-wrap">
              <span :class="tracked.results.over05HT ? 'text-emerald-400' : 'text-red-400'">{{ tracked.results.over05HT ? '✅' : '❌' }} O0.5MT</span>
              <span :class="tracked.results.over05 ? 'text-emerald-400' : 'text-red-400'">{{ tracked.results.over05 ? '✅' : '❌' }} O0.5</span>
              <span :class="tracked.results.over15 ? 'text-emerald-400' : 'text-red-400'">{{ tracked.results.over15 ? '✅' : '❌' }} O1.5</span>
              <span :class="tracked.results.over25 ? 'text-emerald-400' : 'text-red-400'">{{ tracked.results.over25 ? '✅' : '❌' }} O2.5</span>
              <span :class="tracked.results.btts ? 'text-emerald-400' : 'text-red-400'">{{ tracked.results.btts ? '✅' : '❌' }} BTTS</span>
              <span v-if="tracked.htHome !== null" class="text-slate-500 ml-auto">MT: {{ tracked.htHome }}-{{ tracked.htAway }}</span>
            </div>
            <div class="text-xs text-slate-500 mt-1">{{ tracked.league }} - {{ formatDate(tracked.trackedAt) }}</div>
          </div>
        </div>
      </div>

      <!-- Message si pas de données -->
      <div v-if="cStats.over05HT.total === 0" class="card text-center py-12">
        <div class="text-6xl mb-4">📊</div>
        <h3 class="text-xl font-bold text-slate-300 mb-2">Aucun match suivi</h3>
        <p class="text-slate-500 mb-4">
          Les matchs recommandés seront automatiquement suivis quand vous consultez la page des matchs.
        </p>
        <router-link to="/matches" class="px-6 py-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-lg font-bold hover:from-emerald-600 hover:to-cyan-600 transition-all">
          Voir les matchs
        </router-link>
      </div>
    </div>

    <!-- Statistiques -->
    <div v-if="viewMode !== 'stats' && ((viewMode === 'matches' && finishedMatches.length > 0) || (viewMode === 'analyses' && store.analysisHistory.length > 0))" class="space-y-4 mb-8">
      <!-- Première ligne : Stats globales -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-500/30">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">
              📊
            </div>
            <div>
              <div class="text-3xl font-bold text-blue-400">
                {{ viewMode === 'matches' ? finishedMatches.length : store.analysisHistory.length }}
              </div>
              <div class="text-xs text-slate-400">
                {{ viewMode === 'matches' ? 'Matchs terminés' : 'Analyses totales' }}
              </div>
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 border-emerald-500/30">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-2xl">
              ✅
            </div>
            <div>
              <div class="text-3xl font-bold text-emerald-400">{{ recommendedCount }}</div>
              <div class="text-xs text-slate-400">Recommandés</div>
            </div>
          </div>
        </div>

        <div class="card bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-500/30">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              <div class="text-3xl font-bold text-purple-400">{{ uniqueSportsCount }}</div>
              <div class="text-xs text-slate-400">Sports différents</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Deuxième ligne : Stats par sport -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div v-for="sport in sportsWithMatches" :key="sport.id" class="card bg-gradient-to-br from-slate-800/50 to-slate-900/50 border-slate-700/50">
          <div class="flex flex-col items-center justify-center py-2">
            <div class="text-3xl mb-1">{{ sport.icon }}</div>
            <div class="text-2xl font-bold text-white">{{ sport.count }}</div>
            <div class="text-xs text-slate-400">{{ sport.name }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filtres -->
    <div v-if="viewMode !== 'stats' && ((viewMode === 'matches' && allTodayMatches.length > 0) || (viewMode === 'analyses' && store.analysisHistory.length > 0))" class="card mb-6">
      <div class="flex items-center gap-4 flex-wrap">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-sm text-slate-400">Filtrer :</span>
          <button
            @click="filterSport = 'all'"
            :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              filterSport === 'all'
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
          >
            Tous
          </button>
          <button
            v-for="sport in availableSportsForFilter"
            :key="sport.id"
            @click="filterSport = sport.id"
            :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              filterSport === sport.id
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
          >
            {{ sport.icon }} {{ sport.name }}
          </button>
        </div>

        <div class="flex items-center gap-2">
          <!-- Toggle Terminés/Tous (seulement pour matchs) -->
          <template v-if="viewMode === 'matches'">
            <span class="text-sm text-slate-400">Statut :</span>
            <button
              @click="showOnlyFinished = !showOnlyFinished"
              :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                showOnlyFinished
                  ? 'bg-blue-500 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
            >
              {{ showOnlyFinished ? '✅ Terminés' : '📅 Tous' }}
            </button>
          </template>

          <span class="text-sm text-slate-400">Recommandés :</span>
          <button
            @click="filterRecommended = !filterRecommended"
            :class="['px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              filterRecommended
                ? 'bg-emerald-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600']"
          >
            {{ filterRecommended ? '✅ Activé' : 'Désactivé' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Liste des matchs/analyses -->
    <div v-if="viewMode !== 'stats' && filteredHistory.length === 0 && ((viewMode === 'matches' && finishedMatches.length > 0) || (viewMode === 'analyses' && store.analysisHistory.length > 0))" class="text-center py-12 card">
      <div class="text-6xl mb-4">🔍</div>
      <h3 class="text-xl font-bold text-slate-300 mb-2">Aucun résultat avec ces filtres</h3>
      <p class="text-slate-500 mb-4">Essayez de changer les critères de filtre</p>
      <button @click="resetFilters" class="btn-secondary">
        Réinitialiser les filtres
      </button>
    </div>

    <div v-else-if="viewMode !== 'stats' && ((viewMode === 'matches' && finishedMatches.length === 0) || (viewMode === 'analyses' && store.analysisHistory.length === 0))" class="text-center py-16 card">
      <div class="text-6xl mb-4">{{ viewMode === 'matches' ? '⚽' : '📭' }}</div>
      <h3 class="text-2xl font-bold text-slate-300 mb-2">
        {{ viewMode === 'matches' ? 'Aucun match terminé aujourd\'hui' : 'Aucune analyse effectuée' }}
      </h3>
      <p class="text-slate-500 mb-6">
        {{ viewMode === 'matches'
          ? 'Les matchs terminés d\'aujourd\'hui apparaîtront ici automatiquement'
          : 'Commencez par analyser un match pour construire votre historique' }}
      </p>
      <div v-if="viewMode === 'analyses'" class="flex gap-3 justify-center">
        <router-link to="/matches" class="btn-primary">
          📅 Voir les matchs
        </router-link>
        <router-link to="/analysis" class="btn-secondary">
          🎯 Analyse personnalisée
        </router-link>
      </div>
    </div>

    <div v-else-if="viewMode !== 'stats'" class="space-y-4">
      <!-- Indicateur du nombre de matchs affichés -->
      <div v-if="viewMode === 'matches' && filteredHistory.length > 0" class="card bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-500/30">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="text-3xl">📋</div>
            <div>
              <div class="text-lg font-bold text-white">
                Affichage de {{ filteredHistory.length }} matchs
                <span v-if="totalFilteredCount > filteredHistory.length" class="text-slate-400">
                  sur {{ totalFilteredCount }}
                </span>
              </div>
              <div class="text-xs text-slate-400">
                {{ filterSport !== 'all' ? getSportIcon(filterSport) + ' ' : '' }}
                {{ filterRecommended ? '✅ Recommandés uniquement' : 'Tous les matchs terminés aujourd\'hui' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- MODE: Matchs terminés -->
      <template v-if="viewMode === 'matches'">
        <div
          v-for="(match, index) in filteredHistory"
          :key="match.id"
          class="card animate-fade-in"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >
          <!-- En-tête avec équipes et score -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4 flex-1">
              <!-- Équipe domicile -->
              <div class="flex items-center gap-2 flex-1">
                <img :src="match.homeTeam.logo" :alt="match.homeTeam.name" class="w-12 h-12 object-contain" />
                <span class="font-bold text-white">{{ match.homeTeam.name }}</span>
              </div>

              <!-- Score -->
              <div class="text-center px-4">
                <div class="text-3xl font-bold text-white">
                  {{ match.score.home }} - {{ match.score.away }}
                </div>
                <div class="text-xs text-slate-500 mt-1">{{ formatTime(match.date) }}</div>
              </div>

              <!-- Équipe extérieur -->
              <div class="flex items-center gap-2 flex-1 justify-end">
                <span class="font-bold text-white">{{ match.awayTeam.name }}</span>
                <img :src="match.awayTeam.logo" :alt="match.awayTeam.name" class="w-12 h-12 object-contain" />
              </div>
            </div>

            <!-- Badge sport -->
            <div
              :class="['ml-4 px-3 py-1 rounded-full text-xs font-bold',
                getSportBadgeClass(match.sport)]"
            >
              {{ getSportIcon(match.sport) }}
            </div>
          </div>

          <!-- Filtre de buts (Football) -->
          <div v-if="match.sport === 'football' && generateLocalPredictions(match, 'football').goalsPredictions" class="mt-4 p-3 rounded-lg border-2"
            :class="generateLocalPredictions(match, 'football').goalsPredictions.goalFilter.isRecommended
              ? 'bg-emerald-500/10 border-emerald-500/50'
              : 'bg-red-500/10 border-red-500/30'">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-2xl">{{ generateLocalPredictions(match, 'football').goalsPredictions.goalFilter.isRecommended ? '✅' : '❌' }}</span>
                <span class="font-bold" :class="generateLocalPredictions(match, 'football').goalsPredictions.goalFilter.isRecommended ? 'text-emerald-400' : 'text-red-400'">
                  {{ generateLocalPredictions(match, 'football').goalsPredictions.goalFilter.isRecommended ? 'Filtre validé' : 'Filtre échoué' }}
                </span>
              </div>
              <div class="text-right">
                <div class="text-2xl font-bold" :class="generateLocalPredictions(match, 'football').goalsPredictions.goalFilter.isRecommended ? 'text-emerald-400' : 'text-red-400'">
                  {{ generateLocalPredictions(match, 'football').goalsPredictions.goalFilter.score }}/100
                </div>
              </div>
            </div>
          </div>

          <!-- Infos match -->
          <div class="mt-3 text-xs text-slate-400">
            <span>🏆 {{ match.league.name }}</span>
            <span v-if="match.league.country" class="ml-3">📍 {{ match.league.country }}</span>
          </div>
        </div>
      </template>

      <!-- MODE: Analyses manuelles -->
      <template v-else>
      <div
        v-for="(analysis, index) in filteredHistory"
        :key="analysis.id"
        @click="viewAnalysis(analysis)"
        class="card-hover cursor-pointer animate-fade-in"
        :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <!-- En-tête avec équipes -->
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-4 flex-1 min-w-0">
            <!-- Équipe domicile -->
            <div class="flex items-center gap-2 flex-1 min-w-0">
              <img
                v-if="analysis.homeTeamLogo"
                :src="analysis.homeTeamLogo"
                :alt="analysis.homeTeamName"
                class="w-10 h-10 object-contain shrink-0"
              />
              <div class="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-lg shrink-0" v-else>
                🏠
              </div>
              <span class="font-bold text-white truncate">{{ analysis.homeTeamName }}</span>
            </div>

            <!-- VS -->
            <div class="text-slate-500 font-bold shrink-0">VS</div>

            <!-- Équipe extérieur -->
            <div class="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span class="font-bold text-white truncate">{{ analysis.awayTeamName }}</span>
              <img
                v-if="analysis.awayTeamLogo"
                :src="analysis.awayTeamLogo"
                :alt="analysis.awayTeamName"
                class="w-10 h-10 object-contain shrink-0"
              />
              <div class="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-lg shrink-0" v-else>
                ✈️
              </div>
            </div>
          </div>

          <!-- Badge sport -->
          <div
            :class="['ml-4 px-3 py-1 rounded-full text-xs font-bold shrink-0',
              analysis.sport === 'football'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-purple-500/20 text-purple-400']"
          >
            {{ analysis.sport === 'football' ? '⚽ Football' : '🏀 Basketball' }}
          </div>
        </div>

        <!-- Recommandation (si football) -->
        <div
          v-if="analysis.sport === 'football' && analysis.summary?.recommendation"
          class="mb-4 p-3 rounded-lg border-2"
          :class="analysis.summary.isRecommended
            ? 'bg-emerald-500/10 border-emerald-500/50'
            : 'bg-red-500/10 border-red-500/30'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-2xl">{{ analysis.summary.isRecommended ? '✅' : '❌' }}</span>
              <span
                class="font-bold"
                :class="analysis.summary.isRecommended ? 'text-emerald-400' : 'text-red-400'"
              >
                {{ analysis.summary.recommendation }}
              </span>
            </div>
            <span class="text-xs text-slate-400">Filtre de buts</span>
          </div>
        </div>

        <!-- Top prédiction -->
        <div v-if="analysis.summary?.topPrediction" class="mb-4 p-3 rounded-lg bg-slate-700/50">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-xs text-slate-400 uppercase mb-1">
                {{ analysis.summary.topPrediction.type?.replace(/_/g, ' ') }}
              </div>
              <div class="font-bold text-lg text-white">
                {{ analysis.summary.topPrediction.prediction }}
              </div>
            </div>
            <div class="text-right">
              <div
                class="text-2xl font-bold"
                :class="getConfidenceColor(analysis.summary.topPrediction.confidence)"
              >
                {{ analysis.summary.topPrediction.confidence }}%
              </div>
              <div class="text-xs text-slate-400">Confiance</div>
            </div>
          </div>
        </div>

        <!-- Footer avec date et actions -->
        <div class="flex items-center justify-between pt-3 border-t border-slate-700">
          <div class="flex items-center gap-4 text-sm text-slate-400">
            <span class="flex items-center gap-1">
              📅 {{ formatDate(analysis.analyzedAt) }}
            </span>
            <span class="flex items-center gap-1">
              🏆 Saison {{ analysis.season }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              @click.stop="reanalyze(analysis)"
              class="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-500/50 text-blue-400 hover:bg-blue-500/30 transition-colors text-xs font-medium"
            >
              🔄 Réanalyser
            </button>
            <button
              @click.stop="removeAnalysis(analysis.id)"
              class="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 transition-colors text-xs font-medium"
            >
              🗑️
            </button>
          </div>
        </div>
      </div>
      </template>
    </div>

    <!-- Pagination simple (seulement pour analyses) -->
    <div v-if="viewMode === 'analyses' && totalPages > 1" class="mt-8 flex items-center justify-center gap-2">
      <button
        @click="currentPage--"
        :disabled="currentPage === 1"
        class="px-4 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
      >
        ← Précédent
      </button>
      <span class="text-slate-400 mx-4">
        Page {{ currentPage }} sur {{ totalPages }}
      </span>
      <button
        @click="currentPage++"
        :disabled="currentPage === totalPages"
        class="px-4 py-2 rounded-lg bg-slate-700 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
      >
        Suivant →
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAnalysisStore, dateToStr } from '../stores/analysis'
import { useRouter } from 'vue-router'
import { generateLocalPredictions } from '../utils/localPredictions'

const store = useAnalysisStore()
const router = useRouter()

// Mode d'affichage
const viewMode = ref('matches') // 'matches', 'analyses' ou 'stats'

// Filtres
const filterSport = ref('all')
const filterRecommended = ref(false)
const showOnlyFinished = ref(false) // Toggle pour afficher seulement les terminés

const selectedStatsSport = ref('football')
const statsTab = ref('simple') // 'simple' or 'combines'

// Pagination
const currentPage = ref(1)
const itemsPerPage = ref(50) // Augmenté de 10 à 50
const showAll = ref(false) // Afficher tous les matchs

// Tous les matchs de la journée
const allTodayMatches = computed(() => {
  return store.todayMatches || []
})

// Matchs terminés d'aujourd'hui (pour filtrage)
const finishedMatches = computed(() => {
  return store.todayMatches.filter(match => {
    const finishedStatuses = ['FT', 'AET', 'PEN', 'CANC', 'ABD', 'PST', 'AWD']
    if (finishedStatuses.includes(match.status?.toUpperCase())) {
      return true
    }

    // Vérifier si match passé > 3h
    if (match.date) {
      const matchTime = new Date(match.date).getTime()
      const now = Date.now()
      const hoursAgo = (now - matchTime) / (1000 * 60 * 60)
      return hoursAgo > 3 && match.status?.toUpperCase() === 'NS'
    }

    return false
  })
})

// Matchs à afficher selon le toggle
const matchesToDisplay = computed(() => {
  if (showOnlyFinished.value) {
    return finishedMatches.value
  }
  return allTodayMatches.value
})

// Statistiques
const recommendedCount = computed(() => {
  if (viewMode.value === 'matches') {
    return matchesToDisplay.value.filter(m => {
      const pred = generateLocalPredictions(m, m.sport || store.selectedSport)
      return pred?.goalsPredictions?.goalFilter?.isRecommended
    }).length
  }
  return store.analysisHistory.filter(a => a.summary?.isRecommended).length
})

const footballCount = computed(() => {
  if (viewMode.value === 'matches') {
    return matchesToDisplay.value.filter(m => m.sport === 'football').length
  }
  return store.analysisHistory.filter(a => a.sport === 'football').length
})

const basketballCount = computed(() => {
  if (viewMode.value === 'matches') {
    return matchesToDisplay.value.filter(m => m.sport === 'basketball').length
  }
  return store.analysisHistory.filter(a => a.sport === 'basketball').length
})

// Nombre de sports uniques
const uniqueSportsCount = computed(() => {
  if (viewMode.value === 'matches') {
    const sports = new Set(matchesToDisplay.value.map(m => m.sport))
    return sports.size
  }
  const sports = new Set(store.analysisHistory.map(a => a.sport))
  return sports.size
})

// Sports avec leur nombre de matchs
const sportsWithMatches = computed(() => {
  const allSports = [
    { id: 'football', name: 'Football', icon: '⚽' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
    { id: 'rugby', name: 'Rugby', icon: '🏉' },
    { id: 'hockey', name: 'Hockey', icon: '🏒' },
    { id: 'handball', name: 'Handball', icon: '🤾' }
  ]

  const matches = viewMode.value === 'matches' ? matchesToDisplay.value : store.analysisHistory

  return allSports
    .map(sport => ({
      ...sport,
      count: matches.filter(m => m.sport === sport.id).length
    }))
    .filter(sport => sport.count > 0)
    .sort((a, b) => b.count - a.count)
})

// Sports disponibles pour le filtre
const availableSportsForFilter = computed(() => {
  return sportsWithMatches.value
})

// Sports disponibles dans l'historique
const availableSportsInHistory = computed(() => {
  const sports = [
    { id: 'football', name: 'Football', icon: '⚽' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'volleyball', name: 'Volleyball', icon: '🏐' },
    { id: 'rugby', name: 'Rugby', icon: '🏉' },
    { id: 'hockey', name: 'Hockey', icon: '🏒' },
    { id: 'handball', name: 'Handball', icon: '🤾' }
  ]

  // Filtrer uniquement les sports qui ont des matchs aujourd'hui
  return sports.filter(sport =>
    allTodayMatches.value.some(m => m.sport === sport.id)
  )
})

// Stats cumulées persistantes
const cStats = computed(() => store.cumulativeStats.football)

const defaultStat = { total: 0, won: 0, lost: 0, pending: 0 }

const getStat = (key) => {
  return cStats.value[key] || defaultStat
}

const rateOf = (key) => {
  const s = getStat(key)
  const finished = s.won + s.lost
  return finished > 0 ? Math.round((s.won / finished) * 100) : 0
}

const globalSuccessRate = computed(() => rateOf('combined'))

const totalWins = computed(() => {
  const s = cStats.value
  return (s.over05HT?.won || 0) + (s.over05?.won || 0) + (s.over15?.won || 0) + (s.over25?.won || 0) + (s.btts?.won || 0)
})

const bestCategory = computed(() => {
  const categories = [
    { key: 'over05HT', label: 'Over 0.5 MT' },
    { key: 'over05', label: 'Over 0.5' },
    { key: 'over15', label: 'Over 1.5' },
    { key: 'over25', label: 'Over 2.5' },
    { key: 'btts', label: 'BTTS' },
    { key: 'combine_05_15', label: 'O0.5 + O1.5' },
    { key: 'combine_15_25', label: 'O1.5 + O2.5' },
    { key: 'combine_05_15_25', label: 'O0.5 + O1.5 + O2.5' }
  ]
  let best = { rate: 0, label: '-' }
  categories.forEach(c => {
    const rate = rateOf(c.key)
    if (rate > best.rate) best = { rate, label: c.label }
  })
  return best
})

const simpleCriteria = [
  { key: 'over05HT', label: 'Over 0.5 Buts Mi-Temps', color: 'text-emerald-400', barColor: 'bg-emerald-500' },
  { key: 'over05',   label: 'Over 0.5 Buts Match',    color: 'text-green-400',   barColor: 'bg-green-500' },
  { key: 'over15',   label: 'Over 1.5 Buts Match',    color: 'text-cyan-400',    barColor: 'bg-cyan-500' },
  { key: 'over25',   label: 'Over 2.5 Buts Match',    color: 'text-blue-400',    barColor: 'bg-blue-500' },
  { key: 'btts',     label: 'BTTS (Les 2 marquent)',   color: 'text-orange-400',  barColor: 'bg-orange-500' }
]

const combineCriteria = [
  { key: 'combined',          label: 'O0.5 MT + O1.5 + O2.5 + BTTS', desc: 'Tous les criteres reunis',                          color: 'text-purple-400', barColor: 'bg-purple-500', borderClass: 'bg-purple-800/20 border-purple-500/50' },
  { key: 'combine_05_15',    label: 'Over 0.5 + Over 1.5',            desc: 'Au moins 1 but ET au moins 2 buts en fin de match',  color: 'text-cyan-400',   barColor: 'bg-cyan-500',   borderClass: 'bg-cyan-800/20 border-cyan-500/50' },
  { key: 'combine_15_25',    label: 'Over 1.5 + Over 2.5',            desc: 'Au moins 2 buts ET au moins 3 buts en fin de match',  color: 'text-purple-400', barColor: 'bg-purple-500', borderClass: 'bg-purple-800/20 border-purple-500/50' },
  { key: 'combine_05_15_25', label: 'Over 0.5 + Over 1.5 + Over 2.5', desc: 'Au moins 1, 2 ET 3 buts en fin de match',            color: 'text-rose-400',   barColor: 'bg-rose-500',   borderClass: 'bg-rose-800/20 border-rose-500/50' }
]

const getStatColor = (rate) => {
  if (rate >= 70) return 'text-emerald-400'
  if (rate >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

const confirmClearTracking = () => {
  if (confirm('Réinitialiser toutes les statistiques ? Cette action est irréversible.')) {
    store.clearTracking()
  }
}

// Obtenir l'icône du sport
const getSportIcon = (sport) => {
  const icons = {
    football: '⚽',
    basketball: '🏀',
    tennis: '🎾',
    volleyball: '🏐',
    rugby: '🏉',
    hockey: '🏒',
    handball: '🤾'
  }
  return icons[sport] || '🏆'
}

// Obtenir la classe CSS du badge sport
const getSportBadgeClass = (sport) => {
  const classes = {
    football: 'bg-orange-500/20 text-orange-400',
    basketball: 'bg-purple-500/20 text-purple-400',
    tennis: 'bg-emerald-500/20 text-emerald-400',
    volleyball: 'bg-blue-500/20 text-blue-400',
    rugby: 'bg-red-500/20 text-red-400',
    hockey: 'bg-cyan-500/20 text-cyan-400',
    handball: 'bg-yellow-500/20 text-yellow-400'
  }
  return classes[sport] || 'bg-slate-500/20 text-slate-400'
}

// Filtrage
const filteredHistory = computed(() => {
  let filtered = viewMode.value === 'matches' ? matchesToDisplay.value : store.sortedHistory

  // Filtre par sport
  if (filterSport.value !== 'all') {
    filtered = filtered.filter(item => {
      return item.sport === filterSport.value
    })
  }

  // Filtre par recommandation
  if (filterRecommended.value) {
    filtered = filtered.filter(item => {
      if (viewMode.value === 'matches') {
        const pred = generateLocalPredictions(item, item.sport || store.selectedSport)
        return pred?.goalsPredictions?.goalFilter?.isRecommended
      }
      return item.summary?.isRecommended
    })
  }

  // Pour les matchs de la journée : TOUT afficher (pas de pagination)
  if (viewMode.value === 'matches') {
    return filtered
  }

  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filtered.slice(start, end)
})

// Nombre total de résultats après filtrage
const totalFilteredCount = computed(() => {
  let filtered = viewMode.value === 'matches' ? matchesToDisplay.value : store.sortedHistory

  // Filtre par sport
  if (filterSport.value !== 'all') {
    filtered = filtered.filter(item => item.sport === filterSport.value)
  }

  // Filtre par recommandation
  if (filterRecommended.value) {
    filtered = filtered.filter(item => {
      if (viewMode.value === 'matches') {
        const pred = generateLocalPredictions(item, item.sport || store.selectedSport)
        return pred?.goalsPredictions?.goalFilter?.isRecommended
      }
      return item.summary?.isRecommended
    })
  }

  return filtered.length
})

const totalPages = computed(() => {
  let filtered = store.sortedHistory
  if (filterSport.value !== 'all') {
    filtered = filtered.filter(a => a.sport === filterSport.value)
  }
  if (filterRecommended.value) {
    filtered = filtered.filter(a => a.summary?.isRecommended)
  }
  return Math.ceil(filtered.length / itemsPerPage.value)
})

// Actions
const viewAnalysis = (analysis) => {
  // Rediriger vers la page d'analyse avec les paramètres
  router.push({
    name: 'analysis',
    query: {
      homeTeamId: analysis.homeTeamId,
      awayTeamId: analysis.awayTeamId,
      sport: analysis.sport,
      season: analysis.season
    }
  })
}

const reanalyze = async (analysis) => {
  try {
    await store.analyzeMatchByTeams({
      homeTeamId: analysis.homeTeamId,
      awayTeamId: analysis.awayTeamId,
      sport: analysis.sport,
      season: analysis.season,
      homeTeam: { name: analysis.homeTeamName, logo: analysis.homeTeamLogo },
      awayTeam: { name: analysis.awayTeamName, logo: analysis.awayTeamLogo }
    })

    router.push({
      name: 'analysis',
      query: {
        homeTeamId: analysis.homeTeamId,
        awayTeamId: analysis.awayTeamId,
        sport: analysis.sport,
        season: analysis.season
      }
    })
  } catch (error) {
    console.error('Erreur réanalyse:', error)
    alert('Erreur lors de la réanalyse')
  }
}

const removeAnalysis = (id) => {
  if (confirm('Voulez-vous vraiment supprimer cette analyse de l\'historique ?')) {
    store.removeFromHistory(id)
  }
}

const confirmClearHistory = () => {
  if (confirm(`Voulez-vous vraiment vider l'historique complet (${store.analysisHistory.length} analyses) ?`)) {
    store.clearHistory()
  }
}

const resetFilters = () => {
  filterSport.value = 'all'
  filterRecommended.value = false
  currentPage.value = 1
}

// Helpers
const formatTime = (dateString) =>
  new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

const formatDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return `Il y a ${minutes} min`
    }
    return `Il y a ${hours}h`
  }
  if (days === 1) return 'Hier'
  if (days < 7) return `Il y a ${days} jours`

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

onMounted(async () => {
  if (store.todayMatches.length === 0) {
    await store.fetchTodayMatches()
  }
  store.resolveTrackedMatches()
})

const getConfidenceColor = (confidence) => {
  if (confidence >= 75) return 'text-emerald-400'
  if (confidence >= 60) return 'text-blue-400'
  if (confidence >= 50) return 'text-yellow-400'
  return 'text-slate-400'
}
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
  opacity: 0;
}
</style>
