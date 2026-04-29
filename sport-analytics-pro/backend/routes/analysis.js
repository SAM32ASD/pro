const express = require('express');
const router = express.Router();
const analysisEngine = require('../services/analysisEngine');
const db = require('../config/database');
const { authenticateToken, analysisLimiter } = require('../middleware/auth');

router.post('/match', authenticateToken, analysisLimiter, async (req, res) => {
  try {
    const { homeTeamId, awayTeamId, sport, season } = req.body;

    if (!homeTeamId || !awayTeamId || !sport || !season) {
      return res.status(400).json({ error: 'Paramètres requis manquants' });
    }

    const analysis = await analysisEngine.analyzeUpcomingMatch(
      parseInt(homeTeamId),
      parseInt(awayTeamId),
      sport,
      season.toString()
    );

    const homeTeam = await db.query('SELECT name, logo_url FROM teams WHERE api_id = $1', [homeTeamId]);
    const awayTeam = await db.query('SELECT name, logo_url FROM teams WHERE api_id = $1', [awayTeamId]);

    analysis.homeTeam.name = homeTeam.rows[0]?.name || 'Équipe A';
    analysis.homeTeam.logo = homeTeam.rows[0]?.logo_url;
    analysis.awayTeam.name = awayTeam.rows[0]?.name || 'Équipe B';
    analysis.awayTeam.logo = awayTeam.rows[0]?.logo_url;

    res.json({
      success: true,
      data: analysis,
      meta: { sport, season, analyzedAt: new Date().toISOString() }
    });

  } catch (error) {
    console.error('Erreur analyse:', error);
    res.status(500).json({ error: "Erreur lors de l'analyse" });
  }
});

module.exports = router;
