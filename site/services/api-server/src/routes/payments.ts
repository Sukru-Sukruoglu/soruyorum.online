import crypto from "node:crypto";
import express from "express";
import { tenantContextMiddleware } from "../middleware/tenantContext";
import { tenantDb } from "../database/tenantDb";
import { getOrganizationAccess, isSuperAdmin, hasFullAccess } from "../utils/access";
import { getSystemDomainSetupStatus } from "../utils/domains";
import { isMailConfigured, sendMail } from "../utils/mailer";

const router = express.Router();

type PaytrPackage = {
  id: string;
  name: string;
  amount: number; // kurus
  plan: string;
  periodDays: number;
};

type PaytrAddon = {
  id: "addon_remote" | "addon_onsite";
  name: string;
  amount: number; // kurus
  scope: "single_event";
};

type PaytrPaymentType = "card" | "eft";

type BankTransferStatus =
  | "pending_payment"
  | "payment_notified"
  | "under_review"
  | "approved"
  | "rejected"
  | "expired";

type BankTransferAccount = {
  id: string;
  accountHolder: string;
  iban: string;
  bankName: string;
  branchName: string | null;
  branchCode: string | null;
  swiftCode: string | null;
};

type BankTransferConfig = {
  accounts: BankTransferAccount[];
  paymentWindowHours: number;
};

type SubscriptionMetadata = Record<string, unknown> & {
  addons?: Array<Record<string, unknown>>;
  activation?: Record<string, unknown>;
  entitlements?: Array<Record<string, unknown>>;
  gateway?: Record<string, unknown>;
  package?: Record<string, unknown>;
  eventScope?: Record<string, unknown>;
};

type PaytrGatewayResponse = {
  status?: string;
  token?: string;
  reason?: string;
  [key: string]: unknown;
};

const DEFAULT_PACKAGES: PaytrPackage[] = [
  {
    id: "event-starter",
    name: "Event Starter",
    amount: 300000,
    plan: "event_starter",
    periodDays: 30,
  },
  {
    id: "event-standard",
    name: "Event Standard",
    amount: 450000,
    plan: "event_standard",
    periodDays: 30,
  },
  {
    id: "event-professional",
    name: "Event Professional",
    amount: 900000,
    plan: "event_professional",
    periodDays: 30,
  },
  {
    id: "starter-wl",
    name: "Starter WL",
    amount: 500000,
    plan: "starter_wl",
    periodDays: 30,
  },
  {
    id: "standard-wl",
    name: "Standard WL",
    amount: 1000000,
    plan: "standard_wl",
    periodDays: 30,
  },
  {
    id: "professional-wl",
    name: "Professional WL",
    amount: 2000000,
    plan: "professional_wl",
    periodDays: 30,
  },
  {
    id: "event-pack-5",
    name: "Event Pack",
    amount: 1800000,
    plan: "event_pack_5",
    periodDays: 365,
  },
  {
    id: "event-pack-10",
    name: "Event Pack",
    amount: 3200000,
    plan: "event_pack_10",
    periodDays: 365,
  },
  {
    id: "event-pack-wl-5",
    name: "Event Pack WL",
    amount: 4000000,
    plan: "event_pack_wl_5",
    periodDays: 365,
  },
  {
    id: "event-pack-wl-10",
    name: "Event Pack WL",
    amount: 7000000,
    plan: "event_pack_wl_10",
    periodDays: 365,
  },
  {
    id: "corporate",
    name: "Corporate",
    amount: 3500000,
    plan: "corporate",
    periodDays: 365,
  },
  {
    id: "corporate-pro",
    name: "Corporate Pro",
    amount: 6900000,
    plan: "corporate_pro",
    periodDays: 365,
  },
  {
    id: "corporate-wl",
    name: "Corporate WL",
    amount: 5500000,
    plan: "corporate_wl",
    periodDays: 365,
  },
  {
    id: "corporate-pro-wl",
    name: "Corporate Pro WL",
    amount: 12000000,
    plan: "corporate_pro_wl",
    periodDays: 365,
  },
];

const PAYTR_ADDONS: Record<PaytrAddon["id"], PaytrAddon> = {
  addon_remote: {
    id: "addon_remote",
    name: "Remote Event Operator",
    amount: 700000,
    scope: "single_event",
  },
  addon_onsite: {
    id: "addon_onsite",
    name: "On-site Event Operator",
    amount: 2000000,
    scope: "single_event",
  },
};

const PAYMENT_NOTIFICATION_EMAIL = (
  process.env.PAYMENT_NOTIFICATION_EMAIL || "odeme@soruyorum.online"
).trim();

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getStringField(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function formatCurrencyAmount(amountRaw: unknown, currency = "TRY"): string {
  const amount =
    typeof amountRaw === "number"
      ? amountRaw
      : Number.parseFloat(String(amountRaw ?? "0"));
  const normalized = Number.isFinite(amount) ? amount / 100 : 0;
  return `${normalized.toLocaleString("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${currency}`;
}

async function sendPaymentNotificationEmail(params: {
  subject: string;
  intro: string;
  rows: Array<[string, string | null | undefined]>;
}) {
  if (!isMailConfigured() || !PAYMENT_NOTIFICATION_EMAIL) {
    return;
  }

  const visibleRows = params.rows.filter(
    ([, value]) => typeof value === "string" && value.trim().length > 0,
  );
  const text =
    `${params.intro}\n\n` +
    visibleRows.map(([label, value]) => `${label}: ${value}`).join("\n");
  const html = `
<!doctype html>
<html lang="tr">
  <body style="margin:0;padding:24px;background:#0b1020;font-family:Arial,Helvetica,sans-serif;color:#e5e7eb;">
    <div style="max-width:640px;margin:0 auto;background:#111827;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
      <div style="padding:18px 22px;background:#0f172a;border-bottom:1px solid #1f2937;">
        <div style="font-size:18px;font-weight:800;color:#ffffff;">${escapeHtml(params.subject)}</div>
      </div>
      <div style="padding:22px;">
        <p style="margin:0 0 18px 0;line-height:1.7;color:#cbd5e1;">${escapeHtml(params.intro)}</p>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
          ${visibleRows
            .map(
              ([label, value]) => `
            <tr>
              <td style="padding:10px 0;border-top:1px solid #1f2937;color:#94a3b8;font-size:13px;width:180px;vertical-align:top;">${escapeHtml(label)}</td>
              <td style="padding:10px 0;border-top:1px solid #1f2937;color:#f8fafc;font-size:14px;font-weight:600;vertical-align:top;word-break:break-word;">${escapeHtml(
                value || "",
              )}</td>
            </tr>`,
            )
            .join("")}
        </table>
      </div>
    </div>
  </body>
</html>`.trim();

  await sendMail({
    to: PAYMENT_NOTIFICATION_EMAIL,
    subject: params.subject,
    text,
    html,
  });
}

function getPaytrPackages(): PaytrPackage[] {
  const premiumAmount = Number.parseInt(
    process.env.PAYTR_PREMIUM_AMOUNT ?? "",
    10,
  );
  if (!Number.isNaN(premiumAmount) && premiumAmount > 0) {
    return [
      { ...DEFAULT_PACKAGES[0], amount: premiumAmount },
      ...DEFAULT_PACKAGES.slice(1),
    ];
  }
  return DEFAULT_PACKAGES;
}

function getClientIp(req: express.Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded.length > 0) {
    return forwarded[0];
  }
  return req.ip || "127.0.0.1";
}

