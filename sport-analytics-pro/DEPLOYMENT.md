# 🚀 Guide de Déploiement - Sport Analytics Pro

## Corrections appliquées pour la production

### ✅ Bugs corrigés

1. **Problème de chargement des matchs après connexion**
   - ❌ Avant : `window.location.href` causait un hard reload et les matchs n'étaient pas chargés
   - ✅ Après : Navigation Vue Router normale + préchargement des matchs dans le store auth

2. **Typo dans la fonction `getConfidenceBarColor`**
   - ❌ Avant : `getaConfidenceBarColor` (avec typo)
   - ✅ Après : `getConfidenceBarColor` (corrigé)

3. **Logs en production**
   - ❌ Avant : `console.log/error` partout dans le code
   - ✅ Après : Logger conditionnel (`logger.js`) qui ne log qu'en développement

4. **Optimisation du chargement**
   - ✅ Les matchs ne se rechargent plus si déjà présents dans le store
   - ✅ Préchargement automatique des matchs après connexion réussie

---

## 📋 Prérequis

- Node.js 18+ 
- npm ou yarn
- Compte API-Sports (https://www.api-football.com/)
- Serveur pour déploiement (Vercel, Netlify, Railway, etc.)

---

## 🔧 Configuration

### 1. Variables d'environnement

#### Backend (`backend/.env`)

```bash
NODE_ENV=production
PORT=3000

# JWT - IMPORTANT: Changez ces valeurs !
JWT_SECRET=votre-secret-jwt-ultra-securise-256-bits-minimum
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=sport-analytics-api
JWT_AUDIENCE=sport-analytics-client

# API Sports
VITE_API_SPORTS_KEY=votre-cle-api-sports

# CORS
CORS_ORIGIN=https://votre-frontend.com
```

#### Frontend (`frontend/.env`)

```bash
VITE_API_URL=https://votre-backend.com/api
```

---

## 📦 Build

### Backend

```bash
cd backend
npm install --production
npm start
```

### Frontend

```bash
cd frontend
npm install
npm run build
# Le dossier dist/ contient les fichiers statiques à déployer
```

---

## 🌐 Options de déploiement

### Option 1 : Vercel (Recommandé pour le frontend)

**Frontend:**
```bash
cd frontend
npm install -g vercel
vercel --prod
```

**Backend:**
- Créez un nouveau projet sur Vercel
- Importez le repo GitHub
- Définissez `backend` comme root directory
- Ajoutez les variables d'environnement dans Settings

### Option 2 : Netlify (Frontend)

```bash
cd frontend
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

### Option 3 : Railway (Backend)

1. Créez un compte sur Railway.app
2. Créez un nouveau projet
3. Connectez votre repo GitHub
4. Railway détecte automatiquement Node.js
5. Ajoutez les variables d'environnement

### Option 4 : Heroku (Backend)

```bash
# Installer Heroku CLI
heroku login
heroku create sport-analytics-api

# Variables d'environnement
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=votre-secret
heroku config:set VITE_API_SPORTS_KEY=votre-cle

# Déploiement
git subtree push --prefix backend heroku main
```

### Option 5 : VPS (DigitalOcean, AWS, etc.)

```bash
# Sur le serveur
git clone votre-repo
cd sport-analytics-pro

# Backend
cd backend
npm install --production
pm2 start server.js --name sport-analytics-api

# Frontend (avec nginx)
cd ../frontend
npm run build
# Copier dist/ dans /var/www/html
```

---

## 🔒 Sécurité - Checklist avant production

### ✅ Variables d'environnement

- [ ] `JWT_SECRET` changé (minimum 32 caractères aléatoires)
- [ ] `VITE_API_SPORTS_KEY` configurée avec votre clé
- [ ] `CORS_ORIGIN` défini avec votre domaine frontend
- [ ] `NODE_ENV=production` défini

### ✅ Code

- [x] Console.log désactivés en production (via logger.js)
- [x] Gestion d'erreurs robuste
- [x] Rate limiting actif
- [x] Helmet.js configuré (headers sécurisés)
- [x] Validation des entrées avec express-validator

### ✅ Infrastructure

- [ ] HTTPS activé (certificat SSL)
- [ ] Base de données sécurisée (PostgreSQL recommandé en production)
- [ ] Backups automatiques
- [ ] Monitoring (Sentry, LogRocket, etc.)
- [ ] CDN pour les assets statiques (Cloudflare)

---

## 🧪 Tests avant déploiement

### Frontend

```bash
cd frontend
npm run build
npm run preview
# Tester l'application sur http://localhost:4173
```

### Backend

```bash
cd backend
NODE_ENV=production node server.js
# Tester les endpoints
curl http://localhost:3000/health
```

### Tests d'intégration

1. **Inscription** : POST `/api/auth/register`
2. **Connexion** : POST `/api/auth/login`
3. **Matchs du jour** : GET `/api/matches/football?date=2026-04-27`
4. **Vérifier** : Les matchs s'affichent immédiatement après connexion

---

## 📊 Monitoring en production

### Métriques à surveiller

- Temps de réponse API (< 500ms)
- Taux d'erreur (< 1%)
- Consommation API Sports (limite gratuite : 100 req/jour)
- Utilisation mémoire backend
- Taille du bundle frontend (< 500KB)

### Outils recommandés

- **Backend**: PM2, New Relic, Datadog
- **Frontend**: Google Analytics, Sentry
- **API**: Postman Monitoring
- **Uptime**: UptimeRobot, Pingdom

---

## 🐛 Dépannage

### Problème : Les matchs ne se chargent pas

**Cause** : Clé API Sports invalide ou quota dépassé

**Solution** :
```bash
# Vérifier les logs backend
pm2 logs sport-analytics-api

# Tester la clé API manuellement
curl -H "x-apisports-key: VOTRE_CLE" \
  "https://v3.football.api-sports.io/fixtures?date=2026-04-27"
```

### Problème : Erreur CORS

**Cause** : `CORS_ORIGIN` mal configuré

**Solution** :
```bash
# Backend .env
CORS_ORIGIN=https://votre-domaine.com
# Ne PAS mettre de slash final
```

### Problème : JWT invalide après déploiement

**Cause** : `JWT_SECRET` différent entre environnements

**Solution** : Utiliser le même secret partout ou déconnecter/reconnecter

---

## 📝 Changelog des corrections

### Version 1.0.1 (2026-04-27)

#### 🐛 Fixes
- Navigation après login (suppression du hard reload)
- Préchargement automatique des matchs
- Typo `getConfidenceBarColor` corrigée
- Logs conditionnels en production

#### ⚡ Optimisations
- Évite les rechargements inutiles de matchs
- Meilleure gestion du cache dans le store

#### 🔒 Sécurité
- Logs de production nettoyés
- Gestion d'erreurs améliorée

---

## 🎯 Prochaines étapes recommandées

1. **Base de données persistante** : Remplacer `Map` par PostgreSQL/MongoDB
2. **Cache Redis** : Pour les matchs du jour
3. **WebSockets** : Pour les scores live
4. **Tests automatisés** : Jest + Cypress
5. **CI/CD** : GitHub Actions pour déploiement automatique
6. **Documentation API** : Swagger/OpenAPI

---

## 📞 Support

En cas de problème, vérifiez :
1. Les logs backend : `pm2 logs` ou console Vercel/Railway
2. Les erreurs frontend : Console navigateur (F12)
3. La console API Sports : https://dashboard.api-football.com/

---

**Version** : 1.0.1  
**Dernière mise à jour** : 2026-04-27  
**Status** : ✅ Prêt pour production
