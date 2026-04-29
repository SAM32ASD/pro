# 🏆 Sport Analytics Pro

Application d'analyse sportive avancée pour **Football** et **Basketball** avec filtres intelligents de buts, prédictions algorithmiques et support de tous les championnats du monde.

## ✨ Fonctionnalités principales

### 🎯 Analyse Football
- **Filtre intelligent de buts** : Over 0.5 buts mi-temps + Over 1.5 buts match
- Analyse des **12 derniers matchs** de chaque équipe
- Historique des **10 dernières confrontations directes (H2H)**
- Algorithmes de prédiction : **Poisson + Elo + Ensemble**
- Support de **tous les championnats du monde** (Ligue 1, Premier League, La Liga, Serie A, Bundesliga, Champions League, etc.)

### 🏀 Analyse Basketball
- Analyse des 12 derniers matchs par équipe
- Historique H2H des 10 dernières confrontations
- Algorithme **Monte Carlo** (5000 itérations)
- Support NBA, Euroleague, et tous championnats internationaux

### 📊 Statistiques détaillées
- Patterns de buts (mi-temps vs match complet)
- Taux de réussite Over/Under
- BTTS (Both Teams To Score)
- Forme récente et tendances
- Visualisations graphiques interactives

## 🚀 Installation rapide

