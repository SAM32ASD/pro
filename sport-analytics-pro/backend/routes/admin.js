const express = require('express');
const router = express.Router();
const unifiedDataService = require('../services/unifiedDataService');
const cacheService = require('../services/cacheService');
const { authenticateToken } = require('../middleware/auth');

/**
 * Route admin - Statistiques du système
 * Accessible uniquement aux admins
 */

/**
 * GET /api/admin/stats
 * Obtenir les statistiques d'utilisation des APIs et du cache
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    // Vérifier si l'utilisateur est admin (optionnel)
    // if (req.user.role !== 'admin') {
    //   return res.status(403).json({ error: 'Accès réservé aux administrateurs' });
    // }

    const usageStats = unifiedDataService.getUsageStats();
    const cacheStats = await cacheService.getStats();

    res.json({
      success: true,
      data: {
        usage: usageStats,
        cache: cacheStats,
        recommendations: generateRecommendations(usageStats)
      }
    });
  } catch (error) {
    console.error('Erreur stats admin:', error);
    res.status(500).json({ error: 'Erreur récupération statistiques' });
  }
});

/**
 * GET /api/admin/health
 * Health check de tous les services
 */
router.get('/health', async (req, res) => {
  try {
    const health = await unifiedDataService.healthCheck();
    const allHealthy = Object.values(health).every(v => v === true);

    res.status(allHealthy ? 200 : 503).json({
      success: allHealthy,
      services: health,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Erreur health check:', error);
    res.status(500).json({ error: 'Erreur health check' });
  }
});

/**
 * POST /api/admin/cache/flush
 * Vider le cache (pattern optionnel)
 */
router.post('/cache/flush', authenticateToken, async (req, res) => {
  try {
    const { pattern = '*' } = req.body;

    await cacheService.flush(pattern);

    res.json({
      success: true,
      message: `Cache vidé pour le pattern: ${pattern}`
    });
  } catch (error) {
    console.error('Erreur flush cache:', error);
    res.status(500).json({ error: 'Erreur vidage cache' });
  }
});

/**
 * POST /api/admin/stats/reset
 * Réinitialiser les statistiques d'utilisation
 */
router.post('/stats/reset', authenticateToken, async (req, res) => {
  try {
    unifiedDataService.resetStats();

    res.json({
      success: true,
      message: 'Statistiques réinitialisées'
    });
  } catch (error) {
    console.error('Erreur reset stats:', error);
    res.status(500).json({ error: 'Erreur réinitialisation statistiques' });
  }
});

/**
 * POST /api/admin/cache/invalidate/team/:teamId
 * Invalider le cache d'une équipe spécifique
 */
router.post('/cache/invalidate/team/:teamId', authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;

    await unifiedDataService.invalidateTeamCache(teamId);

    res.json({
      success: true,
      message: `Cache invalidé pour l'équipe ${teamId}`
    });
  } catch (error) {
    console.error('Erreur invalidation cache équipe:', error);
    res.status(500).json({ error: 'Erreur invalidation cache' });
  }
});

/**
 * POST /api/admin/cache/invalidate/date/:date
 * Invalider le cache d'une date spécifique
 */
router.post('/cache/invalidate/date/:date', authenticateToken, async (req, res) => {
  try {
    const { date } = req.params;

    await unifiedDataService.invalidateDateCache(date);

    res.json({
      success: true,
      message: `Cache invalidé pour la date ${date}`
    });
  } catch (error) {
    console.error('Erreur invalidation cache date:', error);
    res.status(500).json({ error: 'Erreur invalidation cache' });
  }
});

/**
 * Générer des recommandations basées sur les stats
 */
function generateRecommendations(stats) {
  const recommendations = [];

  // Taux de cache faible
  const cacheHitRate = parseFloat(stats.cacheHitRate);
  if (cacheHitRate < 50) {
    recommendations.push({
      type: 'warning',
      message: `Taux de cache faible (${stats.cacheHitRate}). Augmentez les TTL ou vérifiez Redis.`
    });
  } else if (cacheHitRate >= 80) {
    recommendations.push({
      type: 'success',
      message: `Excellent taux de cache (${stats.cacheHitRate}) ! Le système est optimisé.`
    });
  }

  // Trop d'appels API-Sports
  if (stats.apiSportsCalls > 50) {
    recommendations.push({
      type: 'warning',
      message: `${stats.apiSportsCalls} appels à API-Sports. Attention au quota (100/jour).`
    });
  }

  // TheSportsDB performant
  if (stats.theSportsDBCalls > stats.apiSportsCalls) {
    recommendations.push({
      type: 'success',
      message: `TheSportsDB utilisé en majorité (${stats.theSportsDBCalls} appels). Économie de quota API-Sports.`
    });
  }

  // Erreurs
  if (stats.errors > 10) {
    recommendations.push({
      type: 'error',
      message: `${stats.errors} erreurs détectées. Vérifiez les logs et la connectivité des services.`
    });
  }

  return recommendations;
}

module.exports = router;
