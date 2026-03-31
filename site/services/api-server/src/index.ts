import "./polyfill";
import express from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { prisma } from "@ks-interaktif/database";
import { appRouter } from "./router";
import { createContext } from "./trpc";

// New Routes
import authRoutes from "./routes/auth";
import eventRoutes from "./routes/events";
import participantRoutes from "./routes/participants";
import settingsRoutes from "./routes/settings";
import reportsRoutes from "./routes/reports";
import paymentsRoutes from "./routes/payments";
import trackingRoutes from "./routes/tracking";
import { orgRateLimiter } from "./middleware/rateLimiter";
import { errorHandler } from "./middleware/errorHandler";
import { assertProductionSecretsAreSafe } from "./utils/secrets";

const app = express();
const port = process.env.PORT || 4000;
assertProductionSecretsAreSafe();
const systemBaseDomain = (process.env.DOMAIN_SYSTEM_BASE || "soruyorum.live")
  .trim()
  .toLowerCase();

const allowedOrigins = new Set(
  [
    process.env.PORTAL_BASE_URL,
    process.env.FRONTEND_URL,
    "https://soruyorum.online",
    "https://www.soruyorum.online",
    "https://api.soruyorum.online",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3101",
    "http://127.0.0.1:3101",
  ].filter((value): value is string => Boolean(value && value.trim())),
);

const allowedOriginHosts = new Set(
  Array.from(allowedOrigins)
    .map((value) => {
      try {
        return new URL(value).hostname.toLowerCase();
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value)),
);

const originAccessCache = new Map<
  string,
  { allowed: boolean; expiresAt: number }
>();
const ORIGIN_CACHE_TTL_MS = 60 * 1000;

function isManagedPlatformHostname(hostname: string) {
  return (
    hostname === "soruyorum.online" ||
    hostname.endsWith(".soruyorum.online") ||
    hostname === systemBaseDomain ||
    hostname.endsWith(`.${systemBaseDomain}`)
  );
}

async function isOriginAllowed(origin: string) {
  if (!origin) return true;
  if (allowedOrigins.has(origin)) return true;

  let parsedOrigin: URL;
  try {
    parsedOrigin = new URL(origin);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsedOrigin.protocol)) {
    return false;
  }

  const hostname = parsedOrigin.hostname.toLowerCase();
  if (allowedOriginHosts.has(hostname) || isManagedPlatformHostname(hostname)) {
    return true;
  }

  const cached = originAccessCache.get(hostname);
  const now = Date.now();
  if (cached && cached.expiresAt > now) {
    return cached.allowed;
  }

  const domain = await prisma.organization_domains.findUnique({
    where: { hostname },
    select: { id: true },
  });

  const allowed = Boolean(domain);
  originAccessCache.set(hostname, {
    allowed,
    expiresAt: now + ORIGIN_CACHE_TTL_MS,
  });

  return allowed;
}

app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      void isOriginAllowed(origin || "")
        .then((allowed) => {
          if (allowed) {
            callback(null, true);
            return;
          }

          callback(new Error(`CORS origin not allowed: ${origin}`));
        })
        .catch((error) => {
          callback(
            error instanceof Error
              ? error
              : new Error("CORS origin check failed"),
          );
        });
    },
  }),
);
// Allow larger payloads for event theme/logo settings (base64 data URLs).
// Keep this bounded to reduce abuse risk.
app.use(express.json({ limit: process.env.REQUEST_BODY_LIMIT ?? "15mb" }));
app.use(
  express.urlencoded({
    extended: true,
    limit: process.env.REQUEST_BODY_LIMIT ?? "15mb",
  }),
);

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext,
  }),
);

// Mount REST API Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", orgRateLimiter, eventRoutes);
app.use("/api/public", participantRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/reports", orgRateLimiter, reportsRoutes);
app.use("/api/payments", orgRateLimiter, paymentsRoutes);
app.use("/api/tracking", trackingRoutes);

app.get("/health", (req, res) => {
  res.send("OK");
});

app.use(errorHandler);

app.listen(Number(port), "0.0.0.0", () => {
  console.log(`API Server listening on port ${port}`);
});
