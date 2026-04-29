<template>
  <div class="min-h-screen bg-[#0d1117]">
    <!-- Header compact 365scores-style -->
    <header class="sticky top-0 z-50 bg-[#161b22] border-b border-[#30363d] shadow-lg">
      <div class="max-w-6xl mx-auto">
        <!-- Date navigation bar -->
        <div class="flex items-center justify-between px-4 py-2.5">
          <div class="flex items-center gap-3">
            <h1 class="text-lg font-bold text-white tracking-tight">Pro Analytics</h1>
            <div class="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-[#1c2128] px-2.5 py-1 rounded-full">
              <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Live
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              @click="store.goToPreviousDay()"
              class="p-1.5 hover:bg-[#30363d] rounded-md transition-colors text-slate-400 hover:text-white">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <button
              @click="store.goToToday()"
              v-if="!isToday"
              class="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded-md text-xs font-semibold transition-colors text-white">
              Auj.
            </button>

            <div class="px-3 py-1 bg-[#1c2128] rounded-md text-sm font-medium text-white min-w-[120px] text-center">
              {{ dateLabel }}
            </div>

            <button
              @click="store.goToNextDay()"
              class="p-1.5 hover:bg-[#30363d] rounded-md transition-colors text-slate-400 hover:text-white">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>

            <button
              @click="store.fetchTodayMatches()"
              :disabled="store.loading"
              class="p-1.5 hover:bg-[#30363d] rounded-md transition-colors text-slate-400 hover:text-white disabled:opacity-40"
              title="Rafraichir">
              <svg :class="['w-4 h-4', store.loading && 'animate-spin']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Sports tabs - horizontal scroll -->
        <div class="overflow-x-auto hide-scrollbar">
          <div class="flex items-center gap-0.5 px-4 pb-2">
            <button
              v-for="sport in availableSports"
              :key="sport.id"
              @click="store.setSport(sport.id)"
              :class="[
                'flex-shrink-0 px-3.5 py-1.5 rounded-md font-medium transition-all duration-150 flex items-center gap-1.5 text-sm',
                store.selectedSport === sport.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-[#30363d]'
              ]">
              <span class="text-base">{{ sport.icon }}</span>
              <span class="whitespace-nowrap">{{ sport.name }}</span>
              <span v-if="getMatchCountForSport(sport.id) > 0" class="ml-0.5 text-[10px] opacity-70">
                {{ getMatchCountForSport(sport.id) }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <div class="max-w-6xl mx-auto px-4 py-4">

      <!-- Warning API -->
      <div v-if="apiWarning" class="mb-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 px-4 py-3 flex items-center gap-3">
        <span class="text-lg">&#9888;&#65039;</span>
        <div class="flex-1">
          <p class="text-sm text-yellow-300">{{ apiWarning }}</p>
        </div>
        <button @click="dismissWarning" class="text-xs text-slate-400 hover:text-white">&times;</button>
      </div>

      <!-- Stats bar + view toggle -->
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <!-- Football filter badge -->
          <span v-if="store.selectedSport === 'football' && activeTab === 'recommended'" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-600/20 border border-blue-500/30 text-xs font-medium text-blue-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            Recommandes uniquement
          </span>
          <span v-if="activeTab !== 'recommended' && store.selectedSport === 'football'" class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600/20 border border-emerald-500/30 text-xs font-medium text-emerald-400">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
            </svg>
            Combine {{ getActiveTabLabel() }}
          </span>
          <span class="text-xs text-slate-500">{{ filteredMatches.length }} matchs</span>
        </div>

        <!-- View mode toggle -->
        <div class="flex items-center gap-1">
          <button
            @click="viewMode = 'cards'"
            :class="['p-1.5 rounded-md transition-colors', viewMode === 'cards' ? 'bg-blue-600 text-white' : 'bg-[#1c2128] text-slate-400 hover:text-white hover:bg-[#30363d]']">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"/>
            </svg>
          </button>
          <button
            @click="viewMode = 'list'"
            :class="['p-1.5 rounded-md transition-colors', viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-[#1c2128] text-slate-400 hover:text-white hover:bg-[#30363d]']">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <button
            @click="viewMode = 'details'"
            :class="['p-1.5 rounded-md transition-colors', viewMode === 'details' ? 'bg-blue-600 text-white' : 'bg-[#1c2128] text-slate-400 hover:text-white hover:bg-[#30363d]']">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Combines tabs (football only) -->
      <div v-if="store.selectedSport === 'football'" class="mb-4 overflow-x-auto hide-scrollbar">
        <div class="flex items-center gap-1.5 min-w-max">
          <button
            @click="activeTab = 'recommended'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === 'recommended'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-white hover:border-blue-500/40'
            ]">
            Recommandes
            <span class="ml-1 opacity-70">{{ recommendedCount }}</span>
          </button>
          <button
            @click="activeTab = 'combine_05ht'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === 'combine_05ht'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-white hover:border-emerald-500/40'
            ]">
            Over 0.5 MT
            <span class="ml-1 opacity-70">{{ combine05HTMatches.length }}</span>
          </button>
          <button
            @click="activeTab = 'combine_05'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === 'combine_05'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-white hover:border-emerald-500/40'
            ]">
            Over 0.5
            <span class="ml-1 opacity-70">{{ combine05Matches.length }}</span>
          </button>
          <button
            @click="activeTab = 'combine_15'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === 'combine_15'
                ? 'bg-yellow-600 text-white shadow-md shadow-yellow-600/20'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-white hover:border-yellow-500/40'
            ]">
            Over 1.5
            <span class="ml-1 opacity-70">{{ combine15Matches.length }}</span>
          </button>
          <button
            @click="activeTab = 'combine_25'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === 'combine_25'
                ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-white hover:border-orange-500/40'
            ]">
            Over 2.5
            <span class="ml-1 opacity-70">{{ combine25Matches.length }}</span>
          </button>
          <div class="w-px h-5 bg-[#30363d]"></div>
          <button
            @click="activeTab = 'combine_05_15'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === 'combine_05_15'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/20'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-white hover:border-cyan-500/40'
            ]">
            0.5 + 1.5
            <span class="ml-1 opacity-70">{{ combine05_15Matches.length }}</span>
          </button>
          <button
            @click="activeTab = 'combine_15_25'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === 'combine_15_25'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-white hover:border-purple-500/40'
            ]">
            1.5 + 2.5
            <span class="ml-1 opacity-70">{{ combine15_25Matches.length }}</span>
          </button>
          <button
            @click="activeTab = 'combine_05_15_25'"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap',
              activeTab === 'combine_05_15_25'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                : 'bg-[#161b22] text-slate-400 border border-[#30363d] hover:text-white hover:border-rose-500/40'
            ]">
            0.5 + 1.5 + 2.5
            <span class="ml-1 opacity-70">{{ combine05_15_25Matches.length }}</span>
          </button>
        </div>
      </div>

      <!-- ======================== COMBINE PANELS ======================== -->
      <div v-if="store.selectedSport === 'football' && activeTab !== 'recommended'" class="mb-4">
        <!-- Combine header card -->
        <div :class="[
          'rounded-lg border p-4 mb-4',
          activeTab === 'combine_05ht' ? 'bg-emerald-500/5 border-emerald-500/30' :
          activeTab === 'combine_05' ? 'bg-emerald-500/5 border-emerald-500/30' :
          activeTab === 'combine_15' ? 'bg-yellow-500/5 border-yellow-500/30' :
          activeTab === 'combine_25' ? 'bg-orange-500/5 border-orange-500/30' :
          activeTab === 'combine_05_15' ? 'bg-cyan-500/5 border-cyan-500/30' :
          activeTab === 'combine_15_25' ? 'bg-purple-500/5 border-purple-500/30' :
          activeTab === 'combine_05_15_25' ? 'bg-rose-500/5 border-rose-500/30' :
          'bg-blue-500/5 border-blue-500/30'
        ]">
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center gap-2">
              <span class="text-xl">&#127922;</span>
              <div>
                <h3 class="text-sm font-bold text-white">Combine {{ getActiveTabLabel() }}</h3>
                <p class="text-[10px] text-slate-400">{{ getActiveTabDescription() }}</p>
              </div>
            </div>
            <div class="text-right">
              <div class="text-lg font-bold text-white">{{ activeCombineMatches.length }}</div>
              <div class="text-[10px] text-slate-500">matchs</div>
            </div>
          </div>

          <!-- Cote combine estimee -->
          <div class="flex items-center gap-3 p-2.5 rounded-md bg-[#0d1117]/60">
            <div class="flex-1">
              <div class="text-[10px] text-slate-500 mb-0.5">Confiance moyenne</div>
              <div class="flex items-center gap-2">
                <div class="flex-1 h-2 bg-[#30363d] rounded-full overflow-hidden">
                  <div
                    :class="['h-full rounded-full transition-all duration-500',
                      combineAverageConfidence >= 70 ? 'bg-emerald-500' :
                      combineAverageConfidence >= 55 ? 'bg-yellow-500' : 'bg-orange-500'
                    ]"
                    :style="{ width: combineAverageConfidence + '%' }"></div>
                </div>
                <span :class="['text-xs font-bold',
                  combineAverageConfidence >= 70 ? 'text-emerald-400' :
                  combineAverageConfidence >= 55 ? 'text-yellow-400' : 'text-orange-400'
                ]">{{ combineAverageConfidence }}%</span>
              </div>
            </div>
            <div class="h-8 w-px bg-[#30363d]"></div>
            <div class="text-center px-2">
              <div class="text-[10px] text-slate-500">Probabilite</div>
              <div class="text-sm font-bold text-white">{{ combineProbability }}%</div>
            </div>
          </div>
        </div>

        <!-- Combine matches grid -->
        <div class="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <div v-for="(match, idx) in activeCombineMatches" :key="match.id"
            class="bg-[#161b22] rounded-lg border border-[#30363d] hover:border-blue-500/30 transition-all overflow-hidden">
            <!-- Card header: league + index -->
            <div class="flex items-center justify-between px-3 py-1.5 border-b border-[#30363d]/50 bg-[#0d1117]/40">
              <div class="flex items-center gap-1.5 min-w-0">
                <img v-if="match.league?.logo" :src="match.league.logo" class="w-3.5 h-3.5 object-contain flex-shrink-0" alt="">
                <span class="text-[10px] text-slate-500 truncate">{{ match.league?.name }}</span>
              </div>
              <div class="flex items-center gap-1.5 flex-shrink-0">
                <span class="text-[10px] text-slate-500">{{ formatTime(match.date) }}</span>
                <span class="text-[9px] font-bold text-slate-600">#{{ idx + 1 }}</span>
              </div>
            </div>

            <!-- Teams -->
            <div class="px-3 py-2.5 space-y-1.5">
              <div class="flex items-center gap-2">
                <img v-if="match.homeTeam.logo" :src="match.homeTeam.logo" class="w-5 h-5 object-contain flex-shrink-0" alt="" @error="$event.target.style.display='none'">
                <span v-else class="w-5 h-5 flex items-center justify-center text-[10px]">&#9917;</span>
                <span class="text-xs font-semibold text-white truncate flex-1">{{ match.homeTeam.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <img v-if="match.awayTeam.logo" :src="match.awayTeam.logo" class="w-5 h-5 object-contain flex-shrink-0" alt="" @error="$event.target.style.display='none'">
                <span v-else class="w-5 h-5 flex items-center justify-center text-[10px]">&#9917;</span>
                <span class="text-xs text-slate-400 truncate flex-1">{{ match.awayTeam.name }}</span>
              </div>
            </div>

            <!-- Criteres -->
            <div class="px-3 pb-2.5">
              <div v-if="!isMultiCombine" class="flex items-center justify-between p-2 rounded-md bg-[#0d1117]/60">
                <span class="text-[10px] text-slate-400">{{ getActiveTabLabel() }}</span>
                <div class="flex items-center gap-1.5">
                  <div class="w-16 h-1.5 bg-[#30363d] rounded-full overflow-hidden">
                    <div :class="['h-full rounded-full', getCombineMatchProb(match) >= 70 ? 'bg-emerald-500' : getCombineMatchProb(match) >= 55 ? 'bg-yellow-500' : 'bg-orange-500']"
                      :style="{ width: getCombineMatchProb(match) + '%' }"></div>
                  </div>
                  <span :class="['text-xs font-bold', getCombineMatchProb(match) >= 70 ? 'text-emerald-400' : getCombineMatchProb(match) >= 55 ? 'text-yellow-400' : 'text-orange-400']">
                    {{ getCombineMatchProb(match) }}%
                  </span>
                </div>
              </div>
              <div v-else class="space-y-1">
                <div v-for="crit in getCombineMatchCriteria(match)" :key="crit.label"
                  class="flex items-center justify-between p-1.5 rounded-md bg-[#0d1117]/60">
                  <span class="text-[10px] text-slate-400">{{ crit.label }}</span>
                  <div class="flex items-center gap-1.5">
                    <div class="w-14 h-1.5 bg-[#30363d] rounded-full overflow-hidden">
                      <div :class="['h-full rounded-full', crit.prob >= 65 ? 'bg-emerald-500' : crit.prob >= 55 ? 'bg-yellow-500' : 'bg-orange-500']"
                        :style="{ width: crit.prob + '%' }"></div>
                    </div>
                    <span :class="['text-[10px] font-bold', crit.prob >= 65 ? 'text-emerald-400' : crit.prob >= 55 ? 'text-yellow-400' : 'text-orange-400']">
                      {{ crit.prob }}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer: confiance moyenne -->
            <div class="px-3 py-1.5 border-t border-[#30363d]/50 bg-[#0d1117]/30 flex items-center justify-between">
              <span class="text-[10px] text-slate-500">Confiance</span>
              <div :class="['flex items-center gap-1 text-[10px] font-bold',
                getCombineMatchProb(match) >= 70 ? 'text-emerald-400' :
                getCombineMatchProb(match) >= 55 ? 'text-yellow-400' : 'text-orange-400']">
                <span>{{ getCombineMatchProb(match) }}%</span>
                <span class="text-base">&#10003;</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="activeCombineMatches.length === 0" class="py-8 text-center">
          <div class="text-3xl opacity-20 mb-2">&#127922;</div>
          <p class="text-sm text-slate-500">Aucun match ne repond aux criteres de ce combine</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="store.loading" class="py-16">
        <div class="flex flex-col items-center gap-3">
          <div class="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p class="text-sm text-slate-400">Chargement...</p>
        </div>
      </div>

      <!-- No matches -->
      <div v-else-if="filteredMatches.length === 0 && !apiWarning" class="py-16 text-center">
        <div class="text-5xl mb-3 opacity-20">{{ getSportIcon() }}</div>
        <h3 class="text-lg font-semibold text-slate-300 mb-1">Aucun match</h3>
        <p class="text-sm text-slate-500">Essayez une autre date ou un autre sport</p>
      </div>

      <!-- ======================== CARDS VIEW ======================== -->
      <div v-else-if="viewMode === 'cards'" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="match in filteredMatches" :key="match.id" class="col-span-1">
          <div
            @click="togglePredictions(match)"
            :class="[
              'group relative bg-[#161b22] rounded-lg border transition-all cursor-pointer overflow-hidden',
              expandedMatches[match.id] ? 'border-blue-500/60' : 'border-[#30363d] hover:border-blue-500/40'
            ]">
            <!-- Live badge -->
            <div v-if="isLive(match)" class="absolute top-2.5 right-2.5 z-10">
              <span class="flex items-center gap-1 px-1.5 py-0.5 bg-red-500 rounded-full text-[10px] font-bold">
                <span class="w-1 h-1 bg-white rounded-full animate-pulse"></span>
                LIVE
              </span>
            </div>
            <!-- League -->
            <div class="px-3 py-2 border-b border-[#30363d]/50">
              <div class="flex items-center gap-2">
                <img v-if="match.league.logo" :src="match.league.logo" class="w-4 h-4 object-contain" alt="">
                <span v-else class="text-xs">{{ getSportIcon() }}</span>
                <span class="text-[10px] font-medium text-slate-400 truncate flex-1">{{ match.league.name }}</span>
              </div>
            </div>
            <!-- Teams -->
            <div class="p-3 space-y-2.5">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5 flex-1 min-w-0">
                  <img v-if="match.homeTeam.logo" :src="match.homeTeam.logo" class="w-8 h-8 object-contain flex-shrink-0" alt="" @error="$event.target.style.display='none'">
                  <span v-else class="w-8 h-8 flex items-center justify-center text-sm flex-shrink-0">{{ getSportIcon() }}</span>
                  <span class="text-sm font-semibold text-white truncate">{{ match.homeTeam.name }}</span>
                </div>
                <span class="text-xl font-bold text-white ml-2">{{ match.score.home ?? '-' }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5 flex-1 min-w-0">
                  <img v-if="match.awayTeam.logo" :src="match.awayTeam.logo" class="w-8 h-8 object-contain flex-shrink-0" alt="" @error="$event.target.style.display='none'">
                  <span v-else class="w-8 h-8 flex items-center justify-center text-sm flex-shrink-0">{{ getSportIcon() }}</span>
                  <span class="text-sm font-semibold text-white truncate">{{ match.awayTeam.name }}</span>
                </div>
                <span class="text-xl font-bold text-white ml-2">{{ match.score.away ?? '-' }}</span>
              </div>
            </div>
            <!-- Footer -->
            <div class="px-3 py-2 bg-[#0d1117]/50 border-t border-[#30363d]/50 flex items-center justify-between text-[10px]">
              <span class="text-slate-400">{{ formatTime(match.date) }}</span>
              <div class="flex items-center gap-2">
                <span :class="['px-1.5 py-0.5 rounded font-semibold', isLive(match) ? 'bg-red-500/20 text-red-400' : 'bg-[#30363d] text-slate-300']">
                  {{ match.statusLong }}
                </span>
                <svg :class="['w-3 h-3 text-blue-400 transition-transform', expandedMatches[match.id] && 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
              </div>
            </div>
          </div>
          <!-- Expanded predictions under card -->
          <transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-2">
            <div v-if="expandedMatches[match.id]" class="mt-2 bg-[#161b22] rounded-lg border border-blue-500/30 p-3">
              <PredictionPanel :match="match" :getMatchPredictions="getMatchPredictions" :getMatchQuality="getMatchQuality" :getMatchRecommendations="getMatchRecommendations" :getMatchCriteria="getMatchCriteria" :showDetailedAnalysis="showDetailedAnalysis" :toggleDetailedAnalysis="toggleDetailedAnalysis" :getSportIcon="getSportIcon" />
            </div>
          </transition>
        </div>
      </div>

      <!-- ======================== DETAILS VIEW ======================== -->
      <div v-else-if="viewMode === 'details'" class="space-y-4">
        <div v-for="match in filteredMatches" :key="match.id"
          class="bg-[#161b22] rounded-lg border border-[#30363d] overflow-hidden">
          <!-- Match header -->
          <div class="p-4 border-b border-[#30363d]/50">
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-2">
                <img v-if="match.league.logo" :src="match.league.logo" class="w-4 h-4 object-contain" alt="">
                <span v-else class="text-xs">{{ getSportIcon() }}</span>
                <span class="text-xs font-medium text-slate-300">{{ match.league.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span v-if="isLive(match)" class="flex items-center gap-1 px-1.5 py-0.5 bg-red-500 rounded-full text-[10px] font-bold animate-pulse">
                  <span class="w-1 h-1 bg-white rounded-full"></span> LIVE
                </span>
                <span class="text-xs font-bold text-blue-400">{{ formatTime(match.date) }}</span>
              </div>
            </div>
            <!-- Teams centered -->
            <div class="flex items-center justify-between">
              <div class="flex-1 text-center">
                <img v-if="match.homeTeam.logo" :src="match.homeTeam.logo" class="w-12 h-12 object-contain mx-auto mb-1.5" alt="" @error="$event.target.style.display='none'">
                <div v-else class="text-3xl mb-1.5">{{ getSportIcon() }}</div>
                <div class="font-bold text-sm text-white">{{ match.homeTeam.name }}</div>
              </div>
              <div class="px-4 text-center">
                <div v-if="match.score.home !== null" class="text-2xl font-bold text-white">{{ match.score.home }} - {{ match.score.away }}</div>
                <div v-else class="text-slate-500 font-bold text-lg">VS</div>
                <div class="text-[10px] text-slate-500 mt-1">{{ match.statusLong }}</div>
              </div>
              <div class="flex-1 text-center">
                <img v-if="match.awayTeam.logo" :src="match.awayTeam.logo" class="w-12 h-12 object-contain mx-auto mb-1.5" alt="" @error="$event.target.style.display='none'">
                <div v-else class="text-3xl mb-1.5">{{ getSportIcon() }}</div>
                <div class="font-bold text-sm text-white">{{ match.awayTeam.name }}</div>
              </div>
            </div>
            <!-- Toggle button -->
            <div class="text-center mt-4">
              <button
                @click="togglePredictions(match)"
                :class="['px-5 py-1.5 rounded-md text-xs font-bold transition-all', expandedMatches[match.id] ? 'bg-[#30363d] text-white hover:bg-[#484f58]' : 'bg-blue-600 text-white hover:bg-blue-500']">
                {{ expandedMatches[match.id] ? 'Masquer les predictions' : 'Voir les predictions' }}
              </button>
            </div>
          </div>
          <!-- Expanded predictions -->
          <div v-if="expandedMatches[match.id]" class="p-4 bg-[#0d1117]/50">
            <PredictionPanel :match="match" :getMatchPredictions="getMatchPredictions" :getMatchQuality="getMatchQuality" :getMatchRecommendations="getMatchRecommendations" :getMatchCriteria="getMatchCriteria" :showDetailedAnalysis="showDetailedAnalysis" :toggleDetailedAnalysis="toggleDetailedAnalysis" :getSportIcon="getSportIcon" />
          </div>
        </div>
      </div>

      <!-- ======================== LIST VIEW (grouped by league) ======================== -->
      <div v-else class="space-y-3">
        <div v-for="league in groupedByLeague" :key="league.id" class="league-group">
          <!-- League header -->
          <div class="flex items-center gap-2.5 px-3 py-2 bg-[#161b22] rounded-t-lg border border-b-0 border-[#30363d]">
            <img v-if="league.logo" :src="league.logo" class="w-4 h-4 object-contain" alt="">
            <span v-else class="text-sm">{{ getSportIcon() }}</span>
            <span class="text-xs font-semibold text-slate-300 truncate">{{ league.name }}</span>
            <span v-if="league.country" class="text-[10px] text-slate-500">{{ league.country }}</span>
            <span class="ml-auto text-[10px] text-slate-500">{{ league.matches.length }}</span>
          </div>

          <!-- Matches list -->
          <div class="border border-[#30363d] rounded-b-lg overflow-hidden divide-y divide-[#30363d]/50">
            <div
              v-for="match in league.matches"
              :key="match.id">
              <!-- Match row -->
              <div
                @click="togglePredictions(match)"
                :class="[
                  'match-row flex items-center px-3 py-2.5 cursor-pointer transition-colors',
                  expandedMatches[match.id] ? 'bg-[#1c2128]' : 'hover:bg-[#161b22]'
                ]">

                <!-- Time / Status -->
                <div class="w-14 flex-shrink-0 text-center">
                  <div v-if="isLive(match)" class="inline-flex items-center gap-1 px-1.5 py-0.5 bg-red-500/20 rounded text-[10px] font-bold text-red-400">
                    <span class="w-1 h-1 bg-red-400 rounded-full animate-pulse"></span>
                    LIVE
                  </div>
                  <div v-else-if="isFinished(match)" class="text-[10px] font-semibold text-slate-500">FT</div>
                  <div v-else class="text-xs font-medium text-slate-300">{{ formatTime(match.date) }}</div>
                </div>

                <!-- Teams & Score -->
                <div class="flex-1 min-w-0">
                  <!-- Home -->
                  <div class="flex items-center gap-2 mb-1">
                    <img v-if="match.homeTeam.logo" :src="match.homeTeam.logo" class="w-4 h-4 object-contain flex-shrink-0" alt="" @error="$event.target.style.display='none'">
                    <span v-else class="w-4 h-4 flex items-center justify-center text-[10px]">{{ getSportIcon() }}</span>
                    <span :class="['text-sm truncate flex-1', isWinner(match, 'home') ? 'font-bold text-white' : 'text-slate-300']">
                      {{ match.homeTeam.name }}
                    </span>
                    <span :class="['text-sm font-bold w-6 text-right', isWinner(match, 'home') ? 'text-white' : 'text-slate-400']">
                      {{ match.score.home ?? '' }}
                    </span>
                  </div>
                  <!-- Away -->
                  <div class="flex items-center gap-2">
                    <img v-if="match.awayTeam.logo" :src="match.awayTeam.logo" class="w-4 h-4 object-contain flex-shrink-0" alt="" @error="$event.target.style.display='none'">
                    <span v-else class="w-4 h-4 flex items-center justify-center text-[10px]">{{ getSportIcon() }}</span>
                    <span :class="['text-sm truncate flex-1', isWinner(match, 'away') ? 'font-bold text-white' : 'text-slate-300']">
                      {{ match.awayTeam.name }}
                    </span>
                    <span :class="['text-sm font-bold w-6 text-right', isWinner(match, 'away') ? 'text-white' : 'text-slate-400']">
                      {{ match.score.away ?? '' }}
                    </span>
                  </div>
                </div>

                <!-- Prediction badge -->
                <div class="w-10 flex-shrink-0 flex items-center justify-center">
                  <div v-if="hasPrediction(match)" class="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                    :class="getPredictionBadgeClass(match)">
                    {{ getPredictionLabel(match) }}
                  </div>
                </div>

                <!-- Chevron -->
                <div class="w-5 flex-shrink-0 text-slate-500">
                  <svg :class="['w-3.5 h-3.5 transition-transform', expandedMatches[match.id] && 'rotate-180']" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                  </svg>
                </div>
              </div>

              <!-- Expanded prediction panel -->
              <transition
                enter-active-class="transition-all duration-200 ease-out"
                enter-from-class="opacity-0 max-h-0"
                enter-to-class="opacity-100 max-h-[800px]"
                leave-active-class="transition-all duration-150 ease-in"
                leave-from-class="opacity-100 max-h-[800px]"
                leave-to-class="opacity-0 max-h-0">
                <div v-if="expandedMatches[match.id]" class="overflow-hidden bg-[#1c2128] border-t border-[#30363d]/50 px-4 py-4">

                  <!-- Quality Score compact -->
                  <MatchQualityCard
                    :quality="getMatchQuality(match)"
                    :recommendations="getMatchRecommendations(match)"
                    :criteria="getMatchCriteria(match)"
                    :showDetailedCriteria="showDetailedAnalysis[match.id]"
                    @toggle-details="toggleDetailedAnalysis(match.id)"
                    class="mb-4"
                  />

                  <!-- FOOTBALL predictions -->
                  <div
                    v-if="match.sport === 'football' && getMatchPredictions(match).goalsPredictions"
                    class="space-y-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-sm">&#9917;</span>
                      <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Analyse Buts</h4>
                    </div>

                    <div :class="[
                      'p-3 rounded-lg border',
                      getMatchPredictions(match).goalsPredictions.goalFilter.isRecommended
                        ? 'bg-green-500/5 border-green-500/30'
                        : 'bg-red-500/5 border-red-500/20'
                    ]">
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
                            <span :class="['font-bold', criterion.data.recommended ? 'text-green-400' : 'text-red-400']">
                              {{ criterion.data.probability }}%
                            </span>
                          </div>
                          <div class="w-full bg-[#30363d] rounded-full h-1">
                            <div :class="['h-full rounded-full transition-all duration-500', criterion.data.recommended ? 'bg-green-500' : 'bg-red-500']"
                              :style="{ width: criterion.data.probability + '%' }"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- BASKETBALL predictions -->
                  <div
                    v-if="match.sport === 'basketball' && getMatchPredictions(match).basketballPredictions"
                    class="space-y-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-sm">&#127936;</span>
                      <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Analyse Basketball</h4>
                    </div>

                    <div class="p-3 rounded-lg border border-orange-500/30 bg-orange-500/5">
                      <!-- Expected points -->
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

                      <!-- Team points -->
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

                      <!-- Spread -->
                      <div class="p-2 rounded bg-[#0d1117]/50 mb-3">
                        <div class="flex items-center justify-between">
                          <span class="text-[10px] text-slate-400">Spread</span>
                          <span class="text-xs font-bold text-yellow-400">
                            {{ getMatchPredictions(match).basketballPredictions.spread.favorite === 'home' ? match.homeTeam.name : match.awayTeam.name }}
                            {{ getMatchPredictions(match).basketballPredictions.spread.value }}
                          </span>
                        </div>
                      </div>

                      <!-- Over/Under lines -->
                      <div class="grid grid-cols-3 gap-2">
                        <div v-for="line in [
                          { label: 'O 195.5', data: getMatchPredictions(match).basketballPredictions.over195_5 },
                          { label: 'O 205.5', data: getMatchPredictions(match).basketballPredictions.over205_5 },
                          { label: 'O 215.5', data: getMatchPredictions(match).basketballPredictions.over215_5 }
                        ]" :key="line.label" class="p-2 rounded bg-[#0d1117]/50 text-center">
                          <div class="text-[10px] text-slate-400">{{ line.label }}</div>
                          <div :class="['text-sm font-bold', line.data.recommended ? 'text-green-400' : 'text-slate-400']">
                            {{ line.data.probability }}%
                          </div>
                          <div class="w-full bg-[#30363d] rounded-full h-1 mt-1">
                            <div :class="['h-full rounded-full', line.data.recommended ? 'bg-green-500' : 'bg-slate-600']"
                              :style="{ width: line.data.probability + '%' }"></div>
                          </div>
                        </div>
                      </div>

                      <!-- Quarter analysis -->
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
                  <div
                    v-if="match.sport === 'volleyball' && getMatchPredictions(match).volleyballPredictions"
                    class="space-y-3">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-sm">&#127952;</span>
                      <h4 class="text-xs font-bold text-slate-300 uppercase tracking-wide">Analyse Volleyball</h4>
                    </div>

                    <div class="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                      <!-- Winner prediction -->
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

                      <!-- Sets prediction -->
                      <div class="mb-3">
                        <div class="text-[10px] text-slate-500 mb-2">Score en sets</div>
                        <div class="grid grid-cols-3 gap-2">
                          <div v-for="(prob, score) in getMatchPredictions(match).volleyballPredictions.setScores" :key="score" class="p-2 rounded bg-[#0d1117]/50 text-center">
                            <div class="text-xs font-bold text-white">{{ score }}</div>
                            <div class="text-sm font-bold text-blue-400">{{ prob }}%</div>
                          </div>
                        </div>
                      </div>

                      <!-- Over sets/points -->
                      <div class="grid grid-cols-2 gap-2">
                        <div class="p-2 rounded bg-[#0d1117]/50">
                          <div class="flex items-center justify-between text-[10px] mb-1">
                            <span class="text-slate-400">Over 2.5 sets</span>
                            <span :class="['font-bold', getMatchPredictions(match).volleyballPredictions.over2_5Sets.recommended ? 'text-green-400' : 'text-slate-400']">
                              {{ getMatchPredictions(match).volleyballPredictions.over2_5Sets.probability }}%
                            </span>
                          </div>
                          <div class="w-full bg-[#30363d] rounded-full h-1">
                            <div :class="['h-full rounded-full', getMatchPredictions(match).volleyballPredictions.over2_5Sets.recommended ? 'bg-green-500' : 'bg-slate-600']"
                              :style="{ width: getMatchPredictions(match).volleyballPredictions.over2_5Sets.probability + '%' }"></div>
                          </div>
                        </div>
                        <div class="p-2 rounded bg-[#0d1117]/50">
                          <div class="flex items-center justify-between text-[10px] mb-1">
                            <span class="text-slate-400">Over 3.5 sets</span>
                            <span :class="['font-bold', getMatchPredictions(match).volleyballPredictions.over3_5Sets.recommended ? 'text-green-400' : 'text-slate-400']">
                              {{ getMatchPredictions(match).volleyballPredictions.over3_5Sets.probability }}%
                            </span>
                          </div>
                          <div class="w-full bg-[#30363d] rounded-full h-1">
                            <div :class="['h-full rounded-full', getMatchPredictions(match).volleyballPredictions.over3_5Sets.recommended ? 'bg-green-500' : 'bg-slate-600']"
                              :style="{ width: getMatchPredictions(match).volleyballPredictions.over3_5Sets.probability + '%' }"></div>
                          </div>
                        </div>
                      </div>

                      <!-- Expected sets & points info -->
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
                          <div class="text-sm font-bold" :class="getMatchPredictions(match).volleyballPredictions.confidence > 55 ? 'text-green-400' : 'text-yellow-400'">
                            {{ getMatchPredictions(match).volleyballPredictions.confidence }}%
                          </div>
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

                  <!-- Generic sport prediction (rugby, hockey, handball) -->
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
              </transition>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, onBeforeUnmount } from 'vue'
