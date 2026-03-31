import express from 'express';
import { tenantDb } from '../database/tenantDb';
import { z } from 'zod';
import { isSuperAdmin, getOrganizationAccess, hasFullAccess } from '../utils/access';

const router = express.Router();

function isThemeObject(value: unknown): value is Record<string, any> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

// Get event info for join page (registration settings)
router.get('/join-info', async (req, res, next) => {
    try {
        const { pin } = req.query;

        if (!pin || typeof pin !== 'string' || pin.length !== 6) {
            return res.status(400).json({ error: 'Geçersiz PIN' });
        }

        const event = await tenantDb.direct.events.findFirst({
            where: {
                OR: [{ event_pin: pin }, { pin: pin }],
            } as any,
            select: {
                id: true,
                name: true,
                status: true,
                settings: true,
            },
        });

        if (!event) {
            return res.status(404).json({ error: 'Etkinlik bulunamadı' });
        }

        // Allow participants to see info before event starts
        if (event.status !== 'active' && event.status !== 'draft') {
            return res.status(400).json({
                error: 'Etkinlik henüz başlamadı veya sona erdi'
            });
        }

        const settings = (event as any).settings || {};
        const registration = settings.registration || {};
        const theme = settings.theme || {};
        const mobileTheme = isThemeObject(theme.mobile) ? theme.mobile : {};
        const mobileThemeEnabled = mobileTheme.enabled === true;
        const effectiveTheme = mobileThemeEnabled
            ? {
                ...theme,
                ...mobileTheme,
            }
            : theme;

        // Return registration settings for dynamic form
        res.json({
            success: true,
            event: {
                id: event.id,
                name: event.name,
            },
            registration: {
                requireName: registration.requireName ?? true,
                requireEmail: registration.requireEmail ?? false,
                requirePhone: registration.requirePhone ?? false,
                requireAvatar: registration.requireAvatar ?? false,
                requireKvkkConsent: registration.requireKvkkConsent ?? false,
            },
            theme: {
                bgAnimation: effectiveTheme.bgAnimation ?? false,
                bgAnimationType: effectiveTheme.bgAnimationType ?? 'gradient',
                auroraColorPreset: effectiveTheme.auroraColorPreset ?? 'blue',
                gradientColorStart: effectiveTheme.gradientColorStart ?? null,
                gradientColorEnd: effectiveTheme.gradientColorEnd ?? null,
                colorPalette: effectiveTheme.colorPalette ?? 'koyu',
                backgroundColor: effectiveTheme.backgroundColor ?? null,
                backgroundImage: effectiveTheme.backgroundImage ?? null,
                background: effectiveTheme.background ?? null,
                textColor: effectiveTheme.textColor ?? null,
                buttonColorStart: effectiveTheme.buttonColorStart ?? null,
                buttonColorEnd: effectiveTheme.buttonColorEnd ?? null,
                heroLogoUrl: effectiveTheme.heroLogoUrl ?? null,
                heroPanelColor: effectiveTheme.heroPanelColor ?? null,
                heroTitleColor: effectiveTheme.heroTitleColor ?? null,
                heroSubtitleColor: effectiveTheme.heroSubtitleColor ?? null,
                logoUrl: mobileThemeEnabled
                    ? effectiveTheme.logoUrl || null
                    : theme.rightLogo?.url || theme.rightLogoUrl || null,
                rightLogoUrl: theme.rightLogo?.url || theme.rightLogoUrl || null,
                rightLogoShadow: theme.rightLogo?.shadow ?? false,
                rightLogoShadowColor: theme.rightLogo?.shadowColor || '#ffffff',
            },
        });
    } catch (error) {
        next(error);
    }
});

const joinEventSchema = z.object({
    pin: z.string().length(6, 'PIN 6 haneli olmalıdır'),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    avatar: z.string().optional(),
    // New fields for fingerprinting
    fingerprint: z.string().optional(),
    deviceType: z.string().optional(),
    browser: z.string().optional(),
    os: z.string().optional(),
    kvkkConsent: z.boolean().optional(),
});

