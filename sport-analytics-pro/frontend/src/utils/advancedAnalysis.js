/**
 * Système d'analyse avancée pour les matchs
 * Combine 3 approches :
 * 1. Algorithme de recommandation amélioré
 * 2. Critères de qualité multi-facteurs
 * 3. Score de confiance détaillé
 *
 * ⚠️ Important : N'élimine AUCUN match, ajoute seulement des indicateurs
 */

/**
 * Calculer le score de qualité d'un match (0-100)
 * Plus le score est élevé, plus le match a de potentiel
 */
export function calculateMatchQualityScore(match, predictions) {
  if (!match || !predictions) return 0;

  let score = 0;
  const factors = [];

  // 1. Confiance des prédictions (0-25 points)
  const confidence = predictions.confidence || 0;
  const confidenceScore = Math.min(25, (confidence / 100) * 25);
  score += confidenceScore;
  factors.push({
    name: 'Confiance prédiction',
    score: confidenceScore,
    max: 25,
    percentage: Math.round((confidenceScore / 25) * 100)
  });

  // 2. Qualité des données (0-15 points)
  let dataQuality = 0;
  if (match.homeTeam?.logo) dataQuality += 5;
  if (match.awayTeam?.logo) dataQuality += 5;
  if (match.league?.logo) dataQuality += 5;
  score += dataQuality;
  factors.push({
    name: 'Qualité données',
    score: dataQuality,
    max: 15,
    percentage: Math.round((dataQuality / 15) * 100)
  });

  // 3. Niveau de la compétition (0-20 points)
  const leagueTiers = {
    // Top tier (20 points)
    'UEFA Champions League': 20,
    'Premier League': 20,
    'La Liga': 20,
    'Serie A': 20,
    'Bundesliga': 20,
    'Ligue 1': 20,
    'NBA': 20,
    'EuroLeague': 20,

    // High tier (15 points)
    'Europa League': 15,
    'Championship': 15,
    'Segunda Division': 15,
    'Serie B': 15,
    'Bundesliga 2': 15,
    'Ligue 2': 15,

    // Mid tier (10 points)
    'League One': 10,
    'League Two': 10,
    'Eredivisie': 10,
    'Liga Portugal': 10,

    // Default (5 points)
    'default': 5
  };

  let leagueScore = leagueTiers[match.league?.name] || leagueTiers.default;
  score += leagueScore;
  factors.push({
    name: 'Niveau compétition',
    score: leagueScore,
    max: 20,
    percentage: Math.round((leagueScore / 20) * 100)
  });

  // 4. Équilibrage du match (0-15 points)
  // Match équilibré = plus intéressant pour paris
  let balanceScore = 0;
  if (predictions.mainPrediction?.probabilities) {
    const probs = predictions.mainPrediction.probabilities;
    const homeProb = probs.home || 0;
    const awayProb = probs.away || 0;
    const diff = Math.abs(homeProb - awayProb);

    // Match équilibré (diff < 20%) = meilleur score
    if (diff < 10) balanceScore = 15;
    else if (diff < 20) balanceScore = 12;
    else if (diff < 30) balanceScore = 8;
    else if (diff < 40) balanceScore = 5;
    else balanceScore = 2;
  }
  score += balanceScore;
  factors.push({
    name: 'Équilibre match',
    score: balanceScore,
    max: 15,
    percentage: Math.round((balanceScore / 15) * 100)
  });

  // 5. Potentiel scoring (adapté par sport)
  let scoringScore = 0;
  let scoringLabel = 'Potentiel scoring';

  if (predictions.goalsPredictions?.expectedGoals?.total) {
    scoringLabel = 'Potentiel buts';
    const expectedGoals = predictions.goalsPredictions.expectedGoals.total;
    if (expectedGoals >= 3.5) scoringScore = 15;
    else if (expectedGoals >= 2.5) scoringScore = 12;
    else if (expectedGoals >= 1.5) scoringScore = 8;
    else scoringScore = 3;
  } else if (predictions.basketballPredictions?.expectedPoints?.total) {
    scoringLabel = 'Potentiel points';
    const expectedPts = predictions.basketballPredictions.expectedPoints.total;
    if (expectedPts >= 220) scoringScore = 15;
    else if (expectedPts >= 210) scoringScore = 12;
    else if (expectedPts >= 195) scoringScore = 8;
    else scoringScore = 3;
  } else if (predictions.volleyballPredictions?.expectedSets) {
    scoringLabel = 'Potentiel sets';
    const expectedSets = predictions.volleyballPredictions.expectedSets;
    if (expectedSets >= 4.5) scoringScore = 15;
    else if (expectedSets >= 4) scoringScore = 12;
    else if (expectedSets >= 3.5) scoringScore = 8;
    else scoringScore = 5;
  }
  score += scoringScore;
  factors.push({
    name: scoringLabel,
    score: scoringScore,
    max: 15,
    percentage: Math.round((scoringScore / 15) * 100)
  });

  // 6. Timing du match (0-10 points)
  // Match bientôt = plus pertinent
  let timingScore = 0;
  if (match.date) {
    const matchTime = new Date(match.date).getTime();
    const now = Date.now();
    const hoursUntil = (matchTime - now) / (1000 * 60 * 60);

    if (hoursUntil < 0) {
      // Match en cours = excellent
      timingScore = 10;
    } else if (hoursUntil < 2) {
      // Dans 2h = très bon
      timingScore = 9;
    } else if (hoursUntil < 6) {
      // Dans 6h = bon
      timingScore = 7;
    } else if (hoursUntil < 24) {
      // Aujourd'hui = correct
      timingScore = 5;
    } else {
      // Plus tard = moins pertinent
      timingScore = 2;
    }
  }
  score += timingScore;
  factors.push({
    name: 'Timing',
    score: timingScore,
    max: 10,
    percentage: Math.round((timingScore / 10) * 100)
  });

  return {
    total: Math.round(score),
    max: 100,
    percentage: Math.round(score),
    factors,
    grade: getGrade(score)
  };
}

