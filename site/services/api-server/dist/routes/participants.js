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
const tenantDb_1 = require("../database/tenantDb");
const zod_1 = require("zod");
const router = express_1.default.Router();
const joinEventSchema = zod_1.z.object({
    pin: zod_1.z.string().length(6, 'PIN 6 haneli olmalıdır'),
    name: zod_1.z.string().optional(),
    email: zod_1.z.string().email().optional(),
    phone: zod_1.z.string().optional(),
    avatar: zod_1.z.string().optional(),
    // New fields for fingerprinting
    fingerprint: zod_1.z.string().optional(),
    deviceType: zod_1.z.string().optional(),
    browser: zod_1.z.string().optional(),
    os: zod_1.z.string().optional(),
    kvkkConsent: zod_1.z.boolean().optional(),
});
router.post('/join', async (req, res, next) => {
    try {
        const validatedData = joinEventSchema.parse(req.body);
        const requestedName = validatedData.name?.trim();
        const event = await tenantDb_1.tenantDb.direct.events.findFirst({
            where: {
                OR: [{ event_pin: validatedData.pin }, { pin: validatedData.pin }],
            },
            include: {
                _count: { select: { participants: true } },
            },
        });
        if (!event) {
            return res.status(404).json({ error: 'Geçersiz PIN' });
        }
        // Allow participants to join before the event starts (draft), but block ended/cancelled events.
        // This is especially important for Q&A where people should be able to submit questions early.
        if (event.status !== 'active' && event.status !== 'draft') {
            return res.status(400).json({
                error: 'Etkinlik henüz başlamadı veya sona erdi'
            });
        }
        const eventSettings = event.settings;
        if (eventSettings?.qanda?.stopped) {
            return res.status(403).json({
                error: 'Soru gönderimi bitmiştir',
                code: 'QANDA_STOPPED',
            });
        }
        const eventAny = event;
        const maxParticipants = eventAny.max_participants ?? eventAny.maxParticipants;
        if (maxParticipants && event._count.participants >= maxParticipants) {
            return res.status(400).json({
                error: 'Etkinlik katılımcı limiti doldu'
            });
        }
        // Fingerprint Uniqueness Check
        if (validatedData.fingerprint) {
            // Always treat the same device fingerprint as the same participant for a given event.
            // This prevents accidental duplicate joins from inflating participant counts.
            const existingParticipant = await tenantDb_1.tenantDb.direct.participants.findFirst({
                where: {
                    event_id: event.id,
                    fingerprint: validatedData.fingerprint,
                }
            });
            if (existingParticipant) {
                // If the user tries to change their name, ensure it's unique among active participants.
                if (requestedName && requestedName.length > 0) {
                    const nameTaken = await tenantDb_1.tenantDb.direct.participants.findFirst({
                        where: {
                            event_id: event.id,
                            left_at: null,
                            id: { not: existingParticipant.id },
                            name: { equals: requestedName, mode: 'insensitive' },
                        },
                        select: { id: true },
                    });
                    if (nameTaken) {
                        return res.status(409).json({
                            error: 'Bu isim sistemde var, lütfen farklı bir isim seçin',
                        });
                    }
                }
                // If user entered a new name on the same device, keep the same participant but update the stored name.
                // This matches user expectations when they "log out" and join again with a different name.
                const shouldUpdateName = Boolean(requestedName && requestedName.length > 0 && requestedName !== existingParticipant.name);
                const updatedParticipant = shouldUpdateName
                    ? await tenantDb_1.tenantDb.direct.participants.update({
                        where: { id: existingParticipant.id },
                        data: {
                            name: requestedName,
                            last_seen_at: new Date(),
                            left_at: null,
                        },
                    })
                    : await tenantDb_1.tenantDb.direct.participants.update({
                        where: { id: existingParticipant.id },
                        data: { last_seen_at: new Date(), left_at: null },
                    });
                return res.status(200).json({
                    participant: {
                        id: updatedParticipant.id,
                        sessionId: updatedParticipant.id,
                        name: updatedParticipant.name,
                    },
                    event: {
                        id: event.id,
                        title: event.name,
                        eventType: event.event_type ?? event.eventType,
                    },
                    restored: true,
                });
            }
            // Check if multiple entries are allowed (default to true if not set)
            const allowMultiple = eventAny.allowMultipleEntries !== false; // Assuming field exists or defaults to true
            // If unique entries required, check existing participants
            if (!allowMultiple) {
                const existingParticipant = await tenantDb_1.tenantDb.direct.participants.findFirst({
                    where: {
                        event_id: event.id,
                        fingerprint: validatedData.fingerprint
                    }
                });
                if (existingParticipant) {
                    // If the user provided a name during a restored join, ensure it isn't taken by someone else.
                    if (requestedName && requestedName.length > 0) {
                        const nameTaken = await tenantDb_1.tenantDb.direct.participants.findFirst({
                            where: {
                                event_id: event.id,
                                left_at: null,
                                id: { not: existingParticipant.id },
                                name: { equals: requestedName, mode: 'insensitive' },
                            },
                            select: { id: true },
                        });
                        if (nameTaken) {
                            return res.status(409).json({
                                error: 'Bu isim sistemde var, lütfen farklı bir isim seçin',
                            });
                        }
                    }
                    // Consider this a re-join: clear left_at and refresh last_seen_at.
                    const updatedParticipant = await tenantDb_1.tenantDb.direct.participants.update({
                        where: { id: existingParticipant.id },
                        data: { last_seen_at: new Date(), left_at: null },
                    });
                    // If found, return the existing session instead of error to allow re-join
                    return res.status(200).json({
                        participant: {
                            id: updatedParticipant.id,
                            sessionId: updatedParticipant.id, // Re-use ID as session
                            name: updatedParticipant.name,
                        },
                        event: {
                            id: event.id,
                            title: event.name,
                            eventType: eventAny.event_type ?? eventAny.eventType,
                        },
                        restored: true
                    });
                }
            }
        }
        const settings = event.settings;
        if (settings?.registration?.requireName && !validatedData.name) {
            return res.status(400).json({ error: 'İsim gerekli' });
        }
        if (settings?.registration?.requireEmail && !validatedData.email) {
            return res.status(400).json({ error: 'E-posta gerekli' });
        }
        if (settings?.registration?.requireKvkkConsent && !validatedData.kvkkConsent) {
            return res.status(400).json({ error: 'KVKK onayı gerekli' });
        }
        // Participant tablosunda organizationId yok, doğrudan prisma kullanıyoruz
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        // Enforce unique display name among active participants when a name is explicitly provided.
        // (We intentionally do NOT block blank names since some events may allow anonymous joins.)
        if (requestedName && requestedName.length > 0) {
            const nameTaken = await tenantDb_1.tenantDb.direct.participants.findFirst({
                where: {
                    event_id: event.id,
                    left_at: null,
                    name: { equals: requestedName, mode: 'insensitive' },
                },
                select: { id: true },
            });
            if (nameTaken) {
                return res.status(409).json({
                    error: 'Bu isim sistemde var, lütfen farklı bir isim seçin',
                });
            }
        }
        const participant = await tenantDb_1.tenantDb.direct.participants.create({
            data: {
                id: randomUUID(),
                event_id: event.id,
                name: requestedName || 'Anonim',
                email: validatedData.email,
                phone: validatedData.phone,
                device_id: 'web',
                device_type: validatedData.deviceType,
                fingerprint: validatedData.fingerprint,
                last_seen_at: new Date(),
                metadata: {
                    deviceType: validatedData.deviceType,
                    browser: validatedData.browser,
                    os: validatedData.os
                }
            }
        });
        const sessionId = participant.id;
        res.status(201).json({
            participant: {
                id: participant.id,
                sessionId: sessionId,
                name: participant.name,
            },
            event: {
                id: event.id,
                title: event.name,
                eventType: eventAny.event_type ?? eventAny.eventType,
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/heartbeat', async (req, res, next) => {
    try {
        const { participantId, eventId } = req.body;
        if (!participantId || !eventId) {
            return res.status(400).json({ error: 'Participant ID and Event ID are required' });
        }
        // Verify event is still active
        const event = await tenantDb_1.tenantDb.direct.events.findFirst({
            where: { id: eventId },
            select: { status: true, settings: true }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        const qandaStopped = Boolean(event?.settings?.qanda?.stopped);
        if (qandaStopped) {
            return res.json({ success: true, status: 'stopped', qandaStopped: true, message: 'Soru gönderimi bitmiştir' });
        }
        if (event.status !== 'active' && event.status !== 'draft') {
            return res.status(400).json({ error: 'Event is not active', status: event.status });
        }
        // Update participant lastSeenAt (scoped to event)
        const result = await tenantDb_1.tenantDb.direct.participants.updateMany({
            where: { id: participantId, event_id: eventId },
            data: { last_seen_at: new Date(), left_at: null }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json({ success: true, status: 'ok', qandaStopped: false });
    }
    catch (error) {
        next(error);
    }
});
router.post('/leave', async (req, res, next) => {
    try {
        const { participantId, eventId } = req.body;
        if (!participantId || !eventId) {
            return res.status(400).json({ error: 'Participant ID and Event ID are required' });
        }
        const result = await tenantDb_1.tenantDb.direct.participants.updateMany({
            where: { id: participantId, event_id: eventId },
            data: { left_at: new Date(), last_seen_at: new Date() }
        });
        if (result.count === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        res.json({ success: true, status: 'left' });
    }
    catch (error) {
        next(error);
    }
});
// Submit a question
const submitQuestionSchema = zod_1.z.object({
    eventId: zod_1.z.string(),
    participantId: zod_1.z.string(),
    questionText: zod_1.z.string().min(1).max(500),
    participantName: zod_1.z.string().optional()
});
router.post('/questions', async (req, res, next) => {
    try {
        const validatedData = submitQuestionSchema.parse(req.body);
        // Verify event exists and is active
        const event = await tenantDb_1.tenantDb.direct.events.findFirst({
            where: { id: validatedData.eventId },
            select: { id: true, status: true, organization_id: true, settings: true }
        });
        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }
        if (event?.settings?.qanda?.stopped) {
            return res.status(403).json({ error: 'Soru gönderimi bitmiştir', code: 'QANDA_STOPPED' });
        }
        if (event.status !== 'active' && event.status !== 'draft') {
            return res.status(400).json({ error: 'Event is not active' });
        }
        // Verify participant exists
        const participant = await tenantDb_1.tenantDb.direct.participants.findFirst({
            where: { id: validatedData.participantId }
        });
        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }
        const qandaSettings = (event?.settings?.qanda || {});
        const allowMultipleQuestionsFromDevice = qandaSettings.allowMultipleQuestionsFromDevice !== false;
        if (!allowMultipleQuestionsFromDevice) {
            const fingerprint = participant?.fingerprint;
            const participantIds = fingerprint
                ? (await tenantDb_1.tenantDb.direct.participants.findMany({
                    where: { event_id: validatedData.eventId, fingerprint },
                    select: { id: true },
                })).map((p) => p.id)
                : [validatedData.participantId];
            const existingQuestion = await tenantDb_1.tenantDb.direct.qanda_submissions.findFirst({
                where: {
                    event_id: validatedData.eventId,
                    participant_id: { in: participantIds },
                },
                select: { id: true },
            });
            if (existingQuestion) {
                return res.status(409).json({
                    error: 'Bu cihazdan yalnızca 1 soru gönderilebilir',
                    code: 'MULTI_DEVICE_DISABLED',
                });
            }
        }
        // Mark participant as seen
        await tenantDb_1.tenantDb.direct.participants.updateMany({
            where: { id: validatedData.participantId, event_id: validatedData.eventId },
            data: { last_seen_at: new Date() }
        });
        // Create the question - QandaSubmission tablosunda organizationId yok
        const { randomUUID } = await Promise.resolve().then(() => __importStar(require('crypto')));
        const question = await tenantDb_1.tenantDb.direct.qanda_submissions.create({
            data: {
                id: randomUUID(),
                event_id: validatedData.eventId,
                participant_id: validatedData.participantId,
                question_text: validatedData.questionText,
                participant_name: validatedData.participantName || participant.name || 'Anonim',
                status: 'pending',
                updated_at: new Date(),
            }
        });
        res.status(201).json({
            success: true,
            question: {
                id: question.id,
                questionText: validatedData.questionText,
                status: 'pending'
            }
        });
    }
    catch (error) {
        next(error);
    }
});
exports.default = router;