function paytrHash(payload: string, merchantKey: string): string {
  return crypto
    .createHmac("sha256", merchantKey)
    .update(payload)
    .digest("base64");
}

async function readPaytrResponse(response: Response) {
  const rawBody = await response.text();
  let data: PaytrGatewayResponse | null = null;

  if (rawBody.trim()) {
    try {
      data = JSON.parse(rawBody) as PaytrGatewayResponse;
    } catch {
      data = null;
    }
  }

  return { rawBody, data };
}

function readSubscriptionMetadata(metadata: unknown): SubscriptionMetadata {
  return metadata && typeof metadata === "object" && !Array.isArray(metadata)
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

function buildGatewayMetadata(
  merchantOid: string,
  status: string,
  totalAmount: string | number,
  paymentType: PaytrPaymentType = "card",
) {
  return {
    provider: "paytr",
    payment_type: paymentType,
    merchant_oid: merchantOid,
    status,
    total_amount: totalAmount,
  };
}

function buildMerchantOid(organizationId: string): string {
  const normalizedOrg = organizationId
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(0, 16);
  const timestamp = Date.now().toString();
  const nonce = crypto.randomBytes(6).toString("hex");
  return `SY${normalizedOrg}${timestamp}${nonce}`.slice(0, 64);
}

function getBankTransferConfig(): BankTransferConfig | null {
  const paymentWindowHoursRaw = Number.parseInt(
    process.env.BANK_TRANSFER_PAYMENT_WINDOW_HOURS ?? "48",
    10,
  );
  const paymentWindowHours =
    Number.isFinite(paymentWindowHoursRaw) && paymentWindowHoursRaw > 0
      ? paymentWindowHoursRaw
      : 48;

  const normalizeAccount = (
    raw: Record<string, unknown>,
    index: number,
  ): BankTransferAccount | null => {
    const accountHolder =
      typeof raw.accountHolder === "string" ? raw.accountHolder.trim() : "";
    const iban = typeof raw.iban === "string" ? raw.iban.trim() : "";
    const bankName = typeof raw.bankName === "string" ? raw.bankName.trim() : "";
    const branchName =
      typeof raw.branchName === "string" && raw.branchName.trim().length > 0
        ? raw.branchName.trim()
        : null;
    const branchCode =
      typeof raw.branchCode === "string" && raw.branchCode.trim().length > 0
        ? raw.branchCode.trim()
        : null;
    const swiftCode =
      typeof raw.swiftCode === "string" && raw.swiftCode.trim().length > 0
        ? raw.swiftCode.trim()
        : null;

    if (!accountHolder || !iban || !bankName) {
      return null;
    }

    return {
      id:
        typeof raw.id === "string" && raw.id.trim().length > 0
          ? raw.id.trim()
          : `bank-${index + 1}`,
      accountHolder,
      iban,
      bankName,
      branchName,
      branchCode,
      swiftCode,
    };
  };

  let accounts: BankTransferAccount[] = [];
  const accountsJson = process.env.BANK_TRANSFER_ACCOUNTS_JSON?.trim() ?? "";

  if (accountsJson) {
    try {
      const parsed = JSON.parse(accountsJson) as unknown;
      if (Array.isArray(parsed)) {
        accounts = parsed
          .map((item, index) =>
            item && typeof item === "object" && !Array.isArray(item)
              ? normalizeAccount(item as Record<string, unknown>, index)
              : null,
          )
          .filter((item): item is BankTransferAccount => Boolean(item));
      }
    } catch (error) {
      console.error("BANK_TRANSFER_ACCOUNTS_JSON parse error:", error);
    }
  }

  if (accounts.length === 0) {
    const legacyAccount = normalizeAccount(
      {
        id: "bank-1",
        accountHolder: process.env.BANK_TRANSFER_ACCOUNT_HOLDER?.trim() ?? "",
        iban: process.env.BANK_TRANSFER_IBAN?.trim() ?? "",
        bankName: process.env.BANK_TRANSFER_BANK_NAME?.trim() ?? "",
        branchName: process.env.BANK_TRANSFER_BRANCH_NAME?.trim() || null,
        branchCode: process.env.BANK_TRANSFER_BRANCH_CODE?.trim() || null,
        swiftCode: process.env.BANK_TRANSFER_SWIFT_CODE?.trim() || null,
      },
      0,
    );

    if (legacyAccount) {
      accounts = [legacyAccount];
    }
  }

  if (accounts.length === 0) {
    return null;
  }

  accounts = [...accounts].sort((left, right) => {
    const leftPriority =
      left.id === "garanti" || left.bankName.toLowerCase().includes("garanti")
        ? 0
        : 1;
    const rightPriority =
      right.id === "garanti" || right.bankName.toLowerCase().includes("garanti")
        ? 0
        : 1;
    return leftPriority - rightPriority;
  });

  return {
    accounts,
    paymentWindowHours,
  };
}

function buildBankTransferReference(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const nonce = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `SYBT${stamp}${nonce}`.slice(0, 18);
}

function buildPendingBankTransferMetadata(
  selectedPackage: PaytrPackage,
  selectedAddons: PaytrAddon[],
  currency: string,
  userId: string,
  eventId: string | null,
  referenceCode: string,
  config: BankTransferConfig,
  now: Date,
  expiresAt: Date,
): SubscriptionMetadata {
  const normalizedAddons = selectedAddons.map((addon: PaytrAddon) =>
    normalizeAddonMetadata(addon, eventId),
  );
  const totalAmount = selectedAddons.reduce(
    (sum: number, addon: PaytrAddon) => sum + addon.amount,
    selectedPackage.amount,
  );

  return {
    packageId: selectedPackage.id,
    packageName: selectedPackage.name,
    amount: selectedPackage.amount,
    totalAmount,
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
      type: eventId ? "single_event" : "organization",
      eventId,
    },
    activation: {
      status: "pending",
      activated_at: null,
      expires_at: expiresAt.toISOString(),
      failed_at: null,
    },
    entitlements: [],
    gateway: {
      provider: "bank_transfer",
      status: "pending",
      reference_code: referenceCode,
      total_amount: totalAmount,
    },
    bankTransfer: {
      status: "pending_payment" as BankTransferStatus,
      referenceCode,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      notifiedAt: null,
      senderName: null,
      senderIban: null,
      note: null,
      bankAccount: config.accounts[0],
      bankAccounts: config.accounts,
    },
  };
}

