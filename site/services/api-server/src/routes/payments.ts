import crypto from 'node:crypto';
import express from 'express';
import { tenantContextMiddleware } from '../middleware/tenantContext';
import { tenantDb } from '../database/tenantDb';
import { getOrganizationAccess, isSuperAdmin } from '../utils/access';

const router = express.Router();

type PaytrPackage = {
    id: string;
    name: string;
    amount: number; // kurus
    plan: string;
    periodDays: number;
};

type PaytrAddon = {
    id: 'addon_remote' | 'addon_onsite';
    name: string;
    amount: number; // kurus
    scope: 'single_event';
};

type SubscriptionMetadata = Record<string, unknown> & {
    addons?: Array<Record<string, unknown>>;
    activation?: Record<string, unknown>;
    entitlements?: Array<Record<string, unknown>>;
    gateway?: Record<string, unknown>;
    package?: Record<string, unknown>;
    eventScope?: Record<string, unknown>;
};

const DEFAULT_PACKAGES: PaytrPackage[] = [
    { id: 'event-starter', name: 'Event Starter', amount: 300000, plan: 'event_starter', periodDays: 30 },
    { id: 'event-standard', name: 'Event Standard', amount: 450000, plan: 'event_standard', periodDays: 30 },
    { id: 'event-professional', name: 'Event Professional', amount: 900000, plan: 'event_professional', periodDays: 30 },
    { id: 'starter-wl', name: 'Starter WL', amount: 500000, plan: 'starter_wl', periodDays: 30 },
    { id: 'standard-wl', name: 'Standard WL', amount: 1000000, plan: 'standard_wl', periodDays: 30 },
    { id: 'professional-wl', name: 'Professional WL', amount: 2000000, plan: 'professional_wl', periodDays: 30 },
    { id: 'corporate', name: 'Corporate', amount: 3500000, plan: 'corporate', periodDays: 365 },
    { id: 'corporate-pro', name: 'Corporate Pro', amount: 6900000, plan: 'corporate_pro', periodDays: 365 },
    { id: 'corporate-wl', name: 'Corporate WL', amount: 5500000, plan: 'corporate_wl', periodDays: 365 },
    { id: 'corporate-pro-wl', name: 'Corporate Pro WL', amount: 12000000, plan: 'corporate_pro_wl', periodDays: 365 },
];

const PAYTR_ADDONS: Record<PaytrAddon['id'], PaytrAddon> = {
    addon_remote: {
        id: 'addon_remote',
        name: 'Remote Event Operator',
        amount: 700000,
        scope: 'single_event',
    },
    addon_onsite: {
        id: 'addon_onsite',
        name: 'On-site Event Operator',
        amount: 2000000,
        scope: 'single_event',
    },
};

function getPaytrPackages(): PaytrPackage[] {
    const premiumAmount = Number.parseInt(process.env.PAYTR_PREMIUM_AMOUNT ?? '', 10);
    if (!Number.isNaN(premiumAmount) && premiumAmount > 0) {
        return [{ ...DEFAULT_PACKAGES[0], amount: premiumAmount }, ...DEFAULT_PACKAGES.slice(1)];
    }
    return DEFAULT_PACKAGES;
}

function getClientIp(req: express.Request): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded.length > 0) {
        return forwarded[0];
    }
    return req.ip || '127.0.0.1';
}

function paytrHash(payload: string, merchantKey: string): string {
    return crypto.createHmac('sha256', merchantKey).update(payload).digest('base64');
}

function readSubscriptionMetadata(metadata: unknown): SubscriptionMetadata {
    return metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as SubscriptionMetadata)
        : {};
}

function normalizeAddonMetadata(addon: PaytrAddon, eventId: string | null) {
    return {
        id: addon.id,
        name: addon.name,
        amount: addon.amount,
        scope: addon.scope,
        eventId,
        eventUsageLimit: 1,
    };
}

