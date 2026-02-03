"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeTrPhone = normalizeTrPhone;
/**
 * Best-effort TR phone normalization.
 * - Accepts: +90..., 90..., 0..., 5...
 * - Returns E.164 (+90...) and NetGSM-friendly (90...)
 */
function normalizeTrPhone(raw) {
    const digitsOnly = String(raw || "")
        .trim()
        .replace(/[^0-9+]/g, "")
        .replace(/^00/, "+");
    // Keep only digits for storage/transport
    let digits = digitsOnly.replace(/\D/g, "");
    // If starts with 0XXXXXXXXXX (11 digits), drop leading 0
    if (digits.length === 11 && digits.startsWith("0")) {
        digits = digits.slice(1);
    }
    // If starts with 5XXXXXXXXX (10 digits), assume TR mobile
    if (digits.length === 10 && digits.startsWith("5")) {
        digits = `90${digits}`;
    }
    // If starts with 90 and has 12 digits total => ok
    if (!(digits.startsWith("90") && digits.length === 12)) {
        throw new Error("Telefon numarası formatı geçersiz");
    }
    const netgsm = digits; // NetGSM expects 90xxxxxxxxxx
    const e164 = `+${digits}`;
    return { e164, digits, netgsm };
}
