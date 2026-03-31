import crypto from "crypto";
import { resolve4, resolve6, resolveCname, resolveTxt } from "node:dns/promises";

import type { PrismaClient } from "@ks-interaktif/database";

import { getOrganizationAccess, isSuperAdmin } from "./access";

type DomainRecord = {
  id: string;
  organization_id: string;
  hostname: string;
  type: string;
  status: string;
  is_primary: boolean;
  verification_method: string | null;
  verification_token: string | null;
  verification_record_name: string | null;
  verification_record_type: string | null;
  cname_target: string | null;
  provider_ref: string | null;
  provider_status: string | null;
  provider_data: unknown;
  ssl_status: string | null;
  last_checked_at: Date | null;
  verified_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

type DomainInstructions = {
  records: Array<{
    title: string;
    type: string;
    host: string;
    value: string;
  }>;
};

const stripTrailingSlashes = (value: string) => value.replace(/\/+$/, "");

const DOMAIN_SYSTEM_BASE = (process.env.DOMAIN_SYSTEM_BASE || "soruyorum.live")
  .trim()
  .toLowerCase();
const DOMAIN_CONNECT_TARGET = (
  process.env.DOMAIN_CONNECT_TARGET || `connect.${DOMAIN_SYSTEM_BASE}`
)
  .trim()
  .toLowerCase();
const LEGACY_JOIN_BASE_URL = (
  process.env.LEGACY_JOIN_BASE_URL || "https://mobil.soruyorum.online"
).trim();
const SYSTEM_PORTAL_BASE_URL = (
  process.env.PORTAL_BASE_URL || "https://soruyorum.online"
).trim();
const LEGACY_JOIN_HOST = (() => {
  try {
    return new URL(LEGACY_JOIN_BASE_URL).hostname.toLowerCase();
  } catch {
    return "mobil.soruyorum.online";
  }
})();

const RESERVED_PLATFORM_HOSTS = new Set([
  "soruyorum.online",
  "www.soruyorum.online",
  "mobil.soruyorum.online",
  "ekran.soruyorum.online",
  "tablet.soruyorum.online",
  DOMAIN_SYSTEM_BASE,
  DOMAIN_CONNECT_TARGET,
]);

const RESERVED_SYSTEM_SUBDOMAIN_LABELS = new Set([
  "www",
  "admin",
  "api",
  "mail",
  "ftp",
  "host",
  "app",
  "service",
  "connect",
  "mobil",
  "mobile",
  "tablet",
  "ekran",
  "screen",
  "cdn",
  "assets",
  "media",
  "static",
  "support",
  "help",
  "status",
  "dashboard",
  "portal",
  "billing",
]);

const CLOUDFLARE_API_BASE = "https://api.cloudflare.com/client/v4";
const CLOUDFLARE_ZONE_ID = (process.env.CLOUDFLARE_SAAS_ZONE_ID || "").trim();
const CLOUDFLARE_API_TOKEN = (
  process.env.CLOUDFLARE_SAAS_API_TOKEN || ""
).trim();

function isCloudflareConfigured() {
  return Boolean(CLOUDFLARE_ZONE_ID && CLOUDFLARE_API_TOKEN);
}

function readProviderData(input: unknown): Record<string, any> {
  return input && typeof input === "object" && !Array.isArray(input)
    ? { ...(input as Record<string, any>) }
    : {};
}

function mapCloudflareStatus(
  status?: string | null,
  sslStatus?: string | null,
) {
  const normalizedStatus = String(status || "")
    .trim()
    .toLowerCase();
  const normalizedSslStatus = String(sslStatus || "")
    .trim()
    .toLowerCase();

  if (normalizedStatus === "active" && normalizedSslStatus === "active")
    return "active";
  if (normalizedStatus === "active") return "verified";
  if (
    [
      "pending",
      "pending_validation",
      "pending_deployment",
      "initializing",
    ].includes(normalizedStatus)
  )
    return "pending_dns";
  if (
    ["deleted", "moved", "blocked", "error", "validation_timed_out"].includes(
      normalizedStatus,
    )
  )
    return "failed";
  return "pending_dns";
}

function getManualVerificationRecordName(hostname: string) {
  return `_soruyorum-verify.${hostname}`;
}

function getManualInstructions(
  hostname: string,
  verificationToken: string | null,
  cnameTarget: string | null,
): DomainInstructions {
  const records: DomainInstructions["records"] = [];

  if (cnameTarget) {
    records.push({
      title: "CNAME Kaydi",
      type: "CNAME",
      host: hostname,
      value: cnameTarget,
    });
  }

  if (verificationToken) {
    records.push({
      title: "Dogrulama Kaydi",
      type: "TXT",
      host: getManualVerificationRecordName(hostname),
      value: verificationToken,
    });
  }

  return {
    records,
  };
}

function extractCloudflareInstructions(
  providerData: Record<string, any>,
  fallbackHostname: string,
  fallbackToken: string | null,
  fallbackCnameTarget: string | null,
): DomainInstructions {
  const ownershipVerification =
    providerData.ownership_verification &&
    typeof providerData.ownership_verification === "object"
      ? providerData.ownership_verification
      : null;

  const validationRecords = Array.isArray(providerData.ssl?.validation_records)
    ? providerData.ssl.validation_records
    : [];
  const records: DomainInstructions["records"] = [];
  const seen = new Set<string>();
  const pushRecord = (
    title: string,
    type: string,
    host: string | null | undefined,
    value: string | null | undefined,
  ) => {
    const normalizedHost = String(host || "").trim();
    const normalizedValue = String(value || "").trim();
    if (!normalizedHost || !normalizedValue) return;

    const key = `${type}:${normalizedHost}:${normalizedValue}`;
    if (seen.has(key)) return;
    seen.add(key);
    records.push({
      title,
      type,
      host: normalizedHost,
      value: normalizedValue,
    });
  };

  pushRecord("CNAME Kaydi", "CNAME", fallbackHostname, fallbackCnameTarget);
  pushRecord(
    "Sahiplik Dogrulama",
    "TXT",
    ownershipVerification?.name,
    ownershipVerification?.value,
  );

  for (const record of validationRecords) {
    if (!record || typeof record !== "object") continue;
    pushRecord("SSL Dogrulama", "TXT", record.txt_name, record.txt_value);
  }

  if (records.length === 0 && fallbackToken) {
    pushRecord(
      "Dogrulama Kaydi",
      "TXT",
      getManualVerificationRecordName(fallbackHostname),
      fallbackToken,
    );
  }

  return { records };
}

function getPrimaryVerificationRecord(instructions: DomainInstructions) {
  return instructions.records.find((record) => record.type === "TXT") || null;
}

async function callCloudflareApi(path: string, init?: RequestInit) {
  const response = await fetch(`${CLOUDFLARE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok || !payload?.success) {
    const message =
      payload?.errors?.[0]?.message ||
      payload?.messages?.[0]?.message ||
      `Cloudflare request failed (${response.status})`;
    throw new Error(message);
  }

  return payload.result as Record<string, any>;
}

async function createCloudflareCustomHostname(hostname: string) {
  if (!isCloudflareConfigured()) return null;

  return callCloudflareApi(`/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`, {
    method: "POST",
    body: JSON.stringify({
      hostname,
      custom_origin_server: DOMAIN_CONNECT_TARGET,
      ssl: {
        method: "txt",
        type: "dv",
      },
    }),
  });
}

async function fetchCloudflareCustomHostname(customHostnameId: string) {
  if (!isCloudflareConfigured()) return null;
  return callCloudflareApi(
    `/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${customHostnameId}`,
  );
}

async function findCloudflareDnsRecord(hostname: string, type: string) {
  if (!isCloudflareConfigured()) return null;
  const result = await callCloudflareApi(
    `/zones/${CLOUDFLARE_ZONE_ID}/dns_records?type=${encodeURIComponent(type)}&name=${encodeURIComponent(hostname)}`,
  );

  if (!Array.isArray(result)) return null;
  return (result.find((item) => item && typeof item === "object") ||
    null) as Record<string, any> | null;
}

async function upsertCloudflareCnameRecord(hostname: string, target: string) {
  if (!isCloudflareConfigured()) return null;

  const existing = await findCloudflareDnsRecord(hostname, "CNAME");
  const payload = {
    type: "CNAME",
    name: hostname,
    content: target,
    ttl: 1,
    proxied: true,
  };

  if (existing?.id && typeof existing.id === "string") {
    return callCloudflareApi(
      `/zones/${CLOUDFLARE_ZONE_ID}/dns_records/${existing.id}`,
      {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    );
  }

  return callCloudflareApi(`/zones/${CLOUDFLARE_ZONE_ID}/dns_records`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

function sanitizeHostCandidate(value: string) {
  const trimmed = value.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] || "";
  const withoutPort = withoutPath.split(":")[0] || "";
  return withoutPort.replace(/\.+$/, "");
}

export function normalizeHostname(value: string) {
  const hostname = sanitizeHostCandidate(value);
  if (!hostname) {
    throw new Error("Domain boş olamaz");
  }

  if (!/^[a-z0-9.-]+$/.test(hostname) || hostname.includes("..")) {
    throw new Error("Geçerli bir domain / subdomain girin");
  }

  if (!hostname.includes(".")) {
    throw new Error("Geçerli bir domain / subdomain girin");
  }

  return hostname;
}

export function assertCustomHostnameAllowed(hostname: string) {
  const labels = hostname.split(".").filter(Boolean);
  if (labels.length < 3) {
    throw new Error(
      "İlk fazda yalnızca subdomain destekleniyor. Örn: event.firma.com",
    );
  }

  if (
    RESERVED_PLATFORM_HOSTS.has(hostname) ||
    hostname.endsWith(`.${DOMAIN_SYSTEM_BASE}`) ||
    hostname.endsWith(".soruyorum.online")
  ) {
    throw new Error(
      "Bu domain platform tarafından kullanılıyor. Kendi subdomain adresinizi girin",
    );
  }

  if (hostname.includes("localhost")) {
    throw new Error("localhost alan adı desteklenmiyor");
  }
}

function slugifySubdomainLabel(value: string) {
  const normalized = value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || "org";
}

function normalizeSystemSubdomainLabel(value: string) {
  const normalized = slugifySubdomainLabel(value);

  if (!normalized) {
    throw new Error("Subdomain boş olamaz");
  }

  if (normalized.length < 3) {
    throw new Error("Subdomain en az 3 karakter olmalı");
  }

  if (normalized.length > 40) {
    throw new Error("Subdomain en fazla 40 karakter olabilir");
  }

  if (/^\d+$/.test(normalized)) {
    throw new Error("Subdomain yalnızca sayıdan oluşamaz");
  }

  if (RESERVED_SYSTEM_SUBDOMAIN_LABELS.has(normalized)) {
    throw new Error("Bu subdomain adı platform tarafından rezerve edilmiş");
  }

  return normalized;
}

function extractSystemSubdomainLabel(hostname: string) {
  const suffix = `.${DOMAIN_SYSTEM_BASE}`;
  if (hostname.endsWith(suffix)) {
    return hostname.slice(0, -suffix.length);
  }
  return hostname;
}

async function buildUniqueSystemHostname(
  prisma: PrismaClient,
  organization: { id: string; slug: string | null; name: string },
  preferredLabel?: string | null,
) {
  const baseLabel = preferredLabel
    ? normalizeSystemSubdomainLabel(preferredLabel)
    : slugifySubdomainLabel(
        organization.slug || organization.name || organization.id,
      );
  const maxAttempts = preferredLabel ? 1 : 25;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const label = attempt === 0 ? baseLabel : `${baseLabel}-${attempt + 1}`;
    const hostname = `${label}.${DOMAIN_SYSTEM_BASE}`;
    const existing = await prisma.organization_domains.findUnique({
      where: { hostname },
      select: { id: true, organization_id: true },
    });

    if (!existing || existing.organization_id === organization.id) {
      return hostname;
    }
  }

  if (preferredLabel) {
    throw new Error("Bu subdomain adı zaten kullanılıyor");
  }

  return `${baseLabel}-${crypto.randomBytes(3).toString("hex")}.${DOMAIN_SYSTEM_BASE}`;
}

export async function getOrganizationSystemDomain(
  prisma: PrismaClient,
  organizationId: string,
) {
  return prisma.organization_domains.findFirst({
    where: {
      organization_id: organizationId,
      type: "system_subdomain",
    },
    orderBy: [{ is_primary: "desc" }, { created_at: "asc" }],
  });
}

async function getOrganizationSystemDomainSuggestion(
  prisma: PrismaClient,
  organizationId: string,
) {
  const organization = await prisma.organizations.findUnique({
    where: { id: organizationId },
    select: { id: true, slug: true, name: true },
  });

  if (!organization) {
    throw new Error("Organizasyon bulunamadı");
  }

  const hostname = await buildUniqueSystemHostname(prisma, organization);

  return {
    label: extractSystemSubdomainLabel(hostname),
    hostname,
  };
}

export async function getSystemDomainSetupStatus(
  prisma: PrismaClient,
  organizationId: string,
) {
  const access = await getOrganizationAccess(prisma, organizationId);
  const systemDomain = await getOrganizationSystemDomain(
    prisma,
    organizationId,
  );

  if (!access.features.customDomain) {
    return {
      enabled: false,
      required: false,
      completed: false,
      hostname: systemDomain?.hostname ?? null,
      selectedLabel: systemDomain
        ? extractSystemSubdomainLabel(systemDomain.hostname)
        : null,
      suggestedLabel: null,
      suggestedHostname: null,
    };
  }

  const suggestion = systemDomain
    ? null
    : await getOrganizationSystemDomainSuggestion(prisma, organizationId);

  return {
    enabled: true,
    required: !systemDomain,
    completed: Boolean(systemDomain),
    hostname: systemDomain?.hostname ?? null,
    selectedLabel: systemDomain
      ? extractSystemSubdomainLabel(systemDomain.hostname)
      : null,
    suggestedLabel: suggestion?.label ?? null,
    suggestedHostname: suggestion?.hostname ?? null,
  };
}

export async function ensureSystemDomain(
  prisma: PrismaClient,
  organizationId: string,
  options?: { createIfMissing?: boolean; preferredLabel?: string | null },
) {
  const existing = await prisma.organization_domains.findFirst({
    where: {
      organization_id: organizationId,
      type: "system_subdomain",
    },
    orderBy: [{ is_primary: "desc" }, { created_at: "asc" }],
  });

  if (existing) {
    return existing;
  }

  if (!options?.createIfMissing) {
    return null;
  }

  const organization = await prisma.organizations.findUnique({
    where: { id: organizationId },
    select: { id: true, slug: true, name: true },
  });

  if (!organization) {
    throw new Error("Organizasyon bulunamadı");
  }

  const hasPrimary = await prisma.organization_domains.findFirst({
    where: {
      organization_id: organizationId,
      is_primary: true,
      status: { in: ["active", "verified"] },
    },
    select: { id: true },
  });

  const hostname = await buildUniqueSystemHostname(
    prisma,
    organization,
    options?.preferredLabel,
  );

  let status = "active";
  let sslStatus = "active";
  let providerStatus = "managed";
  let providerData: Record<string, any> = {
    mode: "system_subdomain",
  };

  if (isCloudflareConfigured()) {
    try {
      const dnsRecord = await upsertCloudflareCnameRecord(
        hostname,
        DOMAIN_CONNECT_TARGET,
      );
      providerData = {
        ...providerData,
        dnsRecordId:
          dnsRecord && typeof dnsRecord.id === "string" ? dnsRecord.id : null,
        dnsManaged: true,
      };
    } catch (error) {
      status = "pending_dns";
      sslStatus = "pending_dns";
      providerStatus = "dns_error";
      providerData = {
        ...providerData,
        dnsManaged: false,
        dnsError:
          error instanceof Error
            ? error.message
            : "Cloudflare DNS kaydı oluşturulamadı",
      };
    }
  }

  return prisma.organization_domains.create({
    data: {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      hostname,
      type: "system_subdomain",
      status,
      is_primary: !hasPrimary,
      verification_method: "managed",
      cname_target: DOMAIN_CONNECT_TARGET,
      provider_status: providerStatus,
      provider_data: providerData,
      ssl_status: sslStatus,
      verified_at: status === "active" ? new Date() : null,
      updated_at: new Date(),
    },
  });
}

export async function getOrganizationDomains(
  prisma: PrismaClient,
  organizationId: string,
) {
  const access = await getOrganizationAccess(prisma, organizationId);
  if (!access.features.customDomain) {
    return [];
  }

  return prisma.organization_domains.findMany({
    where: { organization_id: organizationId },
    orderBy: [{ is_primary: "desc" }, { created_at: "asc" }],
  });
}

export async function getPrimaryActiveHostname(
  prisma: PrismaClient,
  organizationId: string,
) {
  const access = await getOrganizationAccess(prisma, organizationId);
  if (!access.features.customDomain) {
    return null;
  }

  const domains = await prisma.organization_domains.findMany({
    where: {
      organization_id: organizationId,
      status: { in: ["active", "verified"] },
    },
    orderBy: [{ is_primary: "desc" }, { created_at: "asc" }],
  });

  const usableDomains = domains.filter(
    (domain) =>
      domain.type === "system_subdomain" || domain.status === "active",
  );

  const primary = usableDomains.find((domain) => domain.is_primary);
  if (primary) return primary.hostname;

  if (usableDomains[0]) {
    return usableDomains[0].hostname;
  }

  return null;
}

function getLegacyBaseUrl(
  req?: { headers?: Record<string, unknown> | null } | null,
) {
  const hostRaw = (
    req?.headers?.["x-forwarded-host"] ??
    req?.headers?.host ??
    ""
  )
    .toString()
    .toLowerCase();
  if (
    hostRaw.includes("localhost") ||
    hostRaw.includes("127.0.0.1") ||
    hostRaw.includes("192.168.")
  ) {
    const env = (process.env.FRONTEND_URL || "").trim();
    if (env) return stripTrailingSlashes(env);
    return "http://192.168.68.73:3001";
  }

  return stripTrailingSlashes(LEGACY_JOIN_BASE_URL);
}

export async function getOrganizationJoinBaseUrl(
  prisma: PrismaClient,
  organizationId: string | null | undefined,
  req?: {
    headers?: Record<string, unknown> | null;
    userRole?: string | null;
    userEmail?: string | null;
  } | null,
) {
  if (isSuperAdmin({ role: req?.userRole, email: req?.userEmail })) {
    return stripTrailingSlashes(SYSTEM_PORTAL_BASE_URL);
  }

  if (organizationId) {
    const customHost = await getPrimaryActiveHostname(prisma, organizationId);
    if (customHost) {
      return `https://${customHost}`;
    }
  }

  return getLegacyBaseUrl(req);
}