import { useAnalysisStore, dateToStr, addDays } from '../stores/analysis'
import { getActiveSports } from '../config/sports'
import { generateLocalPredictions } from '../utils/localPredictions'
import {
  calculateMatchQualityScore,
  analyzeMatchCriteria,
  generateRecommendations
} from '../utils/advancedAnalysis'
import MatchQualityCard from '../components/MatchQualityCard.vue'
import PredictionPanel from '../components/PredictionPanel.vue'

const store = useAnalysisStore()
const availableSports = getActiveSports()

const viewMode = ref('list') // 'cards', 'list', 'details'
const activeTab = ref('recommended') // 'recommended', 'combine_05ht', 'combine_05', 'combine_15', 'combine_25'
const apiWarning = ref(null)
const expandedMatches = ref({})
const showDetailedAnalysis = ref({})
const forceUpdate = ref(0)

const dismissWarning = () => { apiWarning.value = null }

const togglePredictions = (match) => {
  expandedMatches.value[match.id] = !expandedMatches.value[match.id]
}

const toggleDetailedAnalysis = (matchId) => {
  showDetailedAnalysis.value[matchId] = !showDetailedAnalysis.value[matchId]
}

const getMatchPredictions = (match) => {
  return generateLocalPredictions(match, match.sport || store.selectedSport)
}

