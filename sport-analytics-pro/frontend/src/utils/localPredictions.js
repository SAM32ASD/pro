/**
 * Système de prédictions locales (sans appel API)
 * Basé sur des algorithmes statistiques simples
 * Adapté intelligemment selon l'état du match (à venir, en cours, terminé)
 */

/**
 * Déterminer le statut d'un match
 */
function getMatchStatus(match) {
  const status = match.status?.toUpperCase() || 'NS';

  // Match terminé
  const finishedStatuses = ['FT', 'AET', 'PEN', 'CANC', 'ABD', 'PST', 'AWD'];
  if (finishedStatuses.includes(status)) {
    return { isFinished: true, isLive: false, isPending: false, phase: 'finished' };
  }

  // Match en cours
  const liveStatuses = ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE'];
  if (liveStatuses.includes(status)) {
    let phase = 'unknown';
    if (['1H'].includes(status)) phase = 'firstHalf';
    else if (['HT'].includes(status)) phase = 'halftime';
    else if (['2H', 'ET', 'BT'].includes(status)) phase = 'secondHalf';
    else if (['P'].includes(status)) phase = 'penalties';

    return { isFinished: false, isLive: true, isPending: false, phase };
  }

  // Vérifier si le match est dans le passé (> 3h après l'heure prévue)
  if (match.date) {
    const matchTime = new Date(match.date).getTime();
    const now = Date.now();
    const hoursAgo = (now - matchTime) / (1000 * 60 * 60);

    // Si le match était prévu il y a plus de 3 heures et status = NS, c'est probablement terminé sans données
    if (hoursAgo > 3 && status === 'NS') {
      return { isFinished: true, isLive: false, isPending: false, phase: 'finished', noData: true };
    }
  }

  // Match à venir
  return { isFinished: false, isLive: false, isPending: true, phase: 'pending' };
}

/**
 * Générer une analyse pour un match terminé
 */
function generateFinishedMatchAnalysis(match, sport, matchStatus) {
  // Si pas de données disponibles (match passé mais pas de score)
  if (matchStatus.noData) {
    return {
      isFinished: true,
      noData: true,
      mainPrediction: {
        type: '1X2',
        prediction: '-',
        probabilities: { home: 0, draw: 0, away: 0 }
      },
      goalsPredictions: null,
      confidence: 0,
      reasoning: [
        '⚠️ Match terminé',
        '📊 Résultat non disponible',
        '🔍 Les données du match ne sont pas accessibles'
      ]
    };
  }

  const homeScore = match.score?.home ?? match.goals?.home ?? 0;
  const awayScore = match.score?.away ?? match.goals?.away ?? 0;
  const totalGoals = homeScore + awayScore;

  // Score mi-temps si disponible
  const htHome = match.score?.ht?.home ?? match.score?.halftime?.home ?? null;
  const htAway = match.score?.ht?.away ?? match.score?.halftime?.away ?? null;
  const htTotal = (htHome !== null && htAway !== null) ? htHome + htAway : null;

  // Analyse du résultat
  let winner = 'X';
  if (homeScore > awayScore) winner = '1';
  else if (awayScore > homeScore) winner = '2';

  const analysis = {
    isFinished: true,
    mainPrediction: {
      type: '1X2',
      prediction: winner,
      actual: `${homeScore}-${awayScore}`,
      probabilities: {
        home: homeScore > awayScore ? 100 : 0,
        draw: homeScore === awayScore ? 100 : 0,
        away: awayScore > homeScore ? 100 : 0
      }
    },
    goalsPredictions: sport === 'football' ? {
      expectedGoals: { total: totalGoals, firstHalf: htTotal ?? 0 },
      over05HT: {
        probability: 100,
        recommended: true,
        result: htTotal !== null ? (htTotal >= 1) : null
      },
      over05: {
        probability: 100,
        recommended: true,
        result: totalGoals >= 1
      },
      over15: {
        probability: 100,
        recommended: true,
        result: totalGoals >= 2
      },
      over25: {
        probability: 100,
        recommended: true,
        result: totalGoals >= 3
      },
      btts: {
        probability: 100,
        recommended: true,
        result: homeScore > 0 && awayScore > 0
      },
      goalFilter: {
        isRecommended: (htTotal !== null && htTotal >= 1) && (totalGoals >= 2),
        score: ((htTotal !== null && htTotal >= 1) && (totalGoals >= 2)) ? 100 : 0,
        message: '⚽ Match terminé - Résultat réel'
      }
    } : null,
    confidence: 100,
    reasoning: [
      `⚽ Match terminé: ${homeScore}-${awayScore}`,
      htTotal !== null ? `📊 Mi-temps: ${htHome}-${htAway}` : '📊 Score mi-temps non disponible',
      `🏆 Résultat: ${winner === '1' ? 'Victoire domicile' : winner === '2' ? 'Victoire extérieur' : 'Match nul'}`,
      `📈 Total buts: ${totalGoals}`
    ]
  };

  return analysis;
}

