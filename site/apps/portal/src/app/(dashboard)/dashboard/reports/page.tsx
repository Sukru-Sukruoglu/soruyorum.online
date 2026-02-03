"use client";

import { FileText, Download, Calendar, Filter, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ReportItemDto = {
    id: string;
    eventId?: string | null;
    eventName?: string | null;
    type?: string | null;
    format?: string | null;
    generatedAt?: string | null;
    data?: {
        availableFormats?: string[];
    } | null;
};

export default function ReportsPage() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [reports, setReports] = useState<ReportItemDto[]>([]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
                const response = await fetch('/api/reports', {
                    method: 'GET',
                    headers: {
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });
                const data = await response.json().catch(() => null);
                if (!response.ok) {
                    throw new Error(data?.error || 'Raporlar alınamadı');
                }
                const items = (data?.reports || []) as ReportItemDto[];
                if (!cancelled) setReports(items);
            } catch (e: any) {
                if (!cancelled) setError(e?.message || 'Raporlar alınamadı');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // Group reports by eventId+type to show single entry with multiple formats
    const groupedReports = useMemo(() => {
        const groups = new Map<string, ReportItemDto & { formats: string[] }>();
        
        for (const r of reports) {
            const key = `${r.eventId || 'unknown'}-${r.type || 'unknown'}`;
            const existing = groups.get(key);
            
            if (existing) {
                // Add format to existing group
                const format = String(r.format || '').toLowerCase();
                if (format && format !== 'multi' && !existing.formats.includes(format)) {
                    existing.formats.push(format);
                }
            } else {
                // Create new group
                const format = String(r.format || '').toLowerCase();
                const formats = format === 'multi' 
                    ? (r.data?.availableFormats || ['pdf', 'xlsx', 'csv'])
                    : (format ? [format] : []);
                    
                groups.set(key, { ...r, formats });
            }
        }
        
        return Array.from(groups.values());
    }, [reports]);

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return groupedReports;
        return groupedReports.filter((r) => {
            const hay = `${r.eventName || ''} ${r.type || ''} ${r.formats.join(' ')}`.toLowerCase();
            return hay.includes(q);
        });
    }, [groupedReports, query]);

    const formatLabel = (format?: string | null) => {
        const f = String(format || '').toLowerCase();
        if (f === 'csv') return 'Excel (CSV)';
        if (f === 'xlsx') return 'Excel';
        if (f === 'pdf') return 'PDF';
        if (f === 'json') return 'JSON';
        return (format || 'Dosya').toUpperCase();
    };

    const typeLabel = (type?: string | null) => {
        if (!type) return 'Rapor';
        if (type === 'qanda_final') return 'Soru/Yorum Raporu';
        if (type === 'wheel_fortune_final') return 'Çarkıfelek Final Raporu';
        return type;
    };

    const prettyDate = (value?: string | null) => {
        if (!value) return '';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return String(value);
        return d.toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' });
    };

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <FileText className="text-green-500" />
                    Raporlar
                </h1>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text"
                            placeholder="Rapor ara..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-10 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 focus:border-green-500 dark:focus:border-green-500/50 outline-none"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 border border-gray-300 dark:border-white/10 text-gray-700 dark:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                        <Filter size={18} />
                        Filtrele
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading && (
                    <div className="text-sm text-gray-500">Raporlar yükleniyor…</div>
                )}

                {!loading && error && (
                    <div className="text-sm text-red-600">{error}</div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="text-sm text-gray-500">
                        Henüz rapor yok. Q&amp;A için rapor, "Sunumu Durdur" sonrası otomatik oluşur.
                    </div>
                )}

                {!loading && !error && filtered.map((r) => (
                    <ReportItem
                        key={r.id}
                        title={`${r.eventName || 'Etkinlik'} • ${typeLabel(r.type)}`}
                        date={prettyDate(r.generatedAt)}
                        formats={r.formats}
                        reportId={r.id}
                    />
                ))}
            </div>

            <div className="mt-8 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl p-8 shadow-sm">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Calendar size={20} className="text-gray-400" />
                    Zamanlanmış Raporlar
                </h2>
                <p className="text-gray-500 dark:text-gray-400">
                    Otomatik rapor oluşturma özelliği yakında aktif olacak...
                </p>
            </div>
        </div>
    );
}

function ReportItem({ title, date, formats, reportId }: { title: string; date: string; formats: string[]; reportId: string }) {
    const formatConfig: Record<string, { label: string; color: string; icon: string }> = {
        pdf: { label: 'PDF', color: 'text-red-500 bg-red-500/10 hover:bg-red-500/20 border-red-500/20', icon: '📄' },
        xlsx: { label: 'Excel', color: 'text-green-500 bg-green-500/10 hover:bg-green-500/20 border-green-500/20', icon: '📊' },
        csv: { label: 'CSV', color: 'text-blue-500 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20', icon: '📋' },
    };

    const handleDownload = async (format: string) => {
        const token = localStorage.getItem('auth_token') || localStorage.getItem('token') || '';
        const response = await fetch(`/api/reports/${reportId}/download?format=${format}`, {
            method: 'GET',
            headers: {
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
        });

        if (!response.ok) {
            const data = await response.json().catch(() => null);
            throw new Error(data?.error || 'İndirme hatası');
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const contentDisposition = response.headers.get('content-disposition') || '';
        const fileNameMatch = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
        const ext = format === 'xlsx' ? 'xlsx' : format === 'pdf' ? 'pdf' : 'csv';
        const fileName = decodeURIComponent(fileNameMatch?.[1] || fileNameMatch?.[2] || `rapor-${reportId}.${ext}`);

        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-5 hover:border-green-500 dark:hover:border-green-500/50 transition-all shadow-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-green-600 to-green-700">
                        <FileText size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{date}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {formats.map((format) => {
                        const config = formatConfig[format] || { label: format.toUpperCase(), color: 'text-gray-500 bg-gray-500/10', icon: '📁' };
                        return (
                            <button
                                key={format}
                                onClick={() => handleDownload(format).catch((e) => window.alert(e?.message || 'İndirme hatası'))}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all ${config.color}`}
                            >
                                <Download size={16} />
                                {config.label}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