function readBankTransferStatus(
  metadata: SubscriptionMetadata,
): BankTransferStatus {
  const bankTransfer = metadata.bankTransfer;
  const raw =
    bankTransfer && typeof bankTransfer === "object"
      ? (bankTransfer as Record<string, unknown>).status
      : null;

  if (
    raw === "pending_payment" ||
    raw === "payment_notified" ||
    raw === "under_review" ||
    raw === "approved" ||
    raw === "rejected" ||
    raw === "expired"
  ) {
    return raw;
  }

  return "pending_payment";
}

function serializeBankTransferRequest(
  subscription: any,
  metadata: SubscriptionMetadata,
) {
  const bankTransfer = (metadata.bankTransfer ?? {}) as Record<string, unknown>;
  const bankAccount = (bankTransfer.bankAccount ?? {}) as Record<
    string,
    unknown
  >;
  const rawBankAccounts = Array.isArray(bankTransfer.bankAccounts)
    ? bankTransfer.bankAccounts
    : [];
  const bankAccounts = rawBankAccounts
    .map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) {
        return null;
      }

      const record = item as Record<string, unknown>;
      const id = typeof record.id === "string" ? record.id : "";
      const accountHolder =
        typeof record.accountHolder === "string" ? record.accountHolder : "";
      const iban = typeof record.iban === "string" ? record.iban : "";
      const bankName = typeof record.bankName === "string" ? record.bankName : "";

      if (!id || !accountHolder || !iban || !bankName) {
        return null;
      }

      return {
        id,
        accountHolder,
        iban,
        bankName,
        branchName:
          typeof record.branchName === "string" ? record.branchName : null,
        branchCode:
          typeof record.branchCode === "string" ? record.branchCode : null,
        swiftCode:
          typeof record.swiftCode === "string" ? record.swiftCode : null,
      };
    })
    .filter(
      (
        item,
      ): item is {
        id: string;
        accountHolder: string;
        iban: string;
        bankName: string;
        branchName: string | null;
        branchCode: string | null;
        swiftCode: string | null;
      } => Boolean(item),
    );
  const fallbackBankAccount = {
    id: "bank-1",
    accountHolder:
      typeof bankAccount.accountHolder === "string"
        ? bankAccount.accountHolder
        : null,
    iban: typeof bankAccount.iban === "string" ? bankAccount.iban : null,
    bankName:
      typeof bankAccount.bankName === "string" ? bankAccount.bankName : null,
    branchName:
      typeof bankAccount.branchName === "string" ? bankAccount.branchName : null,
    branchCode:
      typeof bankAccount.branchCode === "string" ? bankAccount.branchCode : null,
    swiftCode:
      typeof bankAccount.swiftCode === "string" ? bankAccount.swiftCode : null,
  };

  return {
    requestId: subscription.id,
    status: readBankTransferStatus(metadata),
    referenceCode: String(bankTransfer.referenceCode ?? ""),
    expiresAt:
      typeof bankTransfer.expiresAt === "string"
        ? bankTransfer.expiresAt
        : null,
    notifiedAt:
      typeof bankTransfer.notifiedAt === "string"
        ? bankTransfer.notifiedAt
        : null,
    senderName:
      typeof bankTransfer.senderName === "string"
        ? bankTransfer.senderName
        : null,
    senderIban:
      typeof bankTransfer.senderIban === "string"
        ? bankTransfer.senderIban
        : null,
    note: typeof bankTransfer.note === "string" ? bankTransfer.note : null,
    bankAccount: fallbackBankAccount,
    bankAccounts:
      bankAccounts.length > 0
        ? bankAccounts
        : fallbackBankAccount.accountHolder &&
            fallbackBankAccount.iban &&
            fallbackBankAccount.bankName
          ? [fallbackBankAccount]
          : [],
    package: {
      id: typeof metadata.packageId === "string" ? metadata.packageId : null,
      name:
        typeof metadata.packageName === "string" ? metadata.packageName : null,
      amount: metadata.totalAmount ?? metadata.amount ?? null,
      currency:
        typeof metadata.currency === "string" ? metadata.currency : "TRY",
    },
    addons: Array.isArray(metadata.addons) ? metadata.addons : [],
  };
}