const getMatchQuality = (match) => {
  const predictions = getMatchPredictions(match)
  return calculateMatchQualityScore(match, predictions)
}

const getMatchCriteria = (match) => {
  const predictions = getMatchPredictions(match)
  return analyzeMatchCriteria(match, predictions)
}

const getMatchRecommendations = (match) => {
  const predictions = getMatchPredictions(match)
  const quality = getMatchQuality(match)
  return generateRecommendations(match, predictions, quality)
}

const getSportIcon = () => {
  const sport = availableSports.find(s => s.id === store.selectedSport)
  return sport?.icon || '&#127942;'
}

const isLive = (match) => {
  return ['1H','HT','2H','ET','BT','P','LIVE','Q1','Q2','Q3','Q4','OT'].includes(match.status)
}

const isFinished = (match) => {
  return ['FT','AET','PEN','AOT','FT_PEN'].includes(match.status?.toUpperCase())
}

const isWinner = (match, side) => {
  if (match.score.home === null || match.score.away === null) return false
  if (side === 'home') return match.score.home > match.score.away
  return match.score.away > match.score.home
}

const hasPrediction = (match) => {
  const preds = getMatchPredictions(match)
  return preds?.mainPrediction?.prediction || preds?.confidence
}

const getPredictionBadgeClass = (match) => {
  const preds = getMatchPredictions(match)
  const conf = preds?.confidence || 50
  if (conf >= 70) return 'bg-green-500/20 text-green-400 border border-green-500/30'
  if (conf >= 55) return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
  return 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
}

