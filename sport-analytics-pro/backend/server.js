/**
 * server.js - API Server complet avec authentification JWT, 
 * gestion d'erreurs centralisée et architecture modulaire
 * 
 * Architecture: Express.js + JWT Auth + Rate Limiting + Validation
 * Date: 2026
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');

// ═══════════════════════════════════════════════════════════════
// CONFIGURATION & CONSTANTES
// ═══════════════════════════════════════════════════════════════

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Configuration JWT
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET || 'votre-secret-tres-securise-128-bits-min',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  issuer: process.env.JWT_ISSUER || 'prediction-api',
  audience: process.env.JWT_AUDIENCE || 'prediction-client'
};

// Base de données simulée (remplacer par MongoDB/PostgreSQL en production)
const db = {
  users: new Map(),
  predictions: new Map(),
  refreshTokens: new Set()
};

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARES DE SÉCURITÉ & LOGGING
// ═══════════════════════════════════════════════════════════════

// Sécurité HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// CORS configuration
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
  credentials: true,
  maxAge: 86400
}));

// Parsing JSON avec limite de taille
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging des requêtes
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate Limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes par fenêtre
  message: {
    status: 'error',
    code: 429,
    message: 'Trop de requêtes, veuillez réessayer plus tard'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip
});
app.use(globalLimiter);

// Rate Limiting strict pour auth (désactivé temporairement)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, // 100 tentatives de login (augmenté temporairement)
  skipSuccessfulRequests: true,
  message: {
    status: 'error',
    code: 429,
    message: 'Trop de tentatives de connexion, veuillez réessayer dans 15 minutes'
  }
});

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARES D'AUTHENTIFICATION & AUTORISATION
// ═══════════════════════════════════════════════════════════════

/**
 * Middleware d'authentification JWT
 * Vérifie le token Bearer et attache l'utilisateur à req.user
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.slice(7) 
    : null;

  // Token manquant
  if (!token) {
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: 'Authentification requise: Aucun token fourni',
      timestamp: new Date().toISOString()
    });
  }

  try {
    // Vérification complète avec claims
    const decoded = jwt.verify(token, JWT_CONFIG.secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
      algorithms: ['HS256'] // Whitelist des algorithmes sécurisés
    });

    // Vérification optionnelle de blacklist (pour logout/déconnexion)
    if (db.refreshTokens.has(`blacklist:${token}`)) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Token révoqué, veuillez vous reconnecter'
      });
    }

    // Attacher les infos utilisateur à la requête
    req.user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'user',
      permissions: decoded.permissions || []
    };

    next();
  } catch (error) {
    // Gestion spécifique des erreurs JWT
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Token expiré, veuillez vous reconnecter',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Token invalide: format incorrect'
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Token non encore actif'
      });
    }

    // Erreur générique
    return res.status(403).json({
      status: 'error',
      code: 403,
      message: 'Token invalide'
    });
  }
};

/**
 * Middleware de vérification des rôles (RBAC)
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentification requise'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Accès interdit: permissions insuffisantes',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

/**
 * Middleware de validation des résultats express-validator
 */
const validate = (validations) => {
  return async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      status: 'error',
      code: 400,
      message: 'Validation échouée',
      errors: extractedErrors
    });
  };
};

/**
 * Middleware de logging des requêtes personnalisé
 */
