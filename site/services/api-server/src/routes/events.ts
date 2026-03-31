import express from 'express';
import { EventService } from '../services/eventService';
import { tenantDb } from '../database/tenantDb';
import { tenantContextMiddleware } from '../middleware/tenantContext';
import { AuditLogger } from '../database/auditLog';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { generateShortLivedToken } from '../utils/jwt';
import { canManageEventSteps } from '../utils/eventPermissions';
import { getOrganizationAccess, isSuperAdmin, hasFullAccess } from '../utils/access';
import { buildQandaPdfBase64, QANDA_PDF_VERSION } from '../utils/qandaReportPdf';
import {
    sanitizeSettingsForLimitedAccess,
    themeDesignStateDiffers,
    themeTouchesDesignKeys,
    themeViolatesLimitedAccess,
} from '../utils/themeAccess';
import { getOrganizationJoinBaseUrl } from '../utils/domains';

const router = express.Router();
router.use(tenantContextMiddleware);

const mapEventForFrontend = (event: any) => {
    if (!event) return event;

    const eventPin = event.event_pin ?? event.eventPin ?? event.pin;
    const eventCode = event.event_code ?? event.eventCode;
    const joinUrl = event.join_url ?? event.joinUrl;
    const qrCodeUrl = event.qr_code_url ?? event.qrCodeUrl;
    const eventType = event.event_type ?? event.eventType;
    const maxParticipants =
        (event.max_participants !== undefined ? event.max_participants : undefined) ??
        (event.maxParticipants !== undefined ? event.maxParticipants : undefined) ??
        null;
    const createdAt = event.created_at ?? event.createdAt;
    const updatedAt = event.updated_at ?? event.updatedAt;

    return {
        ...event,
        title: event.title ?? event.name,
        eventPin,
        eventCode,
        joinUrl,
        qrCodeUrl,
        eventType,
        maxParticipants,
        createdAt,
        updatedAt,
    };
};

const allowedEventTypes = (() => {
    const raw = process.env.ALLOWED_EVENT_TYPES;
    if (!raw || !raw.trim()) return null;

    const parts = raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);

    return parts.length ? new Set(parts) : null;
})();

const createEventSchema = z.object({
    title: z.string().min(1, 'Etkinlik başlığı zorunludur'),
    description: z.string().optional(),
    eventType: z.enum(['quiz', 'poll', 'tombala', 'matching']).default('quiz'),
    maxParticipants: z.number().int().positive().nullable().optional(),
    eventPin: z
        .string()
        .regex(/^\d{6}$/, 'PIN 6 haneli olmalıdır')
        .optional(),
    // Client may send these for preview purposes; server generates canonical values.
    joinUrl: z.string().optional(),
    qrCodeUrl: z.string().optional(),
    status: z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
    settings: z.object({
        registration: z.object({
            requirePin: z.boolean(),
            requireName: z.boolean(),
            requireEmail: z.boolean(),
            requirePhone: z.boolean(),
            requireAvatar: z.boolean(),
            requireId: z.boolean(),
            allowAnonymous: z.boolean(),
            requireKvkkConsent: z.boolean(),
        }).passthrough(),
        gameplay: z.object({
            autoMarkNumbers: z.boolean(),
            autoStartEvent: z.boolean(),
            startDateTime: z.string().optional(),
        }).passthrough(),
    }).passthrough(),
});

// PATCH endpoint should accept partial settings payloads (e.g. only qanda.screenMode)
// because older events may not have full registration/gameplay blocks populated.
const updateEventSchema = createEventSchema
    .partial()
    .extend({ settings: z.record(z.any()).optional() });

