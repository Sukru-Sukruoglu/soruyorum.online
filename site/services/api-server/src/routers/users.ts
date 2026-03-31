import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import { isSuperAdmin } from "../utils/access";
import { z } from "zod";
import bcrypt from "bcrypt";
import { Scrypt } from "@ks-interaktif/auth";
import crypto from "crypto";
import { redis } from "../config/redis";
import { normalizeTrPhone } from "../utils/phone";
import { getPhoneOtpSecret } from "../utils/secrets";
import { sendSms } from "../utils/sms";
import { getOrganizationAccess } from "../utils/access";
import {
  createCustomDomain,
  createSystemDomain,
  formatDomainRecord,
  getDomainConnectTarget,
  getDomainSystemBase,
  getOrganizationDomains,
  getOrganizationSystemDomain,
  getSystemDomainSetupStatus,
  removeDomain,
  setPrimaryDomain,
  syncDomainState,
} from "../utils/domains";

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || "10", 10);
const SPRING_PILOT_PLAN = (process.env.SPRING_PILOT_PLAN || "spring_pilot_500").trim().toLowerCase();

const billingProfileInputSchema = z.object({
  legalName: z.string().trim().max(160).optional(),
  taxOffice: z.string().trim().max(160).optional(),
  taxNumber: z.string().trim().max(32).optional(),
  billingEmail: z.string().trim().max(160).optional(),
  billingPhone: z.string().trim().max(32).optional(),
  addressLine: z.string().trim().max(500).optional(),
  city: z.string().trim().max(120).optional(),
  country: z.string().trim().max(120).optional(),
});

const cartDraftLineSchema = z.object({
  key: z.string().min(1).max(160),
  kind: z.enum(["package", "addon"]),
  productId: z.string().min(1).max(160),
  title: z.string().min(1).max(240),
  description: z.string().max(500).optional().nullable(),
  features: z.array(z.string().max(240)).max(50).optional(),
  price: z.number().finite().min(0),
  quantity: z.number().int().min(1).max(50),
  removable: z.boolean().optional(),
  checkout: z
    .object({
      packageId: z.string().max(160).optional(),
      addonId: z.string().max(160).optional(),
    })
    .optional(),
});

const cartDraftSchema = z.object({
  version: z.literal(1),
  currency: z.literal("TRY"),
  lines: z.array(cartDraftLineSchema).max(32),
  updatedAt: z.string().datetime(),
});

const domainSetupChoiceSchema = z.enum(["system", "custom"]);

type CartDraft = z.infer<typeof cartDraftSchema>;

function normalizeBillingProfile(
  input: z.infer<typeof billingProfileInputSchema>,
) {
  return {
    legalName: input.legalName?.trim() || null,
    taxOffice: input.taxOffice?.trim() || null,
    taxNumber: input.taxNumber?.trim() || null,
    billingEmail: input.billingEmail?.trim() || null,
    billingPhone: input.billingPhone?.trim() || null,
    addressLine: input.addressLine?.trim() || null,
    city: input.city?.trim() || null,
    country: input.country?.trim() || null,
  };
}

function readOrganizationSettings(settings: unknown) {
  return settings && typeof settings === "object" && !Array.isArray(settings)
    ? { ...(settings as Record<string, unknown>) }
    : {};
}