/**
 * Générer des prédictions pour un match en cours
 */
function generateLiveMatchPredictions(match, sport, matchStatus) {
  const homeScore = match.score?.home ?? match.goals?.home ?? 0;
  const awayScore = match.score?.away ?? match.goals?.away ?? 0;
  const totalGoals = homeScore + awayScore;

  // Score mi-temps si disponible
  const htHome = match.score?.ht?.home ?? match.score?.halftime?.home ?? null;
  const htAway = match.score?.ht?.away ?? match.score?.halftime?.away ?? null;
  const htTotal = (htHome !== null && htAway !== null) ? htHome + htAway : null;

  const phase = matchStatus.phase;

  // Prédictions ajustées selon la phase et le score actuel
  let goalsPredictions = null;

  if (sport === 'football') {
    // Prédictions mi-temps (invalides si déjà passée)
    const over05HTInvalid = ['halftime', 'secondHalf', 'penalties'].includes(phase);

    // Estimation buts restants
    const avgGoalsRemaining = phase === 'firstHalf' ? 1.5 : phase === 'secondHalf' ? 0.8 : 0;
    const estimatedFinalGoals = totalGoals + avgGoalsRemaining;

    // Résultats réels pour les prédictions
    const over05HTResult = htTotal !== null ? (htTotal >= 1) : null;
    const over15Result = totalGoals >= 2 ? true : null;
    const over25Result = totalGoals >= 3 ? true : null;
    const bttsResult = (homeScore > 0 && awayScore > 0) ? true : null;

    const over05Result = totalGoals >= 1 ? true : null;

    goalsPredictions = {
      expectedGoals: {
        total: parseFloat(estimatedFinalGoals.toFixed(1)),
        firstHalf: htTotal ?? 0
      },
      over05HT: {
        probability: htTotal !== null ? (htTotal >= 1 ? 100 : 0) : (totalGoals >= 1 ? 70 : 30),
        recommended: false,
        result: over05HTResult,
        isInvalid: over05HTInvalid && htTotal === null
      },
      over05: {
        probability: totalGoals >= 1 ? 100 : estimatedFinalGoals >= 1 ? 85 : 60,
        recommended: false,
        result: over05Result
      },
      over15: {
        probability: estimatedFinalGoals >= 2 ? 75 : estimatedFinalGoals >= 1.5 ? 60 : 30,
        recommended: false,
        result: over15Result
      },
      over25: {
        probability: estimatedFinalGoals >= 3 ? 65 : estimatedFinalGoals >= 2.5 ? 50 : 25,
        recommended: false,
        result: over25Result
      },
      btts: {
        probability: (homeScore > 0 && awayScore > 0) ? 100 : homeScore > 0 || awayScore > 0 ? 50 : 40,
        recommended: false,
        result: bttsResult
      },
      goalFilter: {
        isRecommended: over05HTResult && over15Result,
        score: (over05HTResult && over15Result) ? 100 : 0,
        message: `${over05HTResult && over15Result ? '✅ Filtre validé' : '❌ Filtre non validé'} (${homeScore}-${awayScore})`
      }
    };
  }

  // Prédiction 1X2 ajustée
  let winner = 'X';
  let homeProbLive = 33, drawProbLive = 33, awayProbLive = 33;

  if (homeScore > awayScore) {
    homeProbLive = phase === 'secondHalf' ? 70 : 55;
    drawProbLive = phase === 'secondHalf' ? 20 : 30;
    awayProbLive = phase === 'secondHalf' ? 10 : 15;
    winner = '1';
  } else if (awayScore > homeScore) {
    awayProbLive = phase === 'secondHalf' ? 70 : 55;
    drawProbLive = phase === 'secondHalf' ? 20 : 30;
    homeProbLive = phase === 'secondHalf' ? 10 : 15;
    winner = '2';
  } else {
    // Match nul
    if (phase === 'secondHalf') {
      drawProbLive = 50;
      homeProbLive = 25;
      awayProbLive = 25;
    }
    winner = 'X';
  }

  return {
    isLive: true,
    phase,
    currentScore: `${homeScore}-${awayScore}`,
    mainPrediction: {
      type: '1X2',
      prediction: winner,
      probabilities: {
        home: homeProbLive,
        draw: drawProbLive,
        away: awayProbLive
      }
    },
    goalsPredictions,
    confidence: 60,
    reasoning: [
      `🔴 Match en cours (${phase === 'firstHalf' ? '1ère' : phase === 'halftime' ? 'Mi-temps' : '2ème'} MT)`,
      `⚽ Score actuel: ${homeScore}-${awayScore}`,
      htTotal !== null ? `📊 Score mi-temps: ${htHome}-${htAway}` : '',
      `🎯 Prédictions ajustées selon le score en direct`
    ].filter(Boolean)
  };
}

