const db = require('../config/database');

class PredictionAlgorithms {
  
  poissonDistribution(lambda, k) {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k);
  }

  factorial(n) {
    if (n === 0 || n === 1) return 1;
    let result = 1;
    for (let i = 2; i <= n; i++) result *= i;
    return result;
  }

  async ensemblePrediction(homeTeamId, awayTeamId, sport) {
    if (sport === 'football') {
      const poisson = await this.poissonPrediction(homeTeamId, awayTeamId);
      const elo = await this.eloPrediction(homeTeamId, awayTeamId, sport);
      
      return {
        algorithm: 'ensemble_poisson_elo',
        probabilities: {
          homeWin: parseFloat((poisson.probabilities.homeWin * 0.6 + elo.probabilities.homeWin * 0.4).toFixed(1)),
          draw: parseFloat((poisson.probabilities.draw * 0.6 + elo.probabilities.draw * 0.4).toFixed(1)),
          awayWin: parseFloat((poisson.probabilities.awayWin * 0.6 + elo.probabilities.awayWin * 0.4).toFixed(1))
        },
        expectedGoals: poisson.expectedGoals,
        mostLikelyScores: poisson.mostLikelyScores,
        details: { poisson, elo }
      };
    } else {
      const monteCarlo = await this.monteCarloBasketball(homeTeamId, awayTeamId);
      return {
        algorithm: 'monte_carlo',
        winProbabilities: monteCarlo.winProbabilities,
        expectedPoints: monteCarlo.expectedPoints,
        spread: monteCarlo.spread
      };
    }
  }

  async poissonPrediction(homeTeamId, awayTeamId) {
    const homeStats = await this.getBasicStats(homeTeamId, 'home');
    const awayStats = await this.getBasicStats(awayTeamId, 'away');
    
    const lambdaHome = homeStats.avgFor * 0.6 + awayStats.avgAgainst * 0.4;
    const lambdaAway = awayStats.avgFor * 0.6 + homeStats.avgAgainst * 0.4;

    let homeWin = 0, draw = 0, awayWin = 0;
    const scores = [];

    for (let h = 0; h <= 5; h++) {
      for (let a = 0; a <= 5; a++) {
        const prob = this.poissonDistribution(lambdaHome, h) * this.poissonDistribution(lambdaAway, a);
        scores.push({ home: h, away: a, prob });
        
        if (h > a) homeWin += prob;
        else if (h === a) draw += prob;
        else awayWin += prob;
      }
    }

    return {
      expectedGoals: {
        home: parseFloat(lambdaHome.toFixed(2)),
        away: parseFloat(lambdaAway.toFixed(2))
      },
      probabilities: {
        homeWin: parseFloat((homeWin * 100).toFixed(1)),
        draw: parseFloat((draw * 100).toFixed(1)),
        awayWin: parseFloat((awayWin * 100).toFixed(1))
      },
      mostLikelyScores: scores.sort((a, b) => b.prob - a.prob).slice(0, 3).map(s => ({
        score: `${s.home}-${s.away}`,
        probability: parseFloat((s.prob * 100).toFixed(1))
      }))
    };
  }

  async eloPrediction(homeTeamId, awayTeamId, sport) {
    const homeAdvantage = 65;

    const homeElo = await this.getEloRating(homeTeamId, sport) || 1500;
    const awayElo = await this.getEloRating(awayTeamId, sport) || 1500;

    const eloDiff = (homeElo + homeAdvantage) - awayElo;
    const expHome = 1 / (1 + Math.pow(10, -eloDiff / 400));
    const expAway = 1 - expHome;

    const drawFactor = sport === 'football' ? 0.26 : 0.02;
    const closeness = 1 - Math.abs(expHome - expAway);
    const drawProb = drawFactor * closeness * 2;

    const homeWin = expHome * (1 - drawProb);
    const awayWin = expAway * (1 - drawProb);

    return {
      ratings: { home: homeElo, away: awayElo },
      probabilities: {
        homeWin: parseFloat((homeWin * 100).toFixed(1)),
        draw: parseFloat((drawProb * 100).toFixed(1)),
        awayWin: parseFloat((awayWin * 100).toFixed(1))
      }
    };
  }

  async monteCarloBasketball(homeTeamId, awayTeamId, iterations = 5000) {
    const homeStats = await this.getBasicStats(homeTeamId, 'home');
    const awayStats = await this.getBasicStats(awayTeamId, 'away');

    let homeWins = 0, totalHome = 0, totalAway = 0;

    for (let i = 0; i < iterations; i++) {
      const homeScore = this.randomNormal(homeStats.avgFor, homeStats.avgFor * 0.1);
      const awayScore = this.randomNormal(awayStats.avgFor, awayStats.avgFor * 0.1);
      
      if (homeScore > awayScore) homeWins++;
      totalHome += homeScore;
      totalAway += awayScore;
    }

    return {
      winProbabilities: {
        home: parseFloat(((homeWins / iterations) * 100).toFixed(1)),
        away: parseFloat((((iterations - homeWins) / iterations) * 100).toFixed(1))
      },
      expectedPoints: {
        home: parseFloat((totalHome / iterations).toFixed(1)),
        away: parseFloat((totalAway / iterations).toFixed(1))
      },
      spread: {
        suggested: Math.round((totalHome - totalAway) / iterations),
        confidence: 65
      }
    };
  }

  randomNormal(mean, std) {
    let u = 0, v = 0;
    while(u === 0) u = Math.random();
    while(v === 0) v = Math.random();
    return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  async getBasicStats(teamId, venue) {
    try {
      const result = await db.query(
        `SELECT home_score, away_score, home_team_id
         FROM matches
         WHERE (home_team_id = $1 OR away_team_id = $1)
           AND status = 'finished'
           AND match_date > NOW() - INTERVAL '120 days'
         ORDER BY match_date DESC
         LIMIT 12`,
        [teamId]
      );

      if (result.rows.length >= 3) {
        let goalsFor = 0, goalsAgainst = 0;
        result.rows.forEach(m => {
          const isHome = m.home_team_id === teamId;
          goalsFor += isHome ? (m.home_score || 0) : (m.away_score || 0);
          goalsAgainst += isHome ? (m.away_score || 0) : (m.home_score || 0);
        });
        const count = result.rows.length;
        return {
          avgFor: parseFloat((goalsFor / count).toFixed(2)),
          avgAgainst: parseFloat((goalsAgainst / count).toFixed(2))
        };
      }
    } catch {
      // DB unavailable, use league averages
    }

    return {
      avgFor: venue === 'home' ? 1.55 : 1.18,
      avgAgainst: venue === 'home' ? 1.08 : 1.42
    };
  }

  async getEloRating(teamId, sport) {
    const result = await db.query(
      'SELECT elo_rating FROM team_ratings WHERE team_id = $1 AND sport_type = $2',
      [teamId, sport]
    );
    return result.rows[0]?.elo_rating;
  }
}

module.exports = new PredictionAlgorithms();
