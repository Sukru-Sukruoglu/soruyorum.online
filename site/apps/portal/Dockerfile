# Use Node 20
FROM node:20 AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy full source
COPY . .

# Install dependencies (recursive workspace install so apps/* get proper node_modules links)
RUN pnpm -r install --frozen-lockfile --shamefully-hoist

# Build
ENV NEXT_TELEMETRY_DISABLED 1

# Build-time feature flags for client bundles
ARG NEXT_PUBLIC_ENABLED_EVENT_TYPES
ARG NEXT_PUBLIC_DEMO_MODE
ARG NEXT_PUBLIC_SITE_VARIANT
ARG NEXT_PUBLIC_UPGRADE_CONTACT_EMAIL
ARG NEXT_PUBLIC_UPGRADE_CONTACT_PHONE
ARG NEXT_PUBLIC_UPGRADE_CONTACT_PHONES
ARG NEXT_PUBLIC_UPGRADE_CONTACT_ADDRESS
ENV NEXT_PUBLIC_ENABLED_EVENT_TYPES=$NEXT_PUBLIC_ENABLED_EVENT_TYPES
ENV NEXT_PUBLIC_DEMO_MODE=$NEXT_PUBLIC_DEMO_MODE
ENV NEXT_PUBLIC_SITE_VARIANT=$NEXT_PUBLIC_SITE_VARIANT
ENV NEXT_PUBLIC_UPGRADE_CONTACT_EMAIL=$NEXT_PUBLIC_UPGRADE_CONTACT_EMAIL
ENV NEXT_PUBLIC_UPGRADE_CONTACT_PHONE=$NEXT_PUBLIC_UPGRADE_CONTACT_PHONE
ENV NEXT_PUBLIC_UPGRADE_CONTACT_PHONES=$NEXT_PUBLIC_UPGRADE_CONTACT_PHONES
ENV NEXT_PUBLIC_UPGRADE_CONTACT_ADDRESS=$NEXT_PUBLIC_UPGRADE_CONTACT_ADDRESS

# Generate Prisma Client
RUN pnpm --filter=@ks-interaktif/database run db:generate

# Build workspace package output (needed by portal build)
RUN pnpm --filter=@ks-interaktif/database run build

# Sanity check: ensure workspace package is resolvable from the portal package
RUN node -e "const {createRequire}=require('module'); const path=require('path'); const req=createRequire(path.resolve('apps/portal/package.json')); console.log('resolve:@ks-interaktif/database', req.resolve('@ks-interaktif/database/package.json'))"

# Build portal app only (avoid building unrelated workspace packages)
RUN pnpm --filter portal build

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
COPY --from=builder --chown=nextjs:nodejs /app/apps/portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/portal/.next/static ./apps/portal/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/portal/public ./apps/portal/public

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/portal/server.js"]