/**
 * Obtenir la note (A+, A, B, C, D, E) selon le score
 */
function getGrade(score) {
  if (score >= 90) return { grade: 'A+', label: 'Excellent', color: 'emerald' };
  if (score >= 80) return { grade: 'A', label: 'Très bon', color: 'green' };
  if (score >= 70) return { grade: 'B', label: 'Bon', color: 'blue' };
  if (score >= 60) return { grade: 'C', label: 'Moyen', color: 'yellow' };
  if (score >= 50) return { grade: 'D', label: 'Faible', color: 'orange' };
  return { grade: 'E', label: 'Très faible', color: 'red' };
}

/**
 * Analyser les critères individuels d'un match
 */
export function analyzeMatchCriteria(match, predictions) {
  const criteria = {
    // Confiance générale
    overallConfidence: {
      value: predictions?.confidence || 0,
      label: 'Confiance globale',
      status: getConfidenceStatus(predictions?.confidence || 0),
      icon: '📊'
    },

    // Avantage domicile
    homeAdvantage: {
      value: calculateHomeAdvantage(match, predictions),
      label: 'Avantage domicile',
      status: null,
      icon: '🏠'
    },

    teamForm: {
      home: {
        value: calculateTeamFormScore(match, 'home', predictions),
        label: match.homeTeam?.name || 'Domicile',
        icon: '📈'
      },
      away: {
        value: calculateTeamFormScore(match, 'away', predictions),
        label: match.awayTeam?.name || 'Extérieur',
        icon: '📉'
      }
    },

    headToHead: {
      value: calculateH2HScore(predictions),
      label: 'Confrontations directes',
      lastResults: '-',
      icon: '⚔️'
    },

    scoring: getScoringCriteria(match, predictions),

    // Niveau de la ligue
    leagueLevel: {
      value: getLeagueTier(match.league?.name),
      label: match.league?.name || 'Compétition',
      country: match.league?.country,
      icon: '🏆'
    },

    // Météo/Conditions (simulé - à implémenter si API météo)
    conditions: {
      value: 'Bonnes',
      label: 'Conditions de jeu',
      icon: '🌤️'
    }
  };

  return criteria;
}

/**
 * Calculer le score de forme d'une équipe basé sur les prédictions disponibles
 */
function calculateTeamFormScore(match, side, predictions) {
  const probs = predictions?.mainPrediction?.probabilities;
  if (!probs) {
    const homeId = match.homeTeam?.id || 0;
    const awayId = match.awayTeam?.id || 0;
    const seed = ((homeId * 2654435761 + awayId * 40503) >>> 0) % 30;
    return side === 'home' ? 55 + seed % 20 : 50 + seed % 20;
  }
  const teamProb = side === 'home' ? (probs.home || 33) : (probs.away || 33);
  return Math.min(95, Math.max(30, Math.round(teamProb * 1.3)));
}

/**
 * Calculer le score H2H basé sur l'équilibre des prédictions
 */
