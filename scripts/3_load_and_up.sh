#!/bin/bash
# ============================================================
# Passo 3 - Executar NA EC2
# Carrega as imagens e sobe os containers
# ============================================================

set -e

EC2_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ">> Carregando imagens..."
docker load -i "$EC2_DIR/liax-backend.tar"
docker load -i "$EC2_DIR/liax-frontend.tar"
docker load -i "$EC2_DIR/liax-legacy.tar"

echo ">> Parando containers anteriores..."
docker compose -f "$EC2_DIR/docker-compose.prod.yml" down 2>/dev/null || true

echo ">> Subindo containers..."
docker compose -f "$EC2_DIR/docker-compose.prod.yml" up -d --force-recreate

echo ""
echo "Pronto! Containers no ar:"
docker compose -f "$EC2_DIR/docker-compose.prod.yml" ps
