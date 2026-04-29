import { defineStore } from 'pinia'
import axios from 'axios'
import logger from '../utils/logger'
import { getActiveSports, getSportById, MATCH_STATUSES } from '../config/sports'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

// ─── Helpers ────────────────────────────────────────────────────────────────

export const dateToStr = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export const addDays = (dateStr, n) => {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, mo - 1, d, 12, 0, 0)
  dt.setDate(dt.getDate() + n)
  return dateToStr(dt)
}

const getActiveSeason = () => {
  const now   = new Date()
  const year  = now.getFullYear()
  const month = now.getMonth() + 1
  return (month < 7 ? year - 1 : year).toString()
}

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// ─── Clé localStorage pour l'historique ─────────────────────────────────────
const HISTORY_KEY = 'sport_analytics_history'
const MAX_HISTORY = 20

const loadHistory = () => {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveHistory = (history) => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    logger.warn('Impossible de sauvegarder l\'historique')
  }
}

// ─── Tracking des sélections (persistant) ───────────────────────────────────
const TRACKING_KEY = 'sport_analytics_tracking'
const TRACKING_STATS_KEY = 'sport_analytics_cumulative_stats'

const loadTracking = () => {
  try {
    const raw = localStorage.getItem(TRACKING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

const saveTracking = (data) => {
  try {
    localStorage.setItem(TRACKING_KEY, JSON.stringify(data))
  } catch {
    logger.warn('Impossible de sauvegarder le tracking')
  }
}

const buildDefaultStats = () => {
  const def = () => ({ total: 0, won: 0, lost: 0, pending: 0 })
  return {
    football: { fb_05ht: def(), fb_05: def(), fb_15: def(), fb_25: def(), fb_btts: def(), fb_05_15: def(), fb_15_25: def(), fb_05_15_25: def(),
      over05HT: def(), over05: def(), over15: def(), over25: def(), btts: def(), combined: def(), combine_05_15: def(), combine_15_25: def(), combine_05_15_25: def() },
    basketball: { bk_o195: def(), bk_o205: def(), bk_o215: def(), bk_home: def(), bk_away: def(), bk_o195_o205: def(), bk_o195_o205_o215: def() },
    volleyball: { vb_o25sets: def(), vb_o35sets: def(), vb_home: def(), vb_away: def(), vb_o25_o35: def() },
    tennis: { tn_home: def(), tn_away: def() },
    rugby: { gen_home: def(), gen_away: def() },
    hockey: { gen_home: def(), gen_away: def() },
    handball: { gen_home: def(), gen_away: def() }
  }
}

const loadCumulativeStats = () => {
  try {
    const raw = localStorage.getItem(TRACKING_STATS_KEY)
    const defaults = buildDefaultStats()
    if (!raw) return defaults
    const saved = JSON.parse(raw)
    for (const sport of Object.keys(defaults)) {
      if (!saved[sport]) saved[sport] = defaults[sport]
      else {
        for (const key of Object.keys(defaults[sport])) {
          if (!saved[sport][key]) saved[sport][key] = defaults[sport][key]
        }
      }
    }
    return saved
  } catch {
    return buildDefaultStats()
  }
}

const saveCumulativeStats = (data) => {
  try {
    localStorage.setItem(TRACKING_STATS_KEY, JSON.stringify(data))
  } catch {
    logger.warn('Impossible de sauvegarder les stats cumulées')
  }
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useAnalysisStore = defineStore('analysis', {
  state: () => ({
    todayMatches:    [],
    selectedMatch:   null,
    currentAnalysis: null,
    loading:         false,
    error:           null,
    selectedSport:   'football',
    selectedSeason:  getActiveSeason(),
    customDate:      null,
    lastFetch:       null,
    debugInfo:       null,
    isDemoMode:      false,
    searchCache:     new Map(),
    analysisHistory: loadHistory(),
    trackedMatches:  loadTracking(),
    cumulativeStats: loadCumulativeStats(),
    apiWarning:      null
  }),

  getters: {
    filteredMatches: (state) =>
      state.todayMatches.filter(m => m.sport === state.selectedSport),

    seasonDisplay: (state) => {
      const s = parseInt(state.selectedSeason)
      return `${s}-${s + 1}`
    },

    availableSeasons: () => {
      const now   = new Date()
      const year  = now.getFullYear()
      const month = now.getMonth() + 1
      const max   = month < 7 ? year - 1 : year
      const list  = []
      for (let y = max; y >= max - 3; y--)
        list.push({ value: y.toString(), label: `${y}-${y + 1}` })
      return list
    },

    // ← historique trié du plus récent au plus ancien
    sortedHistory: (state) =>
      [...state.analysisHistory].sort((a, b) => new Date(b.analyzedAt) - new Date(a.analyzedAt))
  },

  actions: {

    // ── Navigation ────────────────────────────────────────────────────────────

    goToPreviousDay () {
      const ref       = this.customDate || dateToStr(new Date())
      this.customDate = addDays(ref, -1)
      this.fetchTodayMatches()
    },

    goToNextDay () {
      const ref       = this.customDate || dateToStr(new Date())
      this.customDate = addDays(ref, +1)
      this.fetchTodayMatches()
    },

    goToToday () {
      this.customDate = null
      this.fetchTodayMatches()
    },

    // ── Vérification clé API ─────────────────────────────────────────────────

    isApiKeyValid () {
      const key = import.meta.env.VITE_API_SPORTS_KEY
      return key && 
             key !== 'votre_cle_api_sports_ici' && 
             key.length > 20 &&
             !key.includes('votre')
    },

    // ── Recherche d'équipes (backend) ────────────────────────────────────────

    async searchTeams (query, sport) {
      const cacheKey = `${sport}-${query}`
      if (this.searchCache.has(cacheKey)) {
        return this.searchCache.get(cacheKey)
      }

      try {
        const response = await axios.get(`${API_URL}/teams/search`, {
          params: { q: query, sport },
          headers: getAuthHeaders()
        })
        
        const results = response.data?.data || []
        this.searchCache.set(cacheKey, results)
        return results
      } catch (error) {
        logger.error('Erreur recherche équipes:', error)
        throw new Error(error.response?.data?.error || 'Erreur recherche équipes')
      }
    },

    // ── Analyse détaillée par équipes (backend) ──────────────────────────────

    async analyzeMatchByTeams ({ homeTeamId, awayTeamId, sport, season, homeTeam, awayTeam }) {
      this.loading = true
      this.error = null
      
      try {
        const response = await axios.post(`${API_URL}/analysis/match`, {
          homeTeamId,
          awayTeamId,
          sport,
          season: season || this.selectedSeason
        }, {
          headers: getAuthHeaders()
        })
        
        this.currentAnalysis = response.data?.data || null

        // ← Sauvegarder dans l'historique
        if (this.currentAnalysis) {
          this.addToHistory({
            homeTeam: homeTeam || this.currentAnalysis.homeTeam,
            awayTeam: awayTeam || this.currentAnalysis.awayTeam,
            sport,
            season: season || this.selectedSeason,
            homeTeamId,
            awayTeamId,
            result: this.currentAnalysis
          })
        }

        return this.currentAnalysis
      } catch (error) {
        this.error = error.response?.data?.error || 'Erreur lors de l\'analyse'
        throw new Error(this.error)
      } finally {
        this.loading = false
      }
    },

    // ── Gestion de l'historique ───────────────────────────────────────────────

    addToHistory ({ homeTeam, awayTeam, sport, season, homeTeamId, awayTeamId, result }) {
      const entry = {
        id:          `${homeTeamId}-${awayTeamId}-${Date.now()}`,
        analyzedAt:  new Date().toISOString(),
        sport,
        season,
        homeTeamId,
        awayTeamId,
        homeTeamName: homeTeam?.name || homeTeam || 'Domicile',
        awayTeamName: awayTeam?.name || awayTeam || 'Extérieur',
        homeTeamLogo: homeTeam?.logo || null,
        awayTeamLogo: awayTeam?.logo || null,
        // Résumé rapide pour l'affichage
        summary: {
          recommendation: result?.goalFilter?.recommendation || null,
          isRecommended:  result?.goalFilter?.isRecommended  || false,
          topPrediction:  result?.predictions?.[0] || null
        }
      }

      // Éviter les doublons exacts (même match < 5 min d'intervalle)
      const fiveMin = 5 * 60 * 1000
      const isDuplicate = this.analysisHistory.some(h =>
        h.homeTeamId === homeTeamId &&
        h.awayTeamId === awayTeamId &&
        h.sport === sport &&
        Math.abs(new Date(h.analyzedAt) - new Date(entry.analyzedAt)) < fiveMin
      )

      if (!isDuplicate) {
        this.analysisHistory.unshift(entry)
        // Limiter à MAX_HISTORY entrées
        if (this.analysisHistory.length > MAX_HISTORY) {
          this.analysisHistory = this.analysisHistory.slice(0, MAX_HISTORY)
        }
        saveHistory(this.analysisHistory)
      }
    },

    removeFromHistory (id) {
      this.analysisHistory = this.analysisHistory.filter(h => h.id !== id)
      saveHistory(this.analysisHistory)
    },

    clearHistory () {
      this.analysisHistory = []
      saveHistory([])
    },

    // ── Tracking des matchs sélectionnés ─────────────────────────────────────

    trackMatch (match, predictions) {
      if (!match || match.sport !== 'football') return
      if (this.trackedMatches.some(t => t.matchId === match.id)) return

      const goals = predictions?.goalsPredictions
      if (!goals) return

      const entry = {
        matchId:    match.id,
        date:       match.date,
        trackedAt:  new Date().toISOString(),
        sport:      match.sport,
        homeTeam:   { name: match.homeTeam.name, logo: match.homeTeam.logo },
        awayTeam:   { name: match.awayTeam.name, logo: match.awayTeam.logo },
        league:     match.league?.name || '',
        status:     'pending',
        scoreHome:  null,
        scoreAway:  null,
        htHome:     null,
        htAway:     null,
        predictions: {
          over05HT:  { prob: goals.over05HT?.probability || 0, recommended: goals.over05HT?.recommended || false },
          over05:    { prob: goals.over05?.probability || 0,    recommended: goals.over05?.recommended || false },
          over15:    { prob: goals.over15?.probability || 0,    recommended: goals.over15?.recommended || false },
          over25:    { prob: goals.over25?.probability || 0,    recommended: goals.over25?.recommended || false },
          btts:      { prob: goals.btts?.probability || 0,      recommended: goals.btts?.recommended || false },
          filterRecommended: goals.goalFilter?.isRecommended || false,
          filterScore: goals.goalFilter?.score || 0
        },
        results: {
          over05HT: null,
          over05:   null,
          over15:   null,
          over25:   null,
          btts:     null
        }
      }

      this.trackedMatches.unshift(entry)
      if (this.trackedMatches.length > 500) {
        this.trackedMatches = this.trackedMatches.slice(0, 500)
      }

      const st = this.cumulativeStats.football
      for (const key of ['over05HT', 'over05', 'over15', 'over25', 'btts', 'combined', 'combine_05_15', 'combine_15_25', 'combine_05_15_25']) {
        if (!st[key]) st[key] = { total: 0, won: 0, lost: 0, pending: 0 }
        st[key].total++
        st[key].pending++
      }

      saveTracking(this.trackedMatches)
      saveCumulativeStats(this.cumulativeStats)
    },

    resolveTrackedMatches () {
      let changed = false
      const finishedStatuses = ['FT', 'AET', 'PEN']

      this.trackedMatches.forEach(tracked => {
        if (tracked.status !== 'pending') return

        const liveMatch = this.todayMatches.find(m => m.id === tracked.matchId)
        if (!liveMatch) return
        if (!finishedStatuses.includes(liveMatch.status?.toUpperCase())) return

        const scoreH = liveMatch.score?.home
        const scoreA = liveMatch.score?.away
        if (scoreH === null || scoreH === undefined) return

        const htH = liveMatch.score?.ht?.home
        const htA = liveMatch.score?.ht?.away
        const totalGoals = (scoreH || 0) + (scoreA || 0)
        const htGoals = (htH !== null && htH !== undefined && htA !== null && htA !== undefined)
          ? htH + htA : null

        tracked.scoreHome = scoreH
        tracked.scoreAway = scoreA
        tracked.htHome = htH
        tracked.htAway = htA
        tracked.status = 'resolved'

        const st = this.cumulativeStats.football

        // Over 0.5 HT
        if (htGoals !== null) {
          tracked.results.over05HT = htGoals >= 1
          st.over05HT.pending = Math.max(0, st.over05HT.pending - 1)
          if (htGoals >= 1) st.over05HT.won++
          else st.over05HT.lost++
        } else {
          const estimated = Math.round(totalGoals * 0.43)
          tracked.results.over05HT = estimated >= 1
          st.over05HT.pending = Math.max(0, st.over05HT.pending - 1)
          if (estimated >= 1) st.over05HT.won++
          else st.over05HT.lost++
        }

        // Over 0.5
        if (!st.over05) st.over05 = { total: 0, won: 0, lost: 0, pending: 0 }
        tracked.results.over05 = totalGoals >= 1
        st.over05.pending = Math.max(0, st.over05.pending - 1)
        if (totalGoals >= 1) st.over05.won++
        else st.over05.lost++

        // Over 1.5
        tracked.results.over15 = totalGoals >= 2
        st.over15.pending = Math.max(0, st.over15.pending - 1)
        if (totalGoals >= 2) st.over15.won++
        else st.over15.lost++

        // Over 2.5
        tracked.results.over25 = totalGoals >= 3
        st.over25.pending = Math.max(0, st.over25.pending - 1)
        if (totalGoals >= 3) st.over25.won++
        else st.over25.lost++

        // BTTS
        tracked.results.btts = (scoreH || 0) > 0 && (scoreA || 0) > 0
        st.btts.pending = Math.max(0, st.btts.pending - 1)
        if (tracked.results.btts) st.btts.won++
        else st.btts.lost++

        // Combined (Over 0.5 HT + Over 1.5 + Over 2.5 + BTTS)
        const allPassed = tracked.results.over05HT && tracked.results.over15 &&
                          tracked.results.over25 && tracked.results.btts
        st.combined.pending = Math.max(0, st.combined.pending - 1)
        if (allPassed) st.combined.won++
        else st.combined.lost++

        // Combine Over 0.5 + Over 1.5
        if (!st.combine_05_15) st.combine_05_15 = { total: 0, won: 0, lost: 0, pending: 0 }
        const c05_15 = tracked.results.over05 && tracked.results.over15
        st.combine_05_15.pending = Math.max(0, st.combine_05_15.pending - 1)
        if (c05_15) st.combine_05_15.won++
        else st.combine_05_15.lost++

        // Combine Over 1.5 + Over 2.5
        if (!st.combine_15_25) st.combine_15_25 = { total: 0, won: 0, lost: 0, pending: 0 }
        const c15_25 = tracked.results.over15 && tracked.results.over25
        st.combine_15_25.pending = Math.max(0, st.combine_15_25.pending - 1)
        if (c15_25) st.combine_15_25.won++
        else st.combine_15_25.lost++

        // Combine Over 0.5 + Over 1.5 + Over 2.5
        if (!st.combine_05_15_25) st.combine_05_15_25 = { total: 0, won: 0, lost: 0, pending: 0 }
        const c05_15_25 = tracked.results.over05 && tracked.results.over15 && tracked.results.over25
        st.combine_05_15_25.pending = Math.max(0, st.combine_05_15_25.pending - 1)
        if (c05_15_25) st.combine_05_15_25.won++
        else st.combine_05_15_25.lost++

        changed = true
      })

      if (changed) {
        saveTracking(this.trackedMatches)
        saveCumulativeStats(this.cumulativeStats)
      }
    },

    removeTrackedMatch (matchId) {
      const idx = this.trackedMatches.findIndex(t => t.matchId === matchId)
      if (idx === -1) return

      const entry = this.trackedMatches[idx]
      const st = this.cumulativeStats.football

      const allKeys = ['over05HT', 'over05', 'over15', 'over25', 'btts', 'combined', 'combine_05_15', 'combine_15_25', 'combine_05_15_25']

      if (entry.status === 'pending') {
        for (const key of allKeys) {
          if (!st[key]) continue
          st[key].total = Math.max(0, st[key].total - 1)
          st[key].pending = Math.max(0, st[key].pending - 1)
        }
      } else {
        const r = entry.results || {}
        const combineResults = {
          combined: r.over05HT && r.over15 && r.over25 && r.btts,
          combine_05_15: r.over05 && r.over15,
          combine_15_25: r.over15 && r.over25,
          combine_05_15_25: r.over05 && r.over15 && r.over25
        }

        for (const key of allKeys) {
          if (!st[key]) continue
          st[key].total = Math.max(0, st[key].total - 1)

          let won = false
          if (['combined', 'combine_05_15', 'combine_15_25', 'combine_05_15_25'].includes(key)) {
            won = combineResults[key]
          } else {
            won = r[key] === true
          }
          if (won) st[key].won = Math.max(0, st[key].won - 1)
          else st[key].lost = Math.max(0, st[key].lost - 1)
        }
      }

      this.trackedMatches.splice(idx, 1)
      saveTracking(this.trackedMatches)
      saveCumulativeStats(this.cumulativeStats)
    },

    clearTracking () {
      this.trackedMatches = []
      this.cumulativeStats = {
        football: {
          over05HT:  { total: 0, won: 0, lost: 0, pending: 0 },
          over15:    { total: 0, won: 0, lost: 0, pending: 0 },
          over25:    { total: 0, won: 0, lost: 0, pending: 0 },
          btts:      { total: 0, won: 0, lost: 0, pending: 0 },
          combined:  { total: 0, won: 0, lost: 0, pending: 0 }
        }
      }
      saveTracking([])
      saveCumulativeStats(this.cumulativeStats)
    },

    // ── Fetch principal (liste matchs du jour) ───────────────────────────────

    async fetchTodayMatches () {
      this.loading   = true
      this.error     = null
      this.debugInfo = null

      // Note: La clé API est maintenant gérée par le backend, pas besoin de vérifier ici

      try {
        const refDate  = this.customDate || dateToStr(new Date())
        const prevDate = addDays(refDate, -1)
        const nextDate = addDays(refDate, +1)

        logger.log(`📅 Recherche: ${refDate}`)

        let allMatches = []

        // Fetch matches pour le sport sélectionné
        allMatches = await this.fetchMatchesBySport(this.selectedSport, refDate)

        // Si aucun match trouvé, essayer jour précédent et suivant
        if (allMatches.length === 0) {
          allMatches = await this.fetchMatchesBySport(this.selectedSport, prevDate)
        }
        if (allMatches.length === 0) {
          allMatches = await this.fetchMatchesBySport(this.selectedSport, nextDate)
        }

        this.todayMatches = allMatches.sort((a, b) => new Date(a.date) - new Date(b.date))
        this.lastFetch    = new Date()
        this.isDemoMode   = false

        logger.log(`🎉 todayMatches set to ${this.todayMatches.length} matches`)
        logger.log(`🔍 filteredMatches: ${this.filteredMatches.length}`)

        this.debugInfo = {
          dateSearched: refDate,
          matchesFound: allMatches.length,
          apiKeyValid: true
        }

        if (allMatches.length === 0) {
          this.error = `Aucun match trouvé. L'API retourne vide (plan gratuit limité ?).`
          logger.error('❌ No matches found')
        } else {
          logger.log(`✅ ${allMatches.length} matches loaded successfully`)
        }

        return { success: true, count: allMatches.length }

      } catch (err) {
        logger.error('❌ Erreur API:', err)
        
        if (err.code === 'ERR_NETWORK' || err.message?.includes('CORS') || err.response?.status === 0) {
          this.error = 'Erreur CORS/Réseau. Utilisation du mode démo.'
          return this.loadDemoMatches()
        }
        
        this.error = err.response?.data?.message || err.message || 'Erreur API'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    // ── Appels API directs (liste matchs) ────────────────────────────────────

    async fetchMatchesBySport (sport, date) {
      try {
        logger.log(`🔍 ${sport.toUpperCase()} /matches/${sport}?date=${date}`)
        logger.log(`📡 Calling: ${API_URL}/matches/${sport}`)

        // Réinitialiser l'avertissement
        this.apiWarning = null

        // Appel unifié via le backend
        const res = await axios.get(`${API_URL}/matches/${sport}`, {
          params: { date },
          headers: getAuthHeaders(),
          timeout: 60000
        })

        logger.log(`📦 Response:`, res.data)

        // Vérifier s'il y a un avertissement dans la réponse
        if (res.data?.warning) {
          this.apiWarning = res.data.warning
          logger.warn(`⚠️ API Warning:`, res.data.warning)
        }

        // Le backend retourne { status: 'success', sport, data: { response: [...] } }
        const apiData = res.data?.data || res.data

        logger.log(`✅ ${apiData?.results ?? 0} match(s)`)

        if (!apiData?.response?.length) {
          logger.warn('⚠️ No matches in response')
          return []
        }

        // Formater selon le sport
        const formatted = apiData.response.map(match => {
          if (sport === 'football') {
            return this.formatFootballMatch(match, date)
          } else if (sport === 'basketball') {
            return this.formatBasketballMatch(match, date)
          } else if (sport === 'tennis') {
            return this.formatTennisMatch(match, date)
          } else {
            return this.formatGenericMatch(match, sport, date)
          }
        })

        logger.log(`🎯 Formatted ${formatted.length} matches`)
        return formatted

      } catch (err) {
        logger.error(`❌ Error fetching ${sport}:`, err)
        logger.error(`❌ Response:`, err.response?.data)
        throw err
      }
    },

    async fetchFootballByDate (date, headers) {
      try {
        logger.log(`🔍 Football /fixtures?date=${date}`)
        logger.log(`📡 Calling: ${API_URL}/matches/football`)

        // Utiliser le proxy backend au lieu d'appeler directement l'API externe
        const res = await axios.get(`${API_URL}/matches/football`, {
          params: { date },
          headers: getAuthHeaders(),
          timeout: 60000 // 60 secondes au lieu de 15
        })

        logger.log(`📦 Response:`, res.data)

        // Le backend retourne { status: 'success', data: { response: [...] } }
        const apiData = res.data?.data || res.data

        logger.log(`✅ ${apiData?.results ?? 0} match(s)`)

        if (!apiData?.response?.length) {
          logger.warn('⚠️ No matches in response')
          return []
        }

        const formatted = apiData.response.map(f => this.formatFootballMatch(f, date))
        logger.log(`🎯 Formatted ${formatted.length} matches`)

        return formatted

      } catch (err) {
        logger.error(`❌ Error:`, err)
        logger.error(`❌ Response:`, err.response?.data)
        throw err
      }
    },

    async fetchBasketballByDate (date, headers) {
      try {
        logger.log(`🔍 Basketball /games?date=${date}`)

        // Utiliser le proxy backend au lieu d'appeler directement l'API externe
        const res = await axios.get(`${API_URL}/matches/basketball`, {
          params: { date },
          headers: getAuthHeaders(),
          timeout: 60000 // 60 secondes au lieu de 15
        })

        // Le backend retourne { status: 'success', data: { response: [...] } }
        const apiData = res.data?.data || res.data

        logger.log(`✅ ${apiData?.results ?? 0} match(s)`)

        if (!apiData?.response?.length) return []
        return apiData.response.map(g => this.formatBasketballMatch(g, date))

      } catch (err) {
        logger.error(`❌ Erreur:`, err.message)
        throw err
      }
    },

    // ── Mode Démo ────────────────────────────────────────────────────────────

    async loadDemoMatches () {
      this.loading    = true
      this.isDemoMode = true
      this.error      = null

      const demoMatches = [
        {
          id: 'demo-1',
          sport: 'football',
          source: 'DEMO',
          date: new Date().toISOString(),
          status: 'NS',
          statusLong: 'Not Started',
          league: { 
            id: 2, 
            name: 'UEFA Champions League', 
            country: 'World',
            logo: 'https://media.api-sports.io/football/leagues/2.png',
            round: 'Quarter-finals'
          },
          homeTeam: { 
            id: 541, 
            name: 'Real Madrid', 
            logo: 'https://media.api-sports.io/football/teams/541.png',
            winner: null
          },
          awayTeam: { 
            id: 50, 
            name: 'Manchester City', 
            logo: 'https://media.api-sports.io/football/teams/50.png',
            winner: null
          },
          score: { home: null, away: null, ht: { home: null, away: null } },
          prediction: { 
            prediction: '1', 
            confidence: 62, 
            probabilities: { home: 45, draw: 25, away: 30 } 
          },
          venue: 'Santiago Bernabéu'
        },
        {
          id: 'demo-2',
          sport: 'football',
          source: 'DEMO',
          date: new Date(Date.now() + 7200000).toISOString(),
          status: 'NS',
          statusLong: 'Not Started',
          league: { 
            id: 2, 
            name: 'UEFA Champions League', 
            country: 'World',
            logo: 'https://media.api-sports.io/football/leagues/2.png',
            round: 'Quarter-finals'
          },
          homeTeam: { 
            id: 157, 
            name: 'Bayern Munich', 
            logo: 'https://media.api-sports.io/football/teams/157.png',
            winner: null
          },
          awayTeam: { 
            id: 42, 
            name: 'Arsenal', 
            logo: 'https://media.api-sports.io/football/teams/42.png',
            winner: null
          },
          score: { home: null, away: null, ht: { home: null, away: null } },
          prediction: { 
            prediction: '1', 
            confidence: 55, 
            probabilities: { home: 40, draw: 30, away: 30 } 
          },
          venue: 'Allianz Arena'
        },
        {
          id: 'demo-3',
          sport: 'football',
          source: 'DEMO',
          date: new Date(Date.now() + 14400000).toISOString(),
          status: 'NS',
          statusLong: 'Not Started',
          league: { 
            id: 39, 
            name: 'Premier League', 
            country: 'England',
            logo: 'https://media.api-sports.io/football/leagues/39.png',
            round: 'Regular Season - 32'
          },
          homeTeam: { 
            id: 40, 
            name: 'Liverpool', 
            logo: 'https://media.api-sports.io/football/teams/40.png',
            winner: null
          },
          awayTeam: { 
            id: 49, 
            name: 'Chelsea', 
            logo: 'https://media.api-sports.io/football/teams/49.png',
            winner: null
          },
          score: { home: null, away: null, ht: { home: null, away: null } },
          prediction: { 
            prediction: '1', 
            confidence: 68, 
            probabilities: { home: 48, draw: 25, away: 27 } 
          },
          venue: 'Anfield'
        },
        {
          id: 'demo-4',
          sport: 'football',
          source: 'DEMO',
          date: new Date(Date.now() + 21600000).toISOString(),
          status: 'LIVE',
          statusLong: 'First Half',
          league: { 
            id: 140, 
            name: 'Primera Division', 
            country: 'Spain',
            logo: 'https://media.api-sports.io/football/leagues/140.png',
            round: 'Regular Season - 30'
          },
          homeTeam: { 
            id: 529, 
            name: 'Barcelona', 
            logo: 'https://media.api-sports.io/football/teams/529.png',
            winner: true
          },
          awayTeam: { 
            id: 530, 
            name: 'Atletico Madrid', 
            logo: 'https://media.api-sports.io/football/teams/530.png',
            winner: false
          },
          score: { home: 2, away: 1, ht: { home: 1, away: 0 } },
          prediction: { 
            prediction: '1', 
            confidence: 72, 
            probabilities: { home: 50, draw: 25, away: 25 } 
          },
          venue: 'Camp Nou'
        }
      ]

      this.todayMatches = demoMatches
      this.loading      = false
      
      this.debugInfo = {
        mode: 'DEMO',
        matchesFound: demoMatches.length,
        message: 'Mode démo: matchs fictifs. Configurez une vraie clé API dans .env'
      }

      return { success: true, count: demoMatches.length, demo: true }
    },

    // ── Formatters ────────────────────────────────────────────────────────────

    formatFootballMatch (fixture, dateFetched) {
      return {
        id:         `football-${fixture.fixture.id}`,
        sport:      'football',
        source:     'API',
        fixtureId:  fixture.fixture.id,
        date:       fixture.fixture.date,
        dateFetched,
        status:     fixture.fixture.status.short,
        statusLong: fixture.fixture.status.long,
        league: {
          id:      fixture.league.id,
          name:    fixture.league.name,
          country: fixture.league.country,
          logo:    fixture.league.logo,
          round:   fixture.league.round
        },
        homeTeam: {
          id:     fixture.teams.home.id,
          name:   fixture.teams.home.name,
          logo:   fixture.teams.home.logo,
          winner: fixture.teams.home.winner
        },
        awayTeam: {
          id:     fixture.teams.away.id,
          name:   fixture.teams.away.name,
          logo:   fixture.teams.away.logo,
          winner: fixture.teams.away.winner
        },
        score: {
          home: fixture.goals.home,
          away: fixture.goals.away,
          ht:   { home: fixture.score?.halftime?.home, away: fixture.score?.halftime?.away }
        },
        prediction: this.generatePrediction(fixture),
        venue:      fixture.fixture.venue?.name
      }
    },

    formatBasketballMatch (game, dateFetched) {
      return {
        id:         `basketball-${game.id}`,
        sport:      'basketball',
        source:     'API',
        fixtureId:  game.id,
        date:       game.date,
        dateFetched,
        status:     game.status.short,
        statusLong: game.status.long,
        league: {
          id:      game.league.id,
          name:    game.league.name,
          country: game.country?.name || game.league.country || 'World',
          logo:    game.league.logo,
          round:   game.league.season
        },
        homeTeam: {
          id:     game.teams.home.id,
          name:   game.teams.home.name,
          logo:   game.teams.home.logo,
          winner: game.scores.home?.total > game.scores.away?.total
        },
        awayTeam: {
          id:     game.teams.away.id,
          name:   game.teams.away.name,
          logo:   game.teams.away.logo,
          winner: game.scores.away?.total > game.scores.home?.total
        },
        score: {
          home: game.scores.home?.total || null,
          away: game.scores.away?.total || null,
          ht:   {
            home: game.scores.home?.quarter_1 && game.scores.home?.quarter_2
              ? game.scores.home.quarter_1 + game.scores.home.quarter_2
              : null,
            away: game.scores.away?.quarter_1 && game.scores.away?.quarter_2
              ? game.scores.away.quarter_1 + game.scores.away.quarter_2
              : null
          }
        },
        prediction: this.generatePrediction(game),
        venue: game.arena?.name || game.country?.name
      }
    },

    formatTennisMatch (match, dateFetched) {
      return {
        id:         match.id,
        sport:      'tennis',
        source:     match.source || 'ESPN',
        fixtureId:  match.fixtureId,
        date:       match.date,
        dateFetched,
        status:     match.status || 'NS',
        statusLong: match.statusLong || 'Not Started',
        league: {
          id:      match.league?.id || 0,
          name:    match.league?.name || 'Tennis',
          country: match.league?.country || 'International',
          logo:    match.league?.logo || null,
          round:   match.league?.round || match.tennis?.round || 'Main Draw'
        },
        homeTeam: {
          id:     match.homeTeam?.id || 0,
          name:   match.homeTeam?.name || 'Player 1',
          logo:   match.homeTeam?.logo || match.homeTeam?.flag || null,
          winner: match.homeTeam?.winner || null
        },
        awayTeam: {
          id:     match.awayTeam?.id || 0,
          name:   match.awayTeam?.name || 'Player 2',
          logo:   match.awayTeam?.logo || match.awayTeam?.flag || null,
          winner: match.awayTeam?.winner || null
        },
        score: {
          home: match.score?.home ?? null,
          away: match.score?.away ?? null,
          detail: match.score?.detail || null,
          ht:   { home: null, away: null }
        },
        prediction: this.generatePrediction({
          teams: {
            home: { id: match.homeTeam?.id || 0 },
            away: { id: match.awayTeam?.id || 0 }
          }
        }),
        venue: match.venue || 'Tennis Court',
        tennis: match.tennis || {}
      }
    },

    formatGenericMatch (game, sport, dateFetched) {
      // Format générique pour tennis, volleyball, rugby, hockey, handball, etc.
      return {
        id:         `${sport}-${game.id}`,
        sport:      sport,
        source:     'API',
        fixtureId:  game.id,
        date:       game.date,
        dateFetched,
        status:     game.status?.short || game.status || 'NS',
        statusLong: game.status?.long || 'Not Started',
        league: {
          id:      game.league?.id || game.tournament?.id || 0,
          name:    game.league?.name || game.tournament?.name || 'Unknown',
          country: game.country?.name || game.league?.country || 'World',
          logo:    game.league?.logo || game.tournament?.logo || null,
          round:   game.league?.round || game.round || game.stage || 'Regular'
        },
        homeTeam: {
          id:     game.teams?.home?.id || 0,
          name:   game.teams?.home?.name || game.home_team || 'Home',
          logo:   game.teams?.home?.logo || null,
          winner: game.teams?.home?.winner || false
        },
        awayTeam: {
          id:     game.teams?.away?.id || 0,
          name:   game.teams?.away?.name || game.away_team || 'Away',
          logo:   game.teams?.away?.logo || null,
          winner: game.teams?.away?.winner || false
        },
        score: {
          home: game.scores?.home || game.home_score || null,
          away: game.scores?.away || game.away_score || null,
          ht:   { home: null, away: null }
        },
        prediction: this.generatePrediction(game),
        venue: game.venue?.name || game.arena?.name || 'Unknown'
      }
    },

    generatePrediction (fixture) {
      const homeId = fixture.teams?.home?.id || fixture.homeTeam?.id || 0
      const awayId = fixture.teams?.away?.id || fixture.awayTeam?.id || 0
      const seed = (homeId * 2654435761 + awayId * 40503) & 0xFFFFFFFF
      const norm = (seed >>> 0) / 0xFFFFFFFF

      let homeBase = 45 + (((seed >> 4) & 0xFF) / 255) * 20
      let awayBase = 30 + (((seed >> 12) & 0xFF) / 255) * 20
      const drawBase = 22 + (((seed >> 20) & 0xFF) / 255) * 10

      const total = homeBase + drawBase + awayBase
      const hP = (homeBase / total) * 100
      const dP = (drawBase / total) * 100
      const aP = (awayBase / total) * 100

      let pred = 'X'
      if (hP > aP + 8) pred = '1'
      else if (aP > hP + 8) pred = '2'

      return {
        confidence:    Math.min(85, Math.max(50, Math.round(Math.max(hP, aP)))),
        prediction:    pred,
        probabilities: { home: Math.round(hP), draw: Math.round(dP), away: Math.round(aP) }
      }
    },

    // ── Setters ───────────────────────────────────────────────────────────────

    setSport (sport) {
      this.selectedSport = sport
      this.fetchTodayMatches()
    },

    setSeason (season) {
      this.selectedSeason = season.toString()
      this.fetchTodayMatches()
    },

    async selectMatch (match) {
      this.selectedMatch = match

      // Lancer l'analyse automatique si disponible
      if (match && match.homeTeam?.id && match.awayTeam?.id) {
        try {
          await this.analyzeMatchByTeams({
            homeTeamId: match.homeTeam.id,
            awayTeamId: match.awayTeam.id,
            sport: match.sport || this.selectedSport,
            season: this.selectedSeason,
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam
          })
        } catch (error) {
          logger.error('Erreur analyse automatique:', error)
          // Ne pas bloquer l'UI en cas d'erreur
        }
      }
    },

    clearError () { this.error = null }
  }
})