async function resolveSystemSubdomainState(domain: DomainRecord) {
  const hostname = domain.hostname.toLowerCase();
  const expectedTarget = (domain.cname_target || DOMAIN_CONNECT_TARGET)
    .replace(/\.+$/, "")
    .toLowerCase();
  const currentProviderData = readProviderData(domain.provider_data);

  if (isCloudflareConfigured()) {
    try {
      const dnsRecord = await upsertCloudflareCnameRecord(
        hostname,
        expectedTarget,
      );
      currentProviderData.dnsManaged = true;
      currentProviderData.dnsRecordId =
        dnsRecord && typeof dnsRecord.id === "string" ? dnsRecord.id : null;
      delete currentProviderData.dnsError;
    } catch (error) {
      currentProviderData.dnsManaged = false;
      currentProviderData.dnsError =
        error instanceof Error
          ? error.message
          : "Cloudflare DNS kaydı oluşturulamadı";
    }
  }

  try {
    const cnames = await resolveCname(hostname);
    const cnameMatches = cnames.some(
      (value) => value.replace(/\.+$/, "").toLowerCase() === expectedTarget,
    );

    if (cnameMatches) {
      return {
        status: "active",
        sslStatus: "active",
        providerStatus: "managed",
        providerData: {
          ...currentProviderData,
          mode: "system_subdomain",
          dns: {
            cnameVerified: true,
          },
        },
      };
    }
  } catch {
    // Proxied Cloudflare records often resolve as A/AAAA instead of CNAME.
    // For platform-managed system subdomains, successful IP resolution is enough.
    try {
      const [ipv4, ipv6] = await Promise.allSettled([
        resolve4(hostname),
        resolve6(hostname),
      ]);
      const hasIpv4 = ipv4.status === "fulfilled" && ipv4.value.length > 0;
      const hasIpv6 = ipv6.status === "fulfilled" && ipv6.value.length > 0;

      if (hasIpv4 || hasIpv6) {
        return {
          status: "active",
          sslStatus: "active",
          providerStatus: "managed",
          providerData: {
            ...currentProviderData,
            mode: "system_subdomain",
            dns: {
              cnameVerified: false,
              ipResolved: true,
            },
          },
        };
      }
    } catch {
      // no-op
    }
  }

  return {
    status: "pending_dns",
    sslStatus: "pending_dns",
    providerStatus: "awaiting_dns",
    providerData: {
      ...currentProviderData,
      mode: "system_subdomain",
      dns: {
        cnameVerified: false,
      },
    },
  };
}