function buildGatewayMetadata(merchantOid: string, status: string, totalAmount: string | number) {
    return {
        provider: 'paytr',
        merchant_oid: merchantOid,
        status,
        total_amount: totalAmount,
    };
}

function buildPendingMetadata(
    merchantOid: string,
    selectedPackage: PaytrPackage,
    selectedAddons: PaytrAddon[],
    currency: string,
    userId: string,
    eventId: string | null,
): SubscriptionMetadata {
    const normalizedAddons = selectedAddons.map((addon: PaytrAddon) => normalizeAddonMetadata(addon, eventId));

    return {
        merchant_oid: merchantOid,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        amount: selectedPackage.amount,
        totalAmount: selectedAddons.reduce((sum: number, addon: PaytrAddon) => sum + addon.amount, selectedPackage.amount),
        currency,
        periodDays: selectedPackage.periodDays,
        createdByUserId: userId,
        eventId,
        package: {
            id: selectedPackage.id,
            name: selectedPackage.name,
            plan: selectedPackage.plan,
            amount: selectedPackage.amount,
            periodDays: selectedPackage.periodDays,
        },
        addons: normalizedAddons,
        eventScope: {
            type: eventId ? 'single_event' : 'organization',
            eventId,
        },
        activation: {
            status: 'pending',
            activated_at: null,
            expires_at: null,
            failed_at: null,
        },
        entitlements: [],
        gateway: buildGatewayMetadata(merchantOid, 'pending', selectedAddons.reduce((sum: number, addon: PaytrAddon) => sum + addon.amount, selectedPackage.amount)),
    };
}

function buildEntitlements(plan: string, metadata: SubscriptionMetadata, now: Date, expiresAt: Date) {
    const addons = Array.isArray(metadata.addons) ? metadata.addons : [];

    return [
        {
            type: 'plan',
            key: plan,
            status: 'active',
            activatedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        },
        ...addons.map((addon) => ({
            type: 'addon',
            key: String(addon.id ?? ''),
            name: String(addon.name ?? ''),
            status: 'active',
            scope: String(addon.scope ?? 'single_event'),
            eventId: addon.eventId ?? metadata.eventId ?? null,
            eventUsageLimit: Number(addon.eventUsageLimit ?? 1),
            activatedAt: now.toISOString(),
            expiresAt: expiresAt.toISOString(),
        })),
    ];
}

router.post('/paytr/callback', async (req, res) => {
    const merchantOid = String(req.body?.merchant_oid ?? '');
    const status = String(req.body?.status ?? '');
    const totalAmount = String(req.body?.total_amount ?? '');
    const postedHash = String(req.body?.hash ?? '');

    const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? '';
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? '';

    if (!merchantOid || !status || !totalAmount || !postedHash || !merchantKey || !merchantSalt) {
        return res.status(400).send('PAYTR callback validation failed');
    }

    const expectedHash = paytrHash(`${merchantOid}${merchantSalt}${status}${totalAmount}`, merchantKey);
    if (expectedHash !== postedHash) {
        return res.status(403).send('PAYTR callback hash mismatch');
    }

    try {
        const pending = await tenantDb.direct.subscriptions.findFirst({
            where: {
                metadata: {
                    path: ['merchant_oid'],
                    equals: merchantOid,
                },
            } as any,
            orderBy: { created_at: 'desc' } as any,
        });

        if (!pending) {
            // Callback can arrive for orders already processed or old records.
            return res.status(200).send('OK');
        }

        const metadata = readSubscriptionMetadata(pending.metadata);
        const periodDays = Number(metadata.periodDays ?? 30);
        const now = new Date();
        const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

        if (pending.status === 'active' && metadata.paytr_status === 'success') {
            return res.status(200).send('OK');
        }

        if (status === 'success') {
            const entitlements = buildEntitlements(pending.plan || 'premium', metadata, now, periodEnd);
            await tenantDb.direct.subscriptions.update({
                where: { id: pending.id } as any,
                data: {
                    status: 'active',
                    payment_method: 'paytr',
                    current_period_start: now,
                    current_period_end: periodEnd,
                    updated_at: now,
                    metadata: {
                        ...metadata,
                        entitlements,
                        activation: {
                            status: 'active',
                            activated_at: now.toISOString(),
                            expires_at: periodEnd.toISOString(),
                            failed_at: null,
                        },
                        gateway: buildGatewayMetadata(merchantOid, status, totalAmount),
                        paytr_status: status,
                        paytr_total_amount: totalAmount,
                        activated_at: now.toISOString(),
                    } as any,
                } as any,
            });

            await tenantDb.direct.organizations.update({
                where: { id: pending.organization_id } as any,
                data: {
                    plan: pending.plan || 'premium',
                    updated_at: now,
                } as any,
            });
        } else {
            await tenantDb.direct.subscriptions.update({
                where: { id: pending.id } as any,
                data: {
                    status: 'failed',
                    updated_at: now,
                    metadata: {
                        ...metadata,
                        activation: {
                            status: 'failed',
                            activated_at: null,
                            expires_at: null,
                            failed_at: now.toISOString(),
                        },
                        gateway: buildGatewayMetadata(merchantOid, status, totalAmount),
                        paytr_status: status,
                        paytr_total_amount: totalAmount,
                    } as any,
                } as any,
            });
        }

        return res.status(200).send('OK');
    } catch (error) {
        console.error('PAYTR callback processing error:', error);
        return res.status(500).send('Callback processing failed');
    }
});

