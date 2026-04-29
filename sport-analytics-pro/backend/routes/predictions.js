const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

router.get('/history', authenticateToken, async (req, res) => {
  res.json({ message: 'Historique des prédictions' });
});

module.exports = router;
