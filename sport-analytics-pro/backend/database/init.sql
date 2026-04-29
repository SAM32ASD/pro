-- ============================================
-- INITIALISATION BASE DE DONNÉES
-- Sport Analytics Pro
-- ============================================

-- Supprimer les tables si elles existent (pour reset)
-- DROP TABLE IF EXISTS predictions, matches, team_ratings, h2h_history, teams, users CASCADE;

-- ============================================
-- TABLE: users (utilisateurs)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(20) DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index sur email pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- TABLE: teams (équipes)
-- ============================================
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    api_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(100),
    league_id INTEGER,
    sport_type VARCHAR(20) CHECK (sport_type IN ('football', 'basketball')),
    logo_url TEXT,
    founded INTEGER,
    venue_name VARCHAR(255),
    venue_capacity INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_api_id ON teams(api_id);
CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport_type);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

-- ============================================
-- TABLE: matches (matchs)
-- ============================================
CREATE TABLE IF NOT EXISTS matches (
    id SERIAL PRIMARY KEY,
    api_id INTEGER UNIQUE NOT NULL,
    sport_type VARCHAR(20) CHECK (sport_type IN ('football', 'basketball')),
    league_id INTEGER,
    season VARCHAR(20),
    home_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    match_date TIMESTAMP WITH TIME ZONE,
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(50) CHECK (status IN ('scheduled', 'live', 'finished', 'postponed', 'cancelled')),
    venue VARCHAR(255),
    referee VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_teams ON matches(home_team_id, away_team_id);
CREATE INDEX IF NOT EXISTS idx_matches_league ON matches(league_id);
CREATE INDEX IF NOT EXISTS idx_matches_status ON matches(status);
CREATE INDEX IF NOT EXISTS idx_matches_api_id ON matches(api_id);

-- ============================================
-- TABLE: match_statistics (statistiques détaillées)
-- ============================================
CREATE TABLE IF NOT EXISTS match_statistics (
    id SERIAL PRIMARY KEY,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    
    -- Football
    possession INTEGER CHECK (possession >= 0 AND possession <= 100),
    shots_on_goal INTEGER DEFAULT 0,
    total_shots INTEGER DEFAULT 0,
    corners INTEGER DEFAULT 0,
    fouls INTEGER DEFAULT 0,
    yellow_cards INTEGER DEFAULT 0,
    red_cards INTEGER DEFAULT 0,
    offsides INTEGER DEFAULT 0,
    
    -- Basketball
    field_goal_pct DECIMAL(5,2),
    three_point_pct DECIMAL(5,2),
    free_throw_pct DECIMAL(5,2),
    rebounds INTEGER DEFAULT 0,
    assists INTEGER DEFAULT 0,
    steals INTEGER DEFAULT 0,
    blocks INTEGER DEFAULT 0,
    turnovers INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_stats_match ON match_statistics(match_id);

-- ============================================
-- TABLE: predictions (pronostics)
-- ============================================
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    match_id INTEGER REFERENCES matches(id) ON DELETE CASCADE,
    
    -- Type de prédiction
    prediction_type VARCHAR(50) NOT NULL CHECK (
        prediction_type IN (
            '1X2', 'double_chance', 'over_under', 'btts', 
            'correct_score', 'asian_handicap',
            'winner_spread', 'total_points', 'quarter_winner'
        )
    ),
    prediction_value VARCHAR(50) NOT NULL,
    confidence DECIMAL(5,2) CHECK (confidence >= 0 AND confidence <= 100),
    
    -- Résultat
    result VARCHAR(20) CHECK (result IN ('pending', 'won', 'lost', 'void')),
    profit_loss DECIMAL(10,2),
    
    -- Métadonnées
    algorithm_used VARCHAR(100),
    odds DECIMAL(6,2),
    stake DECIMAL(10,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    settled_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_predictions_user ON predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_predictions_match ON predictions(match_id);
CREATE INDEX IF NOT EXISTS idx_predictions_created ON predictions(created_at);

-- ============================================
-- TABLE: team_ratings (ratings Elo et autres)
-- ============================================
CREATE TABLE IF NOT EXISTS team_ratings (
    team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    sport_type VARCHAR(20) CHECK (sport_type IN ('football', 'basketball')),
    elo_rating DECIMAL(8,2) DEFAULT 1500,
    form_rating DECIMAL(5,2), -- 0-100
    attack_rating DECIMAL(5,2),
    defense_rating DECIMAL(5,2),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (team_id, sport_type)
);

-- ============================================
-- TABLE: h2h_history (historique confrontations)
-- ============================================
CREATE TABLE IF NOT EXISTS h2h_history (
    id SERIAL PRIMARY KEY,
    team_a_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    team_b_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
    matches_count INTEGER DEFAULT 0,
    team_a_wins INTEGER DEFAULT 0,
    team_b_wins INTEGER DEFAULT 0,
    draws INTEGER DEFAULT 0,
    avg_goals_team_a DECIMAL(4,2),
    avg_goals_team_b DECIMAL(4,2),
    last_match_date TIMESTAMP WITH TIME ZONE,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(team_a_id, team_b_id)
);

CREATE INDEX IF NOT EXISTS idx_h2h_teams ON h2h_history(team_a_id, team_b_id);

-- ============================================
-- TABLE: api_logs (journal des appels API)
-- ============================================
CREATE TABLE IF NOT EXISTS api_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    endpoint VARCHAR(255),
    method VARCHAR(10),
    status_code INTEGER,
    response_time_ms INTEGER,
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_user ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_created ON api_logs(created_at);

-- ============================================
-- TABLE: refresh_tokens (pour "remember me")
-- ============================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token_hash);

-- ============================================
-- FONCTION: Mise à jour automatique de updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Appliquer le trigger à toutes les tables avec updated_at
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
            CREATE TRIGGER update_%s_updated_at
                BEFORE UPDATE ON %s
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        ', t, t, t, t);
    END LOOP;
END $$;

-- ============================================
-- DONNÉES INITIALES (optionnel)
-- ============================================

-- Créer un utilisateur admin par défaut (mot de passe: admin123)
-- À changer en production!
-- INSERT INTO users (email, password, name, plan, role) 
-- VALUES (
--     'admin@sportanalytics.com',
--     '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYTa', -- admin123
--     'Administrateur',
--     'enterprise',
--     'admin'
-- )
-- ON CONFLICT (email) DO NOTHING;