const requestLogger = (req, res, next) => {
  const requestId = req.headers['x-request-id'] || 
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  res.setHeader('X-Request-ID', requestId);

  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      requestId,
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };

    if (NODE_ENV === 'production') {
      console.log(JSON.stringify(logData));
    } else {
      console.log(`[${requestId}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    }
  });

  next();
};

app.use(requestLogger);

// ═══════════════════════════════════════════════════════════════
// SERVICES MÉTIER (Logique de Prédiction)
// ═══════════════════════════════════════════════════════════════

/**
 * Service de prédiction simulé
 * En production: intégrer TensorFlow.js, Python microservice, etc.
 */
class PredictionService {
  static async predict(data, modelType = 'default') {
    // Simulation d'un traitement de prédiction
    const startTime = Date.now();
    
    // Validation des données d'entrée
    if (!data || typeof data !== 'object') {
      throw new Error('Données d\'entrée invalides');
    }

    // Simulation de traitement ML (async)
    await new Promise(resolve => setTimeout(resolve, 100));

    // Génération d'une prédiction simulée basée sur les inputs
    const prediction = {
      id: `pred-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      model: modelType,
      input: data,
      output: {
        confidence: Math.random() * 0.4 + 0.6, // 60-100%
        prediction: Math.random() > 0.5 ? 'positive' : 'negative',
        probability: Math.random(),
        features_importance: {
          feature1: Math.random(),
          feature2: Math.random()
        }
      },
      metadata: {
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      }
    };

    return prediction;
  }

  static async getHistory(userId, limit = 10) {
    const history = [];
    for (const [id, pred] of db.predictions) {
      if (pred.userId === userId) {
        history.push(pred);
      }
    }
    return history
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, limit);
  }
}

// ═══════════════════════════════════════════════════════════════
// ROUTES D'AUTHENTIFICATION
// ═══════════════════════════════════════════════════════════════

const authRouter = express.Router();

// Inscription
authRouter.post('/register',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail().withMessage('Email invalide'),
    body('password')
      .isLength({ min: 8 }).withMessage('Mot de passe: min 8 caractères')
      .matches(/[A-Z]/).withMessage('Doit contenir une majuscule')
      .matches(/[0-9]/).withMessage('Doit contenir un chiffre'),
    body('name').trim().isLength({ min: 2 }).withMessage('Nom requis')
  ]),
  async (req, res, next) => {
    try {
      const { email, password, name } = req.body;

      // Vérification doublon
      for (const user of db.users.values()) {
        if (user.email === email) {
          return res.status(409).json({
            status: 'error',
            code: 409,
            message: 'Un utilisateur existe déjà avec cet email'
          });
        }
      }

      // Hash du mot de passe
      const hashedPassword = await bcrypt.hash(password, 12);
      
      // Création utilisateur
      const userId = `user-${Date.now()}`;
      const user = {
        id: userId,
        email,
        name,
        password: hashedPassword,
        role: 'user',
        createdAt: new Date().toISOString(),
        lastLogin: null
      };

      db.users.set(userId, user);

      res.status(201).json({
        status: 'success',
        message: 'Utilisateur créé avec succès',
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Connexion
authRouter.post('/login',
  authLimiter,
  validate([
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ]),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Recherche utilisateur
      let user = null;
      for (const u of db.users.values()) {
        if (u.email === email) {
          user = u;
          break;
        }
      }

      if (!user) {
        return res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Vérification mot de passe
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({
          status: 'error',
          code: 401,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Mise à jour lastLogin
      user.lastLogin = new Date().toISOString();

      // Génération tokens
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };

      const accessToken = jwt.sign(payload, JWT_CONFIG.secret, {
        expiresIn: JWT_CONFIG.expiresIn,
        issuer: JWT_CONFIG.issuer,
        audience: JWT_CONFIG.audience
      });

      const refreshToken = jwt.sign(
        { sub: user.id, type: 'refresh' }, 
        JWT_CONFIG.secret, 
        { expiresIn: JWT_CONFIG.refreshExpiresIn }
      );

      db.refreshTokens.add(refreshToken);

      res.json({
        status: 'success',
        message: 'Connexion réussie',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          tokens: {
            accessToken,
            refreshToken,
            expiresIn: JWT_CONFIG.expiresIn,
            type: 'Bearer'
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

// Rafraîchissement du token
authRouter.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken || !db.refreshTokens.has(refreshToken)) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Refresh token invalide'
      });
    }

    const decoded = jwt.verify(refreshToken, JWT_CONFIG.secret);
    
    if (decoded.type !== 'refresh') {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Token type invalide'
      });
    }

    const user = db.users.get(decoded.sub);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Utilisateur non trouvé'
      });
    }

    // Rotation: supprimer l'ancien refresh token
    db.refreshTokens.delete(refreshToken);

    // Nouveau access token
    const newAccessToken = jwt.sign(
      { sub: user.id, email: user.email, role: user.role },
      JWT_CONFIG.secret,
      { expiresIn: JWT_CONFIG.expiresIn, issuer: JWT_CONFIG.issuer, audience: JWT_CONFIG.audience }
    );

    const newRefreshToken = jwt.sign(
      { sub: user.id, type: 'refresh' },
      JWT_CONFIG.secret,
      { expiresIn: JWT_CONFIG.refreshExpiresIn }
    );

    db.refreshTokens.add(newRefreshToken);

    res.json({
      status: 'success',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_CONFIG.expiresIn
      }
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        code: 401,
        message: 'Refresh token expiré, veuillez vous reconnecter'
      });
    }
    next(error);
  }
});