function readCartDraft(settings: unknown): CartDraft | null {
  const normalizedSettings = readOrganizationSettings(settings);
  const candidate = normalizedSettings.cartDraft;
  const parsed = cartDraftSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

function readSubscriptionMetadata(metadata: unknown) {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
    ? (metadata as Record<string, unknown>)
    : {};
}

function readAmountFromMetadata(metadata: Record<string, unknown>) {
  const rawAmount = metadata.paytr_total_amount ?? metadata.amount;
  if (typeof rawAmount === "number" && Number.isFinite(rawAmount)) {
    return rawAmount;
  }
  if (typeof rawAmount === "string") {
    const parsed = Number.parseInt(rawAmount, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeAuditDetails(details: unknown) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return null;
  }

  const source = details as Record<string, unknown>;
  return Object.entries(source)
    .slice(0, 8)
    .map(([key, value]) => ({
      key,
      value:
        typeof value === "string"
          ? value
          : typeof value === "number" || typeof value === "boolean"
            ? String(value)
            : JSON.stringify(value),
    }))
    .filter((entry) => entry.value && entry.value !== "null");
}

function maxDate(...values: Array<Date | null | undefined>) {
  return values.reduce<Date | null>((latest, current) => {
    if (!current) return latest;
    if (!latest) return current;
    return current.getTime() > latest.getTime() ? current : latest;
  }, null);
}

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

    if (!user.organization_id) {
      return {
        ...user,
        accessSummary: null,
        subscription: null,
        billingProfile: null,
      };
    }

    const [
      organization,
      accessSummary,
      latestSubscription,
      subscriptionHistoryRaw,
      domainSetup,
    ] = await Promise.all([
      ctx.prisma.organizations.findUnique({
        where: { id: user.organization_id },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
          settings: true,
        },
      }),
      getOrganizationAccess(ctx.prisma as any, user.organization_id),
      ctx.prisma.subscriptions.findFirst({
        where: { organization_id: user.organization_id },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          plan: true,
          status: true,
          payment_method: true,
          current_period_start: true,
          current_period_end: true,
          created_at: true,
          metadata: true,
        },
      }),
      ctx.prisma.subscriptions.findMany({
        where: { organization_id: user.organization_id },
        orderBy: { created_at: "desc" },
        take: 12,
        select: {
          id: true,
          plan: true,
          status: true,
          payment_method: true,
          current_period_start: true,
          current_period_end: true,
          created_at: true,
          metadata: true,
        },
      }),
      getSystemDomainSetupStatus(ctx.prisma as any, user.organization_id),
    ]);

    const orgSettings = organization?.settings;
    const billingProfile =
      orgSettings &&
      typeof orgSettings === "object" &&
      !Array.isArray(orgSettings)
        ? ((orgSettings as Record<string, unknown>).billingProfile ?? null)
        : null;
    const cartDraft = readCartDraft(orgSettings);

    const subscriptionHistory = subscriptionHistoryRaw.map((item) => {
      const metadata = readSubscriptionMetadata(item.metadata);
      const gateway =
        metadata.gateway &&
        typeof metadata.gateway === "object" &&
        !Array.isArray(metadata.gateway)
          ? metadata.gateway
          : null;
      const activation =
        metadata.activation &&
        typeof metadata.activation === "object" &&
        !Array.isArray(metadata.activation)
          ? metadata.activation
          : null;

      return {
        id: item.id,
        plan: item.plan,
        status: item.status,
        payment_method: item.payment_method,
        current_period_start: item.current_period_start,
        current_period_end: item.current_period_end,
        created_at: item.created_at,
        amount: readAmountFromMetadata(metadata),
        currency:
          typeof metadata.currency === "string" ? metadata.currency : "TRY",
        package_id:
          typeof metadata.packageId === "string" ? metadata.packageId : null,
        package_name:
          typeof metadata.packageName === "string"
            ? metadata.packageName
            : null,
        paytr_status:
          typeof metadata.paytr_status === "string"
            ? metadata.paytr_status
            : null,
        merchant_oid:
          typeof metadata.merchant_oid === "string"
            ? metadata.merchant_oid
            : null,
        addons: Array.isArray(metadata.addons) ? metadata.addons : [],
        entitlements: Array.isArray(metadata.entitlements)
          ? metadata.entitlements
          : [],
        activation,
        gateway,
      };
    });

    const latestSubscriptionMetadata = readSubscriptionMetadata(
      latestSubscription?.metadata,
    );
    const latestGateway =
      latestSubscriptionMetadata.gateway &&
      typeof latestSubscriptionMetadata.gateway === "object" &&
      !Array.isArray(latestSubscriptionMetadata.gateway)
        ? latestSubscriptionMetadata.gateway
        : null;
    const latestActivation =
      latestSubscriptionMetadata.activation &&
      typeof latestSubscriptionMetadata.activation === "object" &&
      !Array.isArray(latestSubscriptionMetadata.activation)
        ? latestSubscriptionMetadata.activation
        : null;
    const normalizedLatestSubscription = latestSubscription
      ? {
          ...latestSubscription,
          amount: readAmountFromMetadata(latestSubscriptionMetadata),
          currency:
            typeof latestSubscriptionMetadata.currency === "string"
              ? latestSubscriptionMetadata.currency
              : "TRY",
          package_id:
            typeof latestSubscriptionMetadata.packageId === "string"
              ? latestSubscriptionMetadata.packageId
              : null,
          package_name:
            typeof latestSubscriptionMetadata.packageName === "string"
              ? latestSubscriptionMetadata.packageName
              : null,
          addons: Array.isArray(latestSubscriptionMetadata.addons)
            ? latestSubscriptionMetadata.addons
            : [],
          entitlements: Array.isArray(latestSubscriptionMetadata.entitlements)
            ? latestSubscriptionMetadata.entitlements
            : [],
          paytr_status:
            typeof latestSubscriptionMetadata.paytr_status === "string"
              ? latestSubscriptionMetadata.paytr_status
              : null,
          activation: latestActivation,
          gateway: latestGateway,
        }
      : null;

    return {
      ...user,
      organizations: organization
        ? {
            id: organization.id,
            name: organization.name,
            slug: organization.slug,
            plan: organization.plan,
          }
        : user.organizations,
      accessSummary,
      subscription: normalizedLatestSubscription,
      billingProfile,
      cartDraft,
      subscriptionHistory,
      domainSetup,
    };
  }),

  getCartDraft: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.organizationId) {
      return { cartDraft: null };
    }

    const organization = await ctx.prisma.organizations.findUnique({
      where: { id: ctx.user.organizationId },
      select: { settings: true },
    });

    return {
      cartDraft: readCartDraft(organization?.settings),
    };
  }),

  updateCartDraft: protectedProcedure
    .input(z.object({ cartDraft: cartDraftSchema.nullable() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organizasyon bulunamadı",
        });
      }

      const organization = await ctx.prisma.organizations.findUnique({
        where: { id: ctx.user.organizationId },
        select: { settings: true },
      });

      const currentSettings = readOrganizationSettings(organization?.settings);
      const nextSettings = {
        ...currentSettings,
        cartDraft: input.cartDraft,
        cartDraftUpdatedAt: input.cartDraft?.updatedAt ?? null,
      };

      await ctx.prisma.organizations.update({
        where: { id: ctx.user.organizationId },
        data: {
          settings: nextSettings,
          updated_at: new Date(),
        },
      });

      return { ok: true, cartDraft: input.cartDraft };
    }),

  sendPhoneOtp: protectedProcedure
    .input(
      z.object({
        phone: z.string().trim().min(7).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const otpTtlSeconds = parseInt(
        process.env.PHONE_OTP_TTL_SECONDS || "300",
        10,
      );
      const maxSendsPerHour = parseInt(
        process.env.PHONE_OTP_MAX_SENDS_PER_HOUR || "5",
        10,
      );

      let normalized;
      try {
        normalized = normalizeTrPhone(input.phone);
      } catch (e: any) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: e?.message || "Telefon numarası geçersiz",
        });
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
          message:
            "Çok fazla doğrulama kodu istendi. Lütfen daha sonra tekrar deneyin.",
        });
      }

      const code = crypto.randomInt(100000, 1000000).toString();
      const otpSecret = getPhoneOtpSecret();
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
        otpTtlSeconds,
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
        code: z
          .string()
          .trim()
          .regex(/^\d{6}$/),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const otpKey = `otp:phone:verify:${ctx.user.id}`;
      const raw = await redis.get(otpKey);
      if (!raw) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Doğrulama kodu süresi dolmuş olabilir. Lütfen yeniden kod gönderin.",
        });
      }

      let payload: any;
      try {
        payload = JSON.parse(raw);
      } catch {
        await redis.del(otpKey);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Doğrulama kodu geçersiz. Yeniden deneyin.",
        });
      }

      const otpSecret = getPhoneOtpSecret();
      const codeHash = crypto
        .createHmac("sha256", otpSecret)
        .update(input.code)
        .digest("hex");

      if (codeHash !== payload.codeHash) {
        payload.attempts = (payload.attempts || 0) + 1;
        const ttl = await redis.ttl(otpKey);
        if (payload.attempts >= 5) {
          await redis.del(otpKey);
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Çok fazla hatalı deneme. Yeniden kod isteyin.",
          });
        }
        if (ttl > 0) {
          await redis.set(otpKey, JSON.stringify(payload), "EX", ttl);
        }
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Doğrulama kodu hatalı",
        });
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const me = await ctx.prisma.users.findUnique({
        where: { id: ctx.user.id },
        select: { phone: true, phone_verified: true },
      });

      if (!me) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "User not found",
        });
      }

      if (
        input.smsNotifications === true &&
        !(me.phone && me.phone.trim().length > 0)
      ) {
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
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.prisma.users.findUnique({
        where: { id: ctx.user.id },
        select: { password_hash: true },
      });

      if (!user || !user.password_hash) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kullanıcı bulunamadı",
        });
      }

      let validPassword = false;
      try {
        validPassword = await new Scrypt().verify(
          user.password_hash,
          input.currentPassword,
        );
      } catch {
        validPassword = false;
      }

      if (!validPassword) {
        try {
          validPassword = await bcrypt.compare(
            input.currentPassword,
            user.password_hash,
          );
        } catch {
          validPassword = false;
        }
      }

      if (!validPassword) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Mevcut şifre yanlış",
        });
      }

      const newPasswordHash = await bcrypt.hash(
        input.newPassword,
        BCRYPT_ROUNDS,
      );
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
      }),
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
              throw new TRPCError({
                code: "BAD_REQUEST",
                message: "Telefon numarası formatı geçersiz",
              });
            }
          }
          await tx.users.update({
            where: { id: ctx.user.id },
            data: {
              ...(name ? { name } : {}),
              ...(phone ? { phone } : {}),
              ...(timezone ? { timezone } : {}),
              ...(phone
                ? { phone_verified: false, phone_verified_at: null }
                : {}),
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

  updateBillingProfile: protectedProcedure
    .input(billingProfileInputSchema)
    .mutation(async ({ ctx, input }) => {
      if (!ctx.user.organizationId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Organizasyon bulunamadı",
        });
      }

      const organization = await ctx.prisma.organizations.findUnique({
        where: { id: ctx.user.organizationId },
        select: { settings: true },
      });

      const currentSettings = readOrganizationSettings(organization?.settings);

      const billingProfile = normalizeBillingProfile(input);

      await ctx.prisma.organizations.update({
        where: { id: ctx.user.organizationId },
        data: {
          settings: {
            ...currentSettings,
            billingProfile,
            billingProfileUpdatedAt: new Date().toISOString(),
          },
          updated_at: new Date(),
        },
      });

      return { ok: true };
    }),

  getDomains: protectedProcedure.query(async ({ ctx }) => {
    const organizationForSettings = await ctx.prisma.organizations.findUnique({
      where: { id: ctx.user.organizationId },
      select: { settings: true },
    });
    const organizationSettings = readOrganizationSettings(
      organizationForSettings?.settings,
    );
    const preferredSetupChoiceRaw = organizationSettings.domainSetupChoice;
    const preferredSetupChoice =
      preferredSetupChoiceRaw === "custom" ? "custom" : "system";

    const access = await getOrganizationAccess(
      ctx.prisma as any,
      ctx.user.organizationId,
    );
    if (!access.features.customDomain) {
      return {
        enabled: false,
        systemBaseDomain: getDomainSystemBase(),
        connectTarget: getDomainConnectTarget(),
        preferredSetupChoice,
        systemSetup: {
          enabled: false,
          required: false,
          completed: false,
          hostname: null,
          selectedLabel: null,
          suggestedLabel: null,
          suggestedHostname: null,
        },
        domains: [],
      };
    }

    const domains = await getOrganizationDomains(
      ctx.prisma as any,
      ctx.user.organizationId,
    );
    const syncedDomains = await Promise.all(
      domains.map((domain) =>
        syncDomainState(ctx.prisma as any, domain as any),
      ),
    );
    const systemSetup = await getSystemDomainSetupStatus(
      ctx.prisma as any,
      ctx.user.organizationId,
    );

    return {
      enabled: true,
      systemBaseDomain: getDomainSystemBase(),
      connectTarget: getDomainConnectTarget(),
      preferredSetupChoice,
      systemSetup,
      domains: syncedDomains.map((domain) => formatDomainRecord(domain as any)),
    };
  }),

  setDomainSetupChoice: protectedProcedure
    .input(
      z.object({
        choice: domainSetupChoiceSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.prisma.organizations.findUnique({
        where: { id: ctx.user.organizationId },
        select: { settings: true },
      });

      const currentSettings = readOrganizationSettings(organization?.settings);

      await ctx.prisma.organizations.update({
        where: { id: ctx.user.organizationId },
        data: {
          settings: {
            ...currentSettings,
            domainSetupChoice: input.choice,
            domainSetupChoiceUpdatedAt: new Date().toISOString(),
          },
          updated_at: new Date(),
        },
      });

      return { ok: true, choice: input.choice };
    }),

  configureSystemSubdomain: protectedProcedure
    .input(
      z.object({
        label: z.string().trim().min(1).max(80),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await getOrganizationAccess(
        ctx.prisma as any,
        ctx.user.organizationId,
      );
      if (!access.features.customDomain) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Sistem subdomain yalnızca WL paketlerde açılır",
        });
      }

      try {
        const domain = await createSystemDomain(
          ctx.prisma as any,
          ctx.user.organizationId,
          input.label,
        );
        const synced = domain
          ? await syncDomainState(ctx.prisma as any, domain as any)
          : null;
        const systemSetup = await getSystemDomainSetupStatus(
          ctx.prisma as any,
          ctx.user.organizationId,
        );

        return {
          ok: true,
          domain: synced ? formatDomainRecord(synced as any) : null,
          systemSetup,
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Sistem subdomain oluşturulamadı",
        });
      }
    }),

  addDomain: protectedProcedure
    .input(
      z.object({
        hostname: z.string().trim().min(3).max(255),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await getOrganizationAccess(
        ctx.prisma as any,
        ctx.user.organizationId,
      );
      if (!access.features.customDomain) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Özel subdomain / domain yalnızca WL paketlerde açılır",
        });
      }

      try {
        const systemDomain = await getOrganizationSystemDomain(
          ctx.prisma as any,
          ctx.user.organizationId,
        );
        if (!systemDomain) {
          throw new Error("Önce sistem subdomaininizi seçin");
        }
        const domain = await createCustomDomain(
          ctx.prisma as any,
          ctx.user.organizationId,
          input.hostname,
        );
        const synced = await syncDomainState(ctx.prisma as any, domain as any);
        return {
          ok: true,
          domain: formatDomainRecord(synced as any),
        };
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Domain eklenemedi",
        });
      }
    }),

  verifyDomain: protectedProcedure
    .input(
      z.object({
        domainId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await getOrganizationAccess(
        ctx.prisma as any,
        ctx.user.organizationId,
      );
      if (!access.features.customDomain) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Özel subdomain / domain yalnızca WL paketlerde açılır",
        });
      }

      const domain = await ctx.prisma.organization_domains.findFirst({
        where: {
          id: input.domainId,
          organization_id: ctx.user.organizationId,
        },
      });

      if (!domain) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Domain bulunamadı",
        });
      }

      const synced = await syncDomainState(ctx.prisma as any, domain as any);
      return {
        ok: true,
        domain: formatDomainRecord(synced as any),
      };
    }),

  setPrimaryDomain: protectedProcedure
    .input(
      z.object({
        domainId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await getOrganizationAccess(
        ctx.prisma as any,
        ctx.user.organizationId,
      );
      if (!access.features.customDomain) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Özel subdomain / domain yalnızca WL paketlerde açılır",
        });
      }

      try {
        await setPrimaryDomain(
          ctx.prisma as any,
          ctx.user.organizationId,
          input.domainId,
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            error instanceof Error
              ? error.message
              : "Birincil domain güncellenemedi",
        });
      }

      const domains = await getOrganizationDomains(
        ctx.prisma as any,
        ctx.user.organizationId,
      );
      return {
        ok: true,
        domains: domains.map((domain) => formatDomainRecord(domain as any)),
      };
    }),

  deleteDomain: protectedProcedure
    .input(
      z.object({
        domainId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const access = await getOrganizationAccess(
        ctx.prisma as any,
        ctx.user.organizationId,
      );
      if (!access.features.customDomain) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Özel subdomain / domain yalnızca WL paketlerde açılır",
        });
      }

      try {
        await removeDomain(
          ctx.prisma as any,
          ctx.user.organizationId,
          input.domainId,
        );
      } catch (error) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: error instanceof Error ? error.message : "Domain silinemedi",
        });
      }

      const domains = await getOrganizationDomains(
        ctx.prisma as any,
        ctx.user.organizationId,
      );
      return {
        ok: true,
        domains: domains.map((domain) => formatDomainRecord(domain as any)),
      };
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
        email_verified: true,
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

  detail: protectedProcedure
    .input(z.object({ userId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (!isSuperAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu işlem yalnızca Süper Admin için izinlidir",
        });
      }

      const user = await ctx.prisma.users.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          email_verified: true,
          name: true,
          role: true,
          phone: true,
          phone_verified: true,
          company: true,
          organization_id: true,
          created_at: true,
          updated_at: true,
          timezone: true,
          language: true,
          theme: true,
          date_format: true,
          two_factor_enabled: true,
          organizations: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
              created_at: true,
            },
          },
        },
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kullanıcı bulunamadı",
        });
      }

      const now = new Date();
      const organizationId = user.organization_id ?? null;

      const [
        totalSessions,
        activeSessions,
        latestSessionExpiry,
        totalAuditRecords,
        createdEventsCount,
        recentAuditLogs,
        recentEvents,
        organizationUsersCount,
        organizationDomainsCount,
        recentSubscriptions,
      ] = await Promise.all([
        ctx.prisma.sessions.count({
          where: { user_id: user.id },
        }),
        ctx.prisma.sessions.count({
          where: {
            user_id: user.id,
            expires_at: { gt: now },
          },
        }),
        ctx.prisma.sessions.findFirst({
          where: { user_id: user.id },
          orderBy: { expires_at: "desc" },
          select: { expires_at: true },
        }),
        ctx.prisma.audit_logs.count({
          where: { user_id: user.id },
        }),
        ctx.prisma.events.count({
          where: { created_by: user.id },
        }),
        ctx.prisma.audit_logs.findMany({
          where: { user_id: user.id },
          orderBy: { created_at: "desc" },
          take: 24,
          select: {
            id: true,
            action: true,
            resource: true,
            resource_id: true,
            details: true,
            ip_address: true,
            user_agent: true,
            created_at: true,
          },
        }),
        ctx.prisma.events.findMany({
          where: { created_by: user.id },
          orderBy: { created_at: "desc" },
          take: 8,
          select: {
            id: true,
            name: true,
            event_type: true,
            status: true,
            max_participants: true,
            created_at: true,
            start_time: true,
            _count: {
              select: {
                activities: true,
                participants: true,
                qanda_submissions: true,
              },
            },
          },
        }),
        organizationId
          ? ctx.prisma.users.count({
              where: { organization_id: organizationId },
            })
          : Promise.resolve(0),
        organizationId
          ? ctx.prisma.organization_domains.count({
              where: { organization_id: organizationId },
            })
          : Promise.resolve(0),
        organizationId
          ? ctx.prisma.subscriptions.findMany({
              where: { organization_id: organizationId },
              orderBy: { created_at: "desc" },
              take: 6,
              select: {
                id: true,
                plan: true,
                status: true,
                payment_method: true,
                created_at: true,
                current_period_end: true,
                metadata: true,
              },
            })
          : Promise.resolve([]),
      ]);

      const lastAuditAt = recentAuditLogs[0]?.created_at ?? null;
      const lastSeenAt = maxDate(lastAuditAt, latestSessionExpiry?.expires_at ?? null, user.updated_at);
      const accountAgeMs = Math.max(0, now.getTime() - user.created_at.getTime());

      return {
        user,
        stats: {
          totalSessions,
          activeSessions,
          lastSeenAt,
          latestSessionExpiry: latestSessionExpiry?.expires_at ?? null,
          accountAgeMs,
          totalAuditRecords,
          createdEventsCount,
          organizationUsersCount,
          organizationDomainsCount,
          subscriptionCount: recentSubscriptions.length,
        },
        recentAuditLogs: recentAuditLogs.map((log) => ({
          id: log.id,
          action: log.action,
          resource: log.resource,
          resourceId: log.resource_id,
          createdAt: log.created_at,
          ipAddress: log.ip_address,
          userAgent: log.user_agent,
          details: normalizeAuditDetails(log.details),
        })),
        recentEvents: recentEvents.map((event) => ({
          id: event.id,
          name: event.name,
          type: event.event_type,
          status: event.status,
          maxParticipants: event.max_participants,
          createdAt: event.created_at,
          startTime: event.start_time,
          counts: event._count,
        })),
        recentSubscriptions: recentSubscriptions.map((subscription) => {
          const metadata = readSubscriptionMetadata(subscription.metadata);
          return {
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            paymentMethod: subscription.payment_method,
            createdAt: subscription.created_at,
            currentPeriodEnd: subscription.current_period_end,
            amount: readAmountFromMetadata(metadata),
            currency:
              typeof metadata.currency === "string" ? metadata.currency : "TRY",
            packageName:
              typeof metadata.packageName === "string"
                ? metadata.packageName
                : null,
          };
        }),
      };
    }),

  assignSpringPilot: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isSuperAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu işlem yalnızca Süper Admin için izinlidir",
        });
      }

      const user = await ctx.prisma.users.findUnique({
        where: { id: input.userId },
        select: {
          id: true,
          email: true,
          email_verified: true,
          phone_verified: true,
          company: true,
          organization_id: true,
          organizations: {
            select: {
              id: true,
              name: true,
              slug: true,
              plan: true,
            },
          },
        },
      });

      if (!user || !user.organization_id || !user.organizations) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Pilot atanacak organizasyon bulunamadı",
        });
      }

      if (!user.email_verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pilot atamadan önce kullanıcının e-posta doğrulaması tamamlanmalı",
        });
      }

      if (!user.phone_verified) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pilot atamadan önce kullanıcının telefon doğrulaması tamamlanmalı",
        });
      }

      if (!user.company || !user.company.trim()) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Pilot atamadan önce kullanıcı için şirket bilgisi girilmeli",
        });
      }

      const activeSubscription = await ctx.prisma.subscriptions.findFirst({
        where: {
          organization_id: user.organization_id,
          status: "active",
        },
        orderBy: { created_at: "desc" },
        select: {
          id: true,
          plan: true,
          current_period_end: true,
        },
      });

      if (activeSubscription) {
        const now = new Date();
        const currentPeriodEnd = activeSubscription.current_period_end
          ? new Date(activeSubscription.current_period_end)
          : null;

        if (!currentPeriodEnd || currentPeriodEnd >= now) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Bu organizasyonda aktif abonelik var (${activeSubscription.plan || "premium"}). Pilot plan atanamaz.`,
          });
        }
      }

      const updatedOrganization = await ctx.prisma.organizations.update({
        where: { id: user.organization_id },
        data: {
          plan: SPRING_PILOT_PLAN,
          updated_at: new Date(),
        },
        select: {
          id: true,
          name: true,
          slug: true,
          plan: true,
        },
      });

      const access = await getOrganizationAccess(ctx.prisma as any, user.organization_id);

      return {
        ok: true,
        organization: updatedOrganization,
        access,
      };
    }),

  updateRole: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(),
        role: z.enum([
          "superadmin",
          "junioradmin",
          "admin",
          "organizer",
          "moderator",
          "member",
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!isSuperAdmin(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Bu işlem yalnızca Süper Admin için izinlidir",
        });
      }

      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Kendi rolünüzü bu panelden değiştiremezsiniz",
        });
      }

      const target = await ctx.prisma.users.findUnique({
        where: { id: input.userId },
        select: { id: true },
      });

      if (!target) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Kullanıcı bulunamadı",
        });
      }

      const updated = await ctx.prisma.users.update({
        where: { id: input.userId },
        data: {
          role: input.role,
          updated_at: new Date(),
        },
        select: {
          id: true,
          role: true,
          updated_at: true,
        },
      });

      return {
        ok: true,
        user: updated,
      };
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
