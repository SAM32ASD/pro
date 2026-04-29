/**
 * Routes pour tous les sports supportés
 * Architecture unifiée pour gérer plusieurs sports via API-Sports
 */

const express = require('express');
const router = express.Router();
const axios = require('axios');
const { getTennisMatches } = require('../services/tennisService');

// Configuration des API par sport
const SPORT_APIS = {
  football: {
    url: 'https://v3.football.api-sports.io',
    endpoint: '/fixtures'
  },
  basketball: {
    url: 'https://v1.basketball.api-sports.io',
    endpoint: '/games'
  },
  tennis: {
    url: 'https://v1.tennis.api-sports.io',
    endpoint: '/games'
  },
  volleyball: {
    url: 'https://v1.volleyball.api-sports.io',
    endpoint: '/games'
  },
  rugby: {
    url: 'https://v1.rugby.api-sports.io',
    endpoint: '/games'
  },
  hockey: {
    url: 'https://v1.hockey.api-sports.io',
    endpoint: '/games'
  },
  handball: {
    url: 'https://v1.handball.api-sports.io',
    endpoint: '/games'
  },
  baseball: {
    url: 'https://v1.baseball.api-sports.io',
    endpoint: '/games'
  },
  'american-football': {
    url: 'https://v1.american-football.api-sports.io',
    endpoint: '/games'
  }
};

/**
 * Route pour obtenir la liste des sports supportés
 * GET /api/matches/sports/list
 * IMPORTANT: Doit être AVANT la route générique /:sport
 */
router.get('/sports/list', (req, res) => {
  const sports = Object.keys(SPORT_APIS).map(key => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1).replace('-', ' '),
    apiUrl: SPORT_APIS[key].url,
    endpoint: SPORT_APIS[key].endpoint
  }));

  res.json({
    status: 'success',
    count: sports.length,
    data: sports
  });
});

/**
 * Route pour tester la connectivité API d'un sport
 * GET /api/matches/:sport/test
 * IMPORTANT: Doit être AVANT la route générique /:sport
 */
router.get('/:sport/test', async (req, res) => {
  try {
    const { sport } = req.params;
    const sportConfig = SPORT_APIS[sport];

    if (!sportConfig) {
      return res.status(400).json({
        status: 'error',
        message: `Sport non supporté: ${sport}`
      });
    }

    const apiKey = process.env.VITE_API_SPORTS_KEY || '52acbca26557d916d16a8022e72f6254';

    // Test avec la date du jour
    const today = new Date().toISOString().split('T')[0];

    const response = await axios.get(`${sportConfig.url}${sportConfig.endpoint}`, {
      headers: {
        'x-apisports-key': apiKey
      },
      params: {
        date: today,
        timezone: 'Europe/Paris'
      },
      timeout: 10000
    });

    res.json({
      status: 'success',
      sport,
      message: 'API accessible',
      results: response.data?.results || 0,
      apiUrl: sportConfig.url
    });

  } catch (error) {
    res.status(500).json({
      status: 'error',
      sport: req.params.sport,
      message: error.message,
      apiAccessible: false
    });
  }
});

/**
 * Route générique pour récupérer les matchs d'un sport
 * GET /api/matches/:sport?date=YYYY-MM-DD
 * IMPORTANT: Doit être en DERNIER pour éviter de capturer sports/list et :sport/test
 */
router.get('/:sport', async (req, res) => {
  try {
    const { sport } = req.params;
    const { date } = req.query;

    // Validation
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        status: 'error',
        message: 'Date invalide (format attendu: YYYY-MM-DD)'
      });
    }

    // Vérifier si le sport est supporté
    const sportConfig = SPORT_APIS[sport];
    if (!sportConfig) {
      return res.status(400).json({
        status: 'error',
        message: `Sport non supporté: ${sport}`,
        supportedSports: Object.keys(SPORT_APIS)
      });
    }

    // Clé API
    const apiKey = process.env.VITE_API_SPORTS_KEY || '52acbca26557d916d16a8022e72f6254';

    console.log(`[${sport.toUpperCase()}] Fetching matches for ${date}`);

    if (sport === 'tennis') {
      try {
        const tennisMatches = await getTennisMatches(date);
        const validMatches = tennisMatches.filter(m =>
          m.homeTeam.name !== 'Player 1' && m.awayTeam.name !== 'Player 2' &&
          m.homeTeam.name !== 'TBD' && m.awayTeam.name !== 'TBD'
        );

        return res.json({
          status: 'success',
          sport: 'tennis',
          data: {
            results: validMatches.length,
            response: validMatches
          },
          source: validMatches[0]?.source || 'ESPN'
        });

      } catch (tennisError) {
        console.error(`[TENNIS] Error:`, tennisError.message);
        return res.json({
          status: 'success',
          sport: 'tennis',
          data: { results: 0, response: [] },
          warning: {
            code: 'TENNIS_API_ERROR',
            message: `Impossible de récupérer les matchs de tennis pour le moment.`,
            technicalError: tennisError.message
          }
        });
      }
    }

    // Pour les autres sports : API-Sports classique
    const response = await axios.get(`${sportConfig.url}${sportConfig.endpoint}`, {
      headers: {
        'x-apisports-key': apiKey
      },
      params: {
        date,
        timezone: 'Europe/Paris'
      },
      timeout: 10000
    });

    // Réponse
    res.json({
      status: 'success',
      sport,
      data: response.data
    });

  } catch (error) {
    console.error(`[SPORTS API ERROR] ${req.params.sport}:`, error.message);

    // Gestion des erreurs spécifiques
    if (error.response?.status === 429) {
      return res.status(429).json({
        status: 'error',
        message: 'Quota API dépassé. Veuillez réessayer plus tard.',
        code: 'RATE_LIMIT_EXCEEDED',
        sport: req.params.sport
      });
    }

    if (error.response?.status === 401 || error.response?.status === 403) {
      return res.status(401).json({
        status: 'error',
        message: 'Clé API invalide ou expirée',
        code: 'INVALID_API_KEY',
        sport: req.params.sport
      });
    }

    // Erreur DNS ou réseau - Sport non disponible
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      return res.json({
        status: 'success',
        sport: req.params.sport,
        data: {
          results: 0,
          response: []
        },
        warning: {
          code: 'SPORT_API_UNAVAILABLE',
          message: `L'API ${req.params.sport} n'est pas disponible avec votre plan actuel ou est temporairement indisponible.`,
          technicalError: error.message
        }
      });
    }

    // Autres erreurs
    res.status(500).json({
      status: 'error',
      message: error.message || 'Erreur lors de la récupération des matchs',
      sport: req.params.sport
    });
  }
});

module.exports = router;