// Déconnexion (révocation token)
authRouter.post('/logout', authenticateToken, async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader.slice(7);

  // Ajouter à la blacklist (avec TTL)
  db.refreshTokens.add(`blacklist:${token}`);
  
  // Nettoyage après expiration
  setTimeout(() => {
    db.refreshTokens.delete(`blacklist:${token}`);
  }, 15 * 60 * 1000); // 15 min

  res.json({
    status: 'success',
    message: 'Déconnexion réussie'
  });
});

app.use('/api/auth', authRouter);

// ═══════════════════════════════════════════════════════════════
// ROUTES DE PRÉDICTION (Protégées)
// ═══════════════════════════════════════════════════════════════

const predictionRouter = express.Router();

// Toutes les routes de prédiction nécessitent authentification
predictionRouter.use(authenticateToken);

// Créer une prédiction
predictionRouter.post('/',
  validate([
    body('data').isObject().withMessage('Les données doivent être un objet'),
    body('modelType').optional().isIn(['default', 'advanced', 'legacy']).withMessage('Type de modèle invalide')
  ]),
  async (req, res, next) => {
    try {
      const { data, modelType = 'default' } = req.body;

      // Appel au service de prédiction
      const prediction = await PredictionService.predict(data, modelType);
      
      // Stockage dans l'historique
      const predictionRecord = {
        ...prediction,
        userId: req.user.id,
        createdAt: new Date().toISOString()
      };
      db.predictions.set(prediction.id, predictionRecord);

      res.status(201).json({
        status: 'success',
        data: prediction
      });
    } catch (error) {
      next(error);
    }
  }
);

// Obtenir l'historique des prédictions
predictionRouter.get('/history', async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const history = await PredictionService.getHistory(req.user.id, limit);

    res.json({
      status: 'success',
      count: history.length,
      data: history
    });
  } catch (error) {
    next(error);
  }
});

// Obtenir une prédiction spécifique
predictionRouter.get('/:id', async (req, res, next) => {
  try {
    const prediction = db.predictions.get(req.params.id);
    
    if (!prediction) {
      return res.status(404).json({
        status: 'error',
        code: 404,
        message: 'Prédiction non trouvée'
      });
    }

    // Vérification propriété
    if (prediction.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        code: 403,
        message: 'Accès non autorisé à cette prédiction'
      });
    }

    res.json({
      status: 'success',
      data: prediction
    });
  } catch (error) {
    next(error);
  }
});

// Route admin: statistiques globales
predictionRouter.get('/admin/stats',
  requireRole('admin'),
  async (req, res) => {
    const stats = {
      totalPredictions: db.predictions.size,
      totalUsers: db.users.size,
      activeTokens: db.refreshTokens.size,
      serverTime: new Date().toISOString()
    };

    res.json({
      status: 'success',
      data: stats
    });
  }
);

app.use('/api/predictions', predictionRouter);

// ═══════════════════════════════════════════════════════════════
// ROUTES MULTI-SPORTS (Architecture unifiée)
// ═══════════════════════════════════════════════════════════════

const axios = require('axios');
const sportsRouter = require('./routes/sports');

// Route unifiée pour tous les sports
app.use('/api/matches', sportsRouter);