async function resolveManualDomainVerification(domain: DomainRecord) {
  const hostname = domain.hostname.toLowerCase();
  const expectedTarget = (
    domain.cname_target || DOMAIN_CONNECT_TARGET
  ).toLowerCase();
  const expectedTxtName = (
    domain.verification_record_name || getManualVerificationRecordName(hostname)
  ).toLowerCase();
  const expectedTxtValue = (domain.verification_token || "").trim();

  let cnameMatches = false;
  let txtMatches = false;

  try {
    const cnames = await resolveCname(hostname);
    cnameMatches = cnames.some(
      (value) => value.replace(/\.+$/, "").toLowerCase() === expectedTarget,
    );
  } catch {
    cnameMatches = false;
  }

  try {
    const records = await resolveTxt(expectedTxtName);
    txtMatches = records
      .flat()
      .some((value) => value.trim() === expectedTxtValue);
  } catch {
    txtMatches = false;
  }

  return {
    status: cnameMatches && txtMatches ? "verified" : "pending_dns",
    sslStatus: cnameMatches && txtMatches ? "pending_provider" : "pending_dns",
    providerStatus:
      cnameMatches && txtMatches ? "dns_verified" : "awaiting_dns",
    providerData: {
      mode: "manual",
      dns: {
        cnameVerified: cnameMatches,
        txtVerified: txtMatches,
      },
    },
  };
}

