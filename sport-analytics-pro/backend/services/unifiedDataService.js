const apiSports = require('./apiSports');
const theSportsDB = require('./theSportsDB');
const cacheService = require('./cacheService');

/**
 * Service unifié intelligent
 * Gère automatiquement le fallback entre les sources de données
 * et optimise les appels avec le cache
 */
class UnifiedDataService {
  constructor() {
    this.sources = {
      cache: cacheService,
      thesportsdb: theSportsDB,
      apisports: apiSports
    };

    // Statistiques d'utilisation
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      theSportsDBCalls: 0,
      apiSportsCalls: 0,
      errors: 0
    };
  }

  /**
   * Obtenir les derniers matchs d'une équipe (stratégie intelligente)
   */
  async getTeamLastMatches(teamId, sport, season, limit = 12) {
    const cacheKey = cacheService.generateKey('team_matches', teamId, sport, season, limit);

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        // 1. Essayer TheSportsDB (gratuit illimité)
        try {
          const matches = await theSportsDB.getTeamLastMatches(teamId, limit);
          if (matches && matches.length > 0) {
            console.log(`✅ Données de TheSportsDB pour équipe ${teamId}`);
            this.stats.theSportsDBCalls++;
            return matches;
          }
        } catch (error) {
          console.warn('TheSportsDB échec, fallback vers API-Sports');
        }

        // 2. Fallback vers API-Sports
        try {
          const matches = sport === 'football'
            ? await apiSports.getFootballTeamLastMatches(teamId, season, limit)
            : await apiSports.getBasketballTeamLastMatches(teamId, season, limit);

          console.log(`✅ Données de API-Sports pour équipe ${teamId}`);
          this.stats.apiSportsCalls++;
          return matches;
        } catch (error) {
          console.error('API-Sports échec:', error.message);
          this.stats.errors++;
          throw new Error('Aucune source de données disponible');
        }
      },
      cacheService.TTL.TEAM_STATS
    );
  }

  /**
   * Obtenir les confrontations directes (H2H)
   */
  async getH2H(teamAId, teamBId, sport, last = 10) {
    const cacheKey = cacheService.generateKey('h2h', teamAId, teamBId, sport, last);

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        // TheSportsDB ne supporte pas directement H2H
        // Utiliser API-Sports directement
        try {
          const matches = sport === 'football'
            ? await apiSports.getFootballH2H(teamAId, teamBId, last)
            : await apiSports.getBasketballH2H(teamAId, teamBId, last);

          console.log(`✅ H2H de API-Sports (${teamAId} vs ${teamBId})`);
          this.stats.apiSportsCalls++;
          return matches;
        } catch (error) {
          console.error('H2H échec:', error.message);
          this.stats.errors++;
          throw error;
        }
      },
      cacheService.TTL.H2H
    );
  }

  /**
   * Obtenir les matchs du jour (optimisé avec cache)
   */
  async getMatchesByDate(date, sport = 'football') {
    const cacheKey = cacheService.generateKey('matches_day', date, sport);

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const matches = [];

        // 1. Essayer TheSportsDB pour plusieurs ligues populaires
        try {
          const popularLeagues = sport === 'football'
            ? ['Premier League', 'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1', 'Champions League']
            : ['NBA', 'Euroleague'];

          for (const leagueName of popularLeagues) {
            const leagueId = theSportsDB.getPopularLeagueId(leagueName);
            if (leagueId) {
              try {
                const leagueMatches = await theSportsDB.getMatchesByDate(date, leagueId);
                matches.push(...leagueMatches);
              } catch (error) {
                console.warn(`TheSportsDB échec pour ${leagueName}`);
              }
            }
          }

          if (matches.length > 0) {
            console.log(`✅ ${matches.length} matchs de TheSportsDB`);
            this.stats.theSportsDBCalls++;
            return matches;
          }
        } catch (error) {
          console.warn('TheSportsDB échec global');
        }

        // 2. Fallback vers API-Sports
        try {
          // Appel API-Sports (selon implémentation)
          console.log('⚠️ Fallback vers API-Sports pour matchs du jour');
          this.stats.apiSportsCalls++;
          return []; // À implémenter selon votre logique API-Sports
        } catch (error) {
          console.error('Échec complet récupération matchs');
          this.stats.errors++;
          return [];
        }
      },
      cacheService.TTL.MATCHES_TODAY
    );
  }

  /**
   * Rechercher une équipe intelligemment
   */
  async searchTeam(query, sport = 'football') {
    const cacheKey = cacheService.generateKey('team_search', query, sport);

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        // 1. Essayer TheSportsDB
        try {
          const sportName = sport === 'football' ? 'Soccer' : 'Basketball';
          const team = await theSportsDB.searchTeam(query, sportName);

          if (team) {
            console.log(`✅ Équipe trouvée via TheSportsDB: ${team.strTeam}`);
            this.stats.theSportsDBCalls++;
            return this.mapTeamFromTheSportsDB(team);
          }
        } catch (error) {
          console.warn('TheSportsDB recherche échec');
        }

        // 2. Fallback vers API-Sports
        try {
          const teams = await apiSports.searchTeams(query, sport);
          console.log(`✅ Équipe(s) trouvée(s) via API-Sports`);
          this.stats.apiSportsCalls++;
          return teams;
        } catch (error) {
          console.error('Recherche équipe échec:', error.message);
          this.stats.errors++;
          throw error;
        }
      },
      cacheService.TTL.TEAM_INFO
    );
  }

  /**
   * Obtenir les statistiques d'une équipe
   */
  async getTeamStats(teamId, sport, season) {
    const cacheKey = cacheService.generateKey('team_stats', teamId, sport, season);

    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Essayer d'obtenir les détails via TheSportsDB
        try {
          const teamDetails = await theSportsDB.getTeamDetails(teamId);
          if (teamDetails) {
            console.log(`✅ Détails équipe de TheSportsDB: ${teamDetails.strTeam}`);
            this.stats.theSportsDBCalls++;
            return this.mapTeamStatsFromTheSportsDB(teamDetails);
          }
        } catch (error) {
          console.warn('TheSportsDB stats échec');
        }

        // Fallback: calculer à partir des matchs
        try {
          const matches = await this.getTeamLastMatches(teamId, sport, season, 12);
          console.log(`✅ Stats calculées à partir des matchs`);
          return this.calculateTeamStats(matches, teamId);
        } catch (error) {
          console.error('Échec calcul stats:', error.message);
          this.stats.errors++;
          throw error;
        }
      },
      cacheService.TTL.TEAM_STATS
    );
  }

  /**
   * Mapper une équipe TheSportsDB vers notre format
   */
  mapTeamFromTheSportsDB(team) {
    return {
      id: team.idTeam,
      name: team.strTeam,
      logo: team.strTeamBadge,
      country: team.strCountry,
      sport: team.strSport === 'Soccer' ? 'football' : team.strSport.toLowerCase(),
      stadium: team.strStadium,
      description: team.strDescriptionEN,
      source: 'thesportsdb'
    };
  }

  /**
   * Mapper les stats d'une équipe
   */
  mapTeamStatsFromTheSportsDB(team) {
    return {
      id: team.idTeam,
      name: team.strTeam,
      formed: team.intFormedYear,
      stadium: team.strStadium,
      capacity: team.intStadiumCapacity,
      website: team.strWebsite,
      social: {
        facebook: team.strFacebook,
        twitter: team.strTwitter,
        instagram: team.strInstagram
      },
      source: 'thesportsdb'
    };
  }

  /**
   * Calculer les statistiques d'une équipe à partir des matchs
   */
  calculateTeamStats(matches, teamId) {
    if (!matches || matches.length === 0) {
      return {
        matchesPlayed: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0
      };
    }

    let wins = 0, draws = 0, losses = 0;
    let goalsFor = 0, goalsAgainst = 0;

    matches.forEach(match => {
      const isHome = match.teams.home.id === teamId;
      const teamGoals = isHome ? match.goals.home : match.goals.away;
      const oppGoals = isHome ? match.goals.away : match.goals.home;

      if (teamGoals !== null && oppGoals !== null) {
        goalsFor += teamGoals;
        goalsAgainst += oppGoals;

        if (teamGoals > oppGoals) wins++;
        else if (teamGoals === oppGoals) draws++;
        else losses++;
      }
    });

    return {
      matchesPlayed: matches.length,
      wins,
      draws,
      losses,
      goalsFor,
      goalsAgainst,
      winRate: ((wins / matches.length) * 100).toFixed(1),
      avgGoalsFor: (goalsFor / matches.length).toFixed(2),
      avgGoalsAgainst: (goalsAgainst / matches.length).toFixed(2)
    };
  }

  /**
   * Invalider le cache pour une équipe
   */
  async invalidateTeamCache(teamId) {
    await cacheService.flush(`team_*:${teamId}:*`);
    console.log(`🗑️ Cache invalidé pour équipe ${teamId}`);
  }

  /**
   * Invalider le cache pour une date
   */
  async invalidateDateCache(date) {
    await cacheService.flush(`matches_day:${date}:*`);
    console.log(`🗑️ Cache invalidé pour date ${date}`);
  }

  /**
   * Obtenir les statistiques d'utilisation
   */
  getUsageStats() {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate = total > 0 ? ((this.stats.cacheHits / total) * 100).toFixed(1) : 0;

    return {
      ...this.stats,
      cacheHitRate: `${cacheHitRate}%`,
      totalAPICalls: this.stats.theSportsDBCalls + this.stats.apiSportsCalls,
      economySavings: `${((this.stats.cacheHits / (total || 1)) * 100).toFixed(0)}% d'appels API évités`
    };
  }

  /**
   * Réinitialiser les statistiques
   */
  resetStats() {
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      theSportsDBCalls: 0,
      apiSportsCalls: 0,
      errors: 0
    };
  }

  /**
   * Health check de tous les services
   */
  async healthCheck() {
    const results = {
      cache: false,
      thesportsdb: false,
      apisports: false
    };

    // Cache
    try {
      const cacheStats = await cacheService.getStats();
      results.cache = cacheStats.connected || cacheStats.type === 'memory';
    } catch (error) {
      console.error('Cache health check failed:', error.message);
    }

    // TheSportsDB
    try {
      results.thesportsdb = await theSportsDB.healthCheck();
    } catch (error) {
      console.error('TheSportsDB health check failed:', error.message);
    }

    // API-Sports (optionnel)
    results.apisports = !!process.env.API_SPORTS_KEY;

    return results;
  }
}

module.exports = new UnifiedDataService();