function calculateH2HScore(predictions) {
  const probs = predictions?.mainPrediction?.probabilities;
  if (!probs) return 50;
  const diff = Math.abs((probs.home || 33) - (probs.away || 33));
  return Math.max(20, Math.round(80 - diff));
}

/**
 * Calculer l'avantage domicile
 */
function calculateHomeAdvantage(match, predictions) {
  const probs = predictions?.mainPrediction?.probabilities;
  if (!probs) return 55; // Valeur par défaut

  const homeProb = probs.home || 0;
  const awayProb = probs.away || 0;

  // Convertir en pourcentage d'avantage
  if (homeProb > awayProb) {
    return Math.min(100, 50 + ((homeProb - awayProb) / 2));
  } else {
    return Math.max(0, 50 - ((awayProb - homeProb) / 2));
  }
}

/**
 * Critères de scoring adaptés au sport
 */
function getScoringCriteria(match, predictions) {
  const sport = match.sport || 'football';
  if (sport === 'basketball' && predictions?.basketballPredictions) {
    const bp = predictions.basketballPredictions;
    return {
      value: bp.expectedPoints?.total || 210,
      label: 'Points attendus',
      status: getPointsExpectationStatus(bp.expectedPoints?.total || 210),
      icon: '🏀'
    };
  }
  if (sport === 'volleyball' && predictions?.volleyballPredictions) {
    const vp = predictions.volleyballPredictions;
    return {
      value: vp.expectedSets || 4,
      label: 'Sets attendus',
      status: getSetsExpectationStatus(vp.expectedSets || 4),
      icon: '🏐'
    };
  }
  return {
    value: predictions?.goalsPredictions?.expectedGoals?.total || 2.5,
    label: 'Buts attendus',
    status: getGoalsExpectationStatus(predictions?.goalsPredictions?.expectedGoals?.total || 2.5),
    icon: '⚽'
  };
}

function getPointsExpectationStatus(points) {
  if (points >= 220) return { label: 'Très élevé', color: 'emerald' };
  if (points >= 210) return { label: 'Élevé', color: 'green' };
  if (points >= 195) return { label: 'Moyen', color: 'yellow' };
  return { label: 'Faible', color: 'orange' };
}

function getSetsExpectationStatus(sets) {
  if (sets >= 4.5) return { label: 'Match long', color: 'emerald' };
  if (sets >= 4) return { label: 'Match serré', color: 'green' };
  if (sets >= 3.5) return { label: 'Normal', color: 'yellow' };
  return { label: 'Match rapide', color: 'orange' };
}

/**
 * Status de confiance
 */
function getConfidenceStatus(confidence) {
  if (confidence >= 80) return { label: 'Très élevée', color: 'emerald' };
  if (confidence >= 70) return { label: 'Élevée', color: 'green' };
  if (confidence >= 60) return { label: 'Bonne', color: 'blue' };
  if (confidence >= 50) return { label: 'Moyenne', color: 'yellow' };
  if (confidence >= 40) return { label: 'Faible', color: 'orange' };
  return { label: 'Très faible', color: 'red' };
}

/**
 * Status des buts attendus
 */
function getGoalsExpectationStatus(goals) {
  if (goals >= 3.5) return { label: 'Très élevé', color: 'emerald' };
  if (goals >= 2.5) return { label: 'Élevé', color: 'green' };
  if (goals >= 1.5) return { label: 'Moyen', color: 'yellow' };
  return { label: 'Faible', color: 'orange' };
}

/**
 * Tier de la ligue
 */
