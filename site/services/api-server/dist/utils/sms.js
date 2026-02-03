"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSms = sendSms;
const server_1 = require("@trpc/server");
function requireEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new server_1.TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `SMS yapılandırması eksik: ${name}`,
        });
    }
    return value;
}
async function sendNetgsmSms(input) {
    const endpoint = process.env.NETGSM_ENDPOINT || "https://api.netgsm.com.tr/sms/send/get";
    const username = requireEnv("NETGSM_USERNAME");
    const password = requireEnv("NETGSM_PASSWORD");
    const sender = requireEnv("NETGSM_SENDER");
    const url = new URL(endpoint);
    url.searchParams.set("usercode", username);
    url.searchParams.set("password", password);
    url.searchParams.set("gsmno", input.to);
    url.searchParams.set("message", input.message);
    url.searchParams.set("msgheader", sender);
    const res = await fetch(url.toString(), { method: "GET" });
    const text = await res.text();
    // NetGSM returns 200 even for some errors; common success is 00 or starts with 00
    if (!res.ok) {
        throw new server_1.TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `SMS gönderilemedi (HTTP ${res.status})`,
        });
    }
    const normalized = String(text || "").trim();
    if (!(normalized === "00" || normalized.startsWith("00"))) {
        throw new server_1.TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `SMS gönderilemedi (NetGSM: ${normalized})`,
        });
    }
}
async function sendSms(input) {
    const provider = (process.env.SMS_PROVIDER || "test").toLowerCase();
    if (provider === "test") {
        // No-op in test mode; useful for local/dev.
        return;
    }
    if (provider === "netgsm") {
        return sendNetgsmSms(input);
    }
    throw new server_1.TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Desteklenmeyen SMS sağlayıcısı: ${provider}`,
    });
}
