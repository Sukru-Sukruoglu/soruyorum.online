import express from 'express';
import bcrypt from 'bcrypt';
import { Scrypt } from '@ks-interaktif/auth';
import { tenantDb } from '../database/tenantDb';
import { generateToken } from '../utils/jwt';
import { DEFAULT_SIGNUP_PLAN, isSuperAdmin } from '../utils/access';
import {
    buildVerifyEmailUrl,
    generateEmailVerificationToken,
    shouldEnforceEmailVerificationForUser,
    verifyEmailVerificationToken,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    buildPasswordResetUrl,
} from '../utils/emailVerification';
import { getMailConfigMissingKeys, isMailConfigured, sendMail } from '../utils/mailer';
import { buildEmailVerificationEmail, buildPasswordResetEmail } from '../utils/emailTemplates';
import { getCorporateEmailErrorMessage, isCorporateEmail, normalizeEmail } from '../utils/corporateEmail';

const router = express.Router();
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10');

const sendVerificationEmailIfPossible = async (params: { userId: string; email: string; name?: string | null }) => {
    if (!isMailConfigured()) return;

    const token = generateEmailVerificationToken({
        type: 'email_verification',
        userId: params.userId,
        email: params.email,
    });
    const verifyUrl = buildVerifyEmailUrl(token);
    const greetingName = params.name?.trim() || params.email;

    const emailPayload = buildEmailVerificationEmail({ greetingName, verifyUrl });
    await sendMail({
        to: params.email,
        subject: emailPayload.subject,
        text: emailPayload.text,
        html: emailPayload.html,
    });
};