function buildPendingMetadata(
  merchantOid: string,
  selectedPackage: PaytrPackage,
  selectedAddons: PaytrAddon[],
  currency: string,
  userId: string,
  eventId: string | null,
  paymentType: PaytrPaymentType = "card",
): SubscriptionMetadata {
  const normalizedAddons = selectedAddons.map((addon: PaytrAddon) =>
    normalizeAddonMetadata(addon, eventId),
  );

  return {
    merchant_oid: merchantOid,
    packageId: selectedPackage.id,
    packageName: selectedPackage.name,
    amount: selectedPackage.amount,
    totalAmount: selectedAddons.reduce(
      (sum: number, addon: PaytrAddon) => sum + addon.amount,
      selectedPackage.amount,
    ),
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
      type: eventId ? "single_event" : "organization",
      eventId,
    },
    activation: {
      status: "pending",
      activated_at: null,
      expires_at: null,
      failed_at: null,
    },
    entitlements: [],
    gateway: buildGatewayMetadata(
      merchantOid,
      "pending",
      selectedAddons.reduce(
        (sum: number, addon: PaytrAddon) => sum + addon.amount,
        selectedPackage.amount,
      ),
      paymentType,
    ),
  };
}

function buildEntitlements(
  plan: string,
  metadata: SubscriptionMetadata,
  now: Date,
  expiresAt: Date,
) {
  const addons = Array.isArray(metadata.addons) ? metadata.addons : [];

  return [
    {
      type: "plan",
      key: plan,
      status: "active",
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
    ...addons.map((addon) => ({
      type: "addon",
      key: String(addon.id ?? ""),
      name: String(addon.name ?? ""),
      status: "active",
      scope: String(addon.scope ?? "single_event"),
      eventId: addon.eventId ?? metadata.eventId ?? null,
      eventUsageLimit: Number(addon.eventUsageLimit ?? 1),
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    })),
  ];
}

function getGatewayPaymentType(
  metadata: SubscriptionMetadata,
): PaytrPaymentType {
  const gateway = metadata.gateway;
  const raw =
    gateway && typeof gateway === "object"
      ? (gateway as Record<string, unknown>).payment_type
      : undefined;
  return raw === "eft" ? "eft" : "card";
}

router.post("/paytr/callback", async (req, res) => {
  const merchantOid = String(req.body?.merchant_oid ?? "");
  const status = String(req.body?.status ?? "");
  const totalAmount = String(req.body?.total_amount ?? "");
  const postedHash = String(req.body?.hash ?? "");

  const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? "";
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? "";

  if (
    !merchantOid ||
    !status ||
    !totalAmount ||
    !postedHash ||
    !merchantKey ||
    !merchantSalt
  ) {
    console.warn("PAYTR callback validation failed: missing fields", {
      merchantOid,
      status,
      totalAmount,
      hasPostedHash: Boolean(postedHash),
    });
    return res.status(400).send("PAYTR callback validation failed");
  }

  const expectedHash = paytrHash(
    `${merchantOid}${merchantSalt}${status}${totalAmount}`,
    merchantKey,
  );
  if (expectedHash !== postedHash) {
    console.warn("PAYTR callback hash mismatch", {
      merchantOid,
      status,
      totalAmount,
    });
    return res.status(403).send("PAYTR callback hash mismatch");
  }

  try {
    const pending = await tenantDb.direct.subscriptions.findFirst({
      where: {
        metadata: {
          path: ["merchant_oid"],
          equals: merchantOid,
        },
      } as any,
      orderBy: { created_at: "desc" } as any,
    });

    if (!pending) {
      console.warn("PAYTR callback received for unknown merchant_oid", {
        merchantOid,
        status,
        totalAmount,
      });
      // Callback can arrive for orders already processed or old records.
      return res.status(200).send("OK");
    }

    const metadata = readSubscriptionMetadata(pending.metadata);
    const periodDays = Number(metadata.periodDays ?? 30);
    const now = new Date();
    const periodEnd = new Date(
      now.getTime() + periodDays * 24 * 60 * 60 * 1000,
    );

    if (pending.status === "active" && metadata.paytr_status === "success") {
      console.info("PAYTR callback ignored because subscription is already active", {
        merchantOid,
        subscriptionId: pending.id,
        organizationId: pending.organization_id,
      });
      return res.status(200).send("OK");
    }

    if (status === "success") {
      const entitlements = buildEntitlements(
        pending.plan || "premium",
        metadata,
        now,
        periodEnd,
      );
      const paymentType = getGatewayPaymentType(metadata);
      await tenantDb.direct.subscriptions.update({
        where: { id: pending.id } as any,
        data: {
          status: "active",
          payment_method: paymentType === "eft" ? "paytr_eft" : "paytr",
          current_period_start: now,
          current_period_end: periodEnd,
          updated_at: now,
          metadata: {
            ...metadata,
            entitlements,
            activation: {
              status: "active",
              activated_at: now.toISOString(),
              expires_at: periodEnd.toISOString(),
              failed_at: null,
            },
            gateway: buildGatewayMetadata(
              merchantOid,
              status,
              totalAmount,
              paymentType,
            ),
            paytr_status: status,
            paytr_total_amount: totalAmount,
            activated_at: now.toISOString(),
          } as any,
        } as any,
      });

      await tenantDb.direct.organizations.update({
        where: { id: pending.organization_id } as any,
        data: {
          plan: pending.plan || "premium",
          updated_at: now,
        } as any,
      });

      console.info("PAYTR callback activated subscription", {
        merchantOid,
        subscriptionId: pending.id,
        organizationId: pending.organization_id,
        plan: pending.plan,
      });

      try {
        const [organization, user] = await Promise.all([
          tenantDb.direct.organizations.findUnique({
            where: { id: pending.organization_id } as any,
            select: { name: true, slug: true } as any,
          }),
          typeof metadata.createdByUserId === "string"
            ? tenantDb.direct.users.findUnique({
                where: { id: metadata.createdByUserId } as any,
                select: { name: true, email: true } as any,
              })
            : Promise.resolve(null),
        ]);

        const paymentType = getGatewayPaymentType(metadata);
        await sendPaymentNotificationEmail({
          subject:
            paymentType === "eft"
              ? "Yeni PayTR Havale/EFT odemesi alindi"
              : "Yeni kredi karti odemesi alindi",
          intro:
            paymentType === "eft"
              ? "Bir kullanici PayTR Havale/EFT odemesini basariyla tamamladı."
              : "Bir kullanici kredi karti ile odemeyi basariyla tamamladı.",
          rows: [
            ["Organizasyon", getStringField((organization as any)?.name)],
            ["Organizasyon slug", getStringField((organization as any)?.slug)],
            ["Kullanici", getStringField((user as any)?.name)],
            ["Kullanici e-postasi", getStringField((user as any)?.email)],
            ["Paket", typeof metadata.packageName === "string" ? metadata.packageName : null],
            [
              "Tutar",
              formatCurrencyAmount(
                totalAmount,
                typeof metadata.currency === "string" ? metadata.currency : "TRY",
              ),
            ],
            ["Odeme tipi", paymentType === "eft" ? "PayTR Havale/EFT" : "Kredi karti"],
            ["Merchant OID", merchantOid],
            ["Durum", status],
          ],
        });
      } catch (mailError) {
        console.warn("PAYTR success notification email failed:", mailError);
      }
    } else {
      const paymentType = getGatewayPaymentType(metadata);
      await tenantDb.direct.subscriptions.update({
        where: { id: pending.id } as any,
        data: {
          status: "failed",
          updated_at: now,
          metadata: {
            ...metadata,
            activation: {
              status: "failed",
              activated_at: null,
              expires_at: null,
              failed_at: now.toISOString(),
            },
            gateway: buildGatewayMetadata(
              merchantOid,
              status,
              totalAmount,
              paymentType,
            ),
            paytr_status: status,
            paytr_total_amount: totalAmount,
          } as any,
        } as any,
      });

      console.warn("PAYTR callback marked subscription as failed", {
        merchantOid,
        subscriptionId: pending.id,
        organizationId: pending.organization_id,
        status,
      });
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("PAYTR callback processing error:", error);
    return res.status(500).send("Callback processing failed");
  }
});

router.get("/paytr/callback", (_req, res) => {
  return res.status(405).json({
    error:
      "Bu endpoint sadece PayTR sunucusundan gelen POST callback istekleri icindir.",
  });
});

// Optional PayTR EFT intermediate callback (Ara Bildirim URL).
// Hash formula for this endpoint differs from final callback:
// merchant_oid + bank + merchant_salt
router.post("/paytr/eft/intermediate-callback", async (req, res) => {
  const merchantOid = String(req.body?.merchant_oid ?? "");
  const bank = String(req.body?.bank ?? "");
  const status = String(req.body?.status ?? "info");
  const postedHash = String(req.body?.hash ?? "");

  const paymentSentDate = String(req.body?.payment_sent_date ?? "");
  const userName = String(req.body?.user_name ?? "");
  const userPhone = String(req.body?.user_phone ?? "");
  const tcNoLast5 = String(req.body?.tc_no_last5 ?? "");

  const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? "";
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? "";

  if (!merchantOid || !bank || !postedHash || !merchantKey || !merchantSalt) {
    return res.status(400).send("PAYTR intermediate callback validation failed");
  }

  const expectedHash = paytrHash(`${merchantOid}${bank}${merchantSalt}`, merchantKey);
  if (expectedHash !== postedHash) {
    return res.status(403).send("PAYTR intermediate callback hash mismatch");
  }

  try {
    const pending = await tenantDb.direct.subscriptions.findFirst({
      where: {
        metadata: {
          path: ["merchant_oid"],
          equals: merchantOid,
        },
      } as any,
      orderBy: { created_at: "desc" } as any,
    });

    if (!pending) {
      return res.status(200).send("OK");
    }

    const metadata = readSubscriptionMetadata(pending.metadata);
    const paymentType = getGatewayPaymentType(metadata);
    const now = new Date();
    const existingGateway =
      metadata.gateway && typeof metadata.gateway === "object"
        ? (metadata.gateway as Record<string, unknown>)
        : {};

    await tenantDb.direct.subscriptions.update({
      where: { id: pending.id } as any,
      data: {
        updated_at: now,
        metadata: {
          ...metadata,
          gateway: {
            ...existingGateway,
            provider: "paytr",
            payment_type: paymentType,
            merchant_oid: merchantOid,
            intermediate_status: status,
            intermediate_bank: bank,
            intermediate_received_at: now.toISOString(),
          },
          paytr_intermediate: {
            status,
            bank,
            payment_sent_date: paymentSentDate,
            user_name: userName,
            user_phone: userPhone,
            tc_no_last5: tcNoLast5,
            received_at: now.toISOString(),
          },
        } as any,
      } as any,
    });

    return res.status(200).send("OK");
  } catch (error) {
    console.error("PAYTR EFT intermediate callback processing error:", error);
    return res.status(500).send("Intermediate callback processing failed");
  }
});

router.get("/paytr/eft/intermediate-callback", (_req, res) => {
  return res.status(405).json({
    error:
      "Bu endpoint sadece PayTR sunucusundan gelen POST ara bildirim istekleri icindir.",
  });
});

router.use(tenantContextMiddleware);

router.get("/methods", async (_req, res) => {
  const merchantId = process.env.PAYTR_MERCHANT_ID ?? "";
  const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? "";
  const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? "";
  const okUrl = process.env.PAYTR_OK_URL ?? "";
  const failUrl = process.env.PAYTR_FAIL_URL ?? "";

  const paytrBaseReady = Boolean(
    merchantId && merchantKey && merchantSalt && okUrl && failUrl,
  );
  const eftEnabled =
    paytrBaseReady && (process.env.PAYTR_EFT_ENABLED ?? "1") !== "0";
  const bankConfigReady = Boolean(getBankTransferConfig());
  const bankTransferEnabled =
    bankConfigReady && (process.env.BANK_TRANSFER_ENABLED ?? "1") !== "0";

  return res.json({
    methods: {
      card: {
        enabled: paytrBaseReady,
        reason: paytrBaseReady
          ? null
          : "PayTR kart odeme ayarlari eksik.",
      },
      eft: {
        enabled: eftEnabled,
        reason: eftEnabled
          ? null
          : paytrBaseReady
            ? "PayTR EFT odemesi panelde aktif degil (PAYTR_EFT_ENABLED=0)."
            : "PayTR EFT ayarlari eksik.",
      },
      bank_transfer: {
        enabled: bankTransferEnabled,
        reason: bankTransferEnabled
          ? null
          : "Havale/EFT banka hesap bilgileri tanimli degil.",
      },
    },
  });
});

router.get("/access", async (req, res, next) => {
  try {
    const access = await getOrganizationAccess(
      tenantDb.direct as any,
      req.organizationId!,
    );
    const domainSetup = await getSystemDomainSetupStatus(
      tenantDb.direct as any,
      req.organizationId!,
    );
    const superAdminBypass = hasFullAccess({
      role: req.userRole,
      email: req.userEmail,
    });

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
        trialEndsAt:
          effective.trialEndsAt instanceof Date
            ? effective.trialEndsAt.toISOString()
            : (effective as any).trialEndsAt,
      },
      domainSetup,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/paytr/packages", async (req, res) => {
  return res.json({
    packages: getPaytrPackages().map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount,
      currency: process.env.PAYTR_PREMIUM_CURRENCY || "TRY",
      periodDays: item.periodDays,
    })),
  });
});