/**
 * Générer des prédictions locales pour un match
 */
export function generateLocalPredictions(match, sport = 'football') {
  if (!match || !match.homeTeam || !match.awayTeam) {
    return null;
  }

  // Vérifier le statut du match
  const matchStatus = getMatchStatus(match);

  // Si match terminé, retourner les résultats réels
  if (matchStatus.isFinished) {
    return generateFinishedMatchAnalysis(match, sport, matchStatus);
  }

  // Si match en cours, ajuster les prédictions
  if (matchStatus.isLive) {
    return generateLiveMatchPredictions(match, sport, matchStatus);
  }

  // Vérifier si on a déjà des prédictions
  if (match.prediction) {
    return enhancePrediction(match.prediction, match, sport);
  }

  // Générer des prédictions pour match à venir
  const prediction = {
    mainPrediction: generateMainPrediction(match, sport),
    goalsPredictions: sport === 'football' ? generateGoalsPredictions(match) : null,
    basketballPredictions: sport === 'basketball' ? generateBasketballPredictions(match) : null,
    volleyballPredictions: sport === 'volleyball' ? generateVolleyballPredictions(match) : null,
    confidence: calculateConfidence(match),
    reasoning: generateReasoning(match, sport)
  };

  return prediction;
}

/**
 * Prédiction principale (1X2 ou Home/Away)
 */
function generateMainPrediction(match, sport) {
  // Facteurs pris en compte
  const homeAdvantage = 0.55; // 55% avantage domicile

  // Si on a des données de forme (exemple)
  let homeProbability = homeAdvantage;
  let awayProbability = 1 - homeAdvantage;

  // Ajuster selon le nom de l'équipe (top teams)
  const topTeams = [
    'Real Madrid', 'Barcelona', 'Manchester City', 'Liverpool', 'Bayern Munich',
    'PSG', 'Juventus', 'Chelsea', 'Arsenal', 'Manchester United',
    'Los Angeles Lakers', 'Golden State Warriors', 'Boston Celtics'
  ];

  const homeIsTop = topTeams.some(team => match.homeTeam.name?.includes(team));
  const awayIsTop = topTeams.some(team => match.awayTeam.name?.includes(team));

  if (homeIsTop && !awayIsTop) {
    homeProbability += 0.15;
  } else if (awayIsTop && !homeIsTop) {
    awayProbability += 0.15;
  }

  // Normaliser
  const total = homeProbability + awayProbability;
  homeProbability = (homeProbability / total) * 100;
  awayProbability = (awayProbability / total) * 100;

  if (sport === 'football') {
    const drawProbability = 25; // 25% de match nul en moyenne
    const adjustedHome = homeProbability * 0.75;
    const adjustedAway = awayProbability * 0.75;

    let prediction = 'X';
    if (adjustedHome > adjustedAway + 10) prediction = '1';
    else if (adjustedAway > adjustedHome + 10) prediction = '2';

    return {
      type: '1X2',
      prediction,
      probabilities: {
        home: Math.round(adjustedHome),
        draw: drawProbability,
        away: Math.round(adjustedAway)
      }
    };
  } else {
    return {
      type: 'Winner',
      prediction: homeProbability > awayProbability ? 'Home' : 'Away',
      probabilities: {
        home: Math.round(homeProbability),
        away: Math.round(awayProbability)
      }
    };
  }
}