const getPredictionLabel = (match) => {
  const preds = getMatchPredictions(match)
  const pred = preds?.mainPrediction?.prediction
  if (pred === '1' || pred === 'Home') return 'H'
  if (pred === '2' || pred === 'Away') return 'A'
  if (pred === 'X') return 'D'
  return '?'
}

const getMatchCountForSport = (sportId) => {
  return store.todayMatches.filter(m => m.sport === sportId).length
}

const allFootballMatches = computed(() => {
  forceUpdate.value
  let matches = store.filteredMatches

  const finishedStatuses = ['FT', 'AET', 'PEN', 'CANC', 'ABD', 'PST', 'AWD']
  matches = matches.filter(match => !finishedStatuses.includes(match.status?.toUpperCase()))

  const now = new Date()
  matches = matches.filter(match => {
    if (match.status === 'NS' || match.status === 'TBD') {
      const matchTime = new Date(match.date)
      const minutesDiff = (now - matchTime) / (1000 * 60)
      if (minutesDiff > 120) return false
    }
    return true
  })

  return matches
})

const recommendedMatches = computed(() => {
  if (store.selectedSport !== 'football') return allFootballMatches.value
  return allFootballMatches.value.filter(match => {
    const predictions = getMatchPredictions(match)
    return predictions?.goalsPredictions?.goalFilter?.isRecommended
  })
})

