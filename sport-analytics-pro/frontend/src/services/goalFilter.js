/**
 * goalFilter.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Service de filtrage Over 0.5 MT / Over 1.5 Match
 * ► 100% frontend, appelle API-Sports directement (même clé que le store)
 * ► Utilise les vrais scores de mi-temps (score.halftime) — pas d'estimation
 * ► Analyse : 12 derniers matchs de chaque équipe + 10 derniers H2H
 * ─────────────────────────────────────────────────────────────────────────────
 */

import axios from 'axios'

const BASE = 'https://v3.football.api-sports.io'

// ─── Helpers internes ─────────────────────────────────────────────────────────

const getHeaders = () => ({
  'x-apisports-key': import.meta.env.VITE_API_SPORTS_KEY
})

/**
 * Derniers N matchs terminés d'une équipe (avec scores HT réels)
 */
async function fetchLastMatches(teamId, n = 12) {
  try {
    const res = await axios.get(`${BASE}/fixtures`, {
      headers: getHeaders(),
      params:  { team: teamId, last: n, timezone: 'Africa/Douala' },
      timeout: 12000
    })
    // Ne garder que les matchs terminés avec score valide
    return (res.data?.response || []).filter(f =>
      f.fixture.status.short === 'FT' &&
      f.goals.home !== null &&
      f.goals.away !== null
    )
  } catch (e) {
    console.error(`❌ fetchLastMatches(${teamId}):`, e.message)
    return []
  }
}

/**
 * Derniers N confrontations directes entre deux équipes
 */
async function fetchH2H(teamAId, teamBId, n = 10) {
  try {
    const res = await axios.get(`${BASE}/fixtures/headtohead`, {
      headers: getHeaders(),
      params:  { h2h: `${teamAId}-${teamBId}`, last: n, timezone: 'Africa/Douala' },
      timeout: 12000
    })
    return (res.data?.response || []).filter(f =>
      f.fixture.status.short === 'FT' &&
      f.goals.home !== null &&
      f.goals.away !== null
    )
  } catch (e) {
    console.error(`❌ fetchH2H(${teamAId}-${teamBId}):`, e.message)
    return []
  }
}

// ─── Calculs statistiques ─────────────────────────────────────────────────────

/**
 * Calcule les stats de buts d'une liste de matchs.
 * Utilise score.halftime quand disponible, sinon estime à 40% des buts totaux.
 */
function computeStats(fixtures) {
  if (!fixtures.length) return {
    matches: 0, avgTotal: 0, avgHT: 0,
    over05HTRate: 0, over15Rate: 0, over25Rate: 0, bttsRate: 0
  }

  let sumTotal = 0, sumHT = 0
  let over05HT = 0, over15 = 0, over25 = 0, btts = 0

  fixtures.forEach(f => {
    const total = (f.goals.home || 0) + (f.goals.away || 0)

    // ✅ Score HT réel si disponible, sinon estimation 40%
    const htHome = f.score?.halftime?.home ?? null
    const htAway = f.score?.halftime?.away ?? null
    const htTotal = (htHome !== null && htAway !== null)
      ? htHome + htAway
      : Math.round(total * 0.40)

    sumTotal += total
    sumHT    += htTotal

    if (htTotal >= 1) over05HT++
    if (total   >= 2) over15++
    if (total   >= 3) over25++
    if ((f.goals.home || 0) > 0 && (f.goals.away || 0) > 0) btts++
  })

  const n = fixtures.length
  return {
    matches:      n,
    avgTotal:     +(sumTotal / n).toFixed(2),
    avgHT:        +(sumHT    / n).toFixed(2),
    over05HTRate: +((over05HT / n) * 100).toFixed(1),
    over15Rate:   +((over15   / n) * 100).toFixed(1),
    over25Rate:   +((over25   / n) * 100).toFixed(1),
    bttsRate:     +((btts     / n) * 100).toFixed(1),
    hasRealHT:    fixtures.filter(f =>
      f.score?.halftime?.home !== null && f.score?.halftime?.away !== null
    ).length
  }
}

