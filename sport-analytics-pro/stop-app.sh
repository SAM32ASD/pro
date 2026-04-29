#!/bin/bash

# ════════════════════════════════════════════════════════════
# Script d'arrêt - Sport Analytics Pro
# ════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🛑 Arrêt Sport Analytics Pro                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Arrêt Backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🔧 Arrêt du Backend (PID: $BACKEND_PID)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        rm backend.pid
        echo -e "${GREEN}✅ Backend arrêté${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend déjà arrêté${NC}"
        rm backend.pid
    fi
else
    # Fallback: tuer par port
    BACKEND_PID=$(lsof -ti:3000)
    if [ ! -z "$BACKEND_PID" ]; then
        echo -e "${YELLOW}🔧 Arrêt du Backend (port 3000)...${NC}"
        kill $BACKEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Backend arrêté${NC}"
    else
        echo -e "${YELLOW}⚠️  Backend n'est pas en cours${NC}"
    fi
fi

# Arrêt Frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "${YELLOW}🎨 Arrêt du Frontend (PID: $FRONTEND_PID)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        rm frontend.pid
        echo -e "${GREEN}✅ Frontend arrêté${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend déjà arrêté${NC}"
        rm frontend.pid
    fi
else
    # Fallback: tuer par port
    FRONTEND_PID=$(lsof -ti:5173)
    if [ ! -z "$FRONTEND_PID" ]; then
        echo -e "${YELLOW}🎨 Arrêt du Frontend (port 5173)...${NC}"
        kill $FRONTEND_PID 2>/dev/null
        echo -e "${GREEN}✅ Frontend arrêté${NC}"
    else
        echo -e "${YELLOW}⚠️  Frontend n'est pas en cours${NC}"
    fi
fi

echo ""
echo -e "${GREEN}✅ Application arrêtée${NC}"
echo ""
