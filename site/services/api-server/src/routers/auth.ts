import { router, publicProcedure } from "../trpc";
import { z } from "zod";
import { lucia, Scrypt } from "@ks-interaktif/auth";
import { TRPCError } from "@trpc/server";
import { generateToken } from "../utils/jwt";
import crypto from "crypto";
import bcrypt from "bcrypt";
import {
    buildVerifyEmailUrl,
    generateEmailVerificationToken,
    shouldEnforceEmailVerificationForUser,
    verifyEmailVerificationToken,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    buildPasswordResetUrl,
} from "../utils/emailVerification";
import { getMailConfigMissingKeys, isMailConfigured, sendMail } from "../utils/mailer";
import { buildEmailVerificationEmail, buildPasswordResetEmail } from "../utils/emailTemplates";
import { getCorporateEmailErrorMessage, isCorporateEmail, normalizeEmail } from "../utils/corporateEmail";
import { DEFAULT_SIGNUP_PLAN } from "../utils/access";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

const getSafeMailErrorCode = (err: unknown): string | null => {
    if (!err || typeof err !== "object") return null;
    const maybeCode = (err as { code?: unknown }).code;
    return typeof maybeCode === "string" && maybeCode.trim() ? maybeCode.trim() : null;
};

const sendVerificationEmailIfPossible = async (params: { userId: string; email: string; name?: string | null }) => {
    if (!isMailConfigured()) return;

    const token = generateEmailVerificationToken({
        type: "email_verification",
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

export const authRouter = router({
    registerAdmin: publicProcedure
        .input(z.object({
            email: z.string().email(),
            password: z.string().min(6),
            name: z.string().min(2),
            phone: z.string().trim().min(7).max(20).optional(),
            organizationName: z.string().min(2),
            company: z.string().trim().min(2).max(160).optional(),
            kvkkAccepted: z.literal(true),
            explicitConsentAccepted: z.literal(true),
            consentVersion: z.string().min(1).optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const email = normalizeEmail(input.email);
            const { password, name, organizationName } = input;
            const phone = input.phone?.trim();
            const company = input.company?.trim() || null;

            if (!isCorporateEmail(email)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: getCorporateEmailErrorMessage(),
                });
            }

            const verificationRequiredNow = shouldEnforceEmailVerificationForUser(new Date());
            if (verificationRequiredNow && !isMailConfigured()) {
                const missing = getMailConfigMissingKeys();
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "Email doğrulama aktif fakat mail gönderimi yapılandırılmamış." +
                        (missing.length ? ` Eksik ayarlar: ${missing.join(", ")}.` : ""),
                });
            }

            // Check if user exists
            const existingUser = await ctx.prisma.users.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "User already exists"
                });
            }

            // Create Organization and User transactionally
            const user = await ctx.prisma.$transaction(async (tx) => {
                const now = new Date();
                const org = await tx.organizations.create({
                    data: {
                        id: crypto.randomUUID(),
                        name: organizationName,
                        plan: DEFAULT_SIGNUP_PLAN,
                        updated_at: now,
                    }
                });

                const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
                const newUser = await tx.users.create({
                    data: {
                        id: crypto.randomUUID(),
                        email,
                        password_hash: hashedPassword,
                        name,
                        phone: phone || null,
                        company,
                        role: "admin",
                        organization_id: org.id,
                        updated_at: now,
                    }
                });

                const userAgentHeader = ctx.req?.headers["user-agent"];
                const userAgent = Array.isArray(userAgentHeader)
                    ? userAgentHeader.join(" ")
                    : userAgentHeader;

                await tx.audit_logs.create({
                    data: {
                        id: crypto.randomUUID(),
                        organization_id: org.id,
                        user_id: newUser.id,
                        action: "consent.accepted",
                        resource: "users",
                        resource_id: newUser.id,
                        details: {
                            kvkkAccepted: true,
                            explicitConsentAccepted: true,
                            consentVersion: input.consentVersion ?? "v1",
                            source: "registerAdmin",
                            acceptedAt: now.toISOString(),
                        },
                        ip_address: ctx.req?.ip ?? null,
                        user_agent: userAgent ?? null,
                    }
                });

                return newUser;
            });

            // Send verification email best-effort (even if enforcement is off).
            try {
                await sendVerificationEmailIfPossible({ userId: user.id, email: user.email, name: user.name });
            } catch (err) {
                console.warn("[auth.registerAdmin] Failed to send verification email", err);
            }

            const verificationRequired = shouldEnforceEmailVerificationForUser(user.created_at);
            const token = verificationRequired
                ? null
                : generateToken({
                      userId: user.id,
                      organizationId: user.organization_id || "",
                      email: user.email,
                      role: user.role,
                  });
            return {
                token,
                verificationRequired,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organization_id
                }
            };
        }),

    registerUser: publicProcedure
        .input(z.object({
            email: z.string().email(),
            password: z.string().min(6),
            name: z.string().min(2),
            phone: z.string().trim().min(7).max(20).optional(),
            organizationId: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const email = normalizeEmail(input.email);
            const { password, name, organizationId } = input;
            const phone = input.phone?.trim();

            if (!isCorporateEmail(email)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: getCorporateEmailErrorMessage(),
                });
            }

            const verificationRequiredNow = shouldEnforceEmailVerificationForUser(new Date());
            if (verificationRequiredNow && !isMailConfigured()) {
                const missing = getMailConfigMissingKeys();
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "Email doğrulama aktif fakat mail gönderimi yapılandırılmamış." +
                        (missing.length ? ` Eksik ayarlar: ${missing.join(", ")}.` : ""),
                });
            }

            const existingUser = await ctx.prisma.users.findUnique({
                where: { email }
            });

            if (existingUser) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "User already exists"
                });
            }

            // Verify Organization exists
            const org = await ctx.prisma.organizations.findUnique({
                where: { id: organizationId }
            });

            if (!org) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Organization not found"
                });
            }

            const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);
            const user = await ctx.prisma.users.create({
                data: {
                    id: crypto.randomUUID(),
                    email,
                    password_hash: hashedPassword,
                    name,
                    phone: phone || null,
                    role: "member",
                    organization_id: organizationId,
                    updated_at: new Date()
                }
            });

            try {
                await sendVerificationEmailIfPossible({ userId: user.id, email: user.email, name: user.name });
            } catch (err) {
                console.warn("[auth.registerUser] Failed to send verification email", err);
            }

            const verificationRequired = shouldEnforceEmailVerificationForUser(user.created_at);
            const token = verificationRequired
                ? null
                : generateToken({
                      userId: user.id,
                      organizationId: user.organization_id || "",
                      email: user.email,
                      role: user.role,
                  });
            return {
                token,
                verificationRequired,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organization_id
                }
            };
        }),

    login: publicProcedure
        .input(z.object({
            email: z.string().min(1),
            password: z.string()
        }))
        .mutation(async ({ ctx, input }) => {
            const { email, password } = input;

            const identifier = email.trim();
            const isEmail = identifier.includes('@');

            const user = await ctx.prisma.users.findFirst({
                where: isEmail
                    ? { email: identifier }
                    : { name: { equals: identifier, mode: 'insensitive' } },
            });

            if (!user || !user.password_hash) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid email or password"
                });
            }

            // Support both legacy bcrypt hashes and newer scrypt hashes.
            // Some older stacks stored bcrypt hashes (REST routes), while newer tRPC auth used scrypt.
            let validPassword = false;
            try {
                validPassword = await new Scrypt().verify(user.password_hash, password);
            } catch {
                validPassword = false;
            }

            if (!validPassword) {
                try {
                    validPassword = await bcrypt.compare(password, user.password_hash);
                } catch {
                    validPassword = false;
                }
            }

            if (!validPassword) {
                throw new TRPCError({
                    code: "UNAUTHORIZED",
                    message: "Invalid email or password"
                });
            }

            if (!user.email_verified && shouldEnforceEmailVerificationForUser(user.created_at)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Email doğrulanmadı. Lütfen e-postanızı doğrulayın.",
                });
            }

            // LOGIN - Generate JWT instead of just session ID
            const token = generateToken({
                userId: user.id,
                organizationId: user.organization_id || '',
                email: user.email,
                role: user.role
            });
            return {
                token: token, // Send JWT
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    organizationId: user.organization_id
                }
            };
        }),

    resendVerificationEmail: publicProcedure
        .input(
            z.object({
                email: z.string().email(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.prisma.users.findUnique({ where: { email: input.email } });

            // Always respond success to avoid account enumeration.
            if (!user) return { success: true };
            if (user.email_verified) return { success: true, alreadyVerified: true };

            if (!isMailConfigured()) {
                const missing = getMailConfigMissingKeys();
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "Mail gönderimi yapılandırılmamış." +
                        (missing.length ? ` Eksik ayarlar: ${missing.join(", ")}.` : ""),
                });
            }

            try {
                await sendVerificationEmailIfPossible({ userId: user.id, email: user.email, name: user.name });
            } catch (err) {
                console.warn("[auth.resendVerificationEmail] Failed to send verification email", err);
                const code = getSafeMailErrorCode(err);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                        "Doğrulama e-postası şu an gönderilemiyor (mail sunucusuna bağlanılamadı" +
                        (code ? `: ${code}` : "") +
                        "). Lütfen biraz sonra tekrar deneyin.",
                });
            }

            return { success: true };
        }),

    verifyEmail: publicProcedure
        .input(
            z.object({
                token: z.string().min(10),
            })
        )
        .mutation(async ({ ctx, input }) => {
            let payload: { userId: string; email: string };
            try {
                const decoded = verifyEmailVerificationToken(input.token);
                payload = { userId: decoded.userId, email: decoded.email };
            } catch {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Geçersiz veya süresi dolmuş doğrulama bağlantısı.",
                });
            }

            const user = await ctx.prisma.users.findUnique({ where: { id: payload.userId } });
            if (!user || user.email !== payload.email) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Kullanıcı bulunamadı.",
                });
            }

            if (user.email_verified) return { success: true, alreadyVerified: true };

            await ctx.prisma.users.update({
                where: { id: user.id },
                data: { email_verified: true, updated_at: new Date() },
            });

            return { success: true };
        }),

    logout: publicProcedure
        .input(z.object({
            sessionId: z.string()
        }))
        .mutation(async ({ input }) => {
            // Most clients use JWT; there's nothing to invalidate server-side.
            // If a legacy Lucia session id is passed, best-effort invalidate.
            try {
                await lucia.invalidateSession(input.sessionId);
            } catch {
                // ignore
            }
            return { success: true };
        }),

    forgotPassword: publicProcedure
        .input(z.object({
            email: z.string().email(),
        }))
        .mutation(async ({ ctx, input }) => {
            // Always respond success to avoid account enumeration.
            const user = await ctx.prisma.users.findUnique({ where: { email: input.email } });

            if (!user) return { success: true };

            if (!isMailConfigured()) {
                const missing = getMailConfigMissingKeys();
                throw new TRPCError({
                    code: "PRECONDITION_FAILED",
                    message:
                        "Mail gönderimi yapılandırılmamış." +
                        (missing.length ? ` Eksik ayarlar: ${missing.join(", ")}.` : ""),
                });
            }

            const token = generatePasswordResetToken({
                type: "password_reset",
                userId: user.id,
                email: user.email,
            });
            const resetUrl = buildPasswordResetUrl(token);

            const greetingName = user.name?.trim() || user.email;
            const emailPayload = buildPasswordResetEmail({ greetingName, resetUrl });

            try {
                await sendMail({
                    to: user.email,
                    subject: emailPayload.subject,
                    text: emailPayload.text,
                    html: emailPayload.html,
                });
            } catch (err) {
                console.warn("[auth.forgotPassword] Failed to send password reset email", err);
                const code = getSafeMailErrorCode(err);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                        "Şifre sıfırlama e-postası şu an gönderilemiyor" +
                        (code ? `: ${code}` : "") +
                        ". Lütfen biraz sonra tekrar deneyin.",
                });
            }

            return { success: true };
        }),

    resetPassword: publicProcedure
        .input(z.object({
            token: z.string().min(10),
            password: z.string().min(6),
        }))
        .mutation(async ({ ctx, input }) => {
            let payload: { userId: string; email: string };
            try {
                const decoded = verifyPasswordResetToken(input.token);
                payload = { userId: decoded.userId, email: decoded.email };
            } catch {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Geçersiz veya süresi dolmuş şifre sıfırlama bağlantısı.",
                });
            }

            const user = await ctx.prisma.users.findUnique({ where: { id: payload.userId } });
            if (!user || user.email !== payload.email) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Kullanıcı bulunamadı.",
                });
            }

            const hashedPassword = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
            await ctx.prisma.users.update({
                where: { id: user.id },
                data: { password_hash: hashedPassword, updated_at: new Date() },
            });

            return { success: true };
        }),
});
