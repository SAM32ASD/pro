const axios = require('axios');

class APISportsService {
  constructor() {
    this.footballClient = axios.create({
      baseURL: 'https://v3.football.api-sports.io',
      headers: {
        'x-rapidapi-key': process.env.API_SPORTS_KEY,
        'x-rapidapi-host': 'v3.football.api-sports.io'
      }
    });

    this.basketballClient = axios.create({
      baseURL: 'https://v1.basketball.api-sports.io',
      headers: {
        'x-rapidapi-key': process.env.API_SPORTS_KEY,
        'x-rapidapi-host': 'v1.basketball.api-sports.io'
      }
    });
  }

  async getFootballTeamLastMatches(teamId, season, number = 12) {
    const response = await this.footballClient.get('/fixtures', {
      params: { team: teamId, season: season, last: number }
    });
    return response.data.response;
  }

  async getFootballH2H(teamA, teamB, last = 10) {
    const response = await this.footballClient.get('/fixtures/headtohead', {
      params: { h2h: `${teamA}-${teamB}`, last: last }
    });
    return response.data.response;
  }

  async getBasketballTeamLastMatches(teamId, season, number = 12) {
    const response = await this.basketballClient.get('/games', {
      params: { team: teamId, season: season, last: number }
    });
    return response.data.response;
  }

  async getBasketballH2H(teamA, teamB, last = 10) {
    const response = await this.basketballClient.get('/games', {
      params: { team: [teamA, teamB], last: last * 2 }
    });
    
    return response.data.response.filter(game => 
      (game.teams.home.id === teamA && game.teams.away.id === teamB) ||
      (game.teams.home.id === teamB && game.teams.away.id === teamA)
    ).slice(0, last);
  }

  async searchTeams(query, sport) {
    const client = sport === 'basketball' ? this.basketballClient : this.footballClient;
    const response = await client.get('/teams', {
      params: { search: query }
    });
    return response.data.response;
  }
}

module.exports = new APISportsService();
