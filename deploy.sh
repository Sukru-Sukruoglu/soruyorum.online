#!/bin/bash
cd /srv/webhosting/soruyorum.online
echo "🔄 Pulling latest changes..."
git pull origin main
echo "🏗️ Building portal..."
cd site
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build soruyorum-portal
echo "✅ Deploy tamamlandı!"
