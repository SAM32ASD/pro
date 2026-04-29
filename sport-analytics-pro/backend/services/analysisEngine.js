const unifiedDataService = require('./unifiedDataService');
const db = require('../config/database');
const predictionAlgorithms = require('./predictionAlgorithms');

class AnalysisEngine {
  
  async analyzeUpcomingMatch(homeTeamId, awayTeamId, sport, season) {
    try {
      // Récupérer les données
      const [homeLastMatches, awayLastMatches, h2hMatches] = await Promise.all([
        this.getTeamLastMatches(homeTeamId, sport, season, 12),
        this.getTeamLastMatches(awayTeamId, sport, season, 12),
        this.getH2HMatches(homeTeamId, awayTeamId, sport, season, 10)
      ]);

      // Calculer les formes
      const homeForm = this.calculateTeamForm(homeLastMatches, homeTeamId, sport);
      const awayForm = this.calculateTeamForm(awayLastMatches, awayTeamId, sport);
      const h2hStats = this.calculateH2HStats(h2hMatches, homeTeamId, awayTeamId, sport);

      // NOUVEAU: Calculer les patterns de buts (Over 0.5 MT + Over 1.5 match)
      const goalPatterns = this.calculateGoalPatterns(homeLastMatches, awayLastMatches, h2hMatches, homeTeamId, awayTeamId, sport);

      // Algorithmes avancés
      const advancedPredictions = await predictionAlgorithms.ensemblePrediction(
        homeTeamId, awayTeamId, sport
      );

      // Générer les pronostics classiques
      const classicPredictions = this.generateClassicPredictions(homeForm, awayForm, h2hStats, sport);

      // NOUVEAU: Ajouter les prédictions de buts mi-temps/match
      const goalPredictions = this.generateGoalPredictions(goalPatterns);

      // Combiner toutes les prédictions
      const allPredictions = [
        ...classicPredictions,
        ...goalPredictions,
        {
          type: 'advanced_ensemble',
          algorithm: advancedPredictions.algorithm,
          confidence: this.calculateAverageConfidence(classicPredictions),
          details: advancedPredictions
        }
      ];

      return {
        homeTeam: {
          id: homeTeamId,
          form: homeForm,
          lastMatches: homeLastMatches.slice(0, 5),
          goalPatterns: goalPatterns.home
        },
        awayTeam: {
          id: awayTeamId,
          form: awayForm,
          lastMatches: awayLastMatches.slice(0, 5),
          goalPatterns: goalPatterns.away
        },
        h2h: {
          matches: h2hMatches.slice(0, 5),
          stats: h2hStats,
          goalPatterns: goalPatterns.h2h
        },
        goalFilter: goalPatterns.filter, // NOUVEAU: Résultat du filtre
        predictions: allPredictions,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erreur analyse:', error);
      throw error;
    }
  }

  async getTeamLastMatches(teamId, sport, season, limit) {
    // Utiliser le service unifié (cache + TheSportsDB + API-Sports)
    return await unifiedDataService.getTeamLastMatches(teamId, sport, season, limit);
  }

  async getH2HMatches(teamA, teamB, sport, season, limit) {
    // Utiliser le service unifié (cache + API-Sports)
    return await unifiedDataService.getH2H(teamA, teamB, sport, limit);
  }

  calculateTeamForm(matches, teamId, sport) {
    if (!matches || matches.length === 0) return null;

    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;
    let formString = '';

    matches.forEach(match => {
      const isHome = match.teams.home.id === teamId;
      const homeScore = sport === 'football' ? match.goals.home : match.scores.home.total;
      const awayScore = sport === 'football' ? match.goals.away : match.scores.away.total;
      
      const teamScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;

      if (teamScore > oppScore) { wins++; formString += 'W'; }
      else if (teamScore === oppScore) { draws++; formString += 'D'; }
      else { losses++; formString += 'L'; }

      goalsFor += teamScore || 0;
      goalsAgainst += oppScore || 0;
    });

    const total = matches.length;
    
    return {
      matchesPlayed: total,
      wins, draws, losses,
      winRate: parseFloat(((wins / total) * 100).toFixed(1)),
      avgGoalsFor: parseFloat((goalsFor / total).toFixed(2)),
      avgGoalsAgainst: parseFloat((goalsAgainst / total).toFixed(2)),
      formString,
      currentStreak: formString[0]
    };
  }

  calculateH2HStats(matches, teamAId, teamBId, sport) {
    if (!matches || matches.length === 0) return null;

    let teamAWins = 0, teamBWins = 0, draws = 0;
    let goalsA = 0, goalsB = 0;

    matches.forEach(match => {
      const isAHome = match.teams.home.id === teamAId;
      const homeScore = sport === 'football' ? match.goals.home : match.scores.home.total;
      const awayScore = sport === 'football' ? match.goals.away : match.scores.away.total;
      
      const scoreA = isAHome ? homeScore : awayScore;
      const scoreB = isAHome ? awayScore : homeScore;

      if (scoreA > scoreB) teamAWins++;
      else if (scoreB > scoreA) teamBWins++;
      else draws++;

      goalsA += scoreA;
      goalsB += scoreB;
    });

    const total = matches.length;
    
    return {
      totalMatches: total,
      teamAWins, teamBWins, draws,
      teamAWinRate: ((teamAWins / total) * 100).toFixed(1),
      teamBWinRate: ((teamBWins / total) * 100).toFixed(1),
      drawRate: ((draws / total) * 100).toFixed(1),
      avgGoalsA: (goalsA / total).toFixed(2),
      avgGoalsB: (goalsB / total).toFixed(2),
      avgTotalGoals: ((goalsA + goalsB) / total).toFixed(2)
    };
  }

  // ============================================
  // NOUVEAU: CALCUL DES PATTERNS DE BUTS
  // ============================================
  
  calculateGoalPatterns(homeMatches, awayMatches, h2hMatches, homeTeamId, awayTeamId, sport) {
    if (sport !== 'football') return null; // Uniquement football pour l'instant

    const home = this.analyzeTeamGoalPatterns(homeMatches, homeTeamId, sport);
    const away = this.analyzeTeamGoalPatterns(awayMatches, awayTeamId, sport);
    const h2h = this.analyzeH2HGoalPatterns(h2hMatches, homeTeamId, awayTeamId, sport);

    // Calculer les probabilités combinées
    const firstHalfProb = this.calculateFirstHalfProbability(home, away, h2h);
    const matchProb = this.calculateMatchProbability(home, away, h2h);

    // Vérifier les critères du filtre
    const meetsFirstHalfCriteria = firstHalfProb.probability >= 60;
    const meetsMatchCriteria = matchProb.probability >= 65;
    const isRecommended = meetsFirstHalfCriteria && meetsMatchCriteria;

    return {
      home,
      away,
      h2h,
      filter: {
        isRecommended,
        recommendation: isRecommended ? '✅ RECOMMANDÉ' : '❌ NON RECOMMANDÉ',
        criteria: {
          firstHalfOver05: {
            met: meetsFirstHalfCriteria,
            probability: firstHalfProb.probability,
            confidence: firstHalfProb.confidence,
            description: 'Over 0.5 buts mi-temps'
          },
          matchOver15: {
            met: meetsMatchCriteria,
            probability: matchProb.probability,
            confidence: matchProb.confidence,
            description: 'Over 1.5 buts match'
          }
        },
        reasoning: this.generateFilterReasoning(home, away, h2h, isRecommended)
      }
    };
  }

  analyzeTeamGoalPatterns(matches, teamId, sport) {
    if (!matches || matches.length === 0) {
      return {
        matchesPlayed: 0,
        avgTotalGoals: 0,
        avgFirstHalfGoals: 0,
        over05HT: 0,
        over15Match: 0,
        over25Match: 0,
        bttsRate: 0,
        last5Form: ''
      };
    }

    let totalGoals = 0;
    let firstHalfGoals = 0;
    let over05HT = 0;
    let over15Match = 0;
    let over25Match = 0;
    let btts = 0;
    let last5Form = '';

    matches.forEach((match, index) => {
      const isHome = match.teams.home.id === teamId;
      const homeScore = match.goals?.home ?? 0;
      const awayScore = match.goals?.away ?? 0;
      const total = homeScore + awayScore;

      totalGoals += total;

      // Extraire les données de mi-temps depuis l'API
      const actualHT = match.score?.halftime;
      let htGoals;

      if (actualHT && typeof actualHT === 'object') {
        const htHome = actualHT.home ?? 0;
        const htAway = actualHT.away ?? 0;
        htGoals = htHome + htAway;
      } else {
        // Estimation statistique basée sur des données réelles
        // Environ 42-45% des buts tombent en première mi-temps
        htGoals = Math.round(total * 0.43);
      }

      firstHalfGoals += htGoals;
      if (htGoals >= 1) over05HT++;
      if (total >= 2) over15Match++;
      if (total >= 3) over25Match++;
      if (homeScore > 0 && awayScore > 0) btts++;

      // Forme des 5 derniers matchs
      if (index < 5) {
        if (htGoals >= 1) last5Form += '✓';
        else last5Form += '✗';
      }
    });

    const count = matches.length;

    return {
      matchesPlayed: count,
      avgTotalGoals: parseFloat((totalGoals / count).toFixed(2)),
      avgFirstHalfGoals: parseFloat((firstHalfGoals / count).toFixed(2)),
      over05HT: parseFloat(((over05HT / count) * 100).toFixed(1)),
      over15Match: parseFloat(((over15Match / count) * 100).toFixed(1)),
      over25Match: parseFloat(((over25Match / count) * 100).toFixed(1)),
      bttsRate: parseFloat(((btts / count) * 100).toFixed(1)),
      last5Form
    };
  }

  analyzeH2HGoalPatterns(matches, teamAId, teamBId, sport) {
    if (!matches || matches.length === 0) {
      return {
        matchesPlayed: 0,
        avgTotalGoals: 0,
        avgFirstHalfGoals: 0,
        over05HT: 0,
        over15Match: 0,
        over25Match: 0,
        bttsRate: 0,
        recentForm: ''
      };
    }

    let totalGoals = 0;
    let firstHalfGoals = 0;
    let over05HT = 0;
    let over15Match = 0;
    let over25Match = 0;
    let btts = 0;
    let recentForm = '';

    matches.forEach((match, index) => {
      const homeScore = match.goals?.home ?? 0;
      const awayScore = match.goals?.away ?? 0;
      const total = homeScore + awayScore;

      totalGoals += total;

      // Extraction des données de mi-temps
      const actualHT = match.score?.halftime;
      let htGoals;

      if (actualHT && typeof actualHT === 'object') {
        const htHome = actualHT.home ?? 0;
        const htAway = actualHT.away ?? 0;
        htGoals = htHome + htAway;
      } else {
        htGoals = Math.round(total * 0.43);
      }

      firstHalfGoals += htGoals;
      if (htGoals >= 1) over05HT++;
      if (total >= 2) over15Match++;
      if (total >= 3) over25Match++;
      if (homeScore > 0 && awayScore > 0) btts++;

      // Forme récente (5 dernières confrontations)
      if (index < 5) {
        if (total >= 2) recentForm += '🔥';
        else if (total === 1) recentForm += '⚡';
        else recentForm += '❄️';
      }
    });

    const count = matches.length;

    return {
      matchesPlayed: count,
      avgTotalGoals: parseFloat((totalGoals / count).toFixed(2)),
      avgFirstHalfGoals: parseFloat((firstHalfGoals / count).toFixed(2)),
      over05HT: parseFloat(((over05HT / count) * 100).toFixed(1)),
      over15Match: parseFloat(((over15Match / count) * 100).toFixed(1)),
      over25Match: parseFloat(((over25Match / count) * 100).toFixed(1)),
      bttsRate: parseFloat(((btts / count) * 100).toFixed(1)),
      recentForm
    };
  }

  calculateFirstHalfProbability(home, away, h2h) {
    // Pondération améliorée: 35% domicile, 35% extérieur, 30% H2H
    const homeWeight = parseFloat(home.over05HT) * 0.35;
    const awayWeight = parseFloat(away.over05HT) * 0.35;

    // Si moins de 3 confrontations H2H, utiliser la moyenne des deux équipes
    const h2hWeight = h2h.matchesPlayed >= 3
      ? parseFloat(h2h.over05HT) * 0.30
      : ((parseFloat(home.over05HT) + parseFloat(away.over05HT)) / 2) * 0.30;

    const probability = Math.min(98, homeWeight + awayWeight + h2hWeight);

    return {
      probability: parseFloat(probability.toFixed(1)),
      confidence: probability >= 75 ? 'high' : probability >= 60 ? 'medium' : 'low',
      breakdown: {
        home: parseFloat(home.over05HT),
        away: parseFloat(away.over05HT),
        h2h: h2h.matchesPlayed >= 3 ? parseFloat(h2h.over05HT) : null
      }
    };
  }

  calculateMatchProbability(home, away, h2h) {
    // Pondération équilibrée: 35% domicile, 35% extérieur, 30% H2H
    const homeWeight = parseFloat(home.over15Match) * 0.35;
    const awayWeight = parseFloat(away.over15Match) * 0.35;

    // Si moins de 3 confrontations H2H, utiliser la moyenne des deux équipes
    const h2hWeight = h2h.matchesPlayed >= 3
      ? parseFloat(h2h.over15Match) * 0.30
      : ((parseFloat(home.over15Match) + parseFloat(away.over15Match)) / 2) * 0.30;

    const probability = Math.min(98, homeWeight + awayWeight + h2hWeight);

    return {
      probability: parseFloat(probability.toFixed(1)),
      confidence: probability >= 75 ? 'high' : probability >= 65 ? 'medium' : 'low',
      breakdown: {
        home: parseFloat(home.over15Match),
        away: parseFloat(away.over15Match),
        h2h: h2h.matchesPlayed >= 3 ? parseFloat(h2h.over15Match) : null
      }
    };
  }

  generateFilterReasoning(home, away, h2h, isRecommended) {
    const reasons = [];

    if (isRecommended) {
      reasons.push(`✅ ${home.over05HT}% des matchs de l'équipe à domicile ont vu un but en première mi-temps`);
      reasons.push(`✅ ${away.over15Match}% des matchs de l'équipe à l'extérieur ont dépassé 1.5 buts`);
      if (h2h.matchesPlayed > 0) {
        reasons.push(`✅ Historique H2H: ${h2h.avgTotalGoals} buts/match en moyenne (${h2h.matchesPlayed} confrontations)`);
      }
      if (parseFloat(h2h.bttsRate) > 50) {
        reasons.push(`✅ Les deux équipes marquent dans ${h2h.bttsRate}% des confrontations directes`);
      }
    } else {
      if (parseFloat(home.over05HT) < 50) {
        reasons.push(`❌ Faible activité en première mi-temps à domicile (${home.over05HT}%)`);
      }
      if (parseFloat(away.over15Match) < 50) {
        reasons.push(`❌ L'équipe à l'extérieur marque peu (${away.avgTotalGoals} buts/match)`);
      }
      if (h2h.matchesPlayed > 0 && parseFloat(h2h.over15Match) < 50) {
        reasons.push(`❌ Historique H2H peu prolifique (${h2h.over15Match}% over 1.5)`);
      }
      if (parseFloat(home.over05HT) >= 50 && parseFloat(away.over15Match) >= 50) {
        reasons.push(`ℹ️ Proche du seuil - Surveillez les compositions d'équipe`);
      }
    }

    return reasons;
  }

  generateGoalPredictions(goalPatterns) {
    if (!goalPatterns) return [];

    const { filter, home, away, h2h } = goalPatterns;
    const predictions = [];

    // Over 0.5 mi-temps
    predictions.push({
      type: 'over_under_first_half',
      prediction: filter.criteria.firstHalfOver05.met ? 'over_0.5_ht' : 'under_0.5_ht',
      confidence: filter.criteria.firstHalfOver05.probability,
      odds: filter.criteria.firstHalfOver05.met ? 1.75 : 2.10, // Estimation
      reasoning: `Domicile: ${home.over05HT}% | Extérieur: ${away.over05HT}% | H2H: ${h2h.over05HT}%`,
      isRecommended: filter.criteria.firstHalfOver05.met
    });

    // Over 1.5 match
    predictions.push({
      type: 'over_under_match',
      prediction: filter.criteria.matchOver15.met ? 'over_1.5' : 'under_1.5',
      confidence: filter.criteria.matchOver15.probability,
      odds: filter.criteria.matchOver15.met ? 1.35 : 3.20,
      reasoning: `Domicile: ${home.over15Match}% | Extérieur: ${away.over15Match}% | H2H: ${h2h.over15Match}%`,
      isRecommended: filter.criteria.matchOver15.met
    });

    // Over 2.5 match (bonus)
    const over25Prob = (parseFloat(home.over25Match) + parseFloat(away.over25Match)) / 2;
    predictions.push({
      type: 'over_under_match_25',
      prediction: over25Prob >= 50 ? 'over_2.5' : 'under_2.5',
      confidence: parseFloat(over25Prob.toFixed(1)),
      odds: over25Prob >= 50 ? 1.95 : 1.85,
      reasoning: `Moyenne combinée: ${over25Prob.toFixed(1)}%`,
      isRecommended: over25Prob >= 55
    });

    // BTTS
    const bttsProb = h2h.matchesPlayed > 2 ? parseFloat(h2h.bttsRate) : (parseFloat(home.bttsRate) + parseFloat(away.bttsRate)) / 2;
    predictions.push({
      type: 'btts',
      prediction: bttsProb >= 50 ? 'yes' : 'no',
      confidence: parseFloat(bttsProb.toFixed(1)),
      odds: bttsProb >= 50 ? 1.85 : 1.95,
      reasoning: `H2H BTTS: ${h2h.bttsRate}%`,
      isRecommended: bttsProb >= 55
    });

    return predictions;
  }

  generateClassicPredictions(home, away, h2h, sport) {
    const predictions = [];
    
    if (sport === 'football') {
      // 1X2
      const homeAdv = home.winRate * 0.6 + (h2h ? parseFloat(h2h.teamAWinRate) * 0.4 : 0);
      const awayAdv = away.winRate * 0.6 + (h2h ? parseFloat(h2h.teamBWinRate) * 0.4 : 0);
      
      let winner, confidence;
      if (homeAdv > awayAdv + 15) { winner = '1'; confidence = Math.min(85, homeAdv); }
      else if (awayAdv > homeAdv + 15) { winner = '2'; confidence = Math.min(85, awayAdv); }
      else { winner = 'X'; confidence = 45; }

      predictions.push({
        type: '1X2',
        prediction: winner,
        confidence: parseFloat(confidence.toFixed(1)),
        reasoning: `Avantage domicile: ${(homeAdv - awayAdv).toFixed(1)}%`
      });

      // Double Chance
      predictions.push({
        type: 'double_chance',
        prediction: winner === '1' ? '1X' : winner === '2' ? 'X2' : '12',
        confidence: Math.min(90, confidence + 10),
        reasoning: 'Couverture risque'
      });

    } else {
      // Basketball
      const homePoints = home.avgGoalsFor * 4;
      const awayPoints = away.avgGoalsFor * 4;
      const spread = Math.round((homePoints - awayPoints) / 2);

      predictions.push({
        type: 'winner_spread',
        prediction: spread > 0 ? 'home' : 'away',
        spread: Math.abs(spread),
        confidence: 65,
        reasoning: `Différence estimée: ${Math.abs(spread)} points`
      });
    }

    return predictions;
  }

  calculateAverageConfidence(predictions) {
    if (predictions.length === 0) return 0;
    const sum = predictions.reduce((acc, p) => acc + p.confidence, 0);
    return parseFloat((sum / predictions.length).toFixed(1));
  }
}

module.exports = new AnalysisEngine();