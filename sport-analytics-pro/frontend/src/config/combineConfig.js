const footballCombines = [
  { key: 'fb_05ht', label: 'Over 0.5 MT', desc: 'Au moins 1 but en 1ere mi-temps', color: 'emerald', minProb: 60,
    prob: (p) => p?.goalsPredictions?.over05HT?.probability || 0 },
  { key: 'fb_05', label: 'Over 0.5', desc: 'Au moins 1 but fin de match', color: 'emerald', minProb: 70,
    prob: (p) => p?.goalsPredictions?.over05?.probability || 0 },
  { key: 'fb_15', label: 'Over 1.5', desc: 'Au moins 2 buts fin de match', color: 'yellow', minProb: 60,
    prob: (p) => p?.goalsPredictions?.over15?.probability || 0 },
  { key: 'fb_25', label: 'Over 2.5', desc: 'Au moins 3 buts fin de match', color: 'orange', minProb: 50,
    prob: (p) => p?.goalsPredictions?.over25?.probability || 0 },
  { key: 'fb_btts', label: 'BTTS', desc: 'Les 2 equipes marquent', color: 'pink', minProb: 55,
    prob: (p) => p?.goalsPredictions?.btts?.probability || 0 },
  '_sep',
  { key: 'fb_05_15', label: '0.5 + 1.5', desc: 'Over 0.5 ET Over 1.5 (min 57%)', color: 'cyan', minProb: 57, multi: true,
    criteria: [
      { label: 'O 0.5', prob: (p) => p?.goalsPredictions?.over05?.probability || 0 },
      { label: 'O 1.5', prob: (p) => p?.goalsPredictions?.over15?.probability || 0 }
    ] },
  { key: 'fb_15_25', label: '1.5 + 2.5', desc: 'Over 1.5 ET Over 2.5 (min 57%)', color: 'purple', minProb: 57, multi: true,
    criteria: [
      { label: 'O 1.5', prob: (p) => p?.goalsPredictions?.over15?.probability || 0 },
      { label: 'O 2.5', prob: (p) => p?.goalsPredictions?.over25?.probability || 0 }
    ] },
  { key: 'fb_05_15_25', label: '0.5+1.5+2.5', desc: 'Over 0.5, 1.5 ET 2.5 (min 57%)', color: 'rose', minProb: 57, multi: true,
    criteria: [
      { label: 'O 0.5', prob: (p) => p?.goalsPredictions?.over05?.probability || 0 },
      { label: 'O 1.5', prob: (p) => p?.goalsPredictions?.over15?.probability || 0 },
      { label: 'O 2.5', prob: (p) => p?.goalsPredictions?.over25?.probability || 0 }
    ] }
]

const basketballCombines = [
  { key: 'bk_o195', label: 'O 195.5', desc: 'Plus de 195.5 points au total', color: 'orange', minProb: 55,
    prob: (p) => p?.basketballPredictions?.over195_5?.probability || 0 },
  { key: 'bk_o205', label: 'O 205.5', desc: 'Plus de 205.5 points au total', color: 'yellow', minProb: 50,
    prob: (p) => p?.basketballPredictions?.over205_5?.probability || 0 },
  { key: 'bk_o215', label: 'O 215.5', desc: 'Plus de 215.5 points au total', color: 'red', minProb: 45,
    prob: (p) => p?.basketballPredictions?.over215_5?.probability || 0 },
  { key: 'bk_home', label: 'Victoire Dom.', desc: 'Victoire equipe domicile', color: 'emerald', minProb: 58,
    prob: (p) => p?.mainPrediction?.probabilities?.home || 0 },
  { key: 'bk_away', label: 'Victoire Ext.', desc: 'Victoire equipe exterieur', color: 'blue', minProb: 58,
    prob: (p) => p?.mainPrediction?.probabilities?.away || 0 },
  '_sep',
  { key: 'bk_o195_o205', label: 'O195+O205', desc: 'Over 195.5 ET Over 205.5 (min 50%)', color: 'cyan', minProb: 50, multi: true,
    criteria: [
      { label: 'O 195.5', prob: (p) => p?.basketballPredictions?.over195_5?.probability || 0 },
      { label: 'O 205.5', prob: (p) => p?.basketballPredictions?.over205_5?.probability || 0 }
    ] },
  { key: 'bk_o195_o205_o215', label: 'O195+O205+O215', desc: 'Over 195.5, 205.5 ET 215.5 (min 45%)', color: 'rose', minProb: 45, multi: true,
    criteria: [
      { label: 'O 195.5', prob: (p) => p?.basketballPredictions?.over195_5?.probability || 0 },
      { label: 'O 205.5', prob: (p) => p?.basketballPredictions?.over205_5?.probability || 0 },
      { label: 'O 215.5', prob: (p) => p?.basketballPredictions?.over215_5?.probability || 0 }
    ] }
]

