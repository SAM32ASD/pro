/**
 * Configuration des sports supportés
 * Architecture extensible pour ajouter facilement de nouveaux sports
 */

export const SPORTS_CONFIG = {
  football: {
    id: 'football',
    name: 'Football',
    icon: '⚽',
    apiEndpoint: 'football',
    apiUrl: 'https://v3.football.api-sports.io',
    enabled: true,
    color: 'emerald',
    features: {
      predictions: true,
      goals: true,
      h2h: true,
      standings: true
    }
  },

  basketball: {
    id: 'basketball',
    name: 'Basketball',
    icon: '🏀',
    apiEndpoint: 'basketball',
    apiUrl: 'https://v1.basketball.api-sports.io',
    enabled: true,
    color: 'orange',
    competitions: [
      { id: 'nba', name: 'NBA', country: 'USA', priority: 1 },
      { id: 'euroleague', name: 'EuroLeague', country: 'Europe', priority: 2 },
      { id: 'acb', name: 'ACB Liga', country: 'Spain', priority: 3 },
      { id: 'bbl', name: 'BBL', country: 'Germany', priority: 3 },
      { id: 'lnb', name: 'LNB', country: 'France', priority: 3 },
      { id: 'seria-a', name: 'Serie A', country: 'Italy', priority: 3 }
    ],
    features: {
      predictions: true,
      points: true,
      h2h: true,
      standings: true
    }
  },

  tennis: {
    id: 'tennis',
    name: 'Tennis',
    icon: '🎾',
    apiEndpoint: 'tennis',
    apiUrl: 'https://v1.tennis.api-sports.io',
    enabled: true,
    color: 'yellow',
    competitions: [
      { id: 'atp', name: 'ATP Tour', type: 'Men', priority: 1 },
      { id: 'wta', name: 'WTA Tour', type: 'Women', priority: 1 },
      { id: 'grand-slam', name: 'Grand Slam', type: 'Major', priority: 0 },
      { id: 'masters-1000', name: 'Masters 1000', type: 'Men', priority: 2 },
      { id: 'premier', name: 'WTA Premier', type: 'Women', priority: 2 }
    ],
    features: {
      predictions: true,
      sets: true,
      h2h: true,
      rankings: true
    }
  },

  volleyball: {
    id: 'volleyball',
    name: 'Volleyball',
    icon: '🏐',
    apiEndpoint: 'volleyball',
    apiUrl: 'https://v1.volleyball.api-sports.io',
    enabled: true,
    color: 'blue',
    competitions: [
      { id: 'cev-champions', name: 'CEV Champions League', country: 'Europe', priority: 1 },
      { id: 'world-championship', name: 'World Championship', country: 'International', priority: 0 },
      { id: 'nations-league', name: 'Nations League', country: 'International', priority: 1 }
    ],
    features: {
      predictions: true,
      sets: true,
      h2h: true
    }
  },

  rugby: {
    id: 'rugby',
    name: 'Rugby',
    icon: '🏉',
    apiEndpoint: 'rugby',
    apiUrl: 'https://v1.rugby.api-sports.io',
    enabled: true,
    color: 'green',
    competitions: [
      { id: 'top-14', name: 'Top 14', country: 'France', priority: 1 },
      { id: 'premiership', name: 'Premiership', country: 'England', priority: 1 },
      { id: 'pro14', name: 'Pro14', country: 'Europe', priority: 2 },
      { id: 'super-rugby', name: 'Super Rugby', country: 'International', priority: 2 },
      { id: 'six-nations', name: 'Six Nations', country: 'Europe', priority: 0 }
    ],
    features: {
      predictions: true,
      tries: true,
      h2h: true
    }
  },

  hockey: {
    id: 'hockey',
    name: 'Hockey sur glace',
    icon: '🏒',
    apiEndpoint: 'hockey',
    apiUrl: 'https://v1.hockey.api-sports.io',
    enabled: true,
    color: 'cyan',
    competitions: [
      { id: 'nhl', name: 'NHL', country: 'USA/Canada', priority: 1 },
      { id: 'khl', name: 'KHL', country: 'Russia', priority: 2 },
      { id: 'champions-league', name: 'Champions Hockey League', country: 'Europe', priority: 2 },
      { id: 'shl', name: 'SHL', country: 'Sweden', priority: 3 },
      { id: 'liiga', name: 'Liiga', country: 'Finland', priority: 3 }
    ],
    features: {
      predictions: true,
      goals: true,
      h2h: true
    }
  },

  handball: {
    id: 'handball',
    name: 'Handball',
    icon: '🤾',
    apiEndpoint: 'handball',
    apiUrl: 'https://v1.handball.api-sports.io',
    enabled: true,
    color: 'purple',
    competitions: [
      { id: 'champions-league', name: 'EHF Champions League', country: 'Europe', priority: 1 },
      { id: 'lnh', name: 'LNH', country: 'France', priority: 2 },
      { id: 'bundesliga', name: 'Bundesliga', country: 'Germany', priority: 2 },
      { id: 'asobal', name: 'ASOBAL', country: 'Spain', priority: 2 }
    ],
    features: {
      predictions: true,
      goals: true,
      h2h: true
    }
  },

  baseball: {
    id: 'baseball',
    name: 'Baseball',
    icon: '⚾',
    apiEndpoint: 'baseball',
    apiUrl: 'https://v1.baseball.api-sports.io',
    enabled: false, // À activer si demandé
    color: 'red',
    competitions: [
      { id: 'mlb', name: 'MLB', country: 'USA', priority: 1 }
    ],
    features: {
      predictions: true,
      runs: true,
      h2h: true
    }
  },

  american_football: {
    id: 'american_football',
    name: 'Football Américain',
    icon: '🏈',
    apiEndpoint: 'american-football',
    apiUrl: 'https://v1.american-football.api-sports.io',
    enabled: false, // À activer si demandé
    color: 'indigo',
    competitions: [
      { id: 'nfl', name: 'NFL', country: 'USA', priority: 1 },
      { id: 'ncaa', name: 'NCAA', country: 'USA', priority: 2 }
    ],
    features: {
      predictions: true,
      touchdowns: true,
      h2h: true
    }
  }
};