### Prérequis
- Node.js 18+ et npm
- PostgreSQL 14+
- Redis (optionnel, pour le cache)
- Clé API de [api-sports.io](https://dashboard.api-sports.io)

### 1. Configuration

```bash
# Cloner le projet
git clone <votre-repo>
cd sport-analytics-pro

# Backend
cd backend
npm install
cp .env.example .env
# ⚠️ IMPORTANT: Éditez backend/.env et ajoutez votre clé API-Sports

# Frontend
cd ../frontend
npm install
cp .env.example .env
# Éditez frontend/.env si nécessaire
```

### 2. Base de données

```bash
# Démarrer PostgreSQL avec Docker
docker-compose up -d postgres

# Ou configurer PostgreSQL manuellement et créer la base
psql -U postgres
CREATE DATABASE sport_analytics;
CREATE USER sportuser WITH PASSWORD 'sportpass';
GRANT ALL PRIVILEGES ON DATABASE sport_analytics TO sportuser;

# Lancer les migrations
cd backend
npm run db:migrate
```

### 3. Lancement

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Backend lancé sur http://localhost:3000

# Terminal 2 - Frontend
cd frontend
npm run dev
# Frontend lancé sur http://localhost:5173
```

## 🔑 Obtenir une clé API-Sports

1. Créez un compte gratuit sur [api-sports.io](https://dashboard.api-sports.io/register)
2. Plan gratuit : **100 requêtes/jour**
3. Copiez votre clé API
4. Collez-la dans `backend/.env` :
   ```env
   API_SPORTS_KEY=votre_cle_api_ici
   ```
5. Collez-la également dans `frontend/.env` :
   ```env
   VITE_API_SPORTS_KEY=votre_cle_api_ici
   ```

## 📋 Variables d'environnement

### Backend (.env)

```env
# API Sports
API_SPORTS_KEY=votre_cle_api_sports
API_SPORTS_URL=https://v3.football.api-sports.io
API_SPORTS_BASKETBALL_URL=https://v1.basketball.api-sports.io

# Database
DATABASE_URL=postgresql://sportuser:sportpass@localhost:5432/sport_analytics

# Redis (optionnel)
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=changez_cette_cle_par_une_valeur_aleatoire_longue_32chars_min

# Server
PORT=3000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api
VITE_API_SPORTS_KEY=votre_cle_api_sports
```

## 🏗 Architecture

```
sport-analytics-pro/
├── backend/
│   ├── services/
│   │   ├── analysisEngine.js      # 🧠 Moteur d'analyse principal
│   │   ├── predictionAlgorithms.js # 🎲 Algorithmes (Poisson, Elo, Monte Carlo)
│   │   ├── apiSports.js            # 📡 Client API-Sports
│   │   └── dataSync.js             # 🔄 Synchronisation données
│   ├── routes/
│   │   ├── analysis.js             # Routes d'analyse
│   │   ├── matches.js              # Routes matchs
│   │   ├── teams.js                # Routes équipes
│   │   └── auth.js                 # Authentification
│   ├── middleware/
│   │   └── auth.js                 # JWT + Rate limiting
│   ├── config/
│   │   ├── database.js
│   │   └── redis.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── views/
│       │   ├── MatchesView.vue     # 📅 Liste des matchs du jour
│       │   ├── AnalysisView.vue    # 🎯 Analyse détaillée
│       │   └── HistoryView.vue     # 📜 Historique
│       ├── components/
│       │   ├── GoalFilterCard.vue  # ✅ Carte de filtre de buts
│       │   ├── TeamFormCard.vue    # 📊 Forme d'équipe
│       │   ├── H2HCard.vue         # 🤝 Confrontations directes
│       │   └── StatsVisualization.vue # 📈 Graphiques
│       ├── stores/
│       │   ├── analysis.js         # Store Pinia principal
│       │   └── auth.js             # Authentification
│       └── style.css               # Styles Tailwind personnalisés
└── docker-compose.yml
```

## 🎯 Filtre de buts (Football uniquement)

Le système analyse automatiquement chaque match et détermine s'il répond aux critères :

### Critère 1 : Over 0.5 buts en première mi-temps
- ✅ Recommandé si **probabilité ≥ 60%**
- Calcul basé sur :
  - 35% : Performance équipe domicile
  - 35% : Performance équipe extérieur
  - 30% : Historique H2H

### Critère 2 : Over 1.5 buts dans le match
- ✅ Recommandé si **probabilité ≥ 65%**
- Pondération similaire au critère 1

### Verdict final
Un match est **RECOMMANDÉ** uniquement si les **deux critères** sont validés.

### Exemple de résultat

```
✅ RECOMMANDÉ
Score: 78/100

Over 0.5 MT : 72% ████████████████▌
Over 1.5 Match : 84% ████████████████████▍

Analyse :
✅ 75% des matchs à domicile ont vu un but en première mi-temps
✅ 82% des matchs à l'extérieur ont dépassé 1.5 buts
✅ Historique H2H: 2.8 buts/match en moyenne (10 confrontations)
✅ Les deux équipes marquent dans 70% des confrontations directes
```

## 🧮 Algorithmes de prédiction

### Football

#### 1. Distribution de Poisson
Calcule les probabilités de scores basées sur les moyennes de buts :
- λ domicile = buts_pour_domicile × 0.6 + buts_contre_extérieur × 0.4
- λ extérieur = buts_pour_extérieur × 0.6 + buts_contre_domicile × 0.4

#### 2. Système Elo
Ratings dynamiques qui évoluent selon les résultats :
- Rating initial : 1500
- K-factor : 20
- Avantage domicile : +65 points

#### 3. Ensemble (Poisson + Elo)
Prédiction finale combinée :
- 60% Poisson
- 40% Elo

### Basketball

#### Monte Carlo (5000 itérations)
Simulation de 5000 matchs avec distribution normale :
- Moyenne : performances récentes
- Écart-type : 10% de la moyenne

## 📊 Statistiques disponibles

Pour chaque équipe :
- ✅ 12 derniers matchs analysés
- 📈 Taux de victoires/défaites
- ⚽ Moyenne de buts marqués/encaissés
- 🎯 Taux Over 0.5 MT, Over 1.5, Over 2.5
- 🔥 BTTS (Both Teams To Score)
- 📉 Forme récente (5 derniers matchs)

Pour chaque confrontation H2H :
- 📅 10 dernières rencontres
- 🏆 Historique victoires A vs B
- ⚽ Moyenne de buts par match
- 📊 Patterns de buts (mi-temps vs complet)

## 🌍 Championnats supportés

### ⚽ Football (200+ ligues)
- 🇫🇷 Ligue 1, Ligue 2
- 🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League, Championship
- 🇪🇸 La Liga, Segunda División
- 🇮🇹 Serie A, Serie B
- 🇩🇪 Bundesliga, 2. Bundesliga
- 🌍 Champions League, Europa League
- 🌎 MLS, Liga MX
- Et tous les autres championnats mondiaux...

### 🏀 Basketball (50+ ligues)
- 🇺🇸 NBA, WNBA, NCAA
- 🇪🇺 Euroleague, Eurocup
- 🇫🇷 LNB Pro A, Pro B
- 🇪🇸 ACB
- Et tous les championnats internationaux...

## 🛠 Scripts disponibles

### Backend
```bash
npm run dev        # Serveur de développement (nodemon)
npm start          # Production
npm test           # Tests Jest
npm run db:migrate # Lancer les migrations
npm run db:seed    # Peupler la base avec des données de test
```

### Frontend
```bash
npm run dev     # Serveur de développement Vite
npm run build   # Build de production
npm run preview # Prévisualiser le build
```

## 🐳 Docker

Lancer tout avec Docker Compose :

```bash
docker-compose up -d

# Accès
# Frontend: http://localhost
# API:      http://localhost/api
# Docs:     http://localhost/api-docs
```

## 🔒 Sécurité

- ✅ Authentification JWT
- ✅ Rate limiting (100 req/15min global, 10 req/15min analyse)
- ✅ Helmet.js (sécurité headers HTTP)
- ✅ CORS configuré
- ✅ Validation des entrées (express-validator)
- ✅ Hachage bcrypt (12 rounds)

## 📈 Performance

- ⚡ Analyse complète : ~2-3 secondes
- 🔄 Cache Redis pour les données fréquentes
- 📊 Rate limiting pour éviter les abus
- 🚀 Build frontend optimisé avec Vite

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push sur la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

MIT License - Voir le fichier LICENSE pour plus de détails

## 🙏 Remerciements

- [API-Sports](https://api-sports.io) pour les données sportives
- [Tailwind CSS](https://tailwindcss.com) pour le design
- [Vue.js](https://vuejs.org) pour le framework frontend
- [Express.js](https://expressjs.com) pour le backend

## 📞 Support

Pour toute question ou problème :
- 📧 Email : support@sportanalytics.pro
- 💬 Issues GitHub : [Créer une issue](https://github.com/votre-repo/issues)
- 📚 Documentation complète : [Wiki du projet](https://github.com/votre-repo/wiki)

---

**Développé avec ❤️ par l'équipe Sport Analytics Pro**

🎯 Analyse. Prédis. Gagne.
