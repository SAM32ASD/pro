# ============================================
# Stage 1 — Build frontend (Vue/Vite)
# ============================================
FROM node:20-alpine AS frontend-builder
WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci --ignore-scripts
COPY frontend/ ./
RUN npm run build

# ============================================
# Stage 2 — Install backend deps (prod only)
# ============================================
FROM node:20-alpine AS backend-deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ============================================
# Stage 3 — Runtime minimal
# ============================================
FROM node:20-alpine
ENV NODE_ENV=production \
    PORT=3000 \
    FRONTEND_DIST=/app/public

WORKDIR /app

RUN addgroup -g 1001 -S app && adduser -S -u 1001 -G app app

COPY --from=backend-deps --chown=app:app /app/node_modules ./node_modules

COPY --chown=app:app backend/server.js ./
COPY --chown=app:app backend/package.json ./
COPY --chown=app:app backend/config ./config
COPY --chown=app:app backend/middleware ./middleware
COPY --chown=app:app backend/routes ./routes
COPY --chown=app:app backend/services ./services
COPY --chown=app:app backend/database ./database

COPY --from=frontend-builder --chown=app:app /frontend/dist ./public

USER app
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]