const recommendedCount = computed(() => recommendedMatches.value.length)

const combine05HTMatches = computed(() => {
  return recommendedMatches.value
    .map(match => {
      const preds = getMatchPredictions(match)
      return { match, prob: preds?.goalsPredictions?.over05HT?.probability || 0 }
    })
    .filter(item => item.prob >= 60)
    .sort((a, b) => b.prob - a.prob)
    .map(item => item.match)
})

const combine05Matches = computed(() => {
  return recommendedMatches.value
    .map(match => {
      const preds = getMatchPredictions(match)
      return { match, prob: preds?.goalsPredictions?.over05?.probability || 0 }
    })
    .filter(item => item.prob >= 70)
    .sort((a, b) => b.prob - a.prob)
    .map(item => item.match)
})

const combine15Matches = computed(() => {
  return recommendedMatches.value
    .map(match => {
      const preds = getMatchPredictions(match)
      return { match, prob: preds?.goalsPredictions?.over15?.probability || 0 }
    })
    .filter(item => item.prob >= 60)
    .sort((a, b) => b.prob - a.prob)
    .map(item => item.match)
})

const combine25Matches = computed(() => {
  return recommendedMatches.value
    .map(match => {
      const preds = getMatchPredictions(match)
      return { match, prob: preds?.goalsPredictions?.over25?.probability || 0 }
    })
    .filter(item => item.prob >= 50)
    .sort((a, b) => b.prob - a.prob)
    .map(item => item.match)
})

