/**
 * Service Tennis utilisant ESPN API (gratuit, sans clé)
 * Sources: ESPN ATP + WTA scoreboards
 * Fallback: TheSportsDB
 */

const axios = require('axios');

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports/tennis';
const THESPORTSDB_BASE = 'https://www.thesportsdb.com/api/v1/json/3';

const ESPN_TOURS = [
  { id: 'atp', name: 'ATP', type: 'Men' },
  { id: 'wta', name: 'WTA', type: 'Women' }
];

async function getTennisMatches(date) {
  console.log(`[TENNIS] Fetching matches for ${date}`);

  try {
    const espnMatches = await fetchFromESPN(date);
    if (espnMatches.length > 0) {
      console.log(`[TENNIS] ESPN returned ${espnMatches.length} matches`);
      return espnMatches;
    }
  } catch (err) {
    console.error(`[TENNIS] ESPN error:`, err.message);
  }

  try {
    console.log(`[TENNIS] Trying TheSportsDB fallback...`);
    const sdbMatches = await fetchFromTheSportsDB(date);
    if (sdbMatches.length > 0) {
      console.log(`[TENNIS] TheSportsDB returned ${sdbMatches.length} matches`);
      return sdbMatches;
    }
  } catch (err) {
    console.error(`[TENNIS] TheSportsDB fallback error:`, err.message);
  }

  console.log(`[TENNIS] No matches found from any source`);
  return [];
}

