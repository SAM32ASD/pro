const db = require('../config/database');

class AdvancedFilters {
  
  /**
   * Analyse les patterns de buts mi-temps / match complet
   */
  async analyzeGoalPatterns(teamId, opponentId, sport = 'football') {
    const teamStats = await this.getTeamGoalPatterns(teamId, sport);
    const h2hStats = await this.getH2HGoalPatterns(teamId, opponentId, sport);
    
    return {
      firstHalfOver05: this.calculateFirstHalfProbability(teamStats, h2hStats),
      matchOver15: this.calculateMatchProbability(teamStats, h2hStats),
      combinedProbability: 0,
      reasoning: []
    };
  }

  /**
   * Récupère les patterns de buts d'une équipe sur les 12 derniers matchs
   */
  async getTeamGoalPatterns(teamId, sport) {
    const query = `
      SELECT 
        home_score, away_score,
        CASE WHEN home_team_id = $1 THEN 'home' ELSE 'away' END as venue,
        -- Simuler les données mi-temps (si disponibles dans match_statistics)
        -- Sinon utiliser les estimations basées sur les données historiques
        created_at
      FROM matches 
      WHERE (home_team_id = $1 OR away_team_id = $1)
        AND sport_type = $2
        AND status = 'finished'
        AND match_date > NOW() - INTERVAL '90 days'
      ORDER BY match_date DESC
      LIMIT 12
    `;
    
    const result = await db.query(query, [teamId, sport]);
    const matches = result.rows;
    
    let firstHalfGoals = 0;
    let totalGoals = 0;
    let over05HT = 0;  // Over 0.5 mi-temps
    let over15Match = 0; // Over 1.5 match
    
    matches.forEach(match => {
      const isHome = match.venue === 'home';
      const teamScore = isHome ? match.home_score : match.away_score;
      const oppScore = isHome ? match.away_score : match.home_score;
      const total = teamScore + oppScore;
      
      totalGoals += total;
      
      // Estimation: ~45% des buts tombent en première mi-temps (statistique football)
      const estimatedHTGoals = Math.round(total * 0.45);
      firstHalfGoals += estimatedHTGoals;
      
      if (estimatedHTGoals >= 1) over05HT++;
      if (total >= 2) over15Match++;
    });
    
    return {
      matchesPlayed: matches.length,
      avgTotalGoals: matches.length ? (totalGoals / matches.length).toFixed(2) : 0,
      avgFirstHalfGoals: matches.length ? (firstHalfGoals / matches.length).toFixed(2) : 0,
      over05HTRate: matches.length ? ((over05HT / matches.length) * 100).toFixed(1) : 0,
      over15MatchRate: matches.length ? ((over15Match / matches.length) * 100).toFixed(1) : 0,
      rawMatches: matches
    };
  }

  /**
   * Récupère les patterns H2H (confrontations directes)
   */
  async getH2HGoalPatterns(teamAId, teamBId, sport) {
    const query = `
      SELECT 
        home_score, away_score,
        match_date
      FROM matches 
      WHERE ((home_team_id = $1 AND away_team_id = $2) 
         OR (home_team_id = $2 AND away_team_id = $1))
        AND sport_type = $3
        AND status = 'finished'
      ORDER BY match_date DESC
      LIMIT 10
    `;
    
    const result = await db.query(query, [teamAId, teamBId, sport]);
    const matches = result.rows;
    
    let over05HT = 0;
    let over15Match = 0;
    let btts = 0; // Both Teams To Score
    
    matches.forEach(match => {
      const total = (match.home_score || 0) + (match.away_score || 0);
      const estimatedHT = Math.round(total * 0.45);
      
      if (estimatedHT >= 1) over05HT++;
      if (total >= 2) over15Match++;
      if (match.home_score > 0 && match.away_score > 0) btts++;
    });
    
    return {
      h2hMatches: matches.length,
      over05HTRate: matches.length ? ((over05HT / matches.length) * 100).toFixed(1) : 0,
      over15MatchRate: matches.length ? ((over15Match / matches.length) * 100).toFixed(1) : 0,
      bttsRate: matches.length ? ((btts / matches.length) * 100).toFixed(1) : 0,
      avgTotalGoals: matches.length 
        ? (matches.reduce((a, m) => a + (m.home_score || 0) + (m.away_score || 0), 0) / matches.length).toFixed(2) 
        : 0
    };
  }

