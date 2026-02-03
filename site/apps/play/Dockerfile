# Use Node 20
FROM node:20 AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy full source
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Build
ENV NEXT_TELEMETRY_DISABLED 1

# Generate Prisma Client
RUN pnpm --filter=@ks-interaktif/database run db:generate

# Build play app
RUN pnpm run build --filter=play...

# Production image
FROM node:20 AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set permissions
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/apps/play/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/play/.next/static ./apps/play/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/play/server.js"]
