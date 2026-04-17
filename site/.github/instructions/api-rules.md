---
applyTo: "**/api/**/*.{ts,js}"
---
# API Rules
- Validate inputs with zod
- Response format: { success, data, error }
- Proper HTTP status codes
- Rate limiting on public endpoints
- Database queries through Prisma