/**
 * Prédictions de buts (football uniquement)
 */
function generateGoalsPredictions(match) {
  // Moyennes statistiques du football moderne
  const avgGoalsPerMatch = 2.7;
  const avgFirstHalfGoals = 1.15;

  // Ajuster selon la compétition
  let goalsFactor = 1.0;
  let confidence = 50;

  if (match.league?.name) {
    const leagueName = match.league.name.toLowerCase();
    const leagueCountry = match.league.country?.toLowerCase() || '';

    // Ligues européennes majeures (offensives)
    if (leagueName.includes('bundesliga')) { goalsFactor = 1.15; confidence = 70; }
    else if (leagueName.includes('premier league')) { goalsFactor = 1.10; confidence = 75; }
    else if (leagueName.includes('eredivisie')) { goalsFactor = 1.12; confidence = 65; }
    else if (leagueName.includes('champions league') || leagueName.includes('uefa champions')) { goalsFactor = 1.05; confidence = 80; }
    else if (leagueName.includes('ligue 1') && leagueCountry.includes('france')) { goalsFactor = 0.95; confidence = 70; }
    else if (leagueName.includes('serie a') && leagueCountry.includes('italy')) { goalsFactor = 0.90; confidence = 72; }
    else if (leagueName.includes('la liga') && leagueCountry.includes('spain')) { goalsFactor = 1.00; confidence = 75; }
    // Ligues américaines
    else if (leagueName.includes('mls')) { goalsFactor = 1.08; confidence = 62; }
    else if (leagueName.includes('nwsl')) { goalsFactor = 1.10; confidence = 58; }
    else if (leagueName.includes('liga mx')) { goalsFactor = 1.05; confidence = 60; }
    // Amérique du Sud - Première division
    else if ((leagueName.includes('serie a') || leagueName.includes('brasileiro')) && leagueCountry.includes('brazil')) {
      goalsFactor = 0.98; confidence = 65;
    }
    else if (leagueName.includes('liga profesional') && leagueCountry.includes('argentina')) {
      goalsFactor = 0.93; confidence = 63;
    }
    else if (leagueName.includes('primera') && leagueCountry.includes('chile')) {
      goalsFactor = 0.94; confidence = 58;
    }
    else if (leagueName.includes('primera') && leagueCountry.includes('uruguay')) {
      goalsFactor = 0.90; confidence = 57;
    }
    else if (leagueName.includes('liga pro') && leagueCountry.includes('ecuador')) {
      goalsFactor = 0.96; confidence = 55;
    }
    else if (leagueName.includes('primera') && leagueCountry.includes('peru')) {
      goalsFactor = 0.92; confidence = 54;
    }
    else if (leagueName.includes('primera') && leagueCountry.includes('colombia')) {
      goalsFactor = 0.95; confidence = 56;
    }
    // Divisions inférieures Sud-Amérique
    else if ((leagueName.includes('serie b') || leagueName.includes('serie c')) && leagueCountry.includes('brazil')) {
      goalsFactor = 0.88; confidence = 48;
    }
    else if (leagueName.includes('primera b')) {
      goalsFactor = 0.85; confidence = 45;
    }
    else if (leagueName.includes('segunda') || leagueName.includes('division 2')) {
      goalsFactor = 0.87; confidence = 47;
    }
    else if (leagueName.includes('intermedia')) {
      goalsFactor = 0.86; confidence = 46;
    }
    // Ligues exotiques/mineures
    else if (leagueCountry.includes('jamaica') || leagueCountry.includes('barbados') ||
             leagueCountry.includes('paraguay') || leagueCountry.includes('bolivia')) {
      goalsFactor = 0.82; confidence = 42;
    }
    else if (leagueName.includes('division di honor') || leagueCountry.includes('aruba') ||
             leagueCountry.includes('honduras')) {
      goalsFactor = 0.78; confidence = 38;
    }
    // MLS Next Pro et autres ligues de réserve
    else if (leagueName.includes('next pro') || leagueName.includes('expansión')) {
      goalsFactor = 0.95; confidence = 50;
    }
  }

  // Variation unique par match basée sur les IDs des équipes
  const teamIdHash = (match.homeTeam?.id || 0) + (match.awayTeam?.id || 0);
  const seed = teamIdHash % 100;
  const uniqueVariation = 0.92 + (seed / 500); // Variation entre 0.92 et 1.12

  const finalGoalsFactor = goalsFactor * uniqueVariation;
  const expectedGoals = avgGoalsPerMatch * finalGoalsFactor;
  const expectedHalfGoals = avgFirstHalfGoals * finalGoalsFactor;

  // Prédictions Over/Under avec calcul plus précis
  const over05Prob = Math.min(95, Math.max(55, Math.round(70 + (expectedGoals - 0.5) * 10)));
  const over15Prob = Math.min(85, Math.max(35, Math.round(50 + (expectedGoals - 1.5) * 15)));
  const over25Prob = Math.min(75, Math.max(25, Math.round(40 + (expectedGoals - 2.5) * 12)));
  const over05HT = Math.min(82, Math.max(40, Math.round(50 + (expectedHalfGoals - 0.5) * 25)));

  // BTTS (Both Teams To Score) - ajusté selon les buts attendus et la nature de la ligue
  const bttsBase = Math.min(70, Math.max(30, Math.round(40 + (expectedGoals - 2.0) * 10)));
  const bttsProb = confidence > 60 ? Math.min(bttsBase + 5, 70) : Math.max(bttsBase - 5, 30);

  return {
    expectedGoals: {
      total: parseFloat(expectedGoals.toFixed(1)),
      firstHalf: parseFloat(expectedHalfGoals.toFixed(1))
    },
    over05HT: {
      probability: over05HT,
      recommended: over05HT >= 60,
      result: null
    },
    over05: {
      probability: over05Prob,
      recommended: over05Prob >= 70,
      result: null
    },
    over15: {
      probability: over15Prob,
      recommended: over15Prob >= 65,
      result: null
    },
    over25: {
      probability: over25Prob,
      recommended: over25Prob >= 55,
      result: null
    },
    btts: {
      probability: bttsProb,
      recommended: bttsProb >= 55,
      result: null
    },
    goalFilter: {
      isRecommended: over05HT >= 62 && over15Prob >= 67 && over25Prob >= 45 && bttsProb >= 42,
      score: Math.round((over05HT * 0.3 + over15Prob * 0.3 + over25Prob * 0.25 + bttsProb * 0.15))
    }
  };
}

