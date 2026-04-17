# Project Agent Instructions — soruyorum.online

Tüm skill'ler ve kurallar `.agent/` altında tek kaynaktan yönetilir.

## Skills
Dizin: `.agent/skills/`

- `ultimate-frontend-design`

## Workflows
Dizin: `.agent/workflows/`

## Tech Stack
TypeScript + Next.js (Turborepo monorepo) + pnpm

## Rules
- Türkçe yorum, İngilizce kod
- Strict TypeScript, `any` yasak
- Tailwind CSS utility-first
- Error handling: try-catch
- Dosya başına tek sorumluluk (SRP)

## Hosting
- Hetzner Dedicated Server (Docker + Coolify + Traefik)
- Cloudflare DNS/CDN
