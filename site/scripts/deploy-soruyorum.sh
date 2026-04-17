#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

COMPOSE_ARGS=(
  -p soruyorum
  -f docker-compose.yml
  -f docker-compose.traefik.yml
)

usage() {
  echo "Usage: bash scripts/deploy-soruyorum.sh <up|down|ps|logs|config> [service...]"
}

command_name="${1:-}"

case "$command_name" in
  up)
    shift || true
    if [ "$#" -gt 0 ]; then
      docker compose "${COMPOSE_ARGS[@]}" up -d --build --no-deps "$@"
    else
      docker compose "${COMPOSE_ARGS[@]}" up -d --build
    fi
    ;;
  down)
    docker compose "${COMPOSE_ARGS[@]}" down
    ;;
  ps)
    docker compose "${COMPOSE_ARGS[@]}" ps
    ;;
  logs)
    shift || true
    docker compose "${COMPOSE_ARGS[@]}" logs -f "$@"
    ;;
  config)
    docker compose "${COMPOSE_ARGS[@]}" config
    ;;
  *)
    usage
    exit 1
    ;;
esac