/**
 * Prédictions Basketball (points, total, spread)
 */
function generateBasketballPredictions(match) {
  const avgPointsPerGame = 215;
  const avgPointsPerTeam = 107.5;

  let pointsFactor = 1.0;
  let confidence = 50;

  if (match.league?.name) {
    const leagueName = match.league.name.toLowerCase();
    if (leagueName.includes('nba')) { pointsFactor = 1.05; confidence = 72; }
    else if (leagueName.includes('euroleague')) { pointsFactor = 0.78; confidence = 68; }
    else if (leagueName.includes('acb') || leagueName.includes('liga endesa')) { pointsFactor = 0.80; confidence = 60; }
    else if (leagueName.includes('ncaa')) { pointsFactor = 0.72; confidence = 55; }
    else if (leagueName.includes('nbl') || leagueName.includes('bbl')) { pointsFactor = 0.82; confidence = 52; }
    else if (leagueName.includes('lnb') || leagueName.includes('pro a')) { pointsFactor = 0.79; confidence = 55; }
    else if (leagueName.includes('serie a') || leagueName.includes('lega')) { pointsFactor = 0.77; confidence = 54; }
    else { pointsFactor = 0.80; confidence = 45; }
  }

  const teamIdHash = (match.homeTeam?.id || 0) + (match.awayTeam?.id || 0);
  const seed = teamIdHash % 100;
  const uniqueVariation = 0.94 + (seed / 400);

  const expectedTotal = Math.round(avgPointsPerGame * pointsFactor * uniqueVariation);
  const homeExpected = Math.round(avgPointsPerTeam * pointsFactor * uniqueVariation * 1.03);
  const awayExpected = Math.round(avgPointsPerTeam * pointsFactor * uniqueVariation * 0.97);
  const spread = homeExpected - awayExpected;

  const over195_5 = Math.min(85, Math.max(30, Math.round(50 + (expectedTotal - 195.5) * 0.8)));
  const over205_5 = Math.min(80, Math.max(25, Math.round(50 + (expectedTotal - 205.5) * 0.7)));
  const over215_5 = Math.min(75, Math.max(20, Math.round(50 + (expectedTotal - 215.5) * 0.6)));

  return {
    expectedPoints: { total: expectedTotal, home: homeExpected, away: awayExpected },
    spread: { value: spread > 0 ? -spread : Math.abs(spread), favorite: spread > 0 ? 'home' : 'away' },
    overUnder: {
      line: expectedTotal > 210 ? 215.5 : expectedTotal > 200 ? 205.5 : 195.5,
      overProb: expectedTotal > 210 ? over215_5 : expectedTotal > 200 ? over205_5 : over195_5,
    },
    over195_5: { probability: over195_5, recommended: over195_5 >= 60 },
    over205_5: { probability: over205_5, recommended: over205_5 >= 55 },
    over215_5: { probability: over215_5, recommended: over215_5 >= 50 },
    quarterAnalysis: {
      q1Expected: Math.round(expectedTotal * 0.25),
      q2Expected: Math.round(expectedTotal * 0.24),
      q3Expected: Math.round(expectedTotal * 0.26),
      q4Expected: Math.round(expectedTotal * 0.25),
    },
    confidence
  };
}

