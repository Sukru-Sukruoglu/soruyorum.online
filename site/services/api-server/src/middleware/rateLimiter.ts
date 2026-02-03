import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../config/redis';

const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

export const orgRateLimiter = rateLimit({
    store: new RedisStore({
        //@ts-ignore - known issue with rate-limit-redis types compatibility
        sendCommand: (...args: string[]) => redis.call(...args),
    }),
    windowMs: WINDOW_MS,
    max: MAX_REQUESTS,
    keyGenerator: (req) => {
        return req.organizationId || req.ip || 'anonymous';
    },
    handler: (req, res) => {
        console.warn(`[RATE LIMIT] Org ${req.organizationId || 'unknown'} limit aşıldı`);

        res.status(429).json({
            error: 'Çok fazla istek yapıyorsunuz. Lütfen daha sonra tekrar deneyin.',
            retryAfter: Math.ceil(WINDOW_MS / 1000),
        });
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
});
