"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.orgRateLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_redis_1 = __importDefault(require("rate-limit-redis"));
const redis_1 = require("../config/redis");
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');
exports.orgRateLimiter = (0, express_rate_limit_1.default)({
    store: new rate_limit_redis_1.default({
        //@ts-ignore - known issue with rate-limit-redis types compatibility
        sendCommand: (...args) => redis_1.redis.call(...args),
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
