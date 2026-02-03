"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const eventService_1 = require("../services/eventService");
const tenantDb_1 = require("../database/tenantDb");
const tenantContext_1 = require("../middleware/tenantContext");
const auditLog_1 = require("../database/auditLog");
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const jwt_1 = require("../utils/jwt");
const router = express_1.default.Router();
router.use(tenantContext_1.tenantContextMiddleware);
const mapEventForFrontend = (event) => {
    if (!event)
        return event;
    const eventPin = event.event_pin ?? event.eventPin ?? event.pin;
    const eventCode = event.event_code ?? event.eventCode;
    const joinUrl = event.join_url ?? event.joinUrl;
    const qrCodeUrl = event.qr_code_url ?? event.qrCodeUrl;
    const eventType = event.event_type ?? event.eventType;
    const maxParticipants = event.max_participants ?? event.maxParticipants;
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
    if (!raw || !raw.trim())
        return null;
    const parts = raw
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
    return parts.length ? new Set(parts) : null;
})();
const createEventSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, 'Etkinlik başlığı zorunludur'),
    description: zod_1.z.string().optional(),
    eventType: zod_1.z.enum(['quiz', 'poll', 'tombala', 'matching']).default('quiz'),
    maxParticipants: zod_1.z.number().int().positive().optional(),
    eventPin: zod_1.z
        .string()
        .regex(/^\d{6}$/, 'PIN 6 haneli olmalıdır')
        .optional(),
    // Client may send these for preview purposes; server generates canonical values.
    joinUrl: zod_1.z.string().optional(),
    qrCodeUrl: zod_1.z.string().optional(),
    status: zod_1.z.enum(['draft', 'active', 'completed', 'cancelled']).optional(),
    settings: zod_1.z.object({
        registration: zod_1.z.object({
            requirePin: zod_1.z.boolean(),
            requireName: zod_1.z.boolean(),
            requireEmail: zod_1.z.boolean(),
            requirePhone: zod_1.z.boolean(),
            requireAvatar: zod_1.z.boolean(),
            requireId: zod_1.z.boolean(),
            allowAnonymous: zod_1.z.boolean(),
            requireKvkkConsent: zod_1.z.boolean(),
        }).passthrough(),
        gameplay: zod_1.z.object({
            autoMarkNumbers: zod_1.z.boolean(),
            autoStartEvent: zod_1.z.boolean(),
            startDateTime: zod_1.z.string().optional(),
        }).passthrough(),
    }).passthrough(),
});
async function buildQandaPdfBase64(params) {
    const { default: PDFDocument } = await Promise.resolve().then(() => __importStar(require('pdfkit')));
    const doc = new PDFDocument({ size: 'A4', margin: 48 });
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const done = new Promise((resolve, reject) => {
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
    });
    const title = `${params.eventName || 'Etkinlik'} - Soru/Yorum Raporu`;
    doc.fontSize(18).fillColor('#111').text(title);
    doc.moveDown(0.25);
    doc.fontSize(10).fillColor('#444').text(`Oluşturulma: ${params.generatedAt.toISOString()}`);
    doc.moveDown(1);
    doc.fillColor('#000');
    if (!params.rows?.length) {
        doc.fontSize(11).text('Kayıtlı soru/yorum bulunamadı.');
        doc.end();
        const buffer = await done;
        return buffer.toString('base64');
    }
    doc.fontSize(11).text('Soru/Yorumlar', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10);
    for (let i = 0; i < params.rows.length; i++) {
        const r = params.rows[i];
        const who = (r.participantName || '').trim() || 'Anonim';
        const when = r.createdAt ? new Date(r.createdAt).toISOString() : '';
        const status = r.status ? String(r.status) : '';
        const answered = r.isAnswered === true ? 'answered' : r.isAnswered === false ? 'unanswered' : '';
        doc.fillColor('#111').text(`${i + 1}. ${who} — ${when}${status ? ` — ${status}` : ''}${answered ? ` — ${answered}` : ''}`);
        doc.fillColor('#000').text(String(r.questionText || ''), { indent: 12 });
        doc.moveDown(0.5);
        if (doc.y > 760) {
            doc.addPage();
        }
    }
    doc.end();
    const buffer = await done;
    return buffer.toString('base64');
}
async function buildQandaXlsxBase64(params) {
    const ExcelJS = await Promise.resolve().then(() => __importStar(require('exceljs')));
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
        if (rowNumber === 1)
            return;
        row.alignment = { vertical: 'top', wrapText: true };
    });
    // Title worksheet name in properties (event name)
    sheet.headerFooter.oddHeader = `&C&"Arial,Bold"${params.eventName || 'Etkinlik'} - Soru/Yorum Raporu`;
    const bufferLike = await workbook.xlsx.writeBuffer();
    const buffer = Buffer.isBuffer(bufferLike) ? bufferLike : Buffer.from(bufferLike);
    return buffer.toString('base64');
}
router.get('/', async (req, res, next) => {
    try {
        const events = await tenantDb_1.tenantDb.findMany('event', req.organizationId, {
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
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id', async (req, res, next) => {
    try {
        const event = await tenantDb_1.tenantDb.findUnique('event', req.organizationId, {
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
        res.json({ event: mapEventForFrontend(event) });
    }
    catch (error) {
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
        if (validatedData.eventPin) {
            const existing = await tenantDb_1.tenantDb.findFirst('event', req.organizationId, {
                where: { event_pin: validatedData.eventPin },
                select: { id: true },
            });
            if (existing) {
                return res.status(409).json({
                    error: 'Bu PIN zaten kullanılıyor. Lütfen tekrar deneyin.',
                });
            }
        }
        const event = await eventService_1.EventService.createEvent({
            organizationId: req.organizationId,
            userId: req.userId,
            ...validatedData,
        });
        const mappedEvent = mapEventForFrontend(event);
        await auditLog_1.AuditLogger.log({
            organizationId: req.organizationId,
            userId: req.userId,
            action: 'CREATE',
            resource: 'event',
            resourceId: event.id,
            details: {
                title: event.name,
                eventType: event.event_type,
                pin: event.event_pin || event.pin,
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/regenerate-pin', async (req, res, next) => {
    try {
        const result = await eventService_1.EventService.regeneratePin(req.params.id, req.organizationId);
        await auditLog_1.AuditLogger.log({
            organizationId: req.organizationId,
            userId: req.userId,
            action: 'UPDATE',
            resource: 'event',
            resourceId: req.params.id,
            details: { action: 'regenerate_pin', newPin: result.pin },
            ipAddress: req.ip,
        });
        res.json({
            pin: result.pin,
            joinUrl: result.joinUrl,
            qrCodeUrl: result.qrCodeUrl,
        });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/:id', async (req, res, next) => {
    try {
        const validatedData = createEventSchema.partial().parse(req.body);
        if (allowedEventTypes && validatedData.eventType !== undefined && !allowedEventTypes.has(validatedData.eventType)) {
            return res.status(400).json({
                error: 'Bu sitede sadece Canlı Soru etkinliği desteklenir.',
            });
        }
        const updateData = {};
        if (validatedData.title !== undefined)
            updateData.name = validatedData.title;
        if (validatedData.description !== undefined)
            updateData.description = validatedData.description;
        if (validatedData.eventType !== undefined)
            updateData.event_type = validatedData.eventType;
        if (validatedData.maxParticipants !== undefined)
            updateData.max_participants = validatedData.maxParticipants;
        if (validatedData.status !== undefined)
            updateData.status = validatedData.status;
        if (validatedData.settings !== undefined)
            updateData.settings = validatedData.settings;
        const event = await tenantDb_1.tenantDb.update('event', req.organizationId, { id: req.params.id }, updateData);
        res.json({ event: mapEventForFrontend(event) });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/start', async (req, res, next) => {
    try {
        const existing = await tenantDb_1.tenantDb.findUnique('event', req.organizationId, {
            where: { id: req.params.id },
            select: { event_pin: true, pin: true },
        });
        const eventPin = existing?.event_pin || existing?.pin;
        if (!eventPin) {
            return res.status(400).json({ error: 'Etkinlik PIN bulunamadı' });
        }
        const joinUrl = eventService_1.EventService.generateJoinUrl(req.params.id, eventPin);
        const qrCodeUrl = await eventService_1.EventService.generateQRCode(joinUrl);
        const event = await tenantDb_1.tenantDb.update('event', req.organizationId, { id: req.params.id }, {
            status: 'active',
            start_time: new Date(),
            join_url: joinUrl,
            qr_code_url: qrCodeUrl,
        });
        res.json({ event: mapEventForFrontend(event) });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/qanda/anonymous', async (req, res, next) => {
    try {
        const body = zod_1.z.object({ enabled: zod_1.z.boolean() }).parse(req.body);
        const existing = await tenantDb_1.tenantDb.findUnique('event', req.organizationId, {
            where: { id: req.params.id },
            select: { id: true, settings: true },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }
        const settings = existing.settings || {};
        const nextSettings = {
            ...settings,
            qanda: {
                ...(settings?.qanda || {}),
                anonymousMode: body.enabled,
            },
        };
        await tenantDb_1.tenantDb.update('event', req.organizationId, { id: req.params.id }, { settings: nextSettings });
        res.json({ enabled: body.enabled });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/qanda/allow-multiple', async (req, res, next) => {
    try {
        const body = zod_1.z.object({ enabled: zod_1.z.boolean() }).parse(req.body);
        const existing = await tenantDb_1.tenantDb.findUnique('event', req.organizationId, {
            where: { id: req.params.id },
            select: { id: true, settings: true },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }
        const settings = existing.settings || {};
        const nextSettings = {
            ...settings,
            qanda: {
                ...(settings?.qanda || {}),
                allowMultipleQuestionsFromDevice: body.enabled,
            },
        };
        await tenantDb_1.tenantDb.update('event', req.organizationId, { id: req.params.id }, { settings: nextSettings });
        res.json({ success: true, enabled: body.enabled });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/tablet/token', async (req, res, next) => {
    try {
        if (!req.userId || !req.organizationId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }
        // Token is bound to the current authenticated user/org and expires quickly.
        // The tablet UI will store it as auth_token.
        const token = (0, jwt_1.generateShortLivedToken)({
            userId: req.userId,
            organizationId: req.organizationId,
            email: req.userEmail,
            role: req.userRole,
            purpose: 'tablet',
            eventId: req.params.id,
        }, '10m');
        return res.json({ token });
    }
    catch (error) {
        next(error);
    }
});
router.get('/:id/qanda/report', async (req, res, next) => {
    try {
        const formatRaw = String(req.query?.format || 'json').toLowerCase();
        const format = formatRaw === 'csv' ? 'csv' : 'json';
        const event = await tenantDb_1.tenantDb.findUnique('event', req.organizationId, {
            where: { id: req.params.id },
            select: { id: true, name: true, status: true, settings: true, created_at: true, start_time: true, end_time: true },
        });
        if (!event) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }
        const submissions = await tenantDb_1.tenantDb.direct.qanda_submissions.findMany({
            where: { event_id: req.params.id },
            orderBy: { created_at: 'asc' },
        });
        const rows = (submissions || []).map((q) => ({
            id: q.id,
            createdAt: q.created_at,
            updatedAt: q.updated_at,
            participantId: q.participant_id,
            participantName: q.participant_name,
            questionText: q.question_text,
            status: q.status,
            isAnswered: q.is_answered,
        }));
        const toCsvCell = (v) => {
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
            const existingCsvReport = await tenantDb_1.tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'csv' },
                select: { id: true },
            });
            if (!existingCsvReport?.id) {
                await tenantDb_1.tenantDb.direct.reports.create({
                    data: {
                        id: (0, crypto_1.randomUUID)(),
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
                        },
                        generated_at: new Date(),
                    },
                });
            }
            const existingPdfReport = await tenantDb_1.tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'pdf' },
                select: { id: true },
            });
            if (!existingPdfReport?.id) {
                const pdfBase64 = await buildQandaPdfBase64({
                    eventName: String(event.name || event.id || 'Etkinlik'),
                    generatedAt: new Date(),
                    rows,
                });
                await tenantDb_1.tenantDb.direct.reports.create({
                    data: {
                        id: (0, crypto_1.randomUUID)(),
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
                            pdfBase64,
                        },
                        generated_at: new Date(),
                    },
                });
            }
            const existingXlsxReport = await tenantDb_1.tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'xlsx' },
                select: { id: true },
            });
            if (!existingXlsxReport?.id) {
                const xlsxBase64 = await buildQandaXlsxBase64({
                    eventName: String(event.name || event.id || 'Etkinlik'),
                    generatedAt: new Date(),
                    rows,
                });
                await tenantDb_1.tenantDb.direct.reports.create({
                    data: {
                        id: (0, crypto_1.randomUUID)(),
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
                        },
                        generated_at: new Date(),
                    },
                });
            }
        }
        catch (e) {
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
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/qanda/stop', async (req, res, next) => {
    try {
        const existing = await tenantDb_1.tenantDb.findUnique('event', req.organizationId, {
            where: { id: req.params.id },
            select: { id: true, settings: true },
        });
        if (!existing) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }
        const settings = existing.settings || {};
        const nextSettings = {
            ...settings,
            qanda: {
                ...(settings?.qanda || {}),
                stopped: true,
                stoppedAt: new Date().toISOString(),
            },
        };
        await tenantDb_1.tenantDb.update('event', req.organizationId, { id: req.params.id }, {
            settings: nextSettings,
            status: 'completed',
            end_time: new Date(),
        });
        // Create a report entry once so it shows under "Raporlar".
        // The reports table is not tenant-scoped by organization_id, so we must rely on the event scope check above.
        let reportId = null;
        try {
            const existingCsvReport = await tenantDb_1.tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'csv' },
                select: { id: true },
            });
            const existingXlsxReport = await tenantDb_1.tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'xlsx' },
                select: { id: true },
            });
            // Prefer returning XLSX report id if available
            if (existingXlsxReport?.id)
                reportId = existingXlsxReport.id;
            else if (existingCsvReport?.id)
                reportId = existingCsvReport.id;
            const existingPdfReport = await tenantDb_1.tenantDb.direct.reports.findFirst({
                where: { event_id: req.params.id, type: 'qanda_final', format: 'pdf' },
                select: { id: true },
            });
            const needsCsv = !existingCsvReport?.id;
            const needsPdf = !existingPdfReport?.id;
            const needsXlsx = !existingXlsxReport?.id;
            if (needsCsv || needsPdf || needsXlsx) {
                const event = await tenantDb_1.tenantDb.findUnique('event', req.organizationId, {
                    where: { id: req.params.id },
                    select: { id: true, name: true, created_at: true, start_time: true, end_time: true },
                });
                const submissions = await tenantDb_1.tenantDb.direct.qanda_submissions.findMany({
                    where: { event_id: req.params.id },
                    orderBy: { created_at: 'asc' },
                });
                const rows = (submissions || []).map((q) => ({
                    createdAt: q.created_at,
                    participantName: q.participant_name,
                    questionText: q.question_text,
                    status: q.status,
                    isAnswered: q.is_answered,
                    participantId: q.participant_id,
                    id: q.id,
                }));
                const toCsvCell = (v) => {
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
                    reportId = (0, crypto_1.randomUUID)();
                    await tenantDb_1.tenantDb.direct.reports.create({
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
                            },
                            generated_at: new Date(),
                        },
                    });
                }
                if (needsXlsx) {
                    const xlsxBase64 = await buildQandaXlsxBase64({
                        eventName: String(event?.name || event?.id || req.params.id || 'Etkinlik'),
                        generatedAt: new Date(),
                        rows,
                    });
                    const xlsxId = (0, crypto_1.randomUUID)();
                    await tenantDb_1.tenantDb.direct.reports.create({
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
                            },
                            generated_at: new Date(),
                        },
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
                    await tenantDb_1.tenantDb.direct.reports.create({
                        data: {
                            id: (0, crypto_1.randomUUID)(),
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
                                pdfBase64,
                            },
                            generated_at: new Date(),
                        },
                    });
                }
            }
        }
        catch (e) {
            console.error('[QANDA STOP] report generation failed:', e);
            // Best-effort: stopping presentation must still succeed.
        }
        res.json({ stopped: true, status: 'completed', message: 'Soru gönderimi bitmiştir', reportId });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/refresh-join', async (req, res, next) => {
    try {
        const existing = await tenantDb_1.tenantDb.findUnique('event', req.organizationId, {
            where: { id: req.params.id },
            select: { event_pin: true, pin: true },
        });
        const eventPin = existing?.event_pin || existing?.pin;
        if (!eventPin) {
            return res.status(400).json({ error: 'Etkinlik PIN bulunamadı' });
        }
        const joinUrl = eventService_1.EventService.generateJoinUrl(req.params.id, eventPin);
        const qrCodeUrl = await eventService_1.EventService.generateQRCode(joinUrl);
        const event = await tenantDb_1.tenantDb.update('event', req.organizationId, { id: req.params.id }, { join_url: joinUrl, qr_code_url: qrCodeUrl });
        res.json({ event, joinUrl, qrCodeUrl });
    }
    catch (error) {
        next(error);
    }
});
router.post('/:id/end', async (req, res, next) => {
    try {
        const event = await tenantDb_1.tenantDb.update('event', req.organizationId, { id: req.params.id }, {
            status: 'completed',
            end_time: new Date(),
        });
        res.json({ event });
    }
    catch (error) {
        next(error);
    }
});
router.delete('/:id', async (req, res, next) => {
    try {
        await tenantDb_1.tenantDb.delete('event', req.organizationId, { id: req.params.id });
        res.status(204).send();
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