router.post('/join', async (req, res, next) => {
    try {
        const validatedData = joinEventSchema.parse(req.body);

        const requestedName = validatedData.name?.trim();

        const event = await tenantDb.direct.events.findFirst({
            where: {
                OR: [{ event_pin: validatedData.pin }, { pin: validatedData.pin }],
            } as any,
            include: {
                users: { select: { role: true, email: true } },
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

        const eventSettings = (event as any).settings as any;
        if (eventSettings?.qanda?.stopped) {
            return res.status(403).json({
                error: 'Soru gönderimi bitmiştir',
                code: 'QANDA_STOPPED',
            });
        }

        const eventAny = event as any;

        const creator = Array.isArray(eventAny.users) ? eventAny.users[0] : eventAny.users;
        const creatorIsSuperAdmin = Boolean(
            creator && hasFullAccess({ role: creator.role, email: creator.email })
        );

        const storedMaxParticipants =
            (eventAny.max_participants !== undefined ? eventAny.max_participants : undefined) ??
            (eventAny.maxParticipants !== undefined ? eventAny.maxParticipants : undefined) ??
            null;

        // Plan-based participant limit
        let planLimit: number | null = null;
        if (!creatorIsSuperAdmin && eventAny.organization_id) {
            const access = await getOrganizationAccess(
                tenantDb.direct as any,
                eventAny.organization_id,
            );
            planLimit = access.features.maxParticipants;
        }

        const maxParticipants = creatorIsSuperAdmin
            ? storedMaxParticipants
            : (storedMaxParticipants ?? planLimit ?? 50);
        if (typeof maxParticipants === 'number' && maxParticipants > 0 && event._count.participants >= maxParticipants) {
            return res.status(400).json({
                error: 'Etkinlik katılımcı limiti doldu'
            });
        }

        // Fingerprint Uniqueness Check
        if (validatedData.fingerprint) {
            // Always treat the same device fingerprint as the same participant for a given event.
            // This prevents accidental duplicate joins from inflating participant counts.
            const existingParticipant = await tenantDb.direct.participants.findFirst({
                where: {
                    event_id: event.id,
                    fingerprint: validatedData.fingerprint,
                }
            });

            const timeoutThreshold = 45 * 60 * 1000; // 45 minutes
            const now = Date.now();

            if (existingParticipant) {
                // If the session is too old, don't restore it automatically if it's considered "timed out"
                const lastSeen = existingParticipant.last_seen_at ? new Date(existingParticipant.last_seen_at).getTime() : 0;
                const isTimedOut = now - lastSeen > timeoutThreshold;

                if (isTimedOut && existingParticipant.left_at === null) {
                    // Force mark as left if it was stale
                    await tenantDb.direct.participants.update({
                        where: { id: existingParticipant.id },
                        data: { left_at: new Date() }
                    });
                    // fall through to create a new session
                } else if (!isTimedOut) {
                    // If the user tries to change their name, ensure it's unique among active participants.
                    if (requestedName && requestedName.length > 0) {
                        const nameTaken = await tenantDb.direct.participants.findFirst({
                            where: {
                                event_id: event.id,
                                left_at: null,
                                id: { not: existingParticipant.id },
                                name: { equals: requestedName, mode: 'insensitive' },
                            } as any,
                            select: { id: true },
                        });

                        if (nameTaken) {
                            return res.status(409).json({
                                error: 'Bu isim sistemde var, lütfen farklı bir isim seçin',
                            });
                        }
                    }

                    // If user entered a new name on the same device, keep the same participant but update the stored name.
                    const shouldUpdateName = Boolean(
                        requestedName && requestedName.length > 0 && requestedName !== existingParticipant.name
                    );

                    // Merge existing metadata with new avatar if provided
                    const existingMetadata = (existingParticipant as any).metadata || {};
                    const updatedMetadata = validatedData.avatar
                        ? { ...existingMetadata, avatar: validatedData.avatar }
                        : existingMetadata;

                    const updatedParticipant = shouldUpdateName
                        ? await tenantDb.direct.participants.update({
                            where: { id: existingParticipant.id } as any,
                            data: {
                                name: requestedName,
                                last_seen_at: new Date(),
                                left_at: null,
                                metadata: updatedMetadata,
                            } as any,
                        })
                        : await tenantDb.direct.participants.update({
                            where: { id: existingParticipant.id } as any,
                            data: { last_seen_at: new Date(), left_at: null, metadata: updatedMetadata } as any,
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
                            eventType: (event as any).event_type ?? (event as any).eventType,
                        },
                        restored: true,
                    });
                }
            }
        }

        const settings = event.settings as any;

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
        const { randomUUID } = await import('crypto');

        // Enforce unique display name among active participants when a name is explicitly provided.
        // (We intentionally do NOT block blank names since some events may allow anonymous joins.)
        if (requestedName && requestedName.length > 0) {
            const nameTaken = await tenantDb.direct.participants.findFirst({
                where: {
                    event_id: event.id,
                    left_at: null,
                    name: { equals: requestedName, mode: 'insensitive' },
                } as any,
                select: { id: true },
            });

            if (nameTaken) {
                return res.status(409).json({
                    error: 'Bu isim sistemde var, lütfen farklı bir isim seçin',
                });
            }
        }

        const participant = await tenantDb.direct.participants.create({
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
                    os: validatedData.os,
                    avatar: validatedData.avatar || null
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
    } catch (error) {
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
        const event = await tenantDb.direct.events.findFirst({
            where: { id: eventId } as any,
            select: { status: true, settings: true }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found', eventStatus: 'not_found' });
        }

        const qandaStopped = Boolean((event as any)?.settings?.qanda?.stopped);

        // Check if event is ended or cancelled - notify client to exit
        if (event.status === 'ended' || event.status === 'cancelled') {
            return res.json({
                success: false,
                eventStatus: event.status,
                shouldExit: true,
                message: event.status === 'ended' ? 'Etkinlik sona erdi' : 'Etkinlik iptal edildi'
            });
        }

        if (qandaStopped) {
            return res.json({ success: true, eventStatus: event.status, qandaStopped: true, message: 'Soru gönderimi bitmiştir' });
        }

        if (event.status !== 'active' && event.status !== 'draft') {
            return res.status(400).json({ error: 'Event is not active', eventStatus: event.status });
        }

        // Check for inactivity timeout (45 minutes)
        const participant = await tenantDb.direct.participants.findFirst({
            where: { id: participantId, event_id: eventId } as any,
            select: { id: true, last_seen_at: true, left_at: true }
        });

        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        const timeoutThreshold = 45 * 60 * 1000;
        const lastSeen = (participant as any).last_seen_at ? new Date((participant as any).last_seen_at).getTime() : 0;
        const isTimedOut = Date.now() - lastSeen > timeoutThreshold;

        if (isTimedOut) {
            // Mark as left
            await tenantDb.direct.participants.update({
                where: { id: participant.id },
                data: { left_at: new Date() }
            });
            return res.status(403).json({
                success: false,
                shouldExit: true,
                code: 'SESSION_EXPIRED',
                message: 'Oturumunuz zaman aşımına uğradı (45 dk hareketsizlik). Lütfen tekrar giriş yapın.'
            });
        }

        // Update participant lastSeenAt (scoped to event)
        const result = await tenantDb.direct.participants.updateMany({
            where: { id: participantId, event_id: eventId } as any,
            data: { last_seen_at: new Date(), left_at: null }
        });

        if (result.count === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        res.json({ success: true, eventStatus: event.status, qandaStopped: false });
    } catch (error) {
        next(error);
    }
});


router.post('/leave', async (req, res, next) => {
    try {
        const { participantId, eventId } = req.body;

        if (!participantId || !eventId) {
            return res.status(400).json({ error: 'Participant ID and Event ID are required' });
        }

        const result = await tenantDb.direct.participants.updateMany({
            where: { id: participantId, event_id: eventId } as any,
            data: { left_at: new Date(), last_seen_at: new Date() }
        });

        if (result.count === 0) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        res.json({ success: true, status: 'left' });
    } catch (error) {
        next(error);
    }
});

// Submit a question
const submitQuestionSchema = z.object({
    eventId: z.string(),
    participantId: z.string(),
    questionText: z.string().min(1).max(500),
    participantName: z.string().optional()
});

router.post('/questions', async (req, res, next) => {
    try {
        const validatedData = submitQuestionSchema.parse(req.body);

        // Verify event exists and is active
        const event = await tenantDb.direct.events.findFirst({
            where: { id: validatedData.eventId } as any,
            select: { id: true, status: true, organization_id: true, settings: true }
        });

        if (!event) {
            return res.status(404).json({ error: 'Event not found' });
        }

        if ((event as any)?.settings?.qanda?.stopped) {
            return res.status(403).json({ error: 'Soru gönderimi bitmiştir', code: 'QANDA_STOPPED' });
        }

        if (event.status !== 'active' && event.status !== 'draft') {
            return res.status(400).json({ error: 'Event is not active' });
        }

        // Verify participant exists
        const participant = await tenantDb.direct.participants.findFirst({
            where: { id: validatedData.participantId } as any
        });

        if (!participant) {
            return res.status(404).json({ error: 'Participant not found' });
        }

        const qandaSettings = ((event as any)?.settings?.qanda || {}) as any;
        const allowMultipleQuestionsFromDevice = qandaSettings.allowMultipleQuestionsFromDevice !== false;
        if (!allowMultipleQuestionsFromDevice) {
            const fingerprint = (participant as any)?.fingerprint as string | undefined;

            const participantIds = fingerprint
                ? (await tenantDb.direct.participants.findMany({
                    where: { event_id: validatedData.eventId, fingerprint } as any,
                    select: { id: true },
                })).map((p: any) => p.id)
                : [validatedData.participantId];

            const existingQuestion = await tenantDb.direct.qanda_submissions.findFirst({
                where: {
                    event_id: validatedData.eventId,
                    participant_id: { in: participantIds },
                } as any,
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
        await tenantDb.direct.participants.updateMany({
            where: { id: validatedData.participantId, event_id: validatedData.eventId } as any,
            data: { last_seen_at: new Date() }
        });

        // Create the question - QandaSubmission tablosunda organizationId yok
        const { randomUUID } = await import('crypto');

        const question = await tenantDb.direct.qanda_submissions.create({
            data: {
                id: randomUUID(),
                event_id: validatedData.eventId,
                participant_id: validatedData.participantId,
                question_text: validatedData.questionText,
                participant_name: validatedData.participantName || (participant as any).name || 'Anonim',
                status: 'pending',
                updated_at: new Date(),
            }
        });

        res.status(201).json({
            success: true,
            question: {
                id: (question as any).id,
                questionText: validatedData.questionText,
                status: 'pending'
            }
        });
    } catch (error) {
        next(error);
    }
});

export default router;
