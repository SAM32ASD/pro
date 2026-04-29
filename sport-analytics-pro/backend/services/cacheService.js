const redis = require('redis');

/**
 * Service de cache intelligent avec Redis
 * Réduit les appels API de 80-90%
 */
class CacheService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.memoryCache = new Map(); // Fallback si Redis indisponible

    // Durées de vie du cache (en secondes)
    this.TTL = {
      MATCHES_TODAY: 60 * 15,      // 15 minutes (matchs du jour)
      MATCHES_UPCOMING: 60 * 60,   // 1 heure (prochains matchs)
      MATCHES_PAST: 60 * 60 * 24,  // 24 heures (matchs passés)
      TEAM_INFO: 60 * 60 * 24 * 7, // 7 jours (infos équipe)
      TEAM_STATS: 60 * 30,         // 30 minutes (stats équipe)
      LEAGUE_INFO: 60 * 60 * 24,   // 24 heures (infos ligue)
      ANALYSIS: 60 * 60,           // 1 heure (résultat d'analyse)
      H2H: 60 * 60 * 12            // 12 heures (confrontations directes)
    };

    this.init();
  }

  /**
   * Initialiser la connexion Redis
   */
  async init() {
    try {
      // Tenter de se connecter à Redis
      if (process.env.REDIS_URL) {
        this.client = redis.createClient({
          url: process.env.REDIS_URL,
          socket: {
            reconnectStrategy: (retries) => {
              if (retries > 3) {
                console.warn('Redis: Trop de tentatives, utilisation du cache mémoire');
                return false;
              }
              return Math.min(retries * 100, 3000);
            }
          }
        });

        this.client.on('error', (err) => {
          console.error('Redis Error:', err.message);
          this.isConnected = false;
        });

        this.client.on('connect', () => {
          console.log('✅ Redis connecté');
          this.isConnected = true;
        });

        await this.client.connect();
      } else {
        console.warn('⚠️ REDIS_URL non configuré, utilisation du cache mémoire');
      }
    } catch (error) {
      console.error('❌ Redis non disponible, fallback vers cache mémoire:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Obtenir une valeur du cache
   */
  async get(key) {
    try {
      if (this.isConnected && this.client) {
        const value = await this.client.get(key);
        if (value) {
          return JSON.parse(value);
        }
      } else {
        // Fallback cache mémoire
        const cached = this.memoryCache.get(key);
        if (cached && cached.expires > Date.now()) {
          return cached.value;
        }
      }
      return null;
    } catch (error) {
      console.error('Cache get error:', error.message);
      return null;
    }
  }

  /**
   * Définir une valeur dans le cache
   */
  async set(key, value, ttl = 3600) {
    try {
      if (this.isConnected && this.client) {
        await this.client.setEx(key, ttl, JSON.stringify(value));
      } else {
        // Fallback cache mémoire avec expiration
        this.memoryCache.set(key, {
          value,
          expires: Date.now() + (ttl * 1000)
        });

        // Nettoyer le cache mémoire si trop gros
        if (this.memoryCache.size > 1000) {
          this.cleanMemoryCache();
        }
      }
      return true;
    } catch (error) {
      console.error('Cache set error:', error.message);
      return false;
    }
  }

  /**
   * Supprimer une clé du cache
   */
  async del(key) {
    try {
      if (this.isConnected && this.client) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (error) {
      console.error('Cache del error:', error.message);
      return false;
    }
  }

  /**
   * Vider le cache (pattern)
   */
  async flush(pattern = '*') {
    try {
      if (this.isConnected && this.client) {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          await this.client.del(keys);
        }
      } else {
        if (pattern === '*') {
          this.memoryCache.clear();
        } else {
          // Supprimer les clés correspondantes au pattern
          for (const key of this.memoryCache.keys()) {
            if (key.includes(pattern.replace('*', ''))) {
              this.memoryCache.delete(key);
            }
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Cache flush error:', error.message);
      return false;
    }
  }

  /**
   * Nettoyer le cache mémoire (supprimer les entrées expirées)
   */
  cleanMemoryCache() {
    const now = Date.now();
    for (const [key, data] of this.memoryCache.entries()) {
      if (data.expires < now) {
        this.memoryCache.delete(key);
      }
    }
  }

  /**
   * Générer une clé de cache
   */
  generateKey(prefix, ...params) {
    return `${prefix}:${params.join(':')}`;
  }

  /**
   * Wrapper pour récupérer ou calculer une valeur
   */
  async getOrSet(key, fetchFn, ttl = 3600) {
    // Essayer de récupérer du cache
    const cached = await this.get(key);
    if (cached !== null) {
      console.log(`✅ Cache HIT: ${key}`);
      return cached;
    }

    // Cache miss, calculer la valeur
    console.log(`❌ Cache MISS: ${key}`);
    try {
      const value = await fetchFn();
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttl);
      }
      return value;
    } catch (error) {
      console.error('Error in getOrSet:', error.message);
      throw error;
    }
  }

  /**
   * Obtenir les statistiques du cache
   */
  async getStats() {
    try {
      if (this.isConnected && this.client) {
        const info = await this.client.info('stats');
        const keyspace = await this.client.info('keyspace');

        return {
          connected: true,
          type: 'redis',
          info,
          keyspace
        };
      } else {
        // Nettoyer avant de compter
        this.cleanMemoryCache();

        return {
          connected: false,
          type: 'memory',
          keys: this.memoryCache.size,
          maxKeys: 1000
        };
      }
    } catch (error) {
      return {
        connected: false,
        error: error.message
      };
    }
  }

  /**
   * Fermer la connexion Redis
   */
  async close() {
    if (this.isConnected && this.client) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
}

module.exports = new CacheService();