/**
 * Fusionne les stats équipe + H2H avec pondération
 * Poids: 55% forme récente équipe, 45% H2H (si ≥ 3 matchs H2H, sinon 100% forme)
 */
function blend(teamRate, h2hRate, h2hCount) {
  if (h2hCount < 3) return teamRate
  return +(teamRate * 0.55 + h2hRate * 0.45).toFixed(1)
}

function confidenceLabel(prob) {
  if (prob >= 75) return 'élevée'
  if (prob >= 55) return 'moyenne'
  return 'faible'
}

// ─── Entrée publique ──────────────────────────────────────────────────────────

/**
 * Analyse complète Over 0.5 MT + Over 1.5 Match pour une rencontre
 *
 * @param {number} homeTeamId  - ID API-Sports équipe domicile
 * @param {number} awayTeamId  - ID API-Sports équipe extérieur
 * @param {string} homeName    - Nom affiché équipe domicile
 * @param {string} awayName    - Nom affiché équipe extérieur
 * @returns {Promise<Object>}  résultat complet (voir structure ci-dessous)
 */
export async function analyzeGoalFilter(homeTeamId, awayTeamId, homeName = '', awayName = '') {

  // ── 1. Récupérer les données (3 appels parallèles) ───────────────────────
  const [homeFixtures, awayFixtures, h2hFixtures] = await Promise.all([
    fetchLastMatches(homeTeamId, 12),
    fetchLastMatches(awayTeamId, 12),
    fetchH2H(homeTeamId, awayTeamId, 10)
  ])

  // ── 2. Calculer les stats ────────────────────────────────────────────────
  const homeStats = computeStats(homeFixtures)
  const awayStats = computeStats(awayFixtures)
  const h2hStats  = computeStats(h2hFixtures)

  // ── 3. Probabilités finales (blend forme + H2H) ──────────────────────────
  //   Over 0.5 HT  : moyenne des deux équipes, pondérée par H2H
  const homeOver05HT = blend(homeStats.over05HTRate, h2hStats.over05HTRate, h2hStats.matches)
  const awayOver05HT = blend(awayStats.over05HTRate, h2hStats.over05HTRate, h2hStats.matches)
  const probOver05HT = +((homeOver05HT + awayOver05HT) / 2).toFixed(1)

  //   Over 1.5 Match : moyenne des deux équipes, pondérée par H2H
  const homeOver15   = blend(homeStats.over15Rate, h2hStats.over15Rate, h2hStats.matches)
  const awayOver15   = blend(awayStats.over15Rate, h2hStats.over15Rate, h2hStats.matches)
  const probOver15   = +((homeOver15 + awayOver15) / 2).toFixed(1)

  // ── 4. Critères de recommandation ────────────────────────────────────────
  //   Seuils : Over 0.5 HT ≥ 60% ET Over 1.5 ≥ 65%
  const meetsHT    = probOver05HT >= 60
  const meetsMatch = probOver15   >= 65
  const isRecommended = meetsHT && meetsMatch

  // ── 5. Raisons lisibles ──────────────────────────────────────────────────
  const reasoning = buildReasoning(
    homeName, awayName,
    homeStats, awayStats, h2hStats,
    probOver05HT, probOver15,
    meetsHT, meetsMatch
  )

  // ── 6. Résultat structuré ────────────────────────────────────────────────
  return {
    isRecommended,
    recommendation: isRecommended ? '✅ RECOMMANDÉ' : '❌ NON RECOMMANDÉ',

    criteria: {
      firstHalfOver05: {
        met:         meetsHT,
        probability: probOver05HT,
        confidence:  confidenceLabel(probOver05HT),
        threshold:   60,
        description: 'Over 0.5 buts 1ère mi-temps'
      },
      matchOver15: {
        met:         meetsMatch,
        probability: probOver15,
        confidence:  confidenceLabel(probOver15),
        threshold:   65,
        description: 'Over 1.5 buts match complet'
      }
    },

    details: {
      homeTeam: {
        name:         homeName,
        matches:      homeStats.matches,
        avgTotal:     homeStats.avgTotal,
        avgHT:        homeStats.avgHT,
        over05HT:     homeStats.over05HTRate,
        over15:       homeStats.over15Rate,
        over25:       homeStats.over25Rate,
        btts:         homeStats.bttsRate,
        hasRealHT:    homeStats.hasRealHT
      },
      awayTeam: {
        name:         awayName,
        matches:      awayStats.matches,
        avgTotal:     awayStats.avgTotal,
        avgHT:        awayStats.avgHT,
        over05HT:     awayStats.over05HTRate,
        over15:       awayStats.over15Rate,
        over25:       awayStats.over25Rate,
        btts:         awayStats.bttsRate,
        hasRealHT:    awayStats.hasRealHT
      },
      h2h: {
        matches:      h2hStats.matches,
        avgTotal:     h2hStats.avgTotal,
        avgHT:        h2hStats.avgHT,
        over05HT:     h2hStats.over05HTRate,
        over15:       h2hStats.over15Rate,
        btts:         h2hStats.bttsRate,
        hasRealHT:    h2hStats.hasRealHT
      }
    },

    reasoning,
    analyzedAt: new Date().toISOString()
  }
}