router.post("/bank-transfer/create", async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const userId = req.userId;

    if (!organizationId || !userId) {
      return res.status(401).json({ error: "Yetkisiz erişim" });
    }

    if ((process.env.BANK_TRANSFER_ENABLED ?? "1") === "0") {
      return res.status(400).json({ error: "Havale / EFT bildirimi su anda aktif degil" });
    }

    const config = getBankTransferConfig();
    if (!config) {
      return res
        .status(500)
        .json({ error: "Havale / EFT banka bilgileri yapılandırılmamış" });
    }

    const requestedPackage = resolveRequestedPackage(req);
    if ("error" in requestedPackage) {
      return res.status(400).json({ error: requestedPackage.error });
    }

    const { selectedPackage, selectedAddons, eventId } = requestedPackage;
    const currency = process.env.PAYTR_PREMIUM_CURRENCY || "TRY";
    const existingPending = await tenantDb.direct.subscriptions.findMany({
      where: {
        organization_id: organizationId,
        payment_method: "bank_transfer",
        status: "pending",
      } as any,
      orderBy: { created_at: "desc" } as any,
      take: 10,
    });

    for (const subscription of existingPending) {
      const metadata = readSubscriptionMetadata(subscription.metadata);
      const bankTransferStatus = readBankTransferStatus(metadata);
      const expiresAtRaw = (
        metadata.bankTransfer as Record<string, unknown> | undefined
      )?.expiresAt;
      const expiresAt =
        typeof expiresAtRaw === "string" ? new Date(expiresAtRaw) : null;

      if (
        metadata.packageId === selectedPackage.id &&
        bankTransferStatus !== "rejected" &&
        bankTransferStatus !== "expired" &&
        (!expiresAt || expiresAt > new Date())
      ) {
        return res.json(serializeBankTransferRequest(subscription, metadata));
      }
    }

    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + config.paymentWindowHours * 60 * 60 * 1000,
    );
    const referenceCode = buildBankTransferReference();
    const metadata = buildPendingBankTransferMetadata(
      selectedPackage,
      selectedAddons,
      currency,
      userId,
      eventId,
      referenceCode,
      config,
      now,
      expiresAt,
    );

    const created = await tenantDb.direct.subscriptions.create({
      data: {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        plan: selectedPackage.plan,
        status: "pending",
        payment_method: "bank_transfer",
        updated_at: now,
        metadata,
      } as any,
    });

    return res.json(serializeBankTransferRequest(created, metadata));
  } catch (error) {
    console.error("Bank transfer create error:", error);
    return res
      .status(500)
      .json({ error: "Havale / EFT talebi oluşturulamadı" });
  }
});

