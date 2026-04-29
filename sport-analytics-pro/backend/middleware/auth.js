const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

/**
 * Limite spécifique pour les routes d'analyse (coûteuses en ressources)
 */
const analysisLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requêtes par 15 minutes
  message: {
    success: false,
    error: 'Trop de requêtes d\'analyse. Veuillez patienter 15 minutes.',
    retryAfter: 900 // secondes
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Utiliser l'ID utilisateur si disponible, sinon l'IP
    return req.user?.id || req.ip;
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  }
});

/**
 * Limite pour les routes d'authentification (prévention brute force)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 tentatives de connexion par 15 minutes
  skipSuccessfulRequests: true, // Ne pas compter les succès
  message: {
    success: false,
    error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
  }
});

/**
 * Middleware d'authentification JWT
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ 
      success: false,
      error: 'Token d\'authentification requis',
      code: 'TOKEN_MISSING'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      // Différencier les types d'erreurs JWT
      if (err.name === 'TokenExpiredError') {
        return res.status(403).json({ 
          success: false,
          error: 'Token expiré. Veuillez vous reconnecter.',
          code: 'TOKEN_EXPIRED',
          expiredAt: err.expiredAt
        });
      }
      
      if (err.name === 'JsonWebTokenError') {
        return res.status(403).json({ 
          success: false,
          error: 'Token invalide',
          code: 'TOKEN_INVALID'
        });
      }

      return res.status(403).json({ 
        success: false,
        error: 'Erreur d\'authentification',
        code: 'AUTH_ERROR'
      });
    }

    req.user = user;
    next();
  });
};

/**
 * Middleware de vérification des quotas API
 */
const checkApiQuota = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const today = new Date().toISOString().split('T')[0];
    const key = `api_quota:${userId}:${today}`;
    
    const redis = require('../config/redis');
    const current = await redis.incr(key);
    
    // Définir l'expiration au premier appel (expire à minuit)
    if (current === 1) {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const secondsUntilMidnight = Math.floor((midnight - now) / 1000);
      
      await redis.expire(key, secondsUntilMidnight);
    }
    
    // Définir les limites selon le plan
    const limits = {
      free: 100,
      pro: 1000,
      enterprise: 10000
    };
    
    const limit = limits[req.user.plan] || limits.free;
    
    if (current > limit) {
      return res.status(429).json({
        success: false,
        error: 'Quota API quotidien dépassé',
        quota: {
          limit,
          used: current - 1,
          remaining: 0,
          plan: req.user.plan,
          upgradeUrl: '/upgrade'
        }
      });
    }
    
    // Ajouter les headers de quota
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - current));
    res.setHeader('X-RateLimit-Used', current);
    res.setHeader('X-RateLimit-Plan', req.user.plan);
    
    next();
    
  } catch (error) {
    console.error('Erreur vérification quota:', error);
    // En cas d'erreur Redis, continuer sans limitation (fail open)
    next();
  }
};

/**
 * Middleware optionnel: vérifier le rôle admin
 */
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Accès réservé aux administrateurs'
    });
  }
  next();
};

module.exports = {
  authenticateToken,
  analysisLimiter,
  authLimiter,
  checkApiQuota,
  requireAdmin
};