// ─── Générateur de raisons ────────────────────────────────────────────────────

function buildReasoning(hn, an, home, away, h2h, probHT, probMatch, meetsHT, meetsMatch) {
  const reasons = []

  // Over 0.5 HT
  if (meetsHT) {
    reasons.push({
      ok: true,
      text: `${hn} ouvre le score en 1ère MT dans ${home.over05HTRate}% de ses matchs récents`
    })
    if (h2h.matches >= 3)
      reasons.push({
        ok: true,
        text: `H2H : but marqué avant la mi-temps dans ${h2h.over05HTRate}% des confrontations directes`
      })
  } else {
    reasons.push({
      ok: false,
      text: `Peu de buts en 1ère MT : ${hn} (${home.over05HTRate}%) et ${an} (${away.over05HTRate}%) — seuil requis 60%`
    })
  }

  // Over 1.5 Match
  if (meetsMatch) {
    reasons.push({
      ok: true,
      text: `${hn} impliqué dans des matchs à +1.5 buts dans ${home.over15Rate}% des cas`
    })
    reasons.push({
      ok: true,
      text: `${an} : ${away.over15Rate}% de ses matchs dépassent 1.5 buts`
    })
    if (h2h.matches >= 3)
      reasons.push({
        ok: true,
        text: `H2H : ${h2h.over15Rate}% des confrontations dépassent 1.5 buts (moy. ${h2h.avgTotal} buts/match)`
      })
  } else {
    reasons.push({
      ok: false,
      text: `Rencontres peu prolifiques : moy. ${((home.avgTotal + away.avgTotal) / 2).toFixed(1)} buts/match — seuil requis 65%`
    })
  }

  // BTTS bonus
  if (h2h.matches >= 3 && h2h.btts >= 60)
    reasons.push({
      ok: true,
      text: `Les deux équipes ont marqué dans ${h2h.btts}% des H2H (BTTS favorable)`
    })

  // Données HT réelles vs estimées
  const realHTCount = home.hasRealHT + away.hasRealHT + h2h.hasRealHT
  if (realHTCount > 0)
    reasons.push({
      ok: null,
      text: `ℹ️ Scores mi-temps réels utilisés pour ${realHTCount} match(s) sur ${home.matches + away.matches + h2h.matches}`
    })
  else
    reasons.push({
      ok: null,
      text: `ℹ️ Scores HT estimés (données HT non disponibles dans l'API pour ces matchs)`
    })

  return reasons
}