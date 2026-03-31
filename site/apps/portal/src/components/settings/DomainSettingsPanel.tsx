"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Copy,
  Globe,
  Loader2,
  Plus,
  RefreshCw,
  ShieldAlert,
  Star,
  Trash2,
} from "lucide-react";

import { trpc } from "@/utils/trpc";

type StatusState = {
  type: "success" | "error";
  message: string;
} | null;

type DomainSetupChoice = "system" | "custom";

const STATUS_LABELS: Record<string, string> = {
  active: "Aktif",
  verified: "Doğrulandı",
  pending_dns: "DNS bekleniyor",
  failed: "Hata",
  disabled: "Pasif",
};

const STATUS_STYLES: Record<string, string> = {
  active:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200",
  verified: "bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200",
  pending_dns:
    "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200",
  failed: "bg-rose-100 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200",
  disabled: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
};

function copyText(value: string) {
  return navigator.clipboard.writeText(value);
}

function normalizeSubdomainLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 30);
}

export function DomainSettingsPanel() {
  const utils = trpc.useUtils();
  const meQuery = trpc.users.me.useQuery(undefined, { retry: false });
  const domainsQuery = trpc.users.getDomains.useQuery(undefined, {
    retry: false,
  });
  const configureSystemSubdomain =
    trpc.users.configureSystemSubdomain.useMutation({
      onSuccess: async () => {
        await Promise.all([
          utils.users.getDomains.invalidate(),
          utils.users.me.invalidate(),
        ]);
      },
    });

  const addDomain = trpc.users.addDomain.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.users.getDomains.invalidate(),
        utils.users.me.invalidate(),
      ]);
    },
  });
  const verifyDomain = trpc.users.verifyDomain.useMutation({
    onSuccess: async () => {
      await utils.users.getDomains.invalidate();
    },
  });
  const setPrimaryDomain = trpc.users.setPrimaryDomain.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.users.getDomains.invalidate(),
        utils.users.me.invalidate(),
      ]);
    },
  });
  const deleteDomain = trpc.users.deleteDomain.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.users.getDomains.invalidate(),
        utils.users.me.invalidate(),
      ]);
    },
  });
  const setDomainSetupChoiceMutation =
    trpc.users.setDomainSetupChoice.useMutation({
      onSuccess: async () => {
        await utils.users.getDomains.invalidate();
      },
    });

  const [hostname, setHostname] = useState("");
  const [systemLabel, setSystemLabel] = useState("");
  const [status, setStatus] = useState<StatusState>(null);
  const [setupChoice, setSetupChoice] =
    useState<DomainSetupChoice>("system");

  const access = meQuery.data?.accessSummary;
  const customDomainEnabled = Boolean(access?.features?.customDomain);
  const data = domainsQuery.data;
  const domains = data?.domains ?? [];
  const systemSetup = data?.systemSetup as any;

  const customDomains = useMemo(() => {
    return domains.filter((item: any) => item.type !== "system_subdomain");
  }, [domains]);

  const hasPendingCustomDomain = customDomains.some((domain: any) => {
    const status = String(domain.status || "").toLowerCase();
    const sslStatus = String(domain.sslStatus || "").toLowerCase();
    return status !== "active" || sslStatus !== "active";
  });

  useEffect(() => {
    if (!customDomainEnabled) return;
    if (!hasPendingCustomDomain) return;

    const timer = window.setInterval(() => {
      void domainsQuery.refetch();
    }, 10000);

    return () => window.clearInterval(timer);
  }, [customDomainEnabled, hasPendingCustomDomain, domainsQuery]);

  useEffect(() => {
    const savedChoice = data?.preferredSetupChoice;
    if (savedChoice === "custom" || savedChoice === "system") {
      setSetupChoice(savedChoice);
    }
  }, [data?.preferredSetupChoice]);

  useEffect(() => {
    if (!systemLabel && systemSetup?.suggestedLabel) {
      setSystemLabel(normalizeSubdomainLabel(systemSetup.suggestedLabel));
    }
  }, [systemLabel, systemSetup?.suggestedLabel]);

  const systemDomain = useMemo(() => {
    return (
      domains.find((item: any) => item.type === "system_subdomain") ?? null
    );
  }, [domains]);

  const primaryDomain = useMemo(() => {
    return domains.find((item: any) => item.isPrimary) ?? null;
  }, [domains]);

  const baseDomain = data?.systemBaseDomain || "soruyorum.live";
  const suggestionLabels = useMemo(() => {
    const rawList = [
      systemSetup?.suggestedLabel,
      meQuery.data?.organizations?.slug,
      "aura",
      "etkinlik",
      "canli",
    ];

    const unique = new Set<string>();
    for (const raw of rawList) {
      const normalized = normalizeSubdomainLabel(String(raw || ""));
      if (normalized.length >= 3) unique.add(normalized);
    }

    return Array.from(unique).slice(0, 5);
  }, [meQuery.data?.organizations?.slug, systemSetup?.suggestedLabel]);

  const handleConfigureSystemSubdomain = async () => {
    setStatus(null);
    const value = systemLabel.trim();
    if (!value) {
      setStatus({
        type: "error",
        message: "Önce istediğiniz subdomain adını girin",
      });
      return;
    }

    try {
      const result = await configureSystemSubdomain.mutateAsync({
        label: value,
      });
      const domain = (result as any)?.domain;
      setStatus({
        type: "success",
        message: domain?.hostname
          ? `${domain.hostname} hazır. Şimdi isterseniz kendi domaininizi bağlayabilirsiniz.`
          : "Sistem subdomaini hazırlandı.",
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Sistem subdomaini oluşturulamadı",
      });
    }
  };

  const handleAddDomain = async () => {
    setStatus(null);
    const value = hostname.trim();
    if (!value) {
      setStatus({ type: "error", message: "Önce bir subdomain girin" });
      return;
    }

    try {
      await addDomain.mutateAsync({ hostname: value });
      setHostname("");
      setStatus({
        type: "success",
        message: "Domain eklendi. DNS kayıtlarını tamamlayıp doğrulayın.",
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Domain eklenemedi",
      });
    }
  };

  const handleVerify = async (domainId: string) => {
    setStatus(null);
    try {
      const result = await verifyDomain.mutateAsync({ domainId });
      const domain = (result as any)?.domain;
      if (domain?.status === "active") {
        setStatus({
          type: "success",
          message: `${domain.hostname} aktif hale geldi.`,
        });
        return;
      }
      if (domain?.status === "verified") {
        setStatus({
          type: "success",
          message: `${domain.hostname} DNS olarak doğrulandı. SSL / custom hostname aktivasyonu bekleniyor.`,
        });
        return;
      }
      setStatus({
        type: "error",
        message: `${domain?.hostname || "Domain"} için DNS kayıtları henüz tamamlanmamış görünüyor.`,
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Domain doğrulanamadı",
      });
    }
  };

  const handleSetPrimary = async (domainId: string) => {
    setStatus(null);
    try {
      await setPrimaryDomain.mutateAsync({ domainId });
      setStatus({ type: "success", message: "Birincil domain güncellendi" });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Birincil domain güncellenemedi",
      });
    }
  };

  const handleDelete = async (domainId: string) => {
    setStatus(null);
    try {
      await deleteDomain.mutateAsync({ domainId });
      setStatus({ type: "success", message: "Domain silindi" });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error?.message || "Domain silinemedi",
      });
    }
  };

  const handleSetupChoiceChange = async (choice: DomainSetupChoice) => {
    setSetupChoice(choice);
    try {
      await setDomainSetupChoiceMutation.mutateAsync({ choice });
    } catch {
      // Keep local selection; user can continue even if persistence temporarily fails.
    }
  };

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Domainler
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            White-label paketlerde sistem subdomaininizi ve özel domain
            bağlantılarınızı buradan yönetebilirsiniz.
          </p>
        </div>

        {primaryDomain && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-right dark:border-emerald-500/20 dark:bg-emerald-500/10">
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-200">
              Birincil Domain
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-900 dark:text-white">
              {primaryDomain.hostname}
            </div>
          </div>
        )}
      </div>

      {!customDomainEnabled ? (
        <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/70 p-6 dark:border-amber-500/30 dark:bg-amber-500/10">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 h-5 w-5 text-amber-600 dark:text-amber-300" />
            <div className="space-y-2">
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                Özel subdomain / domain bu pakette açık değil
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-100/80">
                Bu alan yalnızca `Starter WL`, `Standard WL`, `Professional WL`,
                `Corporate WL` ve `Corporate Pro WL` paketlerinde açılır.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {status && (
            <div
              className={
                status.type === "success"
                  ? "text-sm text-emerald-600"
                  : "text-sm text-rose-600"
              }
            >
              {status.message}
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900/40">
            <div className="text-sm font-semibold text-gray-900 dark:text-white">
              Domain tercihiniz
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              En kolay yol: SoruYorum adresini seç ve hemen başla.
              İstersen kendi domainini de birkaç adımda bağlayabilirsin.
            </p>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => void handleSetupChoiceChange("system")}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  setupChoice === "system"
                    ? "border-red-400 bg-red-50 text-red-900 dark:border-red-400/60 dark:bg-red-500/10 dark:text-red-100"
                    : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                <div className="text-sm font-semibold">{`SoruYorum subdomaini (${baseDomain})`}</div>
                <div className="mt-1 text-xs opacity-80">
                  En hızlı seçenek. Teknik ayar yok.
                </div>
              </button>

              <button
                type="button"
                onClick={() => void handleSetupChoiceChange("custom")}
                className={`rounded-xl border px-4 py-3 text-left transition ${
                  setupChoice === "custom"
                    ? "border-red-400 bg-red-50 text-red-900 dark:border-red-400/60 dark:bg-red-500/10 dark:text-red-100"
                    : "border-gray-300 bg-white text-gray-800 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
                }`}
              >
                <div className="text-sm font-semibold">Kendi domaininiz</div>
                <div className="mt-1 text-xs opacity-80">
                  Marka adresinizi kullanın. Örnek: event.firma.com
                </div>
              </button>
            </div>
          </div>

          {domainsQuery.isLoading ? (
            <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/40 dark:text-gray-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Domain bilgileri yükleniyor…
            </div>
          ) : (
            <>
              {setupChoice === "system" && !systemDomain && (
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-900/40">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                      <div className="text-sm font-semibold text-gray-900 dark:text-white">
                        1. Sistem subdomaininizi seçin
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        WL paketiniz aktif. Önce müşterilerinizin göreceği ana
                        sistem adresinizi seçin, sonra kendi domaininizi
                        bağlayın.
                      </p>
                    </div>

                    <div className="flex w-full max-w-2xl flex-col gap-3">
                      <div className="flex w-full flex-col gap-3 sm:flex-row">
                        <input
                          type="text"
                          value={systemLabel}
                          onChange={(event) =>
                            setSystemLabel(
                              normalizeSubdomainLabel(event.target.value),
                            )
                          }
                          placeholder={
                            systemSetup?.suggestedLabel || "aurainteraktif"
                          }
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/15 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <div className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200">
                          .{data?.systemBaseDomain || "soruyorum.live"}
                        </div>
                      </div>

                      {suggestionLabels.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            Hızlı seçim:
                          </div>
                          {suggestionLabels.map((label) => (
                            <button
                              key={label}
                              type="button"
                              onClick={() => setSystemLabel(label)}
                              className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 transition hover:border-red-400 hover:text-red-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Bu alanı istediğiniz gibi değiştirebilirsiniz. On izleme:{" "}
                          <span className="font-semibold text-gray-900 dark:text-white">{`${systemLabel.trim() || systemSetup?.suggestedLabel || "ornek"}.${data?.systemBaseDomain || "soruyorum.live"}`}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleConfigureSystemSubdomain}
                          disabled={configureSystemSubdomain.isLoading}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          {configureSystemSubdomain.isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          Sistem Subdomaini Oluştur
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {setupChoice === "custom" && !systemDomain && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50/70 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
                  <div className="font-semibold">Kendi domaininizi bağlamak için önce sistem subdomaini gerekir</div>
                  <div className="mt-2">
                    Güvenli kurulum sırası: önce sistem subdomaininizi oluşturun,
                    ardından custom domain bağlantısına geçin.
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSetupChoiceChange("system")}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 dark:bg-white dark:text-gray-900"
                  >
                    Sistem Subdomaini Adımına Geç
                  </button>
                </div>
              )}

              {systemDomain && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-5 text-sm text-emerald-900 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-100">
                  <div className="font-semibold">
                    Sistem subdomaininiz hazır
                  </div>
                  <div className="mt-2">
                    Ana sistem adresiniz{" "}
                    <span className="font-semibold">
                      {systemDomain.hostname}
                    </span>
                    . Şimdi isterseniz müşterinizin kendi domainini de buraya
                    bağlayabilirsiniz.
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-5 text-sm text-blue-900 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
                <div className="font-semibold">Kurulum Adımları (Çok Basit)</div>
                <div className="mt-3 space-y-2">
                  <div>
                    <span className="font-semibold">1) SoruYorum subdomaini:</span>{" "}
                    "SoruYorum subdomaini" seçin, adresiniz hemen hazır olsun,
                    direkt kullanın.
                  </div>
                  <div>
                    <span className="font-semibold">2) Kendi domaininiz:</span>{" "}
                    Domain yazıp "Domain Ekle" deyin. Ekranda çıkan kayıtları
                    domain aldığınız yere ekleyin. Sonra geri dönün, biz kontrol
                    edip otomatik açalım.
                  </div>
                  {setupChoice === "custom" ? (
                    <div className="text-xs opacity-80">
                      SSL hazırlığı Cloudflare tarafında tamamlanana kadar kısa
                      bir bekleme olabilir. Genelde 1-10 dakika, yoğunlukta 30
                      dakikaya kadar sürebilir.
                    </div>
                  ) : null}
                  {setupChoice === "custom" ? (
                    <div className="text-xs opacity-80">
                      Not: Özel domain için CNAME hedefi{" "}
                      <span className="font-semibold">
                        {data?.connectTarget || "connect.soruyorum.live"}
                      </span>{" "}
                      olmalı. TXT kaydını da eklemeyi unutmayın.
                    </div>
                  ) : null}
                </div>
              </div>

              <div
                className={`rounded-2xl border p-5 ${systemDomain ? "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/40" : "border-dashed border-amber-300 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10"}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div className="space-y-2">
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      2. Kendi domaininizi bağlayın
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Domaininizi yazın, "Domain Ekle" deyin, çıkan kayıtları
                      domain sağlayıcınıza ekleyin. Örnek: event.firma.com
                    </p>
                  </div>

                  <div className="flex w-full max-w-xl flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={hostname}
                      onChange={(event) => setHostname(event.target.value)}
                      placeholder="event.firma.com"
                      disabled={!systemDomain}
                      className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-500/15 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-900"
                    />
                    <button
                      type="button"
                      onClick={handleAddDomain}
                      disabled={addDomain.isLoading || !systemDomain}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {addDomain.isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Domain Ekle
                    </button>
                  </div>
                </div>

                {!systemDomain && (
                  <div className="mt-4 text-sm text-amber-800 dark:text-amber-100/80">
                    Bu adım, sistem subdomaininiz oluşturulduktan sonra açılır.
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {customDomains.map((domain: any) => {
                  const statusLabel =
                    STATUS_LABELS[domain.status] || domain.status;
                  const statusStyle =
                    STATUS_STYLES[domain.status] || STATUS_STYLES.pending_dns;
                  const records = Array.isArray(domain.instructions?.records)
                    ? domain.instructions.records
                    : [];
                  const isBusy =
                    verifyDomain.isLoading ||
                    setPrimaryDomain.isLoading ||
                    deleteDomain.isLoading;
                  const canSetPrimary =
                    !isBusy && domain.canBePrimary && !domain.isPrimary;
                  const isSslProvisioning =
                    domain.status === "verified" && domain.sslStatus !== "active";

                  return (
                    <div
                      key={domain.id}
                      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-colors dark:border-gray-700 dark:bg-gray-900/40"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="text-base font-semibold text-gray-900 dark:text-white">
                              {domain.hostname}
                            </div>
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}
                            >
                              {statusLabel}
                            </span>
                            {isSslProvisioning && (
                              <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
                                Doğrulandı, SSL hazırlanıyor
                              </span>
                            )}
                            {domain.isPrimary && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white dark:bg-white dark:text-gray-900">
                                <Star className="h-3.5 w-3.5" />
                                Primary
                              </span>
                            )}
                          </div>

                          <div className="grid gap-3 md:grid-cols-2">
                            <InfoCard
                              label="SSL Durumu"
                              value={domain.sslStatus || "-"}
                            />
                            <InfoCard
                              label="Doğrulama"
                              value={domain.verificationMethod || "-"}
                            />
                          </div>

                          {records.map((record: any, index: number) => (
                            <DnsCard
                              key={`${domain.id}-${record.type}-${record.host}-${index}`}
                              title={record.title || "DNS Kaydi"}
                              type={record.type}
                              host={record.host}
                              value={record.value}
                              domainHostname={domain.hostname}
                            />
                          ))}

                          {domain.status === "verified" && (
                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-100">
                              DNS kaydı görüldü. Custom hostname / SSL
                              aktivasyonu tamamlandığında bu domain `active`
                              statüsüne geçecek. Bu adım genelde birkaç dakika
                              sürer; bazı durumlarda 30 dakikaya kadar
                              uzayabilir.
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 lg:min-w-[180px]">
                          <button
                            type="button"
                            onClick={() => handleVerify(domain.id)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-600 dark:text-gray-100 dark:hover:bg-gray-800"
                          >
                            {verifyDomain.isLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            Doğrula
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSetPrimary(domain.id)}
                            disabled={!canSetPrimary}
                            className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                              canSetPrimary
                                ? "bg-gray-900 text-white hover:opacity-90 dark:bg-white dark:text-gray-900"
                                : "cursor-not-allowed bg-gray-300 text-gray-700 dark:bg-gray-700 dark:text-gray-100"
                            }`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Primary Yap
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(domain.id)}
                            disabled={isBusy}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-300 px-4 py-2.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-rose-400/40 dark:text-rose-200 dark:hover:bg-rose-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                            Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {systemDomain && customDomains.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-300 px-4 py-5 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                  Henüz özel domain bağlı değil. Yukarıdan `event.firma.com`
                  gibi bir subdomain ekleyerek başlayabilirsiniz.
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800/80">
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

function DnsCard({
  title,
  type,
  host,
  value,
  domainHostname,
}: {
  title: string;
  type: string;
  host: string;
  value: string;
  domainHostname?: string;
}) {
  const compactHost = compactDnsHost(host, domainHostname);

  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900/60">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
          <Globe className="h-4 w-4 text-red-500" />
          {title}
        </div>
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-700 dark:bg-gray-800 dark:text-gray-200">
          {type}
        </span>
      </div>

      <div className="space-y-3 text-sm">
        <DnsRow label="Host" value={compactHost} />
        <DnsRow label="Değer" value={value} />
      </div>
    </div>
  );
}

function compactDnsHost(host: string, domainHostname?: string) {
  const rawHost = String(host || "").trim().replace(/\.+$/, "");
  const rawDomain = String(domainHostname || "").trim().replace(/\.+$/, "");
  if (!rawHost || !rawDomain) return rawHost;

  const domainParts = rawDomain.split(".").filter(Boolean);
  if (domainParts.length < 2) return rawHost;

  const zoneApex = domainParts.slice(1).join(".");
  if (!zoneApex) return rawHost;

  const hostLower = rawHost.toLowerCase();
  const apexLower = zoneApex.toLowerCase();
  const suffix = `.${apexLower}`;

  if (hostLower === apexLower) return "@";
  if (hostLower.endsWith(suffix)) {
    const cut = rawHost.length - suffix.length;
    const shortened = rawHost.slice(0, cut).trim();
    return shortened || "@";
  }

  return rawHost;
}

function DnsRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 px-3 py-3 dark:bg-gray-800/80">
      <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className="flex items-start justify-between gap-3">
        <code className="block break-all text-xs text-gray-900 dark:text-white">
          {value}
        </code>
        <button
          type="button"
          onClick={() => void copyText(value)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 transition hover:bg-white hover:text-gray-900 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
          title="Kopyala"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
