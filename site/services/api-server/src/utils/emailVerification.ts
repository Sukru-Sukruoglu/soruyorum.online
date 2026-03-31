import jwt from "jsonwebtoken";
import { getEmailTokenSecret } from "./secrets";

const EMAIL_TOKEN_SECRET = getEmailTokenSecret();

export type EmailVerificationTokenPayload = {
    type: "email_verification";
    userId: string;
    email: string;
};

const EMAIL_VERIFICATION_EXPIRES_IN = process.env.EMAIL_VERIFICATION_EXPIRES_IN || "24h";

export const generateEmailVerificationToken = (payload: EmailVerificationTokenPayload): string => {
    return jwt.sign(payload, EMAIL_TOKEN_SECRET, { expiresIn: EMAIL_VERIFICATION_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyEmailVerificationToken = (token: string): EmailVerificationTokenPayload => {
    const decoded = jwt.verify(token, EMAIL_TOKEN_SECRET) as Partial<EmailVerificationTokenPayload>;
    if (decoded.type !== "email_verification" || !decoded.userId || !decoded.email) {
        throw new Error("INVALID_EMAIL_VERIFICATION_TOKEN");
    }
    return decoded as EmailVerificationTokenPayload;
};

export const getPortalBaseUrl = (): string => {
    return (process.env.PORTAL_BASE_URL || "https://soruyorum.online").replace(/\/+$/, "");
};

export const buildVerifyEmailUrl = (token: string): string => {
    const base = getPortalBaseUrl();
    return `${base}/verify-email?token=${encodeURIComponent(token)}`;
};

export const isEmailVerificationEnforced = (): boolean => {
    const raw = (process.env.ENFORCE_EMAIL_VERIFICATION || "").toLowerCase();
    return raw === "1" || raw === "true" || raw === "yes";
};

export const shouldEnforceEmailVerificationForUser = (createdAt: Date): boolean => {
    if (!isEmailVerificationEnforced()) return false;
    const enforceFrom = process.env.ENFORCE_EMAIL_VERIFICATION_FROM?.trim();
    if (!enforceFrom) return true;
    const fromDate = new Date(enforceFrom);
    if (Number.isNaN(fromDate.getTime())) return true;
    return createdAt >= fromDate;
};

// ── Password Reset Token ──────────────────────────────────────────────

export type PasswordResetTokenPayload = {
    type: "password_reset";
    userId: string;
    email: string;
};

const PASSWORD_RESET_EXPIRES_IN = process.env.PASSWORD_RESET_EXPIRES_IN || "1h";

export const generatePasswordResetToken = (payload: PasswordResetTokenPayload): string => {
    return jwt.sign(payload, EMAIL_TOKEN_SECRET, { expiresIn: PASSWORD_RESET_EXPIRES_IN } as jwt.SignOptions);
};

export const verifyPasswordResetToken = (token: string): PasswordResetTokenPayload => {
    const decoded = jwt.verify(token, EMAIL_TOKEN_SECRET) as Partial<PasswordResetTokenPayload>;
    if (decoded.type !== "password_reset" || !decoded.userId || !decoded.email) {
        throw new Error("INVALID_PASSWORD_RESET_TOKEN");
    }
    return decoded as PasswordResetTokenPayload;
};

export const buildPasswordResetUrl = (token: string): string => {
    const base = getPortalBaseUrl();
    return `${base}/reset-password?token=${encodeURIComponent(token)}`;
};