const combine05_15Matches = computed(() => {
  return recommendedMatches.value
    .map(match => {
      const preds = getMatchPredictions(match)
      const g = preds?.goalsPredictions
      if (!g) return null
      const p05 = g.over05?.probability || 0
      const p15 = g.over15?.probability || 0
      const avg = Math.round((p05 + p15) / 2)
      return { match, avg, p05, p15 }
    })
    .filter(item => item && item.p05 >= 57 && item.p15 >= 57)
    .sort((a, b) => b.avg - a.avg)
    .map(item => item.match)
})

const combine15_25Matches = computed(() => {
  return recommendedMatches.value
    .map(match => {
      const preds = getMatchPredictions(match)
      const g = preds?.goalsPredictions
      if (!g) return null
      const p15 = g.over15?.probability || 0
      const p25 = g.over25?.probability || 0
      const avg = Math.round((p15 + p25) / 2)
      return { match, avg, p15, p25 }
    })
    .filter(item => item && item.p15 >= 57 && item.p25 >= 57)
    .sort((a, b) => b.avg - a.avg)
    .map(item => item.match)
})

const combine05_15_25Matches = computed(() => {
  return recommendedMatches.value
    .map(match => {
      const preds = getMatchPredictions(match)
      const g = preds?.goalsPredictions
      if (!g) return null
      const p05 = g.over05?.probability || 0
      const p15 = g.over15?.probability || 0
      const p25 = g.over25?.probability || 0
      const avg = Math.round((p05 + p15 + p25) / 3)
      return { match, avg, p05, p15, p25 }
    })
    .filter(item => item && item.p05 >= 57 && item.p15 >= 57 && item.p25 >= 57)
    .sort((a, b) => b.avg - a.avg)
    .map(item => item.match)
})