  /**
   * Calcule la probabilité Over 0.5 mi-temps
   */
  calculateFirstHalfProbability(teamStats, h2hStats) {
    // Pondération: 60% forme équipe, 40% historique H2H
    const teamWeight = parseFloat(teamStats.over05HTRate) * 0.6;
    const h2hWeight = h2hStats.h2hMatches > 2 ? parseFloat(h2hStats.over05HTRate) * 0.4 : 20; // 20% par défaut si peu d'H2H
    
    const probability = Math.min(95, teamWeight + h2hWeight);
    
    return {
      probability: parseFloat(probability.toFixed(1)),
      confidence: probability > 70 ? 'high' : probability > 50 ? 'medium' : 'low',
      teamRate: teamStats.over05HTRate,
      h2hRate: h2hStats.over05HTRate
    };
  }

  /**
   * Calcule la probabilité Over 1.5 match
   */
  calculateMatchProbability(teamStats, h2hStats) {
    const teamWeight = parseFloat(teamStats.over15MatchRate) * 0.6;
    const h2hWeight = h2hStats.h2hMatches > 2 ? parseFloat(h2hStats.over15MatchRate) * 0.4 : 25;
    
    const probability = Math.min(95, teamWeight + h2hWeight);
    
    return {
      probability: parseFloat(probability.toFixed(1)),
      confidence: probability > 70 ? 'high' : probability > 50 ? 'medium' : 'low',
      teamRate: teamStats.over15MatchRate,
      h2hRate: h2hStats.over15MatchRate
    };
  }

  /**
   * FILTRE PRINCIPAL: Vérifie si le match correspond aux critères
   */
  async filterMatch(homeTeamId, awayTeamId, sport = 'football') {
    const homePatterns = await this.getTeamGoalPatterns(homeTeamId, sport);
    const awayPatterns = await this.getTeamGoalPatterns(awayTeamId, sport);
    const h2hPatterns = await this.getH2HGoalPatterns(homeTeamId, awayTeamId, sport);
    
    // Calculer la probabilité combinée
    const firstHalfProb = this.calculateFirstHalfProbability(homePatterns, h2hPatterns);
    const matchProb = this.calculateMatchProbability(awayPatterns, h2hPatterns);
    
    // Moyenne des deux équipes pour le match complet
    const combinedMatchProb = (parseFloat(homePatterns.over15MatchRate) + parseFloat(awayPatterns.over15MatchRate)) / 2;
    
    // CRITÈRES DE FILTRAGE
    const meetsFirstHalfCriteria = firstHalfProb.probability >= 60;  // Au moins 60% de chance de but en MT
    const meetsMatchCriteria = combinedMatchProb >= 65;  // Au moins 65% de chance de +1.5 buts
    
    const isRecommended = meetsFirstHalfCriteria && meetsMatchCriteria;
    
    return {
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
          probability: combinedMatchProb.toFixed(1),
          confidence: combinedMatchProb > 70 ? 'high' : combinedMatchProb > 50 ? 'medium' : 'low',
          description: 'Over 1.5 buts match'
        }
      },
      details: {
        homeTeam: {
          avgGoals: homePatterns.avgTotalGoals,
          over05HT: homePatterns.over05HTRate,
          over15Match: homePatterns.over15MatchRate
        },
        awayTeam: {
          avgGoals: awayPatterns.avgTotalGoals,
          over05HT: awayPatterns.over05HTRate,
          over15Match: awayPatterns.over15MatchRate
        },
        h2h: {
          matches: h2hPatterns.h2hMatches,
          avgGoals: h2hPatterns.avgTotalGoals,
          over05HT: h2hPatterns.over05HTRate,
          over15Match: h2hPatterns.over15MatchRate,
          bttsRate: h2hPatterns.bttsRate
        }
      },
      reasoning: this.generateReasoning(homePatterns, awayPatterns, h2hPatterns, isRecommended)
    };
  }

  generateReasoning(home, away, h2h, isRecommended) {
    const reasons = [];
    
    if (isRecommended) {
      reasons.push(`✅ Forte tendance aux buts en première mi-temps (${home.over05HTRate}% des matchs)`);
      reasons.push(`✅ Historique H2H riche en buts (${h2h.avgTotalGoals} buts/match en moyenne)`);
      reasons.push(`✅ Les deux équipes marquent régulièrement (${h2h.bttsRate}% BTTS)`);
    } else {
      if (parseFloat(home.over05HTRate) < 50) {
        reasons.push(`❌ Faible activité en première mi-temps pour l'équipe à domicile (${home.over05HTRate}%)`);
      }
      if (parseFloat(away.over15MatchRate) < 50) {
        reasons.push(`❌ L'équipe à l'extérieur marque peu (${away.avgTotalGoals} buts/match)`);
      }
      if (h2h.h2hMatches > 0 && parseFloat(h2h.over15MatchRate) < 50) {
        reasons.push(`❌ Historique H2H peu prolifique (${h2h.over15MatchRate}% over 1.5)`);
      }
    }
    
    return reasons;
  }
}

module.exports = new AdvancedFilters();