router.post('/register', async (req, res, next) => {
    try {
        const {
            organizationName,
            email: rawEmail,
            password,
            name,
            company,
            phone,
            kvkkAccepted,
            explicitConsentAccepted,
            consentVersion,
        } = req.body;
        const email = normalizeEmail(String(rawEmail || ''));
        const companyNormalized = typeof company === 'string' && company.trim() ? company.trim() : null;
        const phoneNormalized = typeof phone === 'string' && phone.trim() ? phone.trim() : null;

        const verificationRequiredNow = shouldEnforceEmailVerificationForUser(new Date());
        if (verificationRequiredNow && !isMailConfigured()) {
            const missing = getMailConfigMissingKeys();
            return res.status(412).json({
                error:
                    'Email doğrulama aktif fakat mail gönderimi yapılandırılmamış.' +
                    (missing.length ? ` Eksik ayarlar: ${missing.join(', ')}.` : ''),
            });
        }

        if (!organizationName || !email || !password) {
            return res.status(400).json({
                error: 'Organizasyon adı, email ve şifre gereklidir'
            });
        }

        if (!isCorporateEmail(email)) {
            return res.status(400).json({
                error: getCorporateEmailErrorMessage(),
            });
        }

        const existingUser = await tenantDb.direct.users.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(409).json({
                error: 'Bu email adresi zaten kullanılıyor'
            });
        }

        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

        // Slug generation
        const slug = organizationName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');

        const { randomUUID } = await import('crypto');
        
        const result = await tenantDb.transaction(async (tx) => {
            const now = new Date();
            const organization = await tx.organizations.create({
                data: {
                    id: randomUUID(),
                    name: organizationName,
                    slug: `${slug}-${Date.now()}`,
                    plan: DEFAULT_SIGNUP_PLAN,
                    created_at: now,
                    updated_at: now,
                },
            });

            const user = await tx.users.create({
                data: {
                    id: randomUUID(),
                    organization_id: organization.id,
                    email,
                    password_hash: passwordHash,
                    name,
                    phone: phoneNormalized,
                    company: companyNormalized,
                    role: 'admin',
                    created_at: now,
                    updated_at: now,
                },
            });

            if (kvkkAccepted === true && explicitConsentAccepted === true) {
                const userAgentHeader = req.headers['user-agent'];
                const userAgent = Array.isArray(userAgentHeader)
                    ? userAgentHeader.join(' ')
                    : userAgentHeader;

                await tx.audit_logs.create({
                    data: {
                        id: randomUUID(),
                        organization_id: organization.id,
                        user_id: user.id,
                        action: 'consent.accepted',
                        resource: 'users',
                        resource_id: user.id,
                        details: {
                            kvkkAccepted: true,
                            explicitConsentAccepted: true,
                            consentVersion:
                                typeof consentVersion === 'string' && consentVersion.trim()
                                    ? consentVersion.trim()
                                    : 'v1',
                            source: 'rest.register',
                            acceptedAt: now.toISOString(),
                        },
                        ip_address: req.ip ?? null,
                        user_agent: userAgent ?? null,
                    },
                });
            }

            return { organization, user };
        });

        try {
            await sendVerificationEmailIfPossible({
                userId: result.user.id,
                email: result.user.email,
                name: result.user.name,
            });
        } catch (err) {
            console.warn('[auth.register] Failed to send verification email', err);
        }

        const verificationRequired = shouldEnforceEmailVerificationForUser(result.user.created_at);

        const effectiveRole = isSuperAdmin({ role: result.user.role, email: result.user.email })
            ? 'superadmin'
            : result.user.role;

        const token = verificationRequired
            ? null
            : generateToken({
                  userId: result.user.id,
                  organizationId: result.organization.id,
                  email: result.user.email,
                  role: effectiveRole,
              });
        res.status(201).json({
            token,
            verificationRequired,
            user: {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                role: effectiveRole,
            },
            organization: {
                id: result.organization.id,
                name: result.organization.name,
                slug: result.organization.slug,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                error: 'Email ve şifre gereklidir'
            });
        }

        const identifier = (email as string).trim();
        const isEmail = identifier.includes('@');

        const user = await tenantDb.direct.users.findFirst({
            where: isEmail
                ? { email: identifier }
                : { name: { equals: identifier, mode: 'insensitive' } },
            include: { organizations: true },
        });

        if (!user || !user.password_hash) {
            return res.status(401).json({
                error: 'Geçersiz email veya şifre'
            });
        }

        // Support both scrypt (portal) and bcrypt (REST) hashes
        let isPasswordValid = false;
        try {
            isPasswordValid = await new Scrypt().verify(user.password_hash, password);
        } catch {
            isPasswordValid = false;
        }

        if (!isPasswordValid) {
            try {
                isPasswordValid = await bcrypt.compare(password, user.password_hash);
            } catch {
                isPasswordValid = false;
            }
        }

        if (!isPasswordValid) {
            return res.status(401).json({
                error: 'Geçersiz email veya şifre'
            });
        }

        if (!user.email_verified && shouldEnforceEmailVerificationForUser(user.created_at)) {
            return res.status(403).json({
                error: 'Email doğrulanmadı. Lütfen e-postanızı doğrulayın.'
            });
        }

        const effectiveRole = isSuperAdmin({ role: user.role, email: user.email }) ? 'superadmin' : user.role;

        const token = generateToken({
            userId: user.id,
            organizationId: user.organization_id!,
            email: user.email,
            role: effectiveRole,
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: effectiveRole,
            },
            organization: {
                id: user.organizations!.id,
                name: user.organizations!.name,
                slug: user.organizations!.slug,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/resend-verification', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email gereklidir' });
        }

        const user = await tenantDb.direct.users.findUnique({ where: { email } });

        // Always respond success to avoid user enumeration.
        if (!user) return res.json({ success: true });
        if (user.email_verified) return res.json({ success: true, alreadyVerified: true });

        if (!isMailConfigured()) {
            const missing = getMailConfigMissingKeys();
            return res.status(412).json({
                error:
                    'Mail gönderimi yapılandırılmamış.' +
                    (missing.length ? ` Eksik ayarlar: ${missing.join(', ')}.` : ''),
            });
        }

        await sendVerificationEmailIfPossible({ userId: user.id, email: user.email, name: user.name });
        return res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

router.post('/verify-email', async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) {
            return res.status(400).json({ error: 'Token gereklidir' });
        }

        let payload: { userId: string; email: string };
        try {
            const decoded = verifyEmailVerificationToken(token);
            payload = { userId: decoded.userId, email: decoded.email };
        } catch {
            return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş doğrulama bağlantısı.' });
        }

        const user = await tenantDb.direct.users.findUnique({ where: { id: payload.userId } });
        if (!user || user.email !== payload.email) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        if (user.email_verified) return res.json({ success: true, alreadyVerified: true });

        await tenantDb.direct.users.update({
            where: { id: user.id },
            data: { email_verified: true, updated_at: new Date() },
        });

        return res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

router.post('/forgot-password', async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email gereklidir' });
        }

        const user = await tenantDb.direct.users.findUnique({ where: { email } });

        // Always respond success to avoid user enumeration.
        if (!user) return res.json({ success: true });

        if (!isMailConfigured()) {
            const missing = getMailConfigMissingKeys();
            return res.status(412).json({
                error:
                    'Mail gönderimi yapılandırılmamış.' +
                    (missing.length ? ` Eksik ayarlar: ${missing.join(', ')}.` : ''),
            });
        }

        const token = generatePasswordResetToken({
            type: 'password_reset',
            userId: user.id,
            email: user.email,
        });
        const resetUrl = buildPasswordResetUrl(token);
        const greetingName = user.name?.trim() || user.email;
        const emailPayload = buildPasswordResetEmail({ greetingName, resetUrl });

        await sendMail({
            to: user.email,
            subject: emailPayload.subject,
            text: emailPayload.text,
            html: emailPayload.html,
        });

        return res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

router.post('/reset-password', async (req, res, next) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) {
            return res.status(400).json({ error: 'Token ve yeni şifre gereklidir' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Şifre en az 6 karakter olmalıdır' });
        }

        let payload: { userId: string; email: string };
        try {
            const decoded = verifyPasswordResetToken(token);
            payload = { userId: decoded.userId, email: decoded.email };
        } catch {
            return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.' });
        }

        const user = await tenantDb.direct.users.findUnique({ where: { id: payload.userId } });
        if (!user || user.email !== payload.email) {
            return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
        }

        const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
        await tenantDb.direct.users.update({
            where: { id: user.id },
            data: { password_hash: hashedPassword, updated_at: new Date() },
        });

        return res.json({ success: true });
    } catch (error) {
        next(error);
    }
});

export default router;