const volleyballCombines = [
  { key: 'vb_o25sets', label: 'O 2.5 Sets', desc: 'Plus de 2.5 sets (match en 4 ou 5 sets)', color: 'blue', minProb: 55,
    prob: (p) => p?.volleyballPredictions?.over2_5Sets?.probability || 0 },
  { key: 'vb_o35sets', label: 'O 3.5 Sets', desc: 'Plus de 3.5 sets (match en 4 ou 5 sets)', color: 'purple', minProb: 50,
    prob: (p) => p?.volleyballPredictions?.over3_5Sets?.probability || 0 },
  { key: 'vb_home', label: 'Victoire Dom.', desc: 'Victoire equipe domicile', color: 'emerald', minProb: 55,
    prob: (p) => p?.volleyballPredictions?.winner?.home || 0 },
  { key: 'vb_away', label: 'Victoire Ext.', desc: 'Victoire equipe exterieur', color: 'orange', minProb: 55,
    prob: (p) => p?.volleyballPredictions?.winner?.away || 0 },
  '_sep',
  { key: 'vb_o25_o35', label: 'O2.5+O3.5 Sets', desc: 'Over 2.5 ET Over 3.5 sets (min 50%)', color: 'cyan', minProb: 50, multi: true,
    criteria: [
      { label: 'O 2.5 Sets', prob: (p) => p?.volleyballPredictions?.over2_5Sets?.probability || 0 },
      { label: 'O 3.5 Sets', prob: (p) => p?.volleyballPredictions?.over3_5Sets?.probability || 0 }
    ] }
]

const tennisCombines = [
  { key: 'tn_home', label: 'Victoire J1', desc: 'Victoire joueur domicile', color: 'emerald', minProb: 60,
    prob: (p) => p?.mainPrediction?.probabilities?.home || 0 },
  { key: 'tn_away', label: 'Victoire J2', desc: 'Victoire joueur exterieur', color: 'orange', minProb: 60,
    prob: (p) => p?.mainPrediction?.probabilities?.away || 0 }
]

const genericCombines = [
  { key: 'gen_home', label: 'Victoire Dom.', desc: 'Victoire equipe domicile', color: 'emerald', minProb: 58,
    prob: (p) => p?.mainPrediction?.probabilities?.home || 0 },
  { key: 'gen_away', label: 'Victoire Ext.', desc: 'Victoire equipe exterieur', color: 'orange', minProb: 58,
    prob: (p) => p?.mainPrediction?.probabilities?.away || 0 }
]

const sportCombineMap = {
  football: footballCombines,
  basketball: basketballCombines,
  volleyball: volleyballCombines,
  tennis: tennisCombines,
  rugby: genericCombines,
  hockey: genericCombines,
  handball: genericCombines
}

export function getCombinesForSport(sportId) {
  return (sportCombineMap[sportId] || genericCombines).filter(c => c !== '_sep')
}

export function getCombinesForSportWithSeps(sportId) {
  return sportCombineMap[sportId] || genericCombines
}

export function getAllStatKeysForSport(sportId) {
  return getCombinesForSport(sportId).map(c => c.key)
}

export function getDefaultStatsForSport(sportId) {
  const keys = getAllStatKeysForSport(sportId)
  const stats = {}
  keys.forEach(k => { stats[k] = { total: 0, won: 0, lost: 0, pending: 0 } })
  return stats
}

export function getAllSportsWithCombines() {
  return Object.keys(sportCombineMap)
}

export function getCombineByKey(sportId, key) {
  return getCombinesForSport(sportId).find(c => c.key === key) || null
}

export function getSportIcon(sportId) {
  const icons = { football: '⚽', basketball: '🏀', volleyball: '🏐', tennis: '🎾', rugby: '🏉', hockey: '🏒', handball: '🤾' }
  return icons[sportId] || '🏆'
}

export const hasRecommendedFilter = {
  football: true,
  basketball: false,
  volleyball: false,
  tennis: false,
  rugby: false,
  hockey: false,
  handball: false
}