async function fetchFromESPN(date) {
  const allMatches = [];

  const results = await Promise.allSettled(
    ESPN_TOURS.map(tour =>
      axios.get(`${ESPN_BASE}/${tour.id}/scoreboard`, {
        timeout: 15000,
        headers: { 'Accept-Encoding': 'gzip' }
      }).then(res => ({ tour, data: res.data }))
    )
  );

  for (const result of results) {
    if (result.status !== 'fulfilled') continue;

    const { tour, data } = result.value;
    const events = data.events || [];

    for (const event of events) {
      const groupings = event.groupings || [];

      for (const group of groupings) {
        const competitions = group.competitions || [];

        for (const comp of competitions) {
          const matchDate = (comp.date || '').substring(0, 10);
          const statusName = ((comp.status || {}).type || {}).name || '';

          const isToday = matchDate === date;
          const isLive = statusName === 'STATUS_IN_PROGRESS';
          const isScheduled = statusName === 'STATUS_SCHEDULED' && matchDate >= date;

          if (!isToday && !isLive && !isScheduled) continue;

          const competitors = comp.competitors || [];
          if (competitors.length < 2) continue;

          const p1 = competitors[0];
          const p2 = competitors[1];
          const a1 = p1.athlete || {};
          const a2 = p2.athlete || {};

          if (a1.displayName === 'TBD' || a2.displayName === 'TBD') continue;

          allMatches.push(formatESPNMatch(comp, event, tour, a1, a2, p1, p2));
        }
      }
    }
  }

  const seen = new Set();
  const deduplicated = allMatches.filter(m => {
    const key = `${m.homeTeam.name}-${m.awayTeam.name}-${(m.date || '').substring(0, 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  deduplicated.sort((a, b) => new Date(a.date) - new Date(b.date));
  return deduplicated;
}

function formatESPNMatch(comp, event, tour, a1, a2, p1, p2) {
  const statusName = ((comp.status || {}).type || {}).name || '';
  const statusDetail = ((comp.status || {}).type || {}).detail || '';

  let status = 'NS';
  let statusLong = 'Not Started';

  if (statusName === 'STATUS_FINAL') {
    status = 'FT';
    statusLong = 'Terminé';
  } else if (statusName === 'STATUS_IN_PROGRESS') {
    status = 'LIVE';
    statusLong = statusDetail || 'En cours';
  } else if (statusName === 'STATUS_SCHEDULED') {
    status = 'NS';
    statusLong = 'Programmé';
  }

  const round = (comp.round || {}).displayName || '';
  const tournament = event.name || 'Tennis Tournament';

  const score1 = p1.score || null;
  const score2 = p2.score || null;

  return {
    id: `tennis-espn-${comp.id}`,
    sport: 'tennis',
    source: 'ESPN',
    fixtureId: comp.id,
    date: comp.date || event.date,
    status,
    statusLong,
    league: {
      id: `espn-${tour.id}-${event.id}`,
      name: `${tournament} (${tour.name})`,
      country: 'International',
      logo: null,
      round: round || 'Main Draw'
    },
    homeTeam: {
      id: a1.id || `espn-p1-${comp.id}`,
      name: a1.displayName || 'Player 1',
      logo: (a1.headshot || {}).href || (a1.flag || {}).href || null,
      flag: (a1.flag || {}).href || null,
      seed: p1.seed || null,
      winner: p1.winner || null
    },
    awayTeam: {
      id: a2.id || `espn-p2-${comp.id}`,
      name: a2.displayName || 'Player 2',
      logo: (a2.headshot || {}).href || (a2.flag || {}).href || null,
      flag: (a2.flag || {}).href || null,
      seed: p2.seed || null,
      winner: p2.winner || null
    },
    score: {
      home: score1 ? parseInt(score1) : null,
      away: score2 ? parseInt(score2) : null,
      detail: statusDetail,
      ht: { home: null, away: null }
    },
    venue: (event.venue || {}).fullName || 'Tennis Court',
    tennis: {
      surface: extractSurface(tournament, ''),
      round,
      eventType: tour.name,
      tournament,
      tour: tour.id.toUpperCase()
    }
  };
}

async function fetchFromTheSportsDB(date) {
  const response = await axios.get(`${THESPORTSDB_BASE}/eventsday.php`, {
    params: { d: date, s: 'Tennis' },
    timeout: 10000
  });

  const events = response.data?.events || [];
  return events.map(event => formatTheSportsDBMatch(event, date));
}

function formatTheSportsDBMatch(event, date) {
  const eventName = event.strEvent || '';
  const parts = eventName.split(' vs ');

  let homePlayer = 'Player 1';
  let awayPlayer = 'Player 2';

  if (parts.length === 2) {
    awayPlayer = parts[1].trim();
    const beforeVs = parts[0];
    const lastSpace = beforeVs.lastIndexOf(' ');
    homePlayer = lastSpace > 0 ? beforeVs.substring(lastSpace + 1).trim() : beforeVs.trim();
  }

  let status = 'NS';
  let statusLong = 'Not Started';
  const eventStatus = event.strStatus?.toLowerCase() || '';

  if (eventStatus.includes('match finished') || eventStatus === 'ft') {
    status = 'FT';
    statusLong = 'Terminé';
  } else if (eventStatus.includes('live') || eventStatus.includes('in play')) {
    status = 'LIVE';
    statusLong = 'En cours';
  }

  const homeScore = event.intHomeScore ? parseInt(event.intHomeScore) : null;
  const awayScore = event.intAwayScore ? parseInt(event.intAwayScore) : null;

  return {
    id: `tennis-sdb-${event.idEvent}`,
    sport: 'tennis',
    source: 'TheSportsDB',
    fixtureId: event.idEvent,
    date: event.strTimestamp || event.dateEvent,
    status,
    statusLong,
    league: {
      id: event.idLeague || 0,
      name: event.strLeague || extractTournamentName(event.strEvent, event.strLeague),
      country: event.strCountry || 'International',
      logo: event.strLeagueBadge || null,
      round: event.intRound ? `Round ${event.intRound}` : 'Main Draw'
    },
    homeTeam: {
      id: event.idHomeTeam || `home-${event.idEvent}`,
      name: homePlayer,
      logo: event.strHomeTeamBadge || null,
      flag: null,
      seed: null,
      winner: homeScore !== null && awayScore !== null ? homeScore > awayScore : null
    },
    awayTeam: {
      id: event.idAwayTeam || `away-${event.idEvent}`,
      name: awayPlayer,
      logo: event.strAwayTeamBadge || null,
      flag: null,
      seed: null,
      winner: homeScore !== null && awayScore !== null ? awayScore > homeScore : null
    },
    score: {
      home: homeScore,
      away: awayScore,
      ht: { home: null, away: null }
    },
    venue: event.strVenue || 'Tennis Court',
    tennis: {
      surface: extractSurface(event.strEvent, event.strLeague),
      round: event.intRound || null,
      eventType: event.strLeague || 'Tournament',
      tournament: event.strLeague || extractTournamentName(event.strEvent, event.strLeague),
      tour: ''
    }
  };
}

function extractTournamentName(eventName, leagueName) {
  if (leagueName) return leagueName;
  const vsIndex = (eventName || '').indexOf(' vs ');
  if (vsIndex > 0) {
    const beforeVs = eventName.substring(0, vsIndex);
    const lastSpace = beforeVs.lastIndexOf(' ');
    return lastSpace > 0 ? beforeVs.substring(0, lastSpace).trim() : 'Tennis Tournament';
  }
  return 'Tennis Tournament';
}

function extractSurface(eventName, leagueName) {
  const text = `${eventName} ${leagueName}`.toLowerCase();
  if (text.includes('roland') || text.includes('french') || text.includes('monte carlo') ||
      text.includes('madrid') || text.includes('rome') || text.includes('barcelona')) {
    return 'Clay';
  }
  if (text.includes('wimbledon') || text.includes('halle') || text.includes("queen's")) {
    return 'Grass';
  }
  if (text.includes('us open') || text.includes('australian') || text.includes('miami') ||
      text.includes('indian wells') || text.includes('cincinnati')) {
    return 'Hard';
  }
  return 'Hard';
}

async function getLiveTennisMatches() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const matches = await getTennisMatches(today);
    return matches.filter(m => m.status === 'LIVE');
  } catch (error) {
    console.error(`[TENNIS] Error fetching live matches:`, error.message);
    return [];
  }
}

module.exports = {
  getTennisMatches,
  getLiveTennisMatches
};
