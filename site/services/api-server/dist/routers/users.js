"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.usersRouter = void 0;
const server_1 = require("@trpc/server");
const trpc_1 = require("../trpc");
const access_1 = require("../utils/access");
const zod_1 = require("zod");
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_1 = require("@ks-interaktif/auth");
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("../config/redis");
const phone_1 = require("../utils/phone");
const sms_1 = require("../utils/sms");
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
exports.usersRouter = (0, trpc_1.router)({
    me: trpc_1.protectedProcedure.query(async ({ ctx }) => {
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
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
        }
        return user;
    }),
    sendPhoneOtp: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        phone: zod_1.z.string().trim().min(7).max(20),
    }))
        .mutation(async ({ ctx, input }) => {
        const otpTtlSeconds = parseInt(process.env.PHONE_OTP_TTL_SECONDS || "300", 10);
        const maxSendsPerHour = parseInt(process.env.PHONE_OTP_MAX_SENDS_PER_HOUR || "5", 10);
        let normalized;
        try {
            normalized = (0, phone_1.normalizeTrPhone)(input.phone);
        }
        catch (e) {
            throw new server_1.TRPCError({ code: "BAD_REQUEST", message: e?.message || "Telefon numarası geçersiz" });
        }
        // Rate limit: per-user sends per hour
        const sendCountKey = `otp:phone:send_count:${ctx.user.id}`;
        const sendCount = await redis_1.redis.incr(sendCountKey);
        if (sendCount === 1) {
            await redis_1.redis.expire(sendCountKey, 60 * 60);
        }
        if (sendCount > maxSendsPerHour) {
            throw new server_1.TRPCError({
                code: "TOO_MANY_REQUESTS",
                message: "Çok fazla doğrulama kodu istendi. Lütfen daha sonra tekrar deneyin.",
            });
        }
        const code = crypto_1.default.randomInt(100000, 1000000).toString();
        const otpSecret = process.env.PHONE_OTP_SECRET || process.env.JWT_SECRET;
        if (!otpSecret) {
            throw new server_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "OTP secret yapılandırması eksik (PHONE_OTP_SECRET veya JWT_SECRET)",
            });
        }
        const codeHash = crypto_1.default
            .createHmac("sha256", otpSecret)
            .update(code)
            .digest("hex");
        const otpKey = `otp:phone:verify:${ctx.user.id}`;
        await redis_1.redis.set(otpKey, JSON.stringify({
            codeHash,
            phoneE164: normalized.e164,
            phoneNetgsm: normalized.netgsm,
            attempts: 0,
        }), "EX", otpTtlSeconds);
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
        const template = process.env.PHONE_OTP_MESSAGE_TEMPLATE ||
            "Doğrulama kodunuz: {{code}}\nBu kodu kimseyle paylaşmayınız.";
        const message = template.replace("{{code}}", code);
        await (0, sms_1.sendSms)({ to: normalized.netgsm, message });
        return { ok: true, ttlSeconds: otpTtlSeconds };
    }),
    verifyPhoneOtp: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        code: zod_1.z.string().trim().regex(/^\d{6}$/),
    }))
        .mutation(async ({ ctx, input }) => {
        const otpKey = `otp:phone:verify:${ctx.user.id}`;
        const raw = await redis_1.redis.get(otpKey);
        if (!raw) {
            throw new server_1.TRPCError({
                code: "BAD_REQUEST",
                message: "Doğrulama kodu süresi dolmuş olabilir. Lütfen yeniden kod gönderin.",
            });
        }
        let payload;
        try {
            payload = JSON.parse(raw);
        }
        catch {
            await redis_1.redis.del(otpKey);
            throw new server_1.TRPCError({ code: "BAD_REQUEST", message: "Doğrulama kodu geçersiz. Yeniden deneyin." });
        }
        const otpSecret = process.env.PHONE_OTP_SECRET || process.env.JWT_SECRET;
        if (!otpSecret) {
            throw new server_1.TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: "OTP secret yapılandırması eksik (PHONE_OTP_SECRET veya JWT_SECRET)",
            });
        }
        const codeHash = crypto_1.default
            .createHmac("sha256", otpSecret)
            .update(input.code)
            .digest("hex");
        if (codeHash !== payload.codeHash) {
            payload.attempts = (payload.attempts || 0) + 1;
            const ttl = await redis_1.redis.ttl(otpKey);
            if (payload.attempts >= 5) {
                await redis_1.redis.del(otpKey);
                throw new server_1.TRPCError({ code: "BAD_REQUEST", message: "Çok fazla hatalı deneme. Yeniden kod isteyin." });
            }
            if (ttl > 0) {
                await redis_1.redis.set(otpKey, JSON.stringify(payload), "EX", ttl);
            }
            throw new server_1.TRPCError({ code: "BAD_REQUEST", message: "Doğrulama kodu hatalı" });
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
        await redis_1.redis.del(otpKey);
        return { ok: true };
    }),
    updateNotifications: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        emailNotifications: zod_1.z.boolean().optional(),
        pushNotifications: zod_1.z.boolean().optional(),
        smsNotifications: zod_1.z.boolean().optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const me = await ctx.prisma.users.findUnique({
            where: { id: ctx.user.id },
            select: { phone: true, phone_verified: true },
        });
        if (!me) {
            throw new server_1.TRPCError({ code: "UNAUTHORIZED", message: "User not found" });
        }
        if (input.smsNotifications === true && !(me.phone && me.phone.trim().length > 0)) {
            throw new server_1.TRPCError({
                code: "BAD_REQUEST",
                message: "SMS bildirimleri için önce telefon numarası ekleyin",
            });
        }
        if (input.smsNotifications === true && !me.phone_verified) {
            throw new server_1.TRPCError({
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
    changePassword: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        currentPassword: zod_1.z.string().min(1),
        newPassword: zod_1.z.string().min(6).max(200),
    }))
        .mutation(async ({ ctx, input }) => {
        const user = await ctx.prisma.users.findUnique({
            where: { id: ctx.user.id },
            select: { password_hash: true },
        });
        if (!user || !user.password_hash) {
            throw new server_1.TRPCError({ code: "NOT_FOUND", message: "Kullanıcı bulunamadı" });
        }
        let validPassword = false;
        try {
            validPassword = await new auth_1.Scrypt().verify(user.password_hash, input.currentPassword);
        }
        catch {
            validPassword = false;
        }
        if (!validPassword) {
            try {
                validPassword = await bcrypt_1.default.compare(input.currentPassword, user.password_hash);
            }
            catch {
                validPassword = false;
            }
        }
        if (!validPassword) {
            throw new server_1.TRPCError({ code: "BAD_REQUEST", message: "Mevcut şifre yanlış" });
        }
        const newPasswordHash = await bcrypt_1.default.hash(input.newPassword, BCRYPT_ROUNDS);
        await ctx.prisma.users.update({
            where: { id: ctx.user.id },
            data: {
                password_hash: newPasswordHash,
                updated_at: new Date(),
            },
        });
        return { ok: true };
    }),
    updateProfile: trpc_1.protectedProcedure
        .input(zod_1.z.object({
        name: zod_1.z.string().trim().min(1).max(120).optional(),
        phone: zod_1.z.string().trim().min(7).max(20).optional(),
        timezone: zod_1.z.string().trim().min(1).max(80).optional(),
        organizationName: zod_1.z.string().trim().min(1).max(120).optional(),
    }))
        .mutation(async ({ ctx, input }) => {
        const name = input.name?.trim();
        const phoneRaw = input.phone?.trim();
        const timezone = input.timezone?.trim();
        const organizationName = input.organizationName?.trim();
        await ctx.prisma.$transaction(async (tx) => {
            if (name || phoneRaw || timezone) {
                let phone;
                if (phoneRaw) {
                    try {
                        phone = (0, phone_1.normalizeTrPhone)(phoneRaw).e164;
                    }
                    catch {
                        throw new server_1.TRPCError({ code: "BAD_REQUEST", message: "Telefon numarası formatı geçersiz" });
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
    list: trpc_1.protectedProcedure.query(async ({ ctx }) => {
        if (!(0, access_1.isSuperAdmin)(ctx.user)) {
            throw new server_1.TRPCError({
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
});