const activeCombineMatches = computed(() => {
  if (activeTab.value === 'combine_05ht') return combine05HTMatches.value
  if (activeTab.value === 'combine_05') return combine05Matches.value
  if (activeTab.value === 'combine_15') return combine15Matches.value
  if (activeTab.value === 'combine_25') return combine25Matches.value
  if (activeTab.value === 'combine_05_15') return combine05_15Matches.value
  if (activeTab.value === 'combine_15_25') return combine15_25Matches.value
  if (activeTab.value === 'combine_05_15_25') return combine05_15_25Matches.value
  return []
})

const isMultiCombine = computed(() => {
  return ['combine_05_15', 'combine_15_25', 'combine_05_15_25'].includes(activeTab.value)
})

const getCombineMatchProb = (match) => {
  const preds = getMatchPredictions(match)
  if (!preds?.goalsPredictions) return 0
  const g = preds.goalsPredictions
  if (activeTab.value === 'combine_05ht') return g.over05HT?.probability || 0
  if (activeTab.value === 'combine_05') return g.over05?.probability || 0
  if (activeTab.value === 'combine_15') return g.over15?.probability || 0
  if (activeTab.value === 'combine_25') return g.over25?.probability || 0
  if (activeTab.value === 'combine_05_15') return Math.round(((g.over05?.probability || 0) + (g.over15?.probability || 0)) / 2)
  if (activeTab.value === 'combine_15_25') return Math.round(((g.over15?.probability || 0) + (g.over25?.probability || 0)) / 2)
  if (activeTab.value === 'combine_05_15_25') return Math.round(((g.over05?.probability || 0) + (g.over15?.probability || 0) + (g.over25?.probability || 0)) / 3)
  return 0
}

