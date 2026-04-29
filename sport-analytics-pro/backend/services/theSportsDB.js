const axios = require('axios');

/**
 * Service TheSportsDB - API gratuite illimitée pour les données sportives
 * Documentation: https://www.thesportsdb.com/api.php
 */
class TheSportsDBService {
  constructor() {
    this.baseURL = 'https://www.thesportsdb.com/api/v1/json/3'; // Version gratuite
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });
  }

  /**
   * Rechercher une équipe par nom
   */
  async searchTeam(teamName, sport = 'Soccer') {
    try {
      const response = await this.client.get('/searchteams.php', {
        params: { t: teamName }
      });

      if (!response.data?.teams) return null;

      // Filtrer par sport si spécifié
      const teams = response.data.teams.filter(team => {
        if (sport === 'Soccer') return team.strSport === 'Soccer';
        if (sport === 'Basketball') return team.strSport === 'Basketball';
        return true;
      });

      return teams.length > 0 ? teams[0] : null;
    } catch (error) {
      console.error('TheSportsDB - Erreur recherche équipe:', error.message);
      return null;
    }
  }

  /**
   * Obtenir les détails d'une équipe par ID
   */
  async getTeamDetails(teamId) {
    try {
      const response = await this.client.get('/lookupteam.php', {
        params: { id: teamId }
      });

      return response.data?.teams?.[0] || null;
    } catch (error) {
      console.error('TheSportsDB - Erreur détails équipe:', error.message);
      return null;
    }
  }

  /**
   * Obtenir les derniers matchs d'une équipe
   */
  async getTeamLastMatches(teamId, limit = 12) {
    try {
      const response = await this.client.get('/eventslast.php', {
        params: { id: teamId }
      });

      if (!response.data?.results) return [];

      return response.data.results.slice(0, limit).map(match => this.formatMatch(match));
    } catch (error) {
      console.error('TheSportsDB - Erreur derniers matchs:', error.message);
      return [];
    }
  }

  /**
   * Obtenir les prochains matchs d'une équipe
   */
  async getTeamNextMatches(teamId, limit = 5) {
    try {
      const response = await this.client.get('/eventsnext.php', {
        params: { id: teamId }
      });

      if (!response.data?.events) return [];

      return response.data.events.slice(0, limit).map(match => this.formatMatch(match));
    } catch (error) {
      console.error('TheSportsDB - Erreur prochains matchs:', error.message);
      return [];
    }
  }

  /**
   * Obtenir les matchs d'une ligue pour une date
   */
  async getMatchesByDate(date, leagueId = null) {
    try {
      // Format date: YYYY-MM-DD
      const response = await this.client.get('/eventsday.php', {
        params: {
          d: date,
          ...(leagueId && { l: leagueId })
        }
      });

      if (!response.data?.events) return [];

      return response.data.events.map(match => this.formatMatch(match));
    } catch (error) {
      console.error('TheSportsDB - Erreur matchs par date:', error.message);
      return [];
    }
  }

  /**
   * Obtenir toutes les ligues pour un sport
   */
  async getLeagues(sport = 'Soccer') {
    try {
      const response = await this.client.get('/all_leagues.php');

      if (!response.data?.leagues) return [];

      return response.data.leagues
        .filter(league => league.strSport === sport)
        .map(league => ({
          id: league.idLeague,
          name: league.strLeague,
          sport: league.strSport,
          country: league.strCountry
        }));
    } catch (error) {
      console.error('TheSportsDB - Erreur ligues:', error.message);
      return [];
    }
  }

  /**
   * Obtenir les matchs d'une ligue pour une saison
   */
  async getLeagueMatches(leagueId, season) {
    try {
      const response = await this.client.get('/eventsseason.php', {
        params: {
          id: leagueId,
          s: season
        }
      });

      if (!response.data?.events) return [];

      return response.data.events.map(match => this.formatMatch(match));
    } catch (error) {
      console.error('TheSportsDB - Erreur matchs ligue:', error.message);
      return [];
    }
  }

  /**
   * Formater un match TheSportsDB vers notre format
   */
  formatMatch(match) {
    return {
      id: match.idEvent,
      source: 'thesportsdb',
      date: match.strTimestamp || match.dateEvent,
      status: this.mapStatus(match.strStatus),
      league: {
        id: match.idLeague,
        name: match.strLeague,
        country: match.strCountry,
        logo: match.strLeagueBadge
      },
      teams: {
        home: {
          id: match.idHomeTeam,
          name: match.strHomeTeam,
          logo: match.strHomeTeamBadge
        },
        away: {
          id: match.idAwayTeam,
          name: match.strAwayTeam,
          logo: match.strAwayTeamBadge
        }
      },
      goals: {
        home: match.intHomeScore ? parseInt(match.intHomeScore) : null,
        away: match.intAwayScore ? parseInt(match.intAwayScore) : null
      },
      score: {
        halftime: {
          home: match.strHomeHalfScore ? parseInt(match.strHomeHalfScore) : null,
          away: match.strAwayHalfScore ? parseInt(match.strAwayHalfScore) : null
        }
      },
      venue: match.strVenue,
      season: match.strSeason
    };
  }

  /**
   * Mapper le statut TheSportsDB vers notre format
   */
  mapStatus(status) {
    const statusMap = {
      'Match Finished': 'FT',
      'Not Started': 'NS',
      'First Half': '1H',
      'Halftime': 'HT',
      'Second Half': '2H',
      'Extra Time': 'ET',
      'Penalty Shootout': 'PEN',
      'Postponed': 'PST',
      'Cancelled': 'CANC'
    };

    return statusMap[status] || 'NS';
  }

  /**
   * Mapper une ligue populaire vers son ID TheSportsDB
   */
  getPopularLeagueId(leagueName) {
    const leagues = {
      // Football
      'Premier League': '4328',
      'La Liga': '4335',
      'Serie A': '4332',
      'Bundesliga': '4331',
      'Ligue 1': '4334',
      'Champions League': '4480',
      'Europa League': '4481',
      'World Cup': '4355',
      // Basketball
      'NBA': '4387',
      'Euroleague': '4542',
      'NCAA': '4391'
    };

    return leagues[leagueName] || null;
  }

  /**
   * Vérifier si le service est disponible
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/searchteams.php', {
        params: { t: 'Arsenal' },
        timeout: 5000
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

module.exports = new TheSportsDBService();
