const express = require('express');
const router = express.Router();
const apiSports = require('../services/apiSports');
const { authenticateToken } = require('../middleware/auth');

router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q, sport = 'football' } = req.query;
    
    if (!q || q.length < 2) {
      return res.status(400).json({ error: 'Query trop courte' });
    }

    const results = await apiSports.searchTeams(q, sport);
    
    res.json({
      success: true,
      data: results.map(t => ({
        id: t.id,
        name: t.name,
        country: t.country?.name,
        logo: t.logo
      }))
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
