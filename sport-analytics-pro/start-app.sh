#!/bin/bash

# ════════════════════════════════════════════════════════════
# Script de démarrage - Sport Analytics Pro
# ════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🚀 Démarrage Sport Analytics Pro                    ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si déjà démarré
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Backend déjà en cours sur le port 3000${NC}"
else
    echo -e "${BLUE}🔧 Démarrage du Backend...${NC}"
    cd backend
    npm start > backend.log 2>&1 &
    BACKEND_PID=$!
    echo $BACKEND_PID > ../backend.pid
    echo -e "${GREEN}✅ Backend démarré (PID: $BACKEND_PID)${NC}"
    cd ..
    sleep 2
fi

if lsof -Pi :5173 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Frontend déjà en cours sur le port 5173${NC}"
else
    echo -e "${BLUE}🎨 Démarrage du Frontend...${NC}"
    cd frontend
    npm run dev > frontend.log 2>&1 &
    FRONTEND_PID=$!
    echo $FRONTEND_PID > ../frontend.pid
    echo -e "${GREEN}✅ Frontend démarré (PID: $FRONTEND_PID)${NC}"
    cd ..
    sleep 3
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           ✅ APPLICATION DÉMARRÉE                          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 URLs de l'application :${NC}"
echo ""
echo -e "   ${GREEN}🌐 Frontend :${NC} http://localhost:5173"
echo -e "   ${GREEN}🔌 Backend  :${NC} http://localhost:3000"
echo -e "   ${GREEN}💚 Health   :${NC} http://localhost:3000/health"
echo ""
echo -e "${BLUE}📊 Endpoints principaux :${NC}"
echo ""
echo -e "   POST /api/auth/register  - Inscription"
echo -e "   POST /api/auth/login     - Connexion"
echo -e "   GET  /api/matches/football?date=YYYY-MM-DD"
echo ""
echo -e "${YELLOW}📝 Logs :${NC}"
echo -e "   Backend  : tail -f backend/backend.log"
echo -e "   Frontend : tail -f frontend/frontend.log"
echo ""
echo -e "${RED}🛑 Pour arrêter :${NC} ./stop-app.sh"
echo ""
