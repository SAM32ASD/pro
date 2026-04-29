#!/usr/bin/env bash
# Deploiement sur EC2 (a executer sur l'instance AWS)
# Prerequis: docker + docker compose installes, .env present
set -euo pipefail

if [ ! -f .env ]; then
  echo "ERREUR: .env absent. Copier .env.example en .env et remplir les valeurs."
  exit 1
fi

echo "==> Pull derniere image"
docker compose pull

echo "==> Redemarrage du conteneur"
docker compose up -d --remove-orphans

echo "==> Nettoyage des anciennes images"
docker image prune -f

echo "==> Status"
docker compose ps
echo ""
echo "Logs: docker compose logs -f app"