/**
 * Prédictions Volleyball (sets, points par set)
 */
function generateVolleyballPredictions(match) {
  const avgPointsPerSet = 47;
  let setsFactor = 1.0;
  let confidence = 50;

  if (match.league?.name) {
    const leagueName = match.league.name.toLowerCase();
    if (leagueName.includes('champions') || leagueName.includes('cev')) { setsFactor = 1.02; confidence = 65; }
    else if (leagueName.includes('nations league') || leagueName.includes('world')) { setsFactor = 1.0; confidence = 60; }
    else if (leagueName.includes('superliga') || leagueName.includes('serie a')) { setsFactor = 0.98; confidence = 55; }
    else { setsFactor = 0.96; confidence = 45; }
  }

  const teamIdHash = (match.homeTeam?.id || 0) + (match.awayTeam?.id || 0);
  const seed = teamIdHash % 100;
  const uniqueVariation = 0.95 + (seed / 500);

  const probs = {
    home: 55 + (seed % 15),
    away: 45 - (seed % 15) + 15,
  };
  const totalProb = probs.home + probs.away;
  probs.home = Math.round((probs.home / totalProb) * 100);
  probs.away = 100 - probs.home;

  const dominantWin = Math.max(probs.home, probs.away) >= 60;
  const sets3_0Prob = dominantWin ? Math.min(45, 25 + (Math.max(probs.home, probs.away) - 50) * 0.8) : 18;
  const sets3_1Prob = dominantWin ? 30 : 35;
  const sets3_2Prob = 100 - sets3_0Prob - sets3_1Prob;

  const expectedSets = (sets3_0Prob / 100) * 3 + (sets3_1Prob / 100) * 4 + (sets3_2Prob / 100) * 5;
  const expectedPointsPerSet = Math.round(avgPointsPerSet * setsFactor * uniqueVariation);

  const over2_5Sets = Math.min(85, Math.round(sets3_1Prob + sets3_2Prob));
  const over3_5Sets = Math.min(75, Math.round(sets3_2Prob + sets3_1Prob * 0.3));
  const overTotalPoints = Math.min(80, Math.max(30, Math.round(50 + (expectedPointsPerSet - 47) * 5)));

  return {
    expectedSets: parseFloat(expectedSets.toFixed(1)),
    expectedPointsPerSet,
    setScores: {
      '3-0': Math.round(sets3_0Prob),
      '3-1': Math.round(sets3_1Prob),
      '3-2': Math.round(sets3_2Prob),
    },
    over2_5Sets: { probability: over2_5Sets, recommended: over2_5Sets >= 55 },
    over3_5Sets: { probability: over3_5Sets, recommended: over3_5Sets >= 50 },
    overTotalPoints: {
      line: expectedPointsPerSet * Math.round(expectedSets),
      probability: overTotalPoints,
      recommended: overTotalPoints >= 55
    },
    winner: {
      home: probs.home,
      away: probs.away,
      prediction: probs.home >= probs.away ? 'home' : 'away'
    },
    confidence
  };
}