router.post("/bank-transfer/notify", async (req, res) => {
  try {
    const organizationId = req.organizationId;
    if (!organizationId) {
      return res.status(401).json({ error: "Yetkisiz erişim" });
    }

    const requestId = String(req.body?.requestId ?? "").trim();
    const senderName = String(req.body?.senderName ?? "").trim();
    const senderIban = String(req.body?.senderIban ?? "").trim();
    const note = String(req.body?.note ?? "").trim();

    if (!requestId) {
      return res.status(400).json({ error: "Talep numarası gereklidir" });
    }

    const subscription = await tenantDb.direct.subscriptions.findFirst({
      where: {
        id: requestId,
        organization_id: organizationId,
        payment_method: "bank_transfer",
      } as any,
    });

    if (!subscription) {
      return res.status(404).json({ error: "Havale / EFT talebi bulunamadı" });
    }

    const metadata = readSubscriptionMetadata(subscription.metadata);
    const bankTransfer = (metadata.bankTransfer ?? {}) as Record<
      string,
      unknown
    >;
    const expiresAtRaw =
      typeof bankTransfer.expiresAt === "string"
        ? bankTransfer.expiresAt
        : null;
    if (expiresAtRaw && new Date(expiresAtRaw) < new Date()) {
      const expiredMetadata = {
        ...metadata,
        bankTransfer: {
          ...bankTransfer,
          status: "expired",
        },
      } as SubscriptionMetadata;

      await tenantDb.direct.subscriptions.update({
        where: { id: subscription.id } as any,
        data: {
          updated_at: new Date(),
          metadata: expiredMetadata as any,
        } as any,
      });

      return res
        .status(410)
        .json({ error: "Havale / EFT talebinin süresi dolmuş" });
    }

    const now = new Date();
    const nextMetadata = {
      ...metadata,
      bankTransfer: {
        ...bankTransfer,
        status: "payment_notified",
        notifiedAt: now.toISOString(),
        senderName: senderName || null,
        senderIban: senderIban || null,
        note: note || null,
      },
      gateway: {
        ...(metadata.gateway && typeof metadata.gateway === "object"
          ? metadata.gateway
          : {}),
        provider: "bank_transfer",
        status: "payment_notified",
      },
    } as SubscriptionMetadata;

    const updated = await tenantDb.direct.subscriptions.update({
      where: { id: subscription.id } as any,
      data: {
        updated_at: now,
        metadata: nextMetadata as any,
      } as any,
    });

    try {
      const [organization, user] = await Promise.all([
        tenantDb.direct.organizations.findUnique({
          where: { id: subscription.organization_id } as any,
          select: { name: true, slug: true } as any,
        }),
        typeof metadata.createdByUserId === "string"
          ? tenantDb.direct.users.findUnique({
              where: { id: metadata.createdByUserId } as any,
              select: { name: true, email: true } as any,
            })
          : Promise.resolve(null),
      ]);

      const currentBankAccount = (
        nextMetadata.bankTransfer as Record<string, unknown> | undefined
      )?.bankAccount as Record<string, unknown> | undefined;

      await sendPaymentNotificationEmail({
        subject: "Yeni havale / EFT odeme bildirimi alindi",
        intro:
          "Bir kullanici banka transferi yaptigini bildirerek kontrol bekleyen bir odeme kaydi olusturdu.",
        rows: [
          ["Organizasyon", getStringField((organization as any)?.name)],
          ["Organizasyon slug", getStringField((organization as any)?.slug)],
          ["Kullanici", getStringField((user as any)?.name)],
          ["Kullanici e-postasi", getStringField((user as any)?.email)],
          ["Paket", typeof metadata.packageName === "string" ? metadata.packageName : null],
          [
            "Tutar",
            formatCurrencyAmount(
              metadata.totalAmount ?? metadata.amount ?? null,
              typeof metadata.currency === "string" ? metadata.currency : "TRY",
            ),
          ],
          ["Referans kodu", typeof bankTransfer.referenceCode === "string" ? bankTransfer.referenceCode : null],
          [
            "Odeme yapilan banka",
            typeof currentBankAccount?.bankName === "string"
              ? currentBankAccount.bankName
              : null,
          ],
          ["Gonderen adi", senderName || null],
          ["Gonderen IBAN", senderIban || null],
          ["Not", note || null],
          ["Durum", "payment_notified"],
        ],
      });
    } catch (mailError) {
      console.warn("Bank transfer notification email failed:", mailError);
    }

    return res.json(serializeBankTransferRequest(updated, nextMetadata));
  } catch (error) {
    console.error("Bank transfer notify error:", error);
    return res.status(500).json({ error: "Odeme bildirimi kaydedilemedi" });
  }
});