async function buildQandaXlsxBase64(params: {
    eventName: string;
    generatedAt: Date;
    rows: Array<{
        createdAt: any;
        participantName?: string | null;
        questionText?: string | null;
        status?: string | null;
        isAnswered?: boolean | null;
        participantId?: string | null;
        id?: string | null;
    }>;
}): Promise<string> {
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'KS Interaktif';
    workbook.created = params.generatedAt;

    const sheet = workbook.addWorksheet('Soru-Yorum');

    sheet.columns = [
        { header: 'Tarih', key: 'createdAt', width: 24 },
        { header: 'Katılımcı', key: 'participantName', width: 22 },
        { header: 'Soru/Yorum', key: 'questionText', width: 60 },
        { header: 'Durum', key: 'status', width: 14 },
        { header: 'ParticipantId', key: 'participantId', width: 20 },
        { header: 'Id', key: 'id', width: 20 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.views = [{ state: 'frozen', ySplit: 1 }];

    for (const r of params.rows || []) {
        sheet.addRow({
            createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : '',
            participantName: (r.participantName || '').trim() || 'Anonim',
            questionText: String(r.questionText || ''),
            status: r.status ? String(r.status) : '',
            participantId: r.participantId || '',
            id: r.id || '',
        });
    }

    // Wrap long text for readability
    const questionCol = sheet.getColumn('questionText');
    questionCol.alignment = { wrapText: true, vertical: 'top' };
    sheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.alignment = { vertical: 'top', wrapText: true };
    });

    // Title worksheet name in properties (event name)
    sheet.headerFooter.oddHeader = `&C&"Arial,Bold"${params.eventName || 'Etkinlik'} - Soru/Yorum Raporu`;

    const bufferLike: any = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.isBuffer(bufferLike) ? bufferLike : Buffer.from(bufferLike);
    return buffer.toString('base64');
}