/**
 * Calculer la confiance globale (déterministe)
 */
function calculateConfidence(match) {
  let confidence = 50;

  const topTeams = ['Real Madrid', 'Barcelona', 'Manchester City', 'Bayern', 'PSG', 'Liverpool', 'Arsenal',
                    'Juventus', 'Inter', 'Milan', 'Atletico Madrid', 'Dortmund', 'Chelsea'];
  const hasTopTeam = topTeams.some(team =>
    match.homeTeam.name?.includes(team) || match.awayTeam.name?.includes(team)
  );

  if (hasTopTeam) confidence += 15;

  const majorLeagues = ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League', 'Europa League'];
  const isMajorLeague = majorLeagues.some(league =>
    match.league?.name?.includes(league)
  );

  if (isMajorLeague) confidence += 10;

  if (match.league?.name) {
    const leagueName = match.league.name.toLowerCase();
    if (leagueName.includes('mls') || leagueName.includes('liga mx')) confidence += 5;
    else if (leagueName.includes('segunda') || leagueName.includes('primera b') ||
             leagueName.includes('next pro') || leagueName.includes('expansión')) confidence -= 8;
    else if (leagueName.includes('division di honor') || leagueName.includes('liga nacional')) confidence -= 12;
  }

  const homeId = match.homeTeam?.id || 0;
  const awayId = match.awayTeam?.id || 0;
  const seed = ((homeId * 2654435761 + awayId * 40503) >>> 0) % 7;
  confidence += seed - 3;

  return Math.min(80, Math.max(45, confidence));
}

/**
 * Générer un raisonnement
 */
function generateReasoning(match, sport) {
  const reasons = [];

  // Avantage domicile
  reasons.push(`🏠 Avantage domicile pour ${match.homeTeam.name}`);

  // Ligue avec analyse
  if (match.league?.name) {
    const leagueName = match.league.name.toLowerCase();
    let leagueNote = '';

    if (leagueName.includes('bundesliga')) leagueNote = ' (ligue offensive)';
    else if (leagueName.includes('premier league')) leagueNote = ' (très compétitive)';
    else if (leagueName.includes('serie a')) leagueNote = ' (ligue défensive)';
    else if (leagueName.includes('mls') || leagueName.includes('liga mx')) leagueNote = ' (style offensif)';
    else if (leagueName.includes('primera b') || leagueName.includes('segunda')) leagueNote = ' (division inférieure)';
    else if (leagueName.includes('champions league')) leagueNote = ' (niveau élite)';

    reasons.push(`🏆 ${match.league.name}${leagueNote}`);
  }

  // Top teams
  const topTeams = ['Real Madrid', 'Barcelona', 'Manchester City', 'Bayern', 'PSG', 'Liverpool', 'Arsenal'];
  const homeIsTop = topTeams.some(team => match.homeTeam.name?.includes(team));
  const awayIsTop = topTeams.some(team => match.awayTeam.name?.includes(team));

  if (homeIsTop) {
    reasons.push(`⭐ ${match.homeTeam.name} équipe de haut niveau`);
  }
  if (awayIsTop) {
    reasons.push(`⭐ ${match.awayTeam.name} équipe de haut niveau`);
  }

  // Analyse du match
  if (sport === 'football' && match.league?.country) {
    const country = match.league.country.toLowerCase();
    if (country.includes('usa') || country.includes('mexico')) {
      reasons.push(`🌎 Championnat américain (style de jeu ouvert)`);
    } else if (country.includes('bolivia') || country.includes('uruguay') ||
               country.includes('colombia') || country.includes('chile')) {
      reasons.push(`🌎 Championnat sud-américain (jeu technique)`);
    }
  }

  return reasons;
}