function resolveRequestedPackage(req: express.Request) {
  const requestedPackageId = String(req.body?.packageId || "event-starter");
  const selectedPackage = getPaytrPackages().find(
    (item) => item.id === requestedPackageId,
  );

  if (!selectedPackage) {
    return { error: "Geçersiz paket seçimi" } as const;
  }

  const requestedAddons = Array.isArray(req.body?.addons)
    ? (req.body.addons as unknown[])
    : [];
  const selectedAddons = requestedAddons
    .map(
      (value: unknown) =>
        PAYTR_ADDONS[String(value) as keyof typeof PAYTR_ADDONS],
    )
    .filter((addon): addon is PaytrAddon => Boolean(addon));
  const eventId =
    typeof req.body?.eventId === "string" && req.body.eventId.trim().length > 0
      ? req.body.eventId.trim()
      : null;

  return { selectedPackage, selectedAddons, eventId } as const;
}

router.post("/paytr/iframe/token", async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const userId = req.userId;

    if (!organizationId || !userId) {
      return res.status(401).json({ error: "Yetkisiz erişim" });
    }

    const requestedPackage = resolveRequestedPackage(req);
    if ("error" in requestedPackage) {
      return res.status(400).json({ error: requestedPackage.error });
    }
    const { selectedPackage, selectedAddons, eventId } = requestedPackage;

    const merchantId = process.env.PAYTR_MERCHANT_ID ?? "";
    const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? "";
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? "";
    const okUrl = process.env.PAYTR_OK_URL ?? "";
    const failUrl = process.env.PAYTR_FAIL_URL ?? "";
    const getTokenUrl =
      process.env.PAYTR_GET_TOKEN_URL ||
      "https://www.paytr.com/odeme/api/get-token";
    const iframeBaseUrl =
      process.env.PAYTR_IFRAME_BASE_URL ||
      "https://www.paytr.com/odeme/guvenli/";

    if (!merchantId || !merchantKey || !merchantSalt || !okUrl || !failUrl) {
      return res.status(500).json({ error: "PayTR yapılandırması eksik" });
    }

    const user = (await tenantDb.direct.users.findUnique({
      where: { id: userId } as any,
      select: { email: true, name: true, phone: true } as any,
    })) as any;

    if (!user?.email || typeof user.email !== "string") {
      return res.status(400).json({ error: "Kullanıcı e-posta bilgisi eksik" });
    }

    const merchantOid = buildMerchantOid(organizationId);
    const userIp = getClientIp(req);
    const email = String(user.email);
    const totalAmount = selectedAddons.reduce(
      (sum: number, addon: PaytrAddon) => sum + addon.amount,
      selectedPackage.amount,
    );
    const paymentAmount = totalAmount.toString();
    const currency = process.env.PAYTR_PREMIUM_CURRENCY || "TRY";
    const testMode = process.env.PAYTR_TEST_MODE || "1";
    const debugOn = process.env.PAYTR_DEBUG_ON || "0";
    const lang = process.env.PAYTR_LANG || "tr";
    const timeoutLimit = process.env.PAYTR_TIMEOUT_LIMIT || "30";
    const userName = user.name || "SoruYorum Kullanıcısı";
    const userAddress = process.env.PAYTR_DEFAULT_ADDRESS || "Türkiye";
    const userPhone = user.phone || "05000000000";

    const basket = JSON.stringify([
      [selectedPackage.name, selectedPackage.amount.toString(), 1],
      ...selectedAddons.map((addon: PaytrAddon) => [
        addon.name,
        addon.amount.toString(),
        1,
      ]),
    ]);
    const userBasket = Buffer.from(basket).toString("base64");

    const hashInput =
      `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${userBasket}` +
      `${"0"}${"0"}${currency}${testMode}`;
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
      no_installment: "0",
      max_installment: "0",
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
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    const { rawBody, data: paytrData } = await readPaytrResponse(paytrResp);

    if (!paytrResp.ok || paytrData?.status !== "success" || !paytrData?.token) {
      console.error("PAYTR token request failed", {
        status: paytrResp.status,
        body: rawBody.slice(0, 1000),
      });

      return res.status(502).json({
        error: "PayTR token alınamadı",
        reason:
          paytrData?.reason ||
          (rawBody.trim() ? rawBody.slice(0, 200) : "empty_response"),
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
      "card",
    );

    await tenantDb.direct.subscriptions.create({
      data: {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        plan: selectedPackage.plan,
        status: "pending",
        payment_method: "paytr",
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
    console.error("PAYTR token creation error:", error);
    return res.status(500).json({ error: "Ödeme başlatılamadı" });
  }
});

router.post("/paytr/eft/token", async (req, res) => {
  try {
    const organizationId = req.organizationId;
    const userId = req.userId;

    if (!organizationId || !userId) {
      return res.status(401).json({ error: "Yetkisiz erişim" });
    }

    const requestedPackage = resolveRequestedPackage(req);
    if ("error" in requestedPackage) {
      return res.status(400).json({ error: requestedPackage.error });
    }
    const { selectedPackage, selectedAddons, eventId } = requestedPackage;

    if ((process.env.PAYTR_EFT_ENABLED ?? "1") === "0") {
      return res.status(400).json({ error: "PayTR EFT odemesi su anda aktif degil" });
    }

    const merchantId = process.env.PAYTR_MERCHANT_ID ?? "";
    const merchantKey = process.env.PAYTR_MERCHANT_KEY ?? "";
    const merchantSalt = process.env.PAYTR_MERCHANT_SALT ?? "";
    const getTokenUrl =
      process.env.PAYTR_GET_TOKEN_URL ||
      "https://www.paytr.com/odeme/api/get-token";
    const eftIframeBaseUrl =
      process.env.PAYTR_EFT_IFRAME_BASE_URL ||
      "https://www.paytr.com/odeme/api/";

    if (!merchantId || !merchantKey || !merchantSalt) {
      return res.status(500).json({ error: "PayTR yapılandırması eksik" });
    }

    const user = (await tenantDb.direct.users.findUnique({
      where: { id: userId } as any,
      select: { email: true, name: true } as any,
    })) as any;

    if (!user?.email || typeof user.email !== "string") {
      return res.status(400).json({ error: "Kullanıcı e-posta bilgisi eksik" });
    }

    const merchantOid = buildMerchantOid(organizationId);
    const userIp = getClientIp(req);
    const email = String(user.email);
    const totalAmount = selectedAddons.reduce(
      (sum: number, addon: PaytrAddon) => sum + addon.amount,
      selectedPackage.amount,
    );
    const paymentAmount = totalAmount.toString();
    const testMode = process.env.PAYTR_TEST_MODE || "1";
    const debugOn = process.env.PAYTR_DEBUG_ON || "0";
    const timeoutLimit = process.env.PAYTR_TIMEOUT_LIMIT || "30";
    const paymentType = "eft";

    const paytrToken = paytrHash(
      `${merchantId}${userIp}${merchantOid}${email}${paymentAmount}${paymentType}${testMode}${merchantSalt}`,
      merchantKey,
    );

    const payload = new URLSearchParams({
      merchant_id: merchantId,
      user_ip: userIp,
      merchant_oid: merchantOid,
      email,
      payment_amount: paymentAmount,
      payment_type: paymentType,
      paytr_token: paytrToken,
      debug_on: debugOn,
      timeout_limit: timeoutLimit,
      test_mode: testMode,
    });

    const paytrResp = await fetch(getTokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload.toString(),
    });

    const { rawBody, data: paytrData } = await readPaytrResponse(paytrResp);

    if (paytrData?.status !== "success" || !paytrData?.token) {
      const reason =
        paytrData?.reason ||
        (rawBody.trim() ? rawBody.slice(0, 200) : "empty_response");
      const normalizedReason = String(reason).toLowerCase();
      const userError =
        normalizedReason.includes("yetki") ||
        normalizedReason.includes("permission") ||
        normalizedReason.includes("payment_type")
          ? "PayTR EFT odemesi bu magaza hesabinda aktif olmayabilir"
          : "PayTR Havale/EFT token alinamadi";

      console.error("PAYTR EFT token request failed", {
        status: paytrResp.status,
        body: rawBody.slice(0, 1000),
      });

      return res.status(400).json({
        error: userError,
        reason,
      });
    }

    if (!paytrResp.ok) {
      return res.status(502).json({
        error: "PayTR servisine baglanilamadi",
        reason: "gateway_unreachable",
      });
    }

    const now = new Date();
    const normalizedMetadata = buildPendingMetadata(
      merchantOid,
      selectedPackage,
      selectedAddons,
      process.env.PAYTR_PREMIUM_CURRENCY || "TRY",
      userId,
      eventId,
      "eft",
    );

    await tenantDb.direct.subscriptions.create({
      data: {
        id: crypto.randomUUID(),
        organization_id: organizationId,
        plan: selectedPackage.plan,
        status: "pending",
        payment_method: "paytr_eft",
        updated_at: now,
        metadata: normalizedMetadata,
      } as any,
    });

    return res.json({
      iframeUrl: `${eftIframeBaseUrl}${paytrData.token}`,
      merchantOid,
      package: {
        id: selectedPackage.id,
        name: selectedPackage.name,
        amount: totalAmount,
        currency: process.env.PAYTR_PREMIUM_CURRENCY || "TRY",
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
    console.error("PAYTR EFT token creation error:", error);
    return res.status(500).json({ error: "Havale / EFT başlatılamadı" });
  }
});

export default router;
