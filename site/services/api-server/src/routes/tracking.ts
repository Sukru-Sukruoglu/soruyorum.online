import { Router, Request, Response } from 'express';
import { redis } from '../config/redis';
import { extractGeoHints, normalizeIp, resolveGeoForIp, type GeoInfo } from '../utils/geo';

const router = Router();

const VISITOR_TTL = 120; // seconds — tolerate background tab throttling while still expiring stale visitors reasonably fast
const VISITOR_PREFIX = 'visitor:';

interface VisitorData {
    page: string;
    ua: string;
    ip: string;
    ts: number;         // last heartbeat timestamp
    firstSeen: number;  // first heartbeat timestamp
    referrer?: string;
    geo?: GeoInfo | null;
}

/**
 * POST /api/tracking/heartbeat
 * Called every 15 seconds by the client-side tracker.
 * Body: { visitorId, page, referrer? }
 */
router.post('/heartbeat', async (req: Request, res: Response) => {
    try {
        const { visitorId, page, referrer } = req.body;

        if (!visitorId || !page) {
            return res.status(400).json({ error: 'Missing visitorId or page' });
        }

        const key = `${VISITOR_PREFIX}${visitorId}`;
        const now = Date.now();
        const normalizedIp = normalizeIp((req.headers['x-forwarded-for'] as string || req.ip || '').split(',')[0].trim()) || 'unknown';
        const geo = await resolveGeoForIp(normalizedIp, extractGeoHints(req.headers as Record<string, unknown>));

        // Check if visitor already exists
        const existing = await redis.get(key);
        let firstSeen = now;
        if (existing) {
            try {
                const parsed = JSON.parse(existing);
                firstSeen = parsed.firstSeen || now;
            } catch { /* ignore */ }
        }

        const data: VisitorData = {
            page,
            ua: (req.headers['user-agent'] || 'Unknown').slice(0, 300),
            ip: normalizedIp,
            ts: now,
            firstSeen,
            referrer: referrer?.slice(0, 500),
            geo,
        };

        await redis.set(key, JSON.stringify(data), 'EX', VISITOR_TTL);

        res.json({ ok: true });
    } catch (err) {
        console.error('Tracking heartbeat error:', err);
        res.status(500).json({ error: 'Internal error' });
    }
});

/**
 * GET /api/tracking/visitors
 * Returns all active visitors. Internal/superadmin use.
 */
router.get('/visitors', async (req: Request, res: Response) => {
    try {
        const keys = await redis.keys(`${VISITOR_PREFIX}*`);
        const visitors: Array<VisitorData & { visitorId: string }> = [];

        if (keys.length > 0) {
            const pipeline = redis.pipeline();
            for (const k of keys) {
                pipeline.get(k);
            }
            const results = await pipeline.exec();

            if (results) {
                for (let i = 0; i < keys.length; i++) {
                    const [err, val] = results[i] || [];
                    if (!err && val) {
                        try {
                            const data = JSON.parse(val as string) as VisitorData;
                            visitors.push({
                                visitorId: keys[i].replace(VISITOR_PREFIX, ''),
                                ...data,
                            });
                        } catch { /* skip invalid */ }
                    }
                }
            }
        }

        // Sort by most recent heartbeat
        visitors.sort((a, b) => b.ts - a.ts);

        res.json({
            total: visitors.length,
            visitors,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        console.error('Tracking visitors error:', err);
        res.status(500).json({ error: 'Internal error' });
    }
});

export default router;