export async function syncDomainState(
  prisma: PrismaClient,
  domain: DomainRecord,
) {
  let nextProviderRef = domain.provider_ref;
  let nextStatus = domain.status;
  let nextSslStatus = domain.ssl_status;
  let nextProviderStatus = domain.provider_status;
  let nextProviderData = readProviderData(domain.provider_data);
  let nextVerificationMethod = domain.verification_method;
  let nextVerificationRecordName = domain.verification_record_name;
  let nextVerificationRecordType = domain.verification_record_type;
  let nextVerificationToken = domain.verification_token;
  const now = new Date();

  if (domain.type === "system_subdomain") {
    const systemState = await resolveSystemSubdomainState(domain);
    nextStatus = systemState.status;
    nextSslStatus = systemState.sslStatus;
    nextProviderStatus = systemState.providerStatus;
    nextProviderData = {
      ...(nextProviderData || {}),
      ...systemState.providerData,
    };
  } else if (domain.provider_ref && isCloudflareConfigured()) {
    try {
      const cloudflareRecord = await fetchCloudflareCustomHostname(
        domain.provider_ref,
      );
      if (cloudflareRecord) {
        nextProviderData = cloudflareRecord;
        nextProviderStatus =
          typeof cloudflareRecord.status === "string"
            ? cloudflareRecord.status
            : nextProviderStatus;
        nextSslStatus =
          typeof cloudflareRecord.ssl?.status === "string"
            ? cloudflareRecord.ssl.status
            : nextSslStatus;
        nextStatus = mapCloudflareStatus(nextProviderStatus, nextSslStatus);

        const instructions = extractCloudflareInstructions(
          nextProviderData,
          domain.hostname,
          domain.verification_token,
          domain.cname_target,
        );

        const primaryVerificationRecord =
          getPrimaryVerificationRecord(instructions);
        nextVerificationRecordName =
          primaryVerificationRecord?.host || nextVerificationRecordName;
        nextVerificationRecordType =
          primaryVerificationRecord?.type || nextVerificationRecordType;
        nextVerificationToken =
          primaryVerificationRecord?.value || nextVerificationToken;
      }
    } catch (error) {
      nextProviderData = {
        ...nextProviderData,
        mode: "cloudflare",
        syncError:
          error instanceof Error ? error.message : "Cloudflare sync failed",
      };
    }
  } else {
    const manualState = await resolveManualDomainVerification(domain);
    nextStatus = manualState.status;
    nextSslStatus = manualState.sslStatus;
    nextProviderStatus = manualState.providerStatus;
    nextProviderData = {
      ...nextProviderData,
      ...manualState.providerData,
    };

    // DNS is verified but provider_ref is missing (e.g. previous auth error).
    // Retry creating a Cloudflare custom hostname so SSL can move to active.
    if (
      nextStatus === "verified" &&
      !nextProviderRef &&
      isCloudflareConfigured()
    ) {
      try {
        const cloudflareRecord = await createCloudflareCustomHostname(
          domain.hostname,
        );
        if (cloudflareRecord) {
          nextProviderRef =
            typeof cloudflareRecord.id === "string"
              ? cloudflareRecord.id
              : null;
          nextProviderStatus =
            typeof cloudflareRecord.status === "string"
              ? cloudflareRecord.status
              : nextProviderStatus;
          nextProviderData = cloudflareRecord;
          nextVerificationMethod = "cloudflare_txt";
          nextSslStatus =
            typeof cloudflareRecord.ssl?.status === "string"
              ? cloudflareRecord.ssl.status
              : nextSslStatus;
          nextStatus = mapCloudflareStatus(nextProviderStatus, nextSslStatus);

          const instructions = extractCloudflareInstructions(
            nextProviderData,
            domain.hostname,
            domain.verification_token,
            domain.cname_target,
          );
          const primaryVerificationRecord =
            getPrimaryVerificationRecord(instructions);
          nextVerificationRecordName =
            primaryVerificationRecord?.host || nextVerificationRecordName;
          nextVerificationRecordType =
            primaryVerificationRecord?.type || nextVerificationRecordType;
          nextVerificationToken =
            primaryVerificationRecord?.value || nextVerificationToken;
        }
      } catch (error) {
        nextProviderData = {
          ...nextProviderData,
          mode: "cloudflare",
          createError:
            error instanceof Error ? error.message : "Cloudflare create failed",
        };
      }
    }
  }

  const shouldSetVerifiedAt =
    nextStatus === "verified" || nextStatus === "active";
  const updated = await prisma.organization_domains.update({
    where: { id: domain.id },
    data: {
      status: nextStatus,
      ssl_status: nextSslStatus,
      provider_ref: nextProviderRef,
      provider_status: nextProviderStatus,
      provider_data: nextProviderData,
      verification_method: nextVerificationMethod,
      verification_record_name: nextVerificationRecordName,
      verification_record_type: nextVerificationRecordType,
      verification_token: nextVerificationToken,
      last_checked_at: now,
      verified_at: shouldSetVerifiedAt ? domain.verified_at || now : null,
      updated_at: now,
    },
  });

  return updated;
}