router.use(tenantContextMiddleware);

router.get('/access', async (req, res, next) => {
    try {
        const access = await getOrganizationAccess(tenantDb.direct as any, req.organizationId!);
        const superAdminBypass = isSuperAdmin({ role: req.userRole, email: req.userEmail });

        const effective = superAdminBypass
            ? {
                  ...access,
                  isFreeOrTrial: false,
                  isExpired: false,
              }
            : access;

        res.json({
            access: {
                ...effective,
                trialEndsAt: effective.trialEndsAt instanceof Date ? effective.trialEndsAt.toISOString() : (effective as any).trialEndsAt,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get('/paytr/packages', async (req, res) => {
    return res.json({
        packages: getPaytrPackages().map((item) => ({
            id: item.id,
            name: item.name,
            amount: item.amount,
            currency: process.env.PAYTR_PREMIUM_CURRENCY || 'TRY',
            periodDays: item.periodDays,
        })),
    });
});

router.post('/paytr/iframe/token', async (req, res) => {
    try {
        const organizationId = req.organizationId;
        const userId = req.userId;

        if (!organizationId || !userId) {
            return res.status(401).json({ error: 'Yetkisiz erişim' });
        }

        const requestedPackageId = String(req.body?.packageId || 'event-starter');
        const selectedPackage = getPaytrPackages().find((item) => item.id === requestedPackageId);
        if (!selectedPackage) {
            return res.status(400).json({ error: 'Geçersiz paket seçimi' });
        }

        const requestedAddons = Array.isArray(req.body?.addons)
            ? (req.body.addons as unknown[])
            : [];
        const selectedAddons = requestedAddons
            .map((value: unknown) => PAYTR_ADDONS[String(value) as keyof typeof PAYTR_ADDONS])
            .filter((addon): addon is PaytrAddon => Boolean(addon));
        const eventId = typeof req.body?.eventId === 'string' && req.body.eventId.trim().length > 0
            ? req.body.eventId.trim()
            : null;

        const merchantId = process.env.PAYTR_MERCHANT_ID ?? '';
        const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? '';
        const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? '';
        const okUrl = process.env.PAYTR_OK_URL ?? '';
        const failUrl = process.env.PAYTR_FAIL_URL ?? '';
        const getTokenUrl = process.env.PAYTR_GET_TOKEN_URL || 'https://www.paytr.com/odeme/api/get-token';
        const iframeBaseUrl = process.env.PAYTR_IFRAME_BASE_URL || 'https://www.paytr.com/odeme/guvenli/';

        if (!merchantId || !merchantKey || !merchantSalt || !okUrl || !failUrl) {
            return res.status(500).json({ error: 'PayTR yapılandırması eksik' });
        }

        const user = (await tenantDb.direct.users.findUnique({
            where: { id: userId } as any,
            select: { email: true, name: true, phone: true } as any,
        })) as any;

        if (!user?.email || typeof user.email !== 'string') {
            return res.status(400).json({ error: 'Kullanıcı e-posta bilgisi eksik' });
        }

        const merchantOid = `oid_${organizationId}_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
        const userIp = getClientIp(req);
        const email = String(user.email);
        const totalAmount = selectedAddons.reduce((sum: number, addon: PaytrAddon) => sum + addon.amount, selectedPackage.amount);
        const paymentAmount = totalAmount.toString();
        const currency = process.env.PAYTR_PREMIUM_CURRENCY || 'TRY';
        const testMode = process.env.PAYTR_TEST_MODE || '1';
        const debugOn = process.env.PAYTR_DEBUG_ON || '0';
        const lang = process.env.PAYTR_LANG || 'tr';
        const timeoutLimit = process.env.PAYTR_TIMEOUT_LIMIT || '30';
        const userName = user.name || 'SoruYorum Kullanıcısı';
        const userAddress = process.env.PAYTR_DEFAULT_ADDRESS || 'Türkiye';
        const userPhone = user.phone || '05000000000';

        const basket = JSON.stringify([
            [selectedPackage.name, selectedPackage.amount.toString(), 1],
            ...selectedAddons.map((addon: PaytrAddon) => [addon.name, addon.amount.toString(), 1]),
        ]);
        const userBasket = Buffer.from(basket).toString('base64');

        const hashInput =
            `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}` +
            `${'0'}${'0'}${currency}${testMode}`;
        const paytrToken = paytrHash(`${hashInput}${merchantSalt}`, merchantKey);

        const payload = new URLSearchParams({
            merchant_id: merchantId,
            user_ip: userIp,
            merchant_oid: merchantOid,
            email,
            payment_amount: paymentAmount,
            paytr_token: paytrToken,
            user_basket: userBasket,
            debug_on: debugOn,
            no_installment: '0',
            max_installment: '0',
            user_name: userName,
            user_address: userAddress,
            user_phone: userPhone,
            merchant_ok_url: okUrl,
            merchant_fail_url: failUrl,
            timeout_limit: timeoutLimit,
            currency,
            test_mode: testMode,
            lang,
        });

        const paytrResp = await fetch(getTokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: payload.toString(),
        });

        const paytrData = (await paytrResp.json()) as { status?: string; token?: string; reason?: string };

        if (!paytrResp.ok || paytrData.status !== 'success' || !paytrData.token) {
            return res.status(502).json({
                error: 'PayTR token alınamadı',
                reason: paytrData.reason || 'unknown_error',
            });
        }

        const now = new Date();
        const normalizedMetadata = buildPendingMetadata(
            merchantOid,
            selectedPackage,
            selectedAddons,
            currency,
            userId,
            eventId,
        );

        await tenantDb.direct.subscriptions.create({
            data: {
                id: crypto.randomUUID(),
                organization_id: organizationId,
                plan: selectedPackage.plan,
                status: 'pending',
                payment_method: 'paytr',
                updated_at: now,
                metadata: normalizedMetadata,
            } as any,
        });

        return res.json({
            iframeUrl: `${iframeBaseUrl}${paytrData.token}`,
            merchantOid,
            package: {
                id: selectedPackage.id,
                name: selectedPackage.name,
                amount: totalAmount,
                currency,
            },
            addons: selectedAddons.map((addon: PaytrAddon) => ({
                id: addon.id,
                name: addon.name,
                amount: addon.amount,
                scope: addon.scope,
                eventUsageLimit: 1,
            })),
        });
    } catch (error) {
        console.error('PAYTR token creation error:', error);
        return res.status(500).json({ error: 'Ödeme başlatılamadı' });
    }
});

export default router;
