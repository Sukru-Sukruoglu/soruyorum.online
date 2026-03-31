"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { isSuperAdminRole } from "../../../../../utils/auth";
import { fetchPortalAuthSession } from "../../../../../utils/authSession";

type PricingCard = {
  title: string;
  price: string;
  support: string;
  features: string[];
  mutedFeatures: string[];
  cta: string;
  packageId?: string;
  active?: boolean;
  hidden?: boolean;
};

type PricingSection = {
  id: string;
  label: string;
  description?: string;
  cards: PricingCard[];
};

type PricingData = {
  sections: PricingSection[];
};

const emptyCard: PricingCard = {
  title: "",
  price: "",
  support: "",
  features: [],
  mutedFeatures: [],
  cta: "",
  packageId: "",
  active: false,
};

export default function PricingSettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<PricingData | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    void fetchPortalAuthSession()
      .then((session) => {
        if (!session.authenticated) {
          router.replace("/login");
          return;
        }
        if (!isSuperAdminRole(session.role)) {
          router.replace("/dashboard");
        }
      })
      .catch(() => {
        router.replace("/login");
      });
  }, [router]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/trpc/settings.getPricing?input=%7B%7D&batch=1");
      const json = await res.json();
      const result = json?.[0]?.result?.data;
      if (result && typeof result === "object" && Array.isArray(result.sections)) {
        setData(result as PricingData);
      } else {
        setData(null);
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/trpc/settings.updatePricing?batch=1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ "0": data }),
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.[0]?.result?.data?.success) {
        setMessage({ type: "success", text: "Fiyatlandırma başarıyla kaydedildi." });
      } else {
        setMessage({ type: "error", text: json?.[0]?.error?.message || "Kaydetme başarısız." });
      }
    } catch {
      setMessage({ type: "error", text: "Bir hata oluştu." });
    } finally {
      setSaving(false);
    }
  };

  /* ── Section operations ── */
  const addSection = () => {
    if (!data) return;
    const id = `section_${Date.now()}`;
    setData((prev) => {
      if (!prev) return prev;
      return {
        sections: [
          ...prev.sections,
          { id, label: "Yeni Bölüm", description: "", cards: [] },
        ],
      };
    });
  };

  const removeSection = (idx: number) => {
    if (!data) return;
    if (!confirm(`"${data.sections[idx].label}" bölümü ve içindeki tüm kartlar silinecek. Emin misiniz?`)) return;
    setData((prev) => {
      if (!prev) return prev;
      return { sections: prev.sections.filter((_, i) => i !== idx) };
    });
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    if (!data) return;
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= data.sections.length) return;
    setData((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      [sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]];
      return { sections };
    });
  };

  const updateSection = (idx: number, field: string, value: any) => {
    setData((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      sections[idx] = { ...sections[idx], [field]: value };
      return { sections };
    });
  };

  /* ── Card operations ── */
  const addCard = (sIdx: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      sections[sIdx] = { ...sections[sIdx], cards: [...sections[sIdx].cards, { ...emptyCard }] };
      return { sections };
    });
  };

  const removeCard = (sIdx: number, cIdx: number) => {
    setData((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      sections[sIdx] = { ...sections[sIdx], cards: sections[sIdx].cards.filter((_, i) => i !== cIdx) };
      return { sections };
    });
  };

  const updateCard = (sIdx: number, cIdx: number, field: string, value: any) => {
    setData((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const cards = [...sections[sIdx].cards];
      cards[cIdx] = { ...cards[cIdx], [field]: value };
      sections[sIdx] = { ...sections[sIdx], cards };
      return { sections };
    });
  };

  const moveCard = (sIdx: number, cIdx: number, dir: -1 | 1) => {
    if (!data) return;
    const newIdx = cIdx + dir;
    if (newIdx < 0 || newIdx >= data.sections[sIdx].cards.length) return;
    setData((prev) => {
      if (!prev) return prev;
      const sections = [...prev.sections];
      const cards = [...sections[sIdx].cards];
      [cards[cIdx], cards[newIdx]] = [cards[newIdx], cards[cIdx]];
      sections[sIdx] = { ...sections[sIdx], cards };
      return { sections };
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Fiyatlandırma Yönetimi</h1>
        <div className="flex items-center gap-3">
          {data === null && (
            <button
              onClick={() => setData({ sections: [] })}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition"
            >
              Sıfırdan Oluştur
            </button>
          )}
          {data && (
            <>
              <button
                onClick={addSection}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition"
              >
                + Bölüm Ekle
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition"
              >
                {saving ? "Kaydediliyor..." : "Kaydet"}
              </button>
            </>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg text-sm font-medium ${
            message.type === "success"
              ? "bg-green-900/50 text-green-300 border border-green-700"
              : "bg-red-900/50 text-red-300 border border-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      {data === null ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">Henüz veritabanında fiyatlandırma verisi yok.</p>
          <p className="text-sm">&quot;Sıfırdan Oluştur&quot; ile boş başlayabilirsiniz.</p>
        </div>
      ) : data.sections.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg mb-2">Henüz bölüm eklenmedi.</p>
          <p className="text-sm">&quot;+ Bölüm Ekle&quot; ile yeni bir fiyatlandırma bölümü oluşturun.</p>
        </div>
      ) : (
        <div className="space-y-10">
          {data.sections.map((section, sIdx) => (
            <div key={section.id} className="border border-slate-700 rounded-2xl p-5 bg-slate-900/40">
              {/* Section header */}
              <div className="flex items-center gap-3 mb-1">
                <div className="flex gap-1 mr-1">
                  <button
                    onClick={() => moveSection(sIdx, -1)}
                    disabled={sIdx === 0}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-30 text-xs"
                    title="Bölümü yukarı taşı"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveSection(sIdx, 1)}
                    disabled={sIdx === data.sections.length - 1}
                    className="p-1 text-gray-500 hover:text-white disabled:opacity-30 text-xs"
                    title="Bölümü aşağı taşı"
                  >
                    ▼
                  </button>
                </div>
                <input
                  type="text"
                  value={section.label}
                  onChange={(e) => updateSection(sIdx, "label", e.target.value)}
                  placeholder="Bölüm Başlığı"
                  className="flex-1 bg-slate-800 border border-slate-600 rounded px-3 py-2 text-lg font-semibold text-blue-400 placeholder-gray-600"
                />
                <button
                  onClick={() => addCard(sIdx)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs font-medium transition whitespace-nowrap"
                >
                  + Kart Ekle
                </button>
                <button
                  onClick={() => removeSection(sIdx)}
                  className="px-3 py-1.5 bg-red-900/60 hover:bg-red-800 text-red-300 rounded text-xs font-medium transition whitespace-nowrap"
                >
                  Bölümü Sil
                </button>
              </div>

              {/* Section description */}
              <div className="ml-12 mb-4">
                <input
                  type="text"
                  value={section.description || ""}
                  onChange={(e) => updateSection(sIdx, "description", e.target.value)}
                  placeholder="Bölüm açıklaması (opsiyonel)"
                  className="w-full bg-slate-800/50 border border-slate-700 rounded px-3 py-1.5 text-sm text-gray-300 placeholder-gray-600"
                />
              </div>

              {/* Cards */}
              {section.cards.length === 0 ? (
                <p className="text-gray-500 text-sm italic ml-12">Bu bölümde henüz kart yok.</p>
              ) : (
                <div className="space-y-3">
                  {section.cards.map((card, cIdx) => (
                    <CardEditor
                      key={`${section.id}-${cIdx}`}
                      card={card}
                      index={cIdx}
                      total={section.cards.length}
                      onChange={(field, value) => updateCard(sIdx, cIdx, field, value)}
                      onRemove={() => removeCard(sIdx, cIdx)}
                      onMove={(dir) => moveCard(sIdx, cIdx, dir)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Card Editor ── */

function CardEditor({
  card,
  index,
  total,
  onChange,
  onRemove,
  onMove,
}: {
  card: PricingCard;
  index: number;
  total: number;
  onChange: (field: string, value: any) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`bg-slate-800/60 border rounded-xl p-4 ${card.hidden ? "border-yellow-700/50 opacity-60" : "border-slate-700"}`}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-gray-400 hover:text-white transition text-sm w-6"
        >
          {expanded ? "▼" : "▶"}
        </button>
        <span className="text-xs text-gray-500 font-mono w-6">#{index + 1}</span>
        <input
          type="text"
          value={card.title}
          onChange={(e) => onChange("title", e.target.value)}
          placeholder="Başlık"
          className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
        />
        <input
          type="text"
          value={card.price}
          onChange={(e) => onChange("price", e.target.value)}
          placeholder="Fiyat"
          className="w-48 bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white placeholder-gray-500"
        />
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
          <input
            type="checkbox"
            checked={card.active || false}
            onChange={(e) => onChange("active", e.target.checked)}
            className="accent-blue-500"
          />
          Öne Çıkan
        </label>
        <button
          onClick={() => onChange("hidden", !card.hidden)}
          className={`px-2 py-1 rounded text-xs font-medium transition ${
            card.hidden
              ? "bg-yellow-700/60 text-yellow-300 hover:bg-yellow-600/60"
              : "bg-slate-700 text-gray-400 hover:bg-slate-600"
          }`}
          title={card.hidden ? "Fiyat sayfasında gizli — tıklayın gösterin" : "Fiyat sayfasından gizle"}
        >
          {card.hidden ? "👁‍🗨 Gizli" : "👁 Görünür"}
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="p-1 text-gray-500 hover:text-white disabled:opacity-30 text-xs"
            title="Yukarı"
          >
            ▲
          </button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="p-1 text-gray-500 hover:text-white disabled:opacity-30 text-xs"
            title="Aşağı"
          >
            ▼
          </button>
        </div>
        <button
          onClick={onRemove}
          className="p-1 text-red-400 hover:text-red-300 text-sm"
          title="Kartı Sil"
        >
          ✕
        </button>
      </div>

      {expanded && (
        <div className="mt-4 pl-10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Açıklama (support)</label>
              <input
                type="text"
                value={card.support}
                onChange={(e) => onChange("support", e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Buton Metni (CTA)</label>
              <input
                type="text"
                value={card.cta}
                onChange={(e) => onChange("cta", e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Paket ID (packageId)</label>
              <input
                type="text"
                value={card.packageId || ""}
                onChange={(e) => onChange("packageId", e.target.value || undefined)}
                className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Özellikler (features) — her satır bir madde
            </label>
            <textarea
              value={card.features.join("\n")}
              onChange={(e) =>
                onChange("features", e.target.value.split("\n").filter((l) => l.trim()))
              }
              rows={Math.max(3, card.features.length + 1)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">
              Dahil Olmayan Özellikler (mutedFeatures) — her satır bir madde
            </label>
            <textarea
              value={card.mutedFeatures.join("\n")}
              onChange={(e) =>
                onChange("mutedFeatures", e.target.value.split("\n").filter((l) => l.trim()))
              }
              rows={Math.max(2, card.mutedFeatures.length + 1)}
              className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-white font-mono"
            />
          </div>
        </div>
      )}
    </div>
  );
}
