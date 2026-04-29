<template>
  <div class="max-w-6xl mx-auto px-4">
    <!-- Hero -->
    <div class="text-center py-16 sm:py-24">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600/10 border border-blue-500/20 rounded-full text-xs font-medium text-blue-400 mb-6">
        <span class="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse"></span>
        Live Scores & Analytics
      </div>
      <h1 class="text-4xl sm:text-5xl font-bold mb-4 text-white leading-tight">
        Analyse Sportive<br>
        <span class="text-blue-500">Intelligente</span>
      </h1>
      <p class="text-base sm:text-lg text-slate-400 mb-8 max-w-xl mx-auto leading-relaxed">
        Pronostics bases sur 12 derniers matchs et 10 confrontations directes.
        Football, Basketball, Tennis, Volleyball et plus.
      </p>
      <router-link to="/matches" class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-semibold text-white transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-500/30">
        Voir les matchs
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
      </router-link>
    </div>

    <!-- Sports cards -->
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-16">
      <div class="p-4 bg-[#161b22] border border-[#30363d] rounded-lg text-center hover:border-[#58a6ff]/30 transition-colors">
        <div class="text-3xl mb-2">&#9917;</div>
        <h3 class="font-semibold text-sm mb-1 text-white">Football</h3>
        <p class="text-slate-500 text-xs">900+ ligues, Poisson & ELO</p>
      </div>
      <div class="p-4 bg-[#161b22] border border-[#30363d] rounded-lg text-center hover:border-orange-500/30 transition-colors">
        <div class="text-3xl mb-2">&#127936;</div>
        <h3 class="font-semibold text-sm mb-1 text-white">Basketball</h3>
        <p class="text-slate-500 text-xs">Points, spread, Over/Under</p>
      </div>
      <div class="p-4 bg-[#161b22] border border-[#30363d] rounded-lg text-center hover:border-yellow-500/30 transition-colors">
        <div class="text-3xl mb-2">&#127934;</div>
        <h3 class="font-semibold text-sm mb-1 text-white">Tennis</h3>
        <p class="text-slate-500 text-xs">ATP, WTA, Grand Slams</p>
      </div>
      <div class="p-4 bg-[#161b22] border border-[#30363d] rounded-lg text-center hover:border-blue-500/30 transition-colors">
        <div class="text-3xl mb-2">&#127952;</div>
        <h3 class="font-semibold text-sm mb-1 text-white">Volleyball</h3>
        <p class="text-slate-500 text-xs">Sets, points, probabilites</p>
      </div>
    </div>
  </div>
</template>