// ═══════════════════════════════════════════════════════════════
// ROUTES PUBLIQUES & HEALTH CHECK
// ═══════════════════════════════════════════════════════════════

// Health check pour monitoring (Load Balancer, Kubernetes)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: NODE_ENV,
    version: process.env.npm_package_version || '1.0.0'
  });
});

// Readiness probe
app.get('/ready', (req, res) => {
  // Vérifier connexions DB, services externes, etc.
  const isReady = true; // Simplifié pour l'exemple
  
  if (isReady) {
    res.status(200).json({ status: 'ready' });
  } else {
    res.status(503).json({ status: 'not ready' });
  }
});

// Route racine
app.get('/', (req, res) => {
  res.json({
    name: 'Prediction API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/health'
  });
});

// ═══════════════════════════════════════════════════════════════
// GESTION GLOBALE DES ERREURS
// ═══════════════════════════════════════════════════════════════

// Servir le frontend build (production) — chemin configurable via FRONTEND_DIST
const frontendDist = process.env.FRONTEND_DIST || path.resolve(__dirname, '../frontend/dist');
if (NODE_ENV === 'production' && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist, { maxAge: '1d', index: false }));
  app.get(/^\/(?!api|health|ready).*/, (req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// 404 - Route non trouvée
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    code: 404,
    message: `Route ${req.method} ${req.originalUrl} non trouvée`,
    timestamp: new Date().toISOString()
  });
});

// Middleware d'erreur global
app.use((err, req, res, next) => {
  // Log détaillé côté serveur
  console.error(`[ERROR ${req.requestId}]`, {
    message: err.message,
    stack: NODE_ENV === 'development' ? err.stack : undefined,
    url: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Erreurs de validation JWT déjà gérées
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      status: 'error',
      code: 401,
      message: 'Non autorisé'
    });
  }

  // Erreur de syntaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      status: 'error',
      code: 400,
      message: 'JSON malformé dans le body'
    });
  }

  // Erreur par défaut (ne pas exposer les détails en production)
  const statusCode = err.statusCode || err.status || 500;
  const message = NODE_ENV === 'production' 
    ? 'Erreur serveur interne' 
    : err.message;

  res.status(statusCode).json({
    status: 'error',
    code: statusCode,
    message: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
    timestamp: new Date().toISOString(),
    requestId: req.requestId
  });
});

// ═══════════════════════════════════════════════════════════════
// GESTION DES PROCESSUS & DÉMARRAGE
// ═══════════════════════════════════════════════════════════════

// Gestion gracieuse des signaux d'arrêt
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} reçu. Arrêt gracieux...`);
  
  // Fermeture connexions DB, file d'attente, etc.
  // await db.close();
  
  server.close(() => {
    console.log('Serveur HTTP fermé');
    process.exit(0);
  });

  // Force après 10s si bloqué
  setTimeout(() => {
    console.error('Arrêt forcé après timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Gestion erreurs non capturées
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Démarrage serveur
const server = app.listen(PORT, () => {
  console.log(`
  ╔════════════════════════════════════════════════════════════╗
  ║                   🚀 SERVER STARTED                        ║
  ╠════════════════════════════════════════════════════════════╣
  ║  Environment: ${NODE_ENV.padEnd(35)}║
  ║  Port:        ${PORT.toString().padEnd(35)}║
  ║  JWT Expires: ${JWT_CONFIG.expiresIn.padEnd(35)}║
  ╚════════════════════════════════════════════════════════════╝
  `);
  
  if (NODE_ENV === 'development') {
    console.log('Routes disponibles:');
    console.log('  POST /api/auth/register    - Inscription');
    console.log('  POST /api/auth/login       - Connexion');
    console.log('  POST /api/auth/refresh     - Rafraîchir token');
    console.log('  POST /api/predictions      - Créer prédiction [Auth]');
    console.log('  GET  /api/predictions/history - Historique [Auth]');
    console.log('  GET  /health               - Health check');
  }
});

module.exports = app; // Pour les tests