/**
 * Enrichir une prédiction existante
 */
function enhancePrediction(existingPrediction, match, sport) {
  if (!existingPrediction) return generateLocalPredictions(match, sport);

  if (sport === 'football' && !existingPrediction.goalsPredictions) {
    existingPrediction.goalsPredictions = generateGoalsPredictions(match);
  }
  if (sport === 'basketball' && !existingPrediction.basketballPredictions) {
    existingPrediction.basketballPredictions = generateBasketballPredictions(match);
  }
  if (sport === 'volleyball' && !existingPrediction.volleyballPredictions) {
    existingPrediction.volleyballPredictions = generateVolleyballPredictions(match);
  }

  if (!existingPrediction.reasoning) {
    existingPrediction.reasoning = generateReasoning(match, sport);
  }

  return existingPrediction;
}

/**
 * Obtenir une recommandation rapide pour un match
 */
export function getQuickRecommendation(match, sport = 'football') {
  if (sport !== 'football') return null;

  const goalsPredictions = generateGoalsPredictions(match);

  if (!goalsPredictions) return null;

  return {
    isRecommended: goalsPredictions.goalFilter.isRecommended,
    score: goalsPredictions.goalFilter.score,
    message: goalsPredictions.goalFilter.isRecommended
      ? '✅ RECOMMANDÉ'
      : '❌ NON RECOMMANDÉ',
    criteria: {
      over05HT: goalsPredictions.over05HT,
      over15: goalsPredictions.over15
    }
  };
}

/**
 * Formater les prédictions pour l'affichage
 */
export function formatPredictionsForDisplay(predictions) {
  if (!predictions) return [];

  const formatted = [];

  // Prédiction principale
  if (predictions.mainPrediction) {
    formatted.push({
      type: predictions.mainPrediction.type,
      prediction: predictions.mainPrediction.prediction,
      confidence: predictions.confidence || 50,
      probabilities: predictions.mainPrediction.probabilities
    });
  }

  // Prédictions de buts
  if (predictions.goalsPredictions) {
    const goals = predictions.goalsPredictions;

    if (goals.over05HT) {
      formatted.push({
        type: 'Over 0.5 MT',
        prediction: goals.over05HT.recommended ? 'Oui' : 'Non',
        confidence: goals.over05HT.probability,
        isRecommended: goals.over05HT.recommended,
        result: goals.over05HT.result ?? null,
        isInvalid: goals.over05HT.isInvalid ?? false
      });
    }

    if (goals.over15) {
      formatted.push({
        type: 'Over 1.5',
        prediction: goals.over15.recommended ? 'Oui' : 'Non',
        confidence: goals.over15.probability,
        isRecommended: goals.over15.recommended,
        result: goals.over15.result ?? null,
        isInvalid: goals.over15.isInvalid ?? false
      });
    }

    if (goals.over25) {
      formatted.push({
        type: 'Over 2.5',
        prediction: goals.over25.recommended ? 'Oui' : 'Non',
        confidence: goals.over25.probability,
        isRecommended: goals.over25.recommended,
        result: goals.over25.result ?? null,
        isInvalid: goals.over25.isInvalid ?? false
      });
    }

    if (goals.btts) {
      formatted.push({
        type: 'BTTS',
        prediction: goals.btts.recommended ? 'Oui' : 'Non',
        confidence: goals.btts.probability,
        isRecommended: goals.btts.recommended,
        result: goals.btts.result ?? null,
        isInvalid: goals.btts.isInvalid ?? false
      });
    }
  }

  return formatted;
}
