"use client";

import { Button } from "@ks-interaktif/ui";
import { Activity, Database, Server, Cpu, HardDrive } from "lucide-react";

export default function HealthPage() {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Sistem Sağlığı</h1>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-gray-500">Yenile</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Database Status */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Database className="text-indigo-600" /> Veritabanı (PostgreSQL)
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Durum</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">CONNECTED</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Bağlantı Havuzu</span>
                            <span className="font-mono text-sm">45/100</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Ort. Yanıt Süresi</span>
                            <span className="font-mono text-sm">12ms</span>
                        </div>
                    </div>
                </div>

                {/* Redis Status */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Server className="text-red-600" /> Cache & Queue (Redis)
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Durum</span>
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-bold">OPERATIONAL</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Bellek Kullanımı</span>
                            <span className="font-mono text-sm">256 MB / 1 GB</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Hit Oranı</span>
                            <span className="font-mono text-sm">%94.5</span>
                        </div>
                    </div>
                </div>

                {/* API Server */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Cpu className="text-blue-600" /> API Server Node 01
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Uptime</span>
                            <span className="font-mono text-sm">14d 2h 15m</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">CPU Load</span>
                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[35%]"></div>
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Memory</span>
                            <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 w-[60%]"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* WebSocket Server */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <Activity className="text-green-600" /> WebSocket Cluster
                    </h3>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Aktif Bağlantı</span>
                            <span className="font-mono text-bold text-lg">1,245</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Mesaj/sn</span>
                            <span className="font-mono text-sm">450 msg/s</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-600">Gecikme (p99)</span>
                            <span className="font-mono text-sm">45ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