export async function createCustomDomain(
  prisma: PrismaClient,
  organizationId: string,
  hostnameInput: string,
) {
  const systemDomain = await getOrganizationSystemDomain(
    prisma,
    organizationId,
  );
  if (!systemDomain) {
    throw new Error("Önce sistem subdomaininizi seçin");
  }

  const hostname = normalizeHostname(hostnameInput);
  assertCustomHostnameAllowed(hostname);

  const existing = await prisma.organization_domains.findUnique({
    where: { hostname },
  });

  if (existing && existing.organization_id !== organizationId) {
    throw new Error("Bu domain başka bir organizasyon tarafından kullanılıyor");
  }

  if (existing) {
    return existing;
  }

  const hasPrimary = await prisma.organization_domains.findFirst({
    where: {
      organization_id: organizationId,
      is_primary: true,
    },
    select: { id: true },
  });

  let providerRef: string | null = null;
  let providerStatus: string | null = null;
  let providerData: Record<string, any> = {};
  let verificationMethod = "manual_dns";
  let verificationToken = crypto.randomBytes(18).toString("hex");
  let verificationRecordName = getManualVerificationRecordName(hostname);
  let verificationRecordType = "TXT";
  let status = "pending_dns";
  let sslStatus = "pending_dns";

  if (isCloudflareConfigured()) {
    try {
      const cloudflareRecord = await createCloudflareCustomHostname(hostname);
      if (cloudflareRecord) {
        providerRef =
          typeof cloudflareRecord.id === "string" ? cloudflareRecord.id : null;
        providerStatus =
          typeof cloudflareRecord.status === "string"
            ? cloudflareRecord.status
            : null;
        providerData = cloudflareRecord;
        verificationMethod = "cloudflare_txt";
        sslStatus =
          typeof cloudflareRecord.ssl?.status === "string"
            ? cloudflareRecord.ssl.status
            : "initializing";
        status = mapCloudflareStatus(providerStatus, sslStatus);

        const instructions = extractCloudflareInstructions(
          providerData,
          hostname,
          verificationToken,
          DOMAIN_CONNECT_TARGET,
        );

        const primaryVerificationRecord =
          getPrimaryVerificationRecord(instructions);
        verificationRecordName =
          primaryVerificationRecord?.host || verificationRecordName;
        verificationRecordType =
          primaryVerificationRecord?.type || verificationRecordType;
        verificationToken =
          primaryVerificationRecord?.value || verificationToken;
      }
    } catch (error) {
      providerData = {
        mode: "cloudflare",
        createError:
          error instanceof Error ? error.message : "Cloudflare create failed",
      };
    }
  }

  return prisma.organization_domains.create({
    data: {
      id: crypto.randomUUID(),
      organization_id: organizationId,
      hostname,
      type: "custom_domain",
      status,
      is_primary: !hasPrimary,
      verification_method: verificationMethod,
      verification_token: verificationToken,
      verification_record_name: verificationRecordName,
      verification_record_type: verificationRecordType,
      cname_target: DOMAIN_CONNECT_TARGET,
      provider_ref: providerRef,
      provider_status: providerStatus,
      provider_data: providerData,
      ssl_status: sslStatus,
      updated_at: new Date(),
    },
  });
}