const getCombineMatchCriteria = (match) => {
  const preds = getMatchPredictions(match)
  if (!preds?.goalsPredictions) return []
  const g = preds.goalsPredictions
  if (activeTab.value === 'combine_05_15') {
    return [
      { label: 'O 0.5', prob: g.over05?.probability || 0 },
      { label: 'O 1.5', prob: g.over15?.probability || 0 }
    ]
  }
  if (activeTab.value === 'combine_15_25') {
    return [
      { label: 'O 1.5', prob: g.over15?.probability || 0 },
      { label: 'O 2.5', prob: g.over25?.probability || 0 }
    ]
  }
  if (activeTab.value === 'combine_05_15_25') {
    return [
      { label: 'O 0.5', prob: g.over05?.probability || 0 },
      { label: 'O 1.5', prob: g.over15?.probability || 0 },
      { label: 'O 2.5', prob: g.over25?.probability || 0 }
    ]
  }
  return []
}

const combineAverageConfidence = computed(() => {
  const matches = activeCombineMatches.value
  if (matches.length === 0) return 0
  const total = matches.reduce((sum, m) => sum + getCombineMatchProb(m), 0)
  return Math.round(total / matches.length)
})

const combineProbability = computed(() => {
  const matches = activeCombineMatches.value
  if (matches.length === 0) return 0
  let prob = 1
  for (const m of matches) {
    prob *= getCombineMatchProb(m) / 100
  }
  return Math.round(prob * 100 * 100) / 100
})

const getActiveTabLabel = () => {
  if (activeTab.value === 'combine_05ht') return 'Over 0.5 MT'
  if (activeTab.value === 'combine_05') return 'Over 0.5'
  if (activeTab.value === 'combine_15') return 'Over 1.5'
  if (activeTab.value === 'combine_25') return 'Over 2.5'
  if (activeTab.value === 'combine_05_15') return 'Over 0.5 + 1.5'
  if (activeTab.value === 'combine_15_25') return 'Over 1.5 + 2.5'
  if (activeTab.value === 'combine_05_15_25') return 'Over 0.5 + 1.5 + 2.5'
  return 'Recommandes'
}

const getActiveTabDescription = () => {
  if (activeTab.value === 'combine_05ht') return 'Matchs avec au moins 1 but en premiere mi-temps'
  if (activeTab.value === 'combine_05') return 'Matchs avec au moins 1 but en fin de match'
  if (activeTab.value === 'combine_15') return 'Matchs avec au moins 2 buts en fin de match'
  if (activeTab.value === 'combine_25') return 'Matchs avec au moins 3 buts en fin de match'
  if (activeTab.value === 'combine_05_15') return 'Matchs avec Over 0.5 ET Over 1.5 buts (min 57% chacun)'
  if (activeTab.value === 'combine_15_25') return 'Matchs avec Over 1.5 ET Over 2.5 buts (min 57% chacun)'
  if (activeTab.value === 'combine_05_15_25') return 'Matchs avec Over 0.5, 1.5 ET 2.5 buts (min 57% chacun)'
  return 'Matchs recommandes par le filtre'
}

const filteredMatches = computed(() => {
  if (store.selectedSport === 'football' && activeTab.value !== 'recommended') {
    return activeCombineMatches.value
  }

  if (store.selectedSport === 'football') {
    return recommendedMatches.value
  }

  return allFootballMatches.value
})

const groupedByLeague = computed(() => {
  const groups = {}
  for (const match of filteredMatches.value) {
    const leagueId = match.league?.id || match.league?.name || 'other'
    if (!groups[leagueId]) {
      groups[leagueId] = {
        id: leagueId,
        name: match.league?.name || 'Autre',
        country: match.league?.country || '',
        logo: match.league?.logo || null,
        matches: []
      }
    }
    groups[leagueId].matches.push(match)
  }
  return Object.values(groups).sort((a, b) => b.matches.length - a.matches.length)
})

const todayStr = dateToStr(new Date())
const currentDate = computed(() => store.customDate || todayStr)
const isToday = computed(() => currentDate.value === todayStr)

const dateLabel = computed(() => {
  const ref = currentDate.value
  if (ref === todayStr) return "Aujourd'hui"
  if (ref === addDays(todayStr, -1)) return 'Hier'
  if (ref === addDays(todayStr, +1)) return 'Demain'
  const [y, m, d] = ref.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'short'
  })
})

const formatTime = (dateString) =>
  new Date(dateString).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

let refreshInterval = null

onMounted(async () => {
  if (store.todayMatches.length === 0 || !store.lastFetch) {
    await store.fetchTodayMatches()
  }

  if (store.apiWarning) {
    apiWarning.value = store.apiWarning.message
  }

  store.resolveTrackedMatches()

  refreshInterval = setInterval(() => {
    forceUpdate.value++
    store.resolveTrackedMatches()
  }, 3 * 60 * 1000)
})

watch(filteredMatches, (matches) => {
  if (store.selectedSport === 'football') {
    matches.forEach(match => {
      const preds = getMatchPredictions(match)
      if (preds?.goalsPredictions?.goalFilter?.isRecommended) {
        store.trackMatch(match, preds)
      }
    })
  }
}, { immediate: true })

onBeforeUnmount(() => {
  if (refreshInterval) clearInterval(refreshInterval)
})
</script>

<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }

.match-row:hover .w-5 { color: #8b949e; }

.league-group + .league-group { margin-top: 0.75rem; }
</style>
