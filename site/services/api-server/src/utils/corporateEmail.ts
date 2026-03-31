const FREE_EMAIL_DOMAINS = new Set([
    "gmail.com",
    "googlemail.com",
    "yahoo.com",
    "yahoo.com.tr",
    "ymail.com",
    "hotmail.com",
    "hotmail.com.tr",
    "outlook.com",
    "outlook.com.tr",
    "live.com",
    "live.com.tr",
    "msn.com",
    "icloud.com",
    "me.com",
    "mac.com",
    "aol.com",
    "proton.me",
    "protonmail.com",
    "pm.me",
    "gmx.com",
    "yandex.com",
    "yandex.ru",
    "mail.com",
    "zoho.com",
    "inbox.com",
]);

export function normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
}

export function getEmailDomain(email: string): string {
    return normalizeEmail(email).split("@")[1] ?? "";
}

export function isCorporateEmail(email: string): boolean {
    const domain = getEmailDomain(email);
    return Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain);
}

export function getCorporateEmailErrorMessage(): string {
    return "Lutfen sirketinize ait kurumsal e-posta adresi kullanin. Gmail, Hotmail, Outlook ve benzeri kisisel adreslerle kayit kabul edilmiyor.";
}