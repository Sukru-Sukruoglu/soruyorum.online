import nodemailer from "nodemailer";
import https from "https";

type MailPayload = {
    to: string;
    subject: string;
    text: string;
    html?: string;
};

type MailProvider = "smtp" | "brevo";

type SmtpConfig = {
    host: string;
    port: number;
    secure: boolean;
    user?: string;
    pass?: string;
    from: string;
    fromName?: string;
};

type BrevoConfig = {
    apiKey: string;
    from: string;
    fromName?: string;
};

let cachedTransporter: nodemailer.Transporter | null = null;
let cachedConfigKey: string | null = null;

const getSmtpConfig = (): SmtpConfig | null => {
    const host = process.env.SMTP_HOST?.trim();
    if (!host) return null;

    const port = parseInt(process.env.SMTP_PORT || "587", 10);
    const secure = (process.env.SMTP_SECURE || "false").toLowerCase() === "true";
    const user = process.env.SMTP_USER?.trim() || undefined;
    const pass = process.env.SMTP_PASS?.trim() || undefined;
    const from = process.env.MAIL_FROM?.trim() || "no-reply@soruyorum.online";

    const fromNameRaw = process.env.MAIL_FROM_NAME?.trim();
    const fromName = fromNameRaw
        ? fromNameRaw.replace(/[\r\n]+/g, " ").trim() || undefined
        : undefined;

    return { host, port, secure, user, pass, from, fromName };
};

const getMailProvider = (): MailProvider => {
    const raw = process.env.MAIL_PROVIDER?.trim().toLowerCase();
    if (raw === "smtp" || raw === "brevo") return raw;

    if (process.env.SMTP_HOST?.trim()) return "smtp";
    if (process.env.BREVO_API_KEY?.trim()) return "brevo";
    return "smtp";
};

const getBrevoConfig = (): BrevoConfig | null => {
    const apiKey = process.env.BREVO_API_KEY?.trim();
    if (!apiKey) return null;

    const from = process.env.MAIL_FROM?.trim() || "no-reply@soruyorum.online";
    const fromName = process.env.MAIL_FROM_NAME?.trim() || undefined;
    return { apiKey, from, fromName };
};

export const isMailConfigured = (): boolean => {
    const provider = getMailProvider();
    if (provider === "brevo") {
        const config = getBrevoConfig();
        return Boolean(config?.apiKey && config?.from);
    }

    const config = getSmtpConfig();
    return Boolean(config?.host && config?.from && config?.user && config?.pass);
};

export const getMailConfigMissingKeys = (): string[] => {
    const missing: string[] = [];

    const provider = getMailProvider();
    if (provider === "brevo") {
        if (!process.env.BREVO_API_KEY?.trim()) missing.push("BREVO_API_KEY");
        if (!process.env.MAIL_FROM?.trim()) missing.push("MAIL_FROM");
        return missing;
    }

    if (!process.env.SMTP_HOST?.trim()) missing.push("SMTP_HOST");
    if (!process.env.SMTP_USER?.trim()) missing.push("SMTP_USER");
    if (!process.env.SMTP_PASS?.trim()) missing.push("SMTP_PASS");
    if (!process.env.MAIL_FROM?.trim()) missing.push("MAIL_FROM");
    return missing;
};

const createCodedError = (code: string, message: string): Error & { code: string } => {
    const err = new Error(message) as Error & { code: string };
    err.code = code;
    return err;
};

const getTransporter = (): { transporter: nodemailer.Transporter; config: SmtpConfig } => {
    const config = getSmtpConfig();
    if (!config) {
        throw new Error("MAIL_NOT_CONFIGURED");
    }

    if (!config.user || !config.pass) {
        throw new Error("MAIL_AUTH_NOT_CONFIGURED");
    }

    const configKey = JSON.stringify({
        host: config.host,
        port: config.port,
        secure: config.secure,
        user: config.user,
        from: config.from,
    });

    if (!cachedTransporter || cachedConfigKey !== configKey) {
        cachedConfigKey = configKey;
        cachedTransporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: { user: config.user, pass: config.pass },
        });
    }

    return { transporter: cachedTransporter, config };
};

const sendBrevoMail = async (payload: MailPayload, config: BrevoConfig): Promise<void> => {
    const body = JSON.stringify({
        sender: {
            email: config.from,
            ...(config.fromName ? { name: config.fromName } : {}),
        },
        to: [{ email: payload.to }],
        subject: payload.subject,
        textContent: payload.text,
        ...(payload.html ? { htmlContent: payload.html } : {}),
    });

    const url = new URL("https://api.brevo.com/v3/smtp/email");

    await new Promise<void>((resolve, reject) => {
        const req = https.request(
            {
                protocol: url.protocol,
                hostname: url.hostname,
                port: url.port ? Number(url.port) : 443,
                path: url.pathname,
                method: "POST",
                headers: {
                    "api-key": config.apiKey,
                    "content-type": "application/json",
                    "content-length": Buffer.byteLength(body),
                    accept: "application/json",
                },
                timeout: 10_000,
            },
            (res) => {
                let responseBody = "";
                res.setEncoding("utf8");
                res.on("data", (chunk) => {
                    responseBody += chunk;
                    if (responseBody.length > 64_000) responseBody = responseBody.slice(0, 64_000);
                });
                res.on("end", () => {
                    const status = res.statusCode ?? 0;
                    if (status >= 200 && status < 300) return resolve();

                    return reject(
                        createCodedError(
                            `BREVO_HTTP_${status}`,
                            `Brevo mail gönderimi başarısız (HTTP ${status}).`
                        )
                    );
                });
            }
        );

        req.on("timeout", () => {
            req.destroy(createCodedError("BREVO_TIMEOUT", "Brevo isteği zaman aşımına uğradı."));
        });

        req.on("error", (err) => {
            reject(err);
        });

        req.write(body);
        req.end();
    });
};

export const sendMail = async (payload: MailPayload): Promise<void> => {
    const provider = getMailProvider();
    if (provider === "brevo") {
        const config = getBrevoConfig();
        if (!config) {
            throw new Error("MAIL_NOT_CONFIGURED");
        }

        await sendBrevoMail(payload, config);
        return;
    }

    const { transporter, config } = getTransporter();

    const fromHeader = config.fromName ? `${config.fromName} <${config.from}>` : config.from;
    await transporter.sendMail({
        from: fromHeader,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
    });
};