function getLeagueTier(leagueName) {
  const topLeagues = ['UEFA Champions League', 'Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'NBA'];
  const highLeagues = ['Europa League', 'Championship', 'Liga Portugal', 'Eredivisie'];

  if (topLeagues.some(l => leagueName?.includes(l))) return { tier: 1, label: 'Top' };
  if (highLeagues.some(l => leagueName?.includes(l))) return { tier: 2, label: 'Haut niveau' };
  return { tier: 3, label: 'Standard' };
}

/**
 * Générer des recommandations personnalisées
 */
export function generateRecommendations(match, predictions, qualityScore) {
  const recommendations = [];

  // Recommandation basée sur le score global
  if (qualityScore.percentage >= 80) {
    recommendations.push({
      type: 'highlight',
      icon: '⭐',
      title: 'Match à fort potentiel',
      description: `Score de qualité : ${qualityScore.percentage}/100 (${qualityScore.grade.label})`,
      priority: 'high'
    });
  }

  // Recommandation basée sur la confiance
  if (predictions?.confidence >= 75) {
    recommendations.push({
      type: 'confidence',
      icon: '🎯',
      title: 'Haute confiance',
      description: `Confiance de ${predictions.confidence}% sur le pronostic`,
      priority: 'high'
    });
  }

  // Recommandation basée sur le scoring (adapté par sport)
  if (predictions?.goalsPredictions?.expectedGoals?.total >= 3) {
    recommendations.push({
      type: 'goals',
      icon: '⚽',
      title: 'Match à buts',
      description: `${predictions.goalsPredictions.expectedGoals.total} buts attendus`,
      priority: 'medium'
    });
  }
  if (predictions?.basketballPredictions?.expectedPoints?.total >= 215) {
    recommendations.push({
      type: 'points',
      icon: '🏀',
      title: 'Match à gros score',
      description: `${predictions.basketballPredictions.expectedPoints.total} points attendus`,
      priority: 'medium'
    });
  }
  if (predictions?.volleyballPredictions?.expectedSets >= 4.3) {
    recommendations.push({
      type: 'sets',
      icon: '🏐',
      title: 'Match serré attendu',
      description: `${predictions.volleyballPredictions.expectedSets} sets attendus`,
      priority: 'medium'
    });
  }

  // Recommandation sur le filtre de buts (football)
  if (predictions?.goalsPredictions?.goalFilter?.isRecommended) {
    recommendations.push({
      type: 'filter',
      icon: '✅',
      title: 'Filtre validé',
      description: 'Over 0.5 MT + Over 1.5 Match',
      priority: 'high'
    });
  }

  // Recommandation match équilibré
  const probs = predictions?.mainPrediction?.probabilities;
  if (probs) {
    const diff = Math.abs((probs.home || 0) - (probs.away || 0));
    if (diff < 15) {
      recommendations.push({
        type: 'balanced',
        icon: '⚖️',
        title: 'Match équilibré',
        description: 'Pronostic ouvert, match incertain',
        priority: 'medium'
      });
    }
  }

  // Recommandation timing
  if (match.date) {
    const hoursUntil = (new Date(match.date).getTime() - Date.now()) / (1000 * 60 * 60);
    if (hoursUntil < 2 && hoursUntil > 0) {
      recommendations.push({
        type: 'timing',
        icon: '⏰',
        title: 'Commence bientôt',
        description: `Dans ${Math.round(hoursUntil * 60)} minutes`,
        priority: 'high'
      });
    }
  }

  // Recommandation ligue de haut niveau
  const leagueTier = getLeagueTier(match.league?.name);
  if (leagueTier.tier === 1) {
    recommendations.push({
      type: 'league',
      icon: '🏆',
      title: 'Compétition majeure',
      description: match.league?.name,
      priority: 'medium'
    });
  }

  return recommendations;
}

/**
 * Calculer un score de "value bet" (rapport cote/probabilité)
 * Note: Nécessite les cotes réelles pour être précis
 */
export function calculateValueBet(predictions, odds = null) {
  if (!predictions?.mainPrediction?.probabilities || !odds) {
    return null;
  }

  const probs = predictions.mainPrediction.probabilities;

  // Convertir probabilités en cotes théoriques
  const theoreticalOdds = {
    home: probs.home > 0 ? (100 / probs.home).toFixed(2) : null,
    draw: probs.draw > 0 ? (100 / probs.draw).toFixed(2) : null,
    away: probs.away > 0 ? (100 / probs.away).toFixed(2) : null
  };

  // Si on a les vraies cotes, calculer la value
  if (odds) {
    const homeValue = odds.home > theoreticalOdds.home ?
      ((odds.home / theoreticalOdds.home - 1) * 100).toFixed(1) : null;

    const drawValue = odds.draw > theoreticalOdds.draw ?
      ((odds.draw / theoreticalOdds.draw - 1) * 100).toFixed(1) : null;

    const awayValue = odds.away > theoreticalOdds.away ?
      ((odds.away / theoreticalOdds.away - 1) * 100).toFixed(1) : null;

    return {
      theoreticalOdds,
      actualOdds: odds,
      value: {
        home: homeValue,
        draw: drawValue,
        away: awayValue
      },
      bestValue: Math.max(
        parseFloat(homeValue || 0),
        parseFloat(drawValue || 0),
        parseFloat(awayValue || 0)
      )
    };
  }

  return { theoreticalOdds };
}

export default {
  calculateMatchQualityScore,
  analyzeMatchCriteria,
  generateRecommendations,
  calculateValueBet
};
