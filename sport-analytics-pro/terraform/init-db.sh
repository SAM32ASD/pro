#!/usr/bin/env bash
# Initialise le schema Postgres via l'EC2 (tunnel indirect)
set -euo pipefail
cd "$(dirname "$0")"

IP=$(terraform output -raw app_public_ip)
KEY="ssh/sport-analytics-key.pem"
SQL="../backend/database/init.sql"

if [ ! -f "$KEY" ]; then
  echo "ERREUR: $KEY introuvable (lance d'abord ./deploy.sh)"
  exit 1
fi

if [ ! -f "$SQL" ]; then
  echo "ERREUR: $SQL introuvable"
  exit 1
fi

echo "==> Copie de init.sql sur l'EC2"
scp -i "$KEY" -o StrictHostKeyChecking=accept-new "$SQL" ec2-user@"$IP":/tmp/init.sql

echo "==> Execution via psql (depuis l'EC2 vers RDS)"
ssh -i "$KEY" -o StrictHostKeyChecking=accept-new ec2-user@"$IP" \
  'source ~/app/.env && psql "$DATABASE_URL" -f /tmp/init.sql && rm /tmp/init.sql'

echo "==> OK, schema initialise"