export async function createSystemDomain(
  prisma: PrismaClient,
  organizationId: string,
  labelInput: string,
) {
  const existing = await getOrganizationSystemDomain(prisma, organizationId);
  if (existing) {
    return existing;
  }

  return ensureSystemDomain(prisma, organizationId, {
    createIfMissing: true,
    preferredLabel: labelInput,
  });
}

export async function setPrimaryDomain(
  prisma: PrismaClient,
  organizationId: string,
  domainId: string,
) {
  const domain = await prisma.organization_domains.findFirst({
    where: {
      id: domainId,
      organization_id: organizationId,
    },
  });

  if (!domain) {
    throw new Error("Domain bulunamadı");
  }

  if (domain.type !== "system_subdomain" && domain.status !== "active") {
    throw new Error(
      "Bu domain henüz aktif değil. Önce DNS ve Cloudflare doğrulamasını tamamlayın",
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.organization_domains.updateMany({
      where: {
        organization_id: organizationId,
        is_primary: true,
      },
      data: {
        is_primary: false,
        updated_at: new Date(),
      },
    });

    await tx.organization_domains.update({
      where: { id: domainId },
      data: {
        is_primary: true,
        updated_at: new Date(),
      },
    });
  });
}

export async function removeDomain(
  prisma: PrismaClient,
  organizationId: string,
  domainId: string,
) {
  const domain = await prisma.organization_domains.findFirst({
    where: {
      id: domainId,
      organization_id: organizationId,
    },
  });

  if (!domain) {
    throw new Error("Domain bulunamadı");
  }

  if (domain.type === "system_subdomain") {
    throw new Error("Sistem subdomain silinemez");
  }

  await prisma.organization_domains.delete({
    where: { id: domainId },
  });

  if (!domain.is_primary) {
    return;
  }

  const fallback = await prisma.organization_domains.findFirst({
    where: {
      organization_id: organizationId,
      id: { not: domainId },
      OR: [{ type: "system_subdomain" }, { status: "active" }],
    },
    orderBy: [{ type: "desc" }, { created_at: "asc" }],
  });

  if (fallback) {
    await prisma.organization_domains.update({
      where: { id: fallback.id },
      data: {
        is_primary: true,
        updated_at: new Date(),
      },
    });
  }
}

