FROM node:20 AS builder
WORKDIR /app

# Enable pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy full source
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile --shamefully-hoist

# Build
RUN pnpm --filter=@ks-interaktif/database run db:generate
RUN pnpm --filter=@ks-interaktif/database run build
RUN pnpm run build --filter=api-server...

# Production image
FROM node:20 AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expserver

COPY --from=builder /app/services/api-server/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/services/api-server/package.json ./package.json
COPY --from=builder /app/packages ./packages

# Link workspace packages
RUN mkdir -p node_modules/@ks-interaktif
RUN ln -s ../../packages/database node_modules/@ks-interaktif/database
RUN ln -s ../../packages/auth node_modules/@ks-interaktif/auth


USER expserver

EXPOSE 4000

CMD ["node", "dist/index.js"]
