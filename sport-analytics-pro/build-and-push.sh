#!/usr/bin/env bash
# Build et push de l'image vers Docker Hub (a executer depuis ton PC)
set -euo pipefail

IMAGE="elmefik96/sport-analytics"
TAG="${1:-latest}"

echo "==> Build $IMAGE:$TAG"
docker build -t "$IMAGE:$TAG" -t "$IMAGE:latest" .

echo "==> Push $IMAGE:$TAG"
docker push "$IMAGE:$TAG"
docker push "$IMAGE:latest"

echo "==> Taille de l'image"
docker images "$IMAGE" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

echo "OK. Sur l'EC2, lance: ./deploy.sh"