export function formatDomainRecord(domain: DomainRecord) {
  const providerData = readProviderData(domain.provider_data);
  const instructions =
    domain.provider_ref && isCloudflareConfigured()
      ? extractCloudflareInstructions(
          providerData,
          domain.hostname,
          domain.verification_token,
          domain.cname_target,
        )
      : getManualInstructions(
          domain.hostname,
          domain.verification_token,
          domain.cname_target,
        );

  return {
    id: domain.id,
    hostname: domain.hostname,
    type: domain.type,
    status: domain.status,
    isPrimary: domain.is_primary,
    verificationMethod: domain.verification_method,
    sslStatus: domain.ssl_status,
    providerStatus: domain.provider_status,
    lastCheckedAt: domain.last_checked_at,
    verifiedAt: domain.verified_at,
    canBePrimary:
      domain.type === "system_subdomain" || domain.status === "active",
    instructions,
    providerMode:
      domain.provider_ref && isCloudflareConfigured() ? "cloudflare" : "manual",
  };
}

export function getLegacyJoinHost() {
  return LEGACY_JOIN_HOST;
}

export function getDomainSystemBase() {
  return DOMAIN_SYSTEM_BASE;
}

export function getDomainConnectTarget() {
  return DOMAIN_CONNECT_TARGET;
}