router.get('/', async (req, res, next) => {
    try {
        const events = await tenantDb.findMany('event', req.organizationId!, {
            orderBy: { created_at: 'desc' },
            include: {
                users: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { participants: true },
                },
            },
        });

        res.json({ events: events.map(mapEventForFrontend) });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const access = await getOrganizationAccess(tenantDb.direct as any, req.organizationId!);
        const superAdminBypass = hasFullAccess({ role: req.userRole, email: req.userEmail });
        const effectiveAccess = superAdminBypass
            ? {
                  ...access,
                  isFreeOrTrial: false,
                  isExpired: false,
                  hasActiveSubscription: true,
                  features: {
                      ...access.features,
                      branding: true,
                      customDomain: true,
                      whiteLabel: true,
                      maxParticipants: 10000,
                      maxEvents: null,
                  },
              }
            : access;
        const event = await tenantDb.findUnique('event', req.organizationId!, {
            where: { id: req.params.id },
            include: {
                users: {
                    select: { id: true, name: true, email: true },
                },
                _count: {
                    select: { participants: true },
                },
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }

        const mappedEvent = mapEventForFrontend(event);
        const limitedSettings = !superAdminBypass && !effectiveAccess.features.branding
            ? sanitizeSettingsForLimitedAccess((mappedEvent as any)?.settings)
            : (mappedEvent as any)?.settings;

        // Derive the canonical join host from the effective domain for this request.
        const baseUrl = await getOrganizationJoinBaseUrl(tenantDb.direct as any, req.organizationId!, req as any);
        let joinHost: string;
        try {
            joinHost = new URL(baseUrl).host;
        } catch {
            joinHost = 'mobil.soruyorum.online';
        }

        let joinUrl = mappedEvent.joinUrl;
        let qrCodeUrl = mappedEvent.qrCodeUrl;
        if (mappedEvent.eventPin) {
            const nextJoinUrl = `${baseUrl.replace(/\/+$/, '')}/join?pin=${encodeURIComponent(mappedEvent.eventPin)}`;
            if (nextJoinUrl !== joinUrl) {
                joinUrl = nextJoinUrl;
                qrCodeUrl = await EventService.generateQRCode(nextJoinUrl);
            }
        }

        res.json({
            event: {
                ...mappedEvent,
                ...(limitedSettings ? { settings: limitedSettings } : {}),
                joinUrl,
                qrCodeUrl,
                joinHost,
                access: effectiveAccess,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const validatedData = createEventSchema.parse(req.body);

        if (allowedEventTypes && !allowedEventTypes.has(validatedData.eventType)) {
            return res.status(400).json({
                error: 'Bu sitede sadece Canlı Soru etkinliği oluşturulabilir.',
            });
        }

        // Pro-only: branding (logo) customization in theme settings.
        // We enforce this on the server to prevent bypass via API calls.
        const access = await getOrganizationAccess(tenantDb.direct as any, req.organizationId!);
        const superAdminBypass = hasFullAccess({ role: req.userRole, email: req.userEmail });

        // Plan-based event limit
        if (!superAdminBypass && access.features.maxEvents !== null) {
            const eventCount = await tenantDb.direct.events.count({
                where: { organization_id: req.organizationId },
            });
            if (eventCount >= access.features.maxEvents) {
                return res.status(403).json({
                    error: `Paketinizde en fazla ${access.features.maxEvents} etkinlik oluşturabilirsiniz. Daha fazla etkinlik için paketinizi yükseltin.`,
                    code: 'EVENT_LIMIT_REACHED',
                });
            }
        }

        if (!superAdminBypass && !access.features.branding) {
            const newSettings: any = (validatedData as any).settings || {};
            const newTheme: any = newSettings.theme || {};

            const normalizeLogoUrl = (theme: any, side: 'left' | 'right') => {
                const objKey = side === 'left' ? 'logo' : 'rightLogo';
                const urlKey = side === 'left' ? 'logoUrl' : 'rightLogoUrl';

                const rawObj = theme?.[objKey];
                const rawUrl = typeof theme?.[urlKey] === 'string' ? theme[urlKey] : null;

                const url =
                    rawObj && typeof rawObj === 'object' && typeof rawObj.url === 'string' && rawObj.url ? rawObj.url :
                    typeof rawObj === 'string' && rawObj ? rawObj :
                    rawUrl && rawUrl ? rawUrl :
                    null;

                return url || null;
            };

            const hasLeftLogo = Boolean(normalizeLogoUrl(newTheme, 'left'));
            const hasRightLogo = Boolean(normalizeLogoUrl(newTheme, 'right'));

            if (hasLeftLogo || hasRightLogo) {
                return res.status(403).json({
                    error: 'Logo ekleme ve logo ayarlari sadece full branding dahil paketlerde kullanilabilir.',
                    code: 'PRO_FEATURE',
                    feature: 'branding_logos',
                });
            }

            if (themeViolatesLimitedAccess(newTheme)) {
                return res.status(403).json({
                    error: 'Gelismis tema ve gorsel ayarlari sadece full branding dahil paketlerde kullanilabilir. Alt paketlerde sadece Varsayilan ve Cift Renkler aciktir.',
                    code: 'PRO_FEATURE',
                    feature: 'advanced_designs',
                });
            }
        }

        if (validatedData.eventPin) {
            const existing = await tenantDb.findFirst('event', req.organizationId!, {
                where: { event_pin: validatedData.eventPin },
                select: { id: true },
            });
            if (existing) {
                return res.status(409).json({
                    error: 'Bu PIN zaten kullanılıyor. Lütfen tekrar deneyin.',
                });
            }
        }

        const planFeatures = access.features;
        const effectiveMaxParticipants = superAdminBypass
            ? (validatedData.maxParticipants === undefined ? null : validatedData.maxParticipants)
            : (validatedData.maxParticipants != null
                ? Math.min(validatedData.maxParticipants, planFeatures.maxParticipants)
                : planFeatures.maxParticipants);

        const event = await EventService.createEvent({
            organizationId: req.organizationId!,
            userId: req.userId!,
            ...validatedData,
            maxParticipants: effectiveMaxParticipants,
            req,
        });

        const mappedEvent = mapEventForFrontend(event);

        await AuditLogger.log({
            organizationId: req.organizationId!,
            userId: req.userId,
            action: 'CREATE',
            resource: 'event',
            resourceId: event.id,
            details: {
                title: event.name,
                eventType: (event as any).event_type,
                pin: (event as any).event_pin || (event as any).pin,
            },
            ipAddress: req.ip,
        });

        res.status(201).json({
            event: {
                id: mappedEvent.id,
                title: mappedEvent.title,
                eventType: mappedEvent.eventType,
                eventCode: mappedEvent.eventCode,
                eventPin: mappedEvent.eventPin,
                joinUrl: mappedEvent.joinUrl,
                qrCodeUrl: mappedEvent.qrCodeUrl,
                maxParticipants: mappedEvent.maxParticipants,
                status: mappedEvent.status,
                createdAt: mappedEvent.createdAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/regenerate-pin', async (req, res, next) => {
    try {
        const eventId = req.params.id;
        
        // First, kick all existing participants (they have the old PIN)
        const { kickEventParticipants } = await import('../services/websocketService');
        await kickEventParticipants({
            eventId,
            reason: 'PIN kodu değiştirildi. Lütfen yeni PIN ile tekrar katılın.'
        });

        // Then regenerate the PIN
        const result = await EventService.regeneratePin(
            eventId,
            req.organizationId!,
            req
        );

        await AuditLogger.log({
            organizationId: req.organizationId!,
            userId: req.userId,
            action: 'UPDATE',
            resource: 'event',
            resourceId: eventId,
            details: { action: 'regenerate_pin', newPin: result.pin },
            ipAddress: req.ip,
        });

        res.json({
            pin: result.pin,
            joinUrl: result.joinUrl,
            qrCodeUrl: result.qrCodeUrl,
        });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async (req, res, next) => {
    try {
        const validatedData = updateEventSchema.parse(req.body);

        if (allowedEventTypes && validatedData.eventType !== undefined && !allowedEventTypes.has(validatedData.eventType)) {
            return res.status(400).json({
                error: 'Bu sitede sadece Canlı Soru etkinliği desteklenir.',
            });
        }

        const updateData: Record<string, unknown> = {};
        if (validatedData.title !== undefined) updateData.name = validatedData.title;
        if (validatedData.description !== undefined) updateData.description = validatedData.description;
        if (validatedData.eventType !== undefined) updateData.event_type = validatedData.eventType;
        const superAdminBypass = hasFullAccess({ role: req.userRole, email: req.userEmail });
        const access = await getOrganizationAccess(tenantDb.direct as any, req.organizationId!);
        if (superAdminBypass) {
            if (validatedData.maxParticipants !== undefined) {
                updateData.max_participants = validatedData.maxParticipants;
            }
        } else {
            // Plan-based participant limit
            const planLimit = access.features.maxParticipants;
            if (validatedData.maxParticipants != null) {
                updateData.max_participants = Math.min(validatedData.maxParticipants, planLimit);
            } else {
                updateData.max_participants = planLimit;
            }
        }
        if (validatedData.status !== undefined) updateData.status = validatedData.status;

        if (validatedData.settings !== undefined) {
            // Pro-only: branding (logo) customization in theme settings.
            // We enforce this on the server to prevent bypass via API calls.
            if (!superAdminBypass && !access.features.branding) {
                const existing = await tenantDb.findUnique<any>('event', req.organizationId!, {
                    where: { id: req.params.id },
                    select: { id: true, settings: true },
                });

                if (!existing) {
                    return res.status(404).json({ error: 'Etkinlik bulunamadı' });
                }

                const oldSettings: any = existing.settings || {};
                const newSettings: any = validatedData.settings || {};

                const oldTheme: any = oldSettings.theme || {};
                const newTheme: any = newSettings.theme || {};

                const normalizeLogo = (theme: any, side: 'left' | 'right') => {
                    const objKey = side === 'left' ? 'logo' : 'rightLogo';
                    const urlKey = side === 'left' ? 'logoUrl' : 'rightLogoUrl';

                    const rawObj = theme?.[objKey];
                    const rawUrl = typeof theme?.[urlKey] === 'string' ? theme[urlKey] : null;

                    const url =
                        (rawObj && typeof rawObj === 'object' && typeof rawObj.url === 'string' && rawObj.url) ? rawObj.url :
                        (typeof rawObj === 'string' && rawObj) ? rawObj :
                        (rawUrl && rawUrl) ? rawUrl :
                        null;

                    if (!url) return null;

                    const x = rawObj && typeof rawObj === 'object' && typeof rawObj.x === 'number' ? rawObj.x : 0;
                    const y = rawObj && typeof rawObj === 'object' && typeof rawObj.y === 'number' ? rawObj.y : 0;
                    const size = rawObj && typeof rawObj === 'object' && typeof rawObj.size === 'number' ? rawObj.size : 240;
                    const anchor = side === 'right' && rawObj && typeof rawObj === 'object' && typeof rawObj.anchor === 'string' ? rawObj.anchor : undefined;

                    return {
                        url,
                        x,
                        y,
                        size,
                        ...(side === 'right' ? { anchor } : {}),
                    };
                };

                const oldLeft = normalizeLogo(oldTheme, 'left');
                const newLeft = normalizeLogo(newTheme, 'left');
                const oldRight = normalizeLogo(oldTheme, 'right');
                const newRight = normalizeLogo(newTheme, 'right');

                const isDifferent = (a: any, b: any) => JSON.stringify(a) !== JSON.stringify(b);

                const triesToAddOrChangeLeft =
                    (!oldLeft && !!newLeft) ||
                    (!!oldLeft && !!newLeft && isDifferent(oldLeft, newLeft));

                const triesToAddOrChangeRight =
                    (!oldRight && !!newRight) ||
                    (!!oldRight && !!newRight && isDifferent(oldRight, newRight));

                // Allow removal on Free/Trial (downgrade recovery), but do not allow adding/changing.
                if (triesToAddOrChangeLeft || triesToAddOrChangeRight) {
                    return res.status(403).json({
                        error: 'Logo ekleme ve logo ayarlari sadece full branding dahil paketlerde kullanilabilir.',
                        code: 'PRO_FEATURE',
                        feature: 'branding_logos',
                    });
                }

                if (themeTouchesDesignKeys(newTheme) && themeViolatesLimitedAccess(newTheme)) {
                    const oldDesignState = oldTheme || {};
                    const newDesignState = newTheme || {};

                    if (themeDesignStateDiffers(oldDesignState, newDesignState)) {
                        return res.status(403).json({
                            error: 'Gelismis tema ve gorsel ayarlari sadece full branding dahil paketlerde kullanilabilir. Alt paketlerde sadece Varsayilan ve Cift Renkler aciktir.',
                            code: 'PRO_FEATURE',
                            feature: 'advanced_designs',
                        });
                    }
                }
            }

            updateData.settings = validatedData.settings;
        }

        // Check if status is being changed to a non-joinable state
        const endingStatuses = ['finished', 'closed', 'ended', 'cancelled'];
        const isEnding = validatedData.status !== undefined && 
                         endingStatuses.includes(validatedData.status.toLowerCase());

        const event = await tenantDb.update(
            'event',
            req.organizationId!,
            { id: req.params.id },
            updateData
        );

        // If event is ending, notify and disconnect all participants
        if (isEnding) {
            const { endEvent } = await import('../services/websocketService');
            await endEvent({
                eventId: req.params.id,
                message: 'Etkinlik sona erdi. Katıldığınız için teşekkürler!'
            });
        }

        const mappedEvent = mapEventForFrontend(event);
        const limitedSettings = !superAdminBypass && !access.features.branding
            ? sanitizeSettingsForLimitedAccess((mappedEvent as any)?.settings)
            : (mappedEvent as any)?.settings;

        res.json({
            event: {
                ...mappedEvent,
                ...(limitedSettings ? { settings: limitedSettings } : {}),
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/start', async (req, res, next) => {
    try {
        const existing = await tenantDb.findUnique<{ event_pin: string | null; pin: string | null }>(
            'event',
            req.organizationId!,
            {
                where: { id: req.params.id },
                select: { event_pin: true, pin: true },
            }
        );

        const eventPin = existing?.event_pin || existing?.pin;
        if (!eventPin) {
            return res.status(400).json({ error: 'Etkinlik PIN bulunamadı' });
        }

        const joinUrl = await EventService.generateJoinUrl(req.params.id, eventPin, req.organizationId!, req);
        const qrCodeUrl = await EventService.generateQRCode(joinUrl);

        const event = await tenantDb.update(
            'event',
            req.organizationId!,
            { id: req.params.id },
            {
                status: 'active',
                start_time: new Date(),
                join_url: joinUrl,
                qr_code_url: qrCodeUrl,
            }
        );

        res.json({ event: mapEventForFrontend(event) });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/qanda/anonymous', async (req, res, next) => {
    try {
        const body = z.object({ enabled: z.boolean() }).parse(req.body);

        const existing = await tenantDb.findUnique<any>('event', req.organizationId!, {
            where: { id: req.params.id },
            select: { id: true, settings: true },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }

        const settings: any = existing.settings || {};
        const nextSettings = {
            ...settings,
            qanda: {
                ...(settings?.qanda || {}),
                anonymousMode: body.enabled,
            },
        };

        await tenantDb.update(
            'event',
            req.organizationId!,
            { id: req.params.id },
            { settings: nextSettings }
        );

        res.json({ enabled: body.enabled });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/qanda/allow-multiple', async (req, res, next) => {
    try {
        const body = z.object({ enabled: z.boolean() }).parse(req.body);

        const existing = await tenantDb.findUnique<any>('event', req.organizationId!, {
            where: { id: req.params.id },
            select: { id: true, settings: true },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }

        const settings: any = existing.settings || {};
        const nextSettings = {
            ...settings,
            qanda: {
                ...(settings?.qanda || {}),
                allowMultipleQuestionsFromDevice: body.enabled,
            },
        };

        await tenantDb.update(
            'event',
            req.organizationId!,
            { id: req.params.id },
            { settings: nextSettings }
        );

        res.json({ success: true, enabled: body.enabled });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/tablet/token', async (req, res, next) => {
    try {
        if (!req.userId || !req.organizationId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }

        const event = await tenantDb.findUnique<any>('event', req.organizationId!, {
            where: { id: req.params.id },
            select: { id: true, settings: true },
        });

        if (!event) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }

        const role = String(req.userRole || 'organizer');
        const superAdminBypass = hasFullAccess({ role: req.userRole, email: req.userEmail });
        if (!superAdminBypass && !canManageEventSteps(role, event.settings)) {
            return res.status(403).json({ error: 'Tablet ekranı için yetkiniz yok' });
        }

        // Token is bound to the current authenticated user/org and expires quickly.
        // The tablet UI will store it as auth_token.
        const token = generateShortLivedToken(
            {
                userId: req.userId,
                organizationId: req.organizationId,
                email: req.userEmail,
                role: req.userRole,
                purpose: 'tablet',
                eventId: req.params.id,
            } as any,
            '12h'
        );

        return res.json({ token });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/qanda/report', async (req, res, next) => {
    try {
        const formatRaw = String((req.query as any)?.format || 'json').toLowerCase();
        const format = formatRaw === 'csv' ? 'csv' : 'json';

        const event = await tenantDb.findUnique<any>('event', req.organizationId!, {
            where: { id: req.params.id },
            select: { id: true, name: true, status: true, settings: true, created_at: true, start_time: true, end_time: true },
        });

        if (!event) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }

        const submissions = await tenantDb.direct.qanda_submissions.findMany({
            where: { event_id: req.params.id } as any,
            orderBy: { created_at: 'asc' } as any,
        });

        const rows = (submissions || []).map((q: any) => ({
            id: q.id,
            createdAt: q.created_at,
            updatedAt: q.updated_at,
            participantId: q.participant_id,
            participantName: q.participant_name,
            questionText: q.question_text,
            status: q.status,
            isAnswered: q.is_answered,
        }));

        const toCsvCell = (v: any) => {
            const s = v === null || v === undefined ? '' : String(v);
            const escaped = s.replace(/\r?\n/g, ' ').replace(/"/g, '""');
            return `"${escaped}"`;
        };

        const header = [
            'createdAt',
            'participantName',
            'questionText',
            'status',
            'participantId',
            'id',
        ].join(',');

        const csv = [
            header,
            ...rows.map((r) => [
                toCsvCell(r.createdAt ? new Date(r.createdAt).toISOString() : ''),
                toCsvCell(r.participantName),
                toCsvCell(r.questionText),
                toCsvCell(r.status),
                toCsvCell(r.participantId),
                toCsvCell(r.id),
            ].join(',')),
        ].join('\n');

        // Best-effort: persist to reports table (so /dashboard/reports can list it)
        try {
            const existingCsvReport = await tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'csv' } as any,
                select: { id: true } as any,
            });

            if (!existingCsvReport?.id) {
                await tenantDb.direct.reports.create({
                    data: {
                        id: randomUUID(),
                        event_id: req.params.id,
                        type: 'qanda_final',
                        format: 'csv',
                        data: {
                            event: {
                                id: event.id,
                                name: event.name,
                                status: event.status,
                                qandaStopped: Boolean(event?.settings?.qanda?.stopped),
                                qandaStoppedAt: event?.settings?.qanda?.stoppedAt || null,
                                createdAt: event.created_at,
                                startTime: event.start_time,
                                endTime: event.end_time,
                            },
                            rowCount: rows.length,
                            csv,
                            questions: rows,
                        } as any,
                        generated_at: new Date(),
                    } as any,
                });
            }

            const existingPdfReport = await tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'pdf' } as any,
                select: { id: true } as any,
            });

            if (!existingPdfReport?.id) {
                const pdfBase64 = await buildQandaPdfBase64({
                    eventName: String(event.name || event.id || 'Etkinlik'),
                    generatedAt: new Date(),
                    rows,
                });

                await tenantDb.direct.reports.create({
                    data: {
                        id: randomUUID(),
                        event_id: req.params.id,
                        type: 'qanda_final',
                        format: 'pdf',
                        data: {
                            event: {
                                id: event.id,
                                name: event.name,
                                status: event.status,
                                qandaStopped: Boolean(event?.settings?.qanda?.stopped),
                                qandaStoppedAt: event?.settings?.qanda?.stoppedAt || null,
                                createdAt: event.created_at,
                                startTime: event.start_time,
                                endTime: event.end_time,
                            },
                            rowCount: rows.length,
                            pdfVersion: QANDA_PDF_VERSION,
                            pdfBase64,
                        } as any,
                        generated_at: new Date(),
                    } as any,
                });
            }

            const existingXlsxReport = await tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'xlsx' } as any,
                select: { id: true } as any,
            });

            if (!existingXlsxReport?.id) {
                const xlsxBase64 = await buildQandaXlsxBase64({
                    eventName: String(event.name || event.id || 'Etkinlik'),
                    generatedAt: new Date(),
                    rows,
                });

                await tenantDb.direct.reports.create({
                    data: {
                        id: randomUUID(),
                        event_id: req.params.id,
                        type: 'qanda_final',
                        format: 'xlsx',
                        data: {
                            event: {
                                id: event.id,
                                name: event.name,
                                status: event.status,
                                qandaStopped: Boolean(event?.settings?.qanda?.stopped),
                                qandaStoppedAt: event?.settings?.qanda?.stoppedAt || null,
                                createdAt: event.created_at,
                                startTime: event.start_time,
                                endTime: event.end_time,
                            },
                            rowCount: rows.length,
                            xlsxBase64,
                        } as any,
                        generated_at: new Date(),
                    } as any,
                });
            }
        } catch (e) {
            console.error('[QANDA REPORT] persist failed:', e);
        }

        if (format === 'csv') {
            const safeName = String(event.name || 'etkinlik')
                .replace(/[^\w\d\-_. ]+/g, '')
                .trim()
                .slice(0, 60) || 'etkinlik';

            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${safeName}-${String(event.id).slice(0, 8)}-qanda-rapor.csv"`);
            return res.status(200).send(csv);
        }

        res.json({
            event: {
                id: event.id,
                name: event.name,
                status: event.status,
                qandaStopped: Boolean(event?.settings?.qanda?.stopped),
                qandaStoppedAt: event?.settings?.qanda?.stoppedAt || null,
                createdAt: event.created_at,
                startTime: event.start_time,
                endTime: event.end_time,
            },
            questions: rows,
        });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/qanda/stop', async (req, res, next) => {
    try {
        const existing = await tenantDb.findUnique<any>('event', req.organizationId!, {
            where: { id: req.params.id },
            select: { id: true, settings: true },
        });

        if (!existing) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }

        const settings: any = existing.settings || {};
        const nextSettings = {
            ...settings,
            qanda: {
                ...(settings?.qanda || {}),
                stopped: true,
                stoppedAt: new Date().toISOString(),
            },
        };

        await tenantDb.update(
            'event',
            req.organizationId!,
            { id: req.params.id },
            {
                settings: nextSettings,
                status: 'completed',
                end_time: new Date(),
            }
        );

        // Create a report entry once so it shows under "Raporlar".
        // The reports table is not tenant-scoped by organization_id, so we must rely on the event scope check above.
        let reportId: string | null = null;
        try {
            const existingCsvReport = await tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'csv' } as any,
                select: { id: true } as any,
            });

            const existingXlsxReport = await tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'xlsx' } as any,
                select: { id: true } as any,
            });

            // Prefer returning XLSX report id if available
            if (existingXlsxReport?.id) reportId = existingXlsxReport.id;
            else if (existingCsvReport?.id) reportId = existingCsvReport.id;

            const existingPdfReport = await tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'pdf' } as any,
                select: { id: true } as any,
            });

            const needsCsv = !existingCsvReport?.id;
            const needsPdf = !existingPdfReport?.id;
            const needsXlsx = !existingXlsxReport?.id;

            if (needsCsv || needsPdf || needsXlsx) {
                const event = await tenantDb.findUnique<any>('event', req.organizationId!, {
                    where: { id: req.params.id },
                    select: { id: true, name: true, created_at: true, start_time: true, end_time: true },
                });

                const submissions = await tenantDb.direct.qanda_submissions.findMany({
                    where: { event_id: req.params.id } as any,
                    orderBy: { created_at: 'asc' } as any,
                });

                const rows = (submissions || []).map((q: any) => ({
                    createdAt: q.created_at,
                    participantName: q.participant_name,
                    questionText: q.question_text,
                    status: q.status,
                    isAnswered: q.is_answered,
                    participantId: q.participant_id,
                    id: q.id,
                }));

                const toCsvCell = (v: any) => {
                    const s = v === null || v === undefined ? '' : String(v);
                    const escaped = s.replace(/\r?\n/g, ' ').replace(/"/g, '""');
                    return `"${escaped}"`;
                };

                const header = [
                    'createdAt',
                    'participantName',
                    'questionText',
                    'status',
                    'participantId',
                    'id',
                ].join(',');

                const csv = [
                    header,
                    ...rows.map((r) => [
                        toCsvCell(r.createdAt ? new Date(r.createdAt).toISOString() : ''),
                        toCsvCell(r.participantName),
                        toCsvCell(r.questionText),
                        toCsvCell(r.status),
                        toCsvCell(r.participantId),
                        toCsvCell(r.id),
                    ].join(',')),
                ].join('\n');

                if (needsCsv) {
                    reportId = randomUUID();
                    await tenantDb.direct.reports.create({
                        data: {
                            id: reportId,
                            event_id: req.params.id,
                            type: 'qanda_final',
                            format: 'csv',
                            data: {
                                event: {
                                    id: event?.id || req.params.id,
                                    name: event?.name || null,
                                    createdAt: event?.created_at || null,
                                    startTime: event?.start_time || null,
                                    endTime: event?.end_time || null,
                                },
                                rowCount: rows.length,
                                csv,
                            } as any,
                            generated_at: new Date(),
                        } as any,
                    });
                }

                if (needsXlsx) {
                    const xlsxBase64 = await buildQandaXlsxBase64({
                        eventName: String(event?.name || event?.id || req.params.id || 'Etkinlik'),
                        generatedAt: new Date(),
                        rows,
                    });

                    const xlsxId = randomUUID();
                    await tenantDb.direct.reports.create({
                        data: {
                            id: xlsxId,
                            event_id: req.params.id,
                            type: 'qanda_final',
                            format: 'xlsx',
                            data: {
                                event: {
                                    id: event?.id || req.params.id,
                                    name: event?.name || null,
                                    createdAt: event?.created_at || null,
                                    startTime: event?.start_time || null,
                                    endTime: event?.end_time || null,
                                },
                                rowCount: rows.length,
                                xlsxBase64,
                            } as any,
                            generated_at: new Date(),
                        } as any,
                    });

                    // Prefer XLSX as the primary report id
                    reportId = xlsxId;
                }

                if (needsPdf) {
                    const pdfBase64 = await buildQandaPdfBase64({
                        eventName: String(event?.name || event?.id || req.params.id || 'Etkinlik'),
                        generatedAt: new Date(),
                        rows,
                    });

                    await tenantDb.direct.reports.create({
                        data: {
                            id: randomUUID(),
                            event_id: req.params.id,
                            type: 'qanda_final',
                            format: 'pdf',
                            data: {
                                event: {
                                    id: event?.id || req.params.id,
                                    name: event?.name || null,
                                    createdAt: event?.created_at || null,
                                    startTime: event?.start_time || null,
                                    endTime: event?.end_time || null,
                                },
                                rowCount: rows.length,
                                pdfVersion: QANDA_PDF_VERSION,
                                pdfBase64,
                            } as any,
                            generated_at: new Date(),
                        } as any,
                    });
                }
            }
        } catch (e) {
            console.error('[QANDA STOP] report generation failed:', e);
            // Best-effort: stopping presentation must still succeed.
        }

        res.json({ stopped: true, status: 'completed', message: 'Soru gönderimi bitmiştir', reportId });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/refresh-join', async (req, res, next) => {
    try {
        const existing = await tenantDb.findUnique<{ event_pin: string | null; pin: string | null }>(
            'event',
            req.organizationId!,
            {
                where: { id: req.params.id },
                select: { event_pin: true, pin: true },
            }
        );

        const eventPin = existing?.event_pin || existing?.pin;
        if (!eventPin) {
            return res.status(400).json({ error: 'Etkinlik PIN bulunamadı' });
        }

        const joinUrl = await EventService.generateJoinUrl(req.params.id, eventPin, req.organizationId!, req);
        const qrCodeUrl = await EventService.generateQRCode(joinUrl);

        const event = await tenantDb.update(
            'event',
            req.organizationId!,
            { id: req.params.id },
            { join_url: joinUrl, qr_code_url: qrCodeUrl }
        );

        res.json({ event, joinUrl, qrCodeUrl });
    } catch (error) {
        next(error);
    }
});

router.post('/:id/end', async (req, res, next) => {
    try {
        const event = await tenantDb.update(
            'event',
            req.organizationId!,
            { id: req.params.id },
            {
                status: 'completed',
                end_time: new Date(),
            }
        );

        res.json({ event });
    } catch (error) {
        next(error);
    }
});

router.delete('/:id', async (req, res, next) => {
    try {
        await tenantDb.delete(
            'event',
            req.organizationId!,
            { id: req.params.id }
        );
        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
