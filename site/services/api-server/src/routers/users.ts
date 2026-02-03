import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { isSuperAdmin } from "../utils/access";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Scrypt } from "@ks-interaktif/auth";
import crypto from "crypto";
import { redis } from "../config/redis";
import { normalizeTrPhone } from "../utils/phone";
import { sendSms } from "../utils/sms";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);

export const usersRouter = router({
    me: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.prisma.users.findUnique({
            where: { id: ctx.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                timezone: true,
                company: true,
                phone: true,
                phone_verified: true,
                phone_verified_at: true,
                email_notifications: true,
                push_notifications: true,
                sms_notifications: true,
                two_factor_enabled: true,
                organization_id: true,
                organizations: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
                created_at: true,
                updated_at: true,
            },
        });

        if (!user) {
            throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
        }

        return user;
    }),

    sendPhoneOtp: protectedProcedure
        .input(
            z.object({
                phone: z.string().trim().min(7).max(20),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const otpTtlSeconds = parseInt(process.env.PHONE_OTP_TTL_SECONDS || "300", 10);
            const maxSendsPerHour = parseInt(process.env.PHONE_OTP_MAX_SENDS_PER_HOUR || "5", 10);

            let normalized;
            try {
                normalized = normalizeTrPhone(input.phone);
            } catch (e: any) {
                throw new TRPCError({ code: "BAD_REQUEST", message: e?.message || "Telefon numarası geçersiz" });
            }

            // Rate limit: per-user sends per hour
            const sendCountKey = `otp:phone:send_count:${ctx.user.id}`;
            const sendCount = await redis.incr(sendCountKey);
            if (sendCount === 1) {
                await redis.expire(sendCountKey, 60 * 60);
            }
            if (sendCount > maxSendsPerHour) {
                throw new TRPCError({
                    code: "TOO_MANY_REQUESTS",
                    message: "Çok fazla doğrulama kodu istendi. Lütfen daha sonra tekrar deneyin.",
                });
            }

            const code = crypto.randomInt(100000, 1000000).toString();
            const otpSecret = process.env.PHONE_OTP_SECRET || process.env.JWT_SECRET;
            if (!otpSecret) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "OTP secret yapılandırması eksik (PHONE_OTP_SECRET veya JWT_SECRET)",
                });
            }
            const codeHash = crypto
                .createHmac("sha256", otpSecret)
                .update(code)
                .digest("hex");

            const otpKey = `otp:phone:verify:${ctx.user.id}`;
            await redis.set(
                otpKey,
                JSON.stringify({
                    codeHash,
                    phoneE164: normalized.e164,
                    phoneNetgsm: normalized.netgsm,
                    attempts: 0,
                }),
                "EX",
                otpTtlSeconds
            );

            // Save phone immediately but mark as unverified until OTP completes
            await ctx.prisma.users.update({
                where: { id: ctx.user.id },
                data: {
                    phone: normalized.e164,
                    phone_verified: false,
                    phone_verified_at: null,
                    updated_at: new Date(),
                },
            });

            const template =
                process.env.PHONE_OTP_MESSAGE_TEMPLATE ||
                "Doğrulama kodunuz: {{code}}\nBu kodu kimseyle paylaşmayınız.";
            const message = template.replace("{{code}}", code);

            const smsProvider = (process.env.SMS_PROVIDER || "test").toLowerCase();
            if (process.env.NODE_ENV === "production" && smsProvider === "test") {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message:
                        "SMS gönderimi yapılandırılmamış. Lütfen SMS_PROVIDER=netgsm ve NETGSM_* değişkenlerini ayarlayın.",
                });
            }

            await sendSms({ to: normalized.netgsm, message });

            return { ok: true, ttlSeconds: otpTtlSeconds };
        }),

    verifyPhoneOtp: protectedProcedure
        .input(
            z.object({
                code: z.string().trim().regex(/^\d{6}$/),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const otpKey = `otp:phone:verify:${ctx.user.id}`;
            const raw = await redis.get(otpKey);
            if (!raw) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Doğrulama kodu süresi dolmuş olabilir. Lütfen yeniden kod gönderin.",
                });
            }

            let payload: any;
            try {
                payload = JSON.parse(raw);
            } catch {
                await redis.del(otpKey);
                throw new TRPCError({ code: "BAD_REQUEST", message: "Doğrulama kodu geçersiz. Yeniden deneyin." });
            }

            const otpSecret = process.env.PHONE_OTP_SECRET || process.env.JWT_SECRET;
            if (!otpSecret) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "OTP secret yapılandırması eksik (PHONE_OTP_SECRET veya JWT_SECRET)",
                });
            }
            const codeHash = crypto
                .createHmac("sha256", otpSecret)
                .update(input.code)
                .digest("hex");

            if (codeHash !== payload.codeHash) {
                payload.attempts = (payload.attempts || 0) + 1;
                const ttl = await redis.ttl(otpKey);
                if (payload.attempts >= 5) {
                    await redis.del(otpKey);
                    throw new TRPCError({ code: "BAD_REQUEST", message: "Çok fazla hatalı deneme. Yeniden kod isteyin." });
                }
                if (ttl > 0) {
                    await redis.set(otpKey, JSON.stringify(payload), "EX", ttl);
                }
                throw new TRPCError({ code: "BAD_REQUEST", message: "Doğrulama kodu hatalı" });
            }

            await ctx.prisma.users.update({
                where: { id: ctx.user.id },
                data: {
                    phone: payload.phoneE164,
                    phone_verified: true,
                    phone_verified_at: new Date(),
                    updated_at: new Date(),
                },
            });

            await redis.del(otpKey);
            return { ok: true };
        }),

    updateNotifications: protectedProcedure
        .input(
            z.object({
                emailNotifications: z.boolean().optional(),
                pushNotifications: z.boolean().optional(),
                smsNotifications: z.boolean().optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const me = await ctx.prisma.users.findUnique({
                where: { id: ctx.user.id },
                select: { phone: true, phone_verified: true },
            });

            if (!me) {
                throw new TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
            }

            if (input.smsNotifications === true && !(me.phone && me.phone.trim().length > 0)) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "SMS bildirimleri için önce telefon numarası ekleyin",
                });
            }

            if (input.smsNotifications === true && !me.phone_verified) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "SMS bildirimleri için telefon numaranızı doğrulayın",
                });
            }

            await ctx.prisma.users.update({
                where: { id: ctx.user.id },
                data: {
                    ...(typeof input.emailNotifications === "boolean"
                        ? { email_notifications: input.emailNotifications }
                        : {}),
                    ...(typeof input.pushNotifications === "boolean"
                        ? { push_notifications: input.pushNotifications }
                        : {}),
                    ...(typeof input.smsNotifications === "boolean"
                        ? { sms_notifications: input.smsNotifications }
                        : {}),
                    updated_at: new Date(),
                },
                select: {
                    email_notifications: true,
                    push_notifications: true,
                    sms_notifications: true,
                },
            });

            return { ok: true };
        }),

    changePassword: protectedProcedure
        .input(
            z.object({
                currentPassword: z.string().min(1),
                newPassword: z.string().min(6).max(200),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const user = await ctx.prisma.users.findUnique({
                where: { id: ctx.user.id },
                select: { password_hash: true },
            });

            if (!user || !user.password_hash) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Kullanıcı bulunamadı" });
            }

            let validPassword = false;
            try {
                validPassword = await new Scrypt().verify(user.password_hash, input.currentPassword);
            } catch {
                validPassword = false;
            }

            if (!validPassword) {
                try {
                    validPassword = await bcrypt.compare(input.currentPassword, user.password_hash);
                } catch {
                    validPassword = false;
                }
            }

            if (!validPassword) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "Mevcut şifre yanlış" });
            }

            const newPasswordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
            await ctx.prisma.users.update({
                where: { id: ctx.user.id },
                data: {
                    password_hash: newPasswordHash,
                    updated_at: new Date(),
                },
            });

            return { ok: true };
        }),

    updateProfile: protectedProcedure
        .input(
            z.object({
                name: z.string().trim().min(1).max(120).optional(),
                phone: z.string().trim().min(7).max(20).optional(),
                timezone: z.string().trim().min(1).max(80).optional(),
                organizationName: z.string().trim().min(1).max(120).optional(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const name = input.name?.trim();
            const phoneRaw = input.phone?.trim();
            const timezone = input.timezone?.trim();
            const organizationName = input.organizationName?.trim();

            await ctx.prisma.$transaction(async (tx) => {
                if (name || phoneRaw || timezone) {
                    let phone: string | undefined;
                    if (phoneRaw) {
                        try {
                            phone = normalizeTrPhone(phoneRaw).e164;
                        } catch {
                            throw new TRPCError({ code: "BAD_REQUEST", message: "Telefon numarası formatı geçersiz" });
                        }
                    }
                    await tx.users.update({
                        where: { id: ctx.user.id },
                        data: {
                            ...(name ? { name } : {}),
                            ...(phone ? { phone } : {}),
                            ...(timezone ? { timezone } : {}),
                            ...(phone ? { phone_verified: false, phone_verified_at: null } : {}),
                        },
                    });
                }

                if (organizationName) {
                    await tx.organizations.update({
                        where: { id: ctx.user.organizationId },
                        data: { name: organizationName },
                    });
                }
            });

            return { ok: true };
        }),

    list: protectedProcedure.query(async ({ ctx }) => {
        if (!isSuperAdmin(ctx.user)) {
            throw new TRPCError({
                code: "FORBIDDEN",
                message: "Bu işlem yalnızca Süper Admin için izinlidir",
            });
        }

        return ctx.prisma.users.findMany({
            orderBy: { created_at: "desc" },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                phone: true,
                phone_verified: true,
                company: true,
                organization_id: true,
                created_at: true,
                updated_at: true,
                organizations: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
    }),

    delete: protectedProcedure
        .input(z.object({ userId: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            if (!isSuperAdmin(ctx.user)) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "Bu işlem yalnızca Süper Admin için izinlidir",
                });
            }

            // Prevent self-deletion
            if (input.userId === ctx.user.id) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Kendinizi silemezsiniz",
                });
            }

            // Check if user exists
            const user = await ctx.prisma.users.findUnique({
                where: { id: input.userId },
            });

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Kullanıcı bulunamadı",
                });
            }

            // Delete user
            await ctx.prisma.users.delete({
                where: { id: input.userId },
            });

            return { ok: true, message: "Kullanıcı silindi" };
        }),
});