/**
 * Obtenir la liste des sports actifs
 */
export function getActiveSports() {
  return Object.values(SPORTS_CONFIG).filter(sport => sport.enabled);
}

/**
 * Obtenir un sport par son ID
 */
export function getSportById(sportId) {
  return SPORTS_CONFIG[sportId] || null;
}

/**
 * Obtenir les compétitions d'un sport
 */
export function getSportCompetitions(sportId) {
  const sport = getSportById(sportId);
  return sport?.competitions || [];
}

/**
 * Vérifier si un sport supporte une fonctionnalité
 */
export function sportHasFeature(sportId, feature) {
  const sport = getSportById(sportId);
  return sport?.features?.[feature] || false;
}

/**
 * Obtenir la couleur d'un sport
 */
export function getSportColor(sportId) {
  const sport = getSportById(sportId);
  return sport?.color || 'gray';
}

/**
 * Mapper le nom API vers l'ID interne
 */
export const SPORT_API_MAPPING = {
  'football': 'football',
  'basketball': 'basketball',
  'tennis': 'tennis',
  'volleyball': 'volleyball',
  'rugby': 'rugby',
  'hockey': 'hockey',
  'handball': 'handball',
  'baseball': 'baseball',
  'american-football': 'american_football'
};

/**
 * Statuts communs des matchs (à adapter par sport)
 */
export const MATCH_STATUSES = {
  // Statuts terminés (à masquer dans le filtre)
  finished: ['FT', 'AET', 'PEN', 'CANC', 'ABD', 'PST', 'AWD', 'AOT', 'FT_PEN'],

  // Statuts en cours (LIVE)
  live: ['1H', 'HT', '2H', 'ET', 'BT', 'P', 'LIVE', 'Q1', 'Q2', 'Q3', 'Q4', 'OT', 'H1', 'H2'],

  // Statuts à venir
  pending: ['NS', 'TBD', 'SCHEDULED'],

  // Statuts suspendus/reportés temporaires
  suspended: ['SUSP', 'INT', 'POSTPONED']
};

/**
 * Configuration des endpoints backend
 */
export const API_ENDPOINTS = {
  football: '/api/matches/football',
  basketball: '/api/matches/basketball',
  tennis: '/api/matches/tennis',
  volleyball: '/api/matches/volleyball',
  rugby: '/api/matches/rugby',
  hockey: '/api/matches/hockey',
  handball: '/api/matches/handball',
  baseball: '/api/matches/baseball',
  american_football: '/api/matches/american-football'
};

export default SPORTS_CONFIG;
