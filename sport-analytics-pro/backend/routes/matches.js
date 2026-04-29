const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/upcoming', authenticateToken, async (req, res) => {
  res.json({ message: 'Matchs à venir' });
});

module.exports = router;
