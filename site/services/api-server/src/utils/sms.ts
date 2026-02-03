import { TRPCError } from "@trpc/server";

type SmsSendInput = {
    to: string;
    message: string;
};

function isPlaceholder(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === "change_me" || normalized === "changeme" || normalized === "todo";
}

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value || value.trim().length === 0 || isPlaceholder(value)) {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: `SMS yapılandırması eksik veya geçersiz: ${name}`,
        });
    }
    return value;
}

function netgsmErrorMessage(code: string): string {
    // Common NetGSM send error codes:
    // 20: message problem/too long, 30: invalid credentials/api permission/ip restriction,
    // 40: invalid sender header, 70: bad query/missing parameter, 80: rate limit.
    switch (code) {
        case "20":
            return "SMS gönderilemedi: mesaj metni veya mesaj boyu hatalı (NetGSM: 20).";
        case "30":
            return (
                "SMS gönderilemedi: NetGSM kullanıcı/şifre hatalı, API erişim izniniz yok veya IP kısıtınız var (NetGSM: 30). " +
                "Not: NetGSM API için ‘alt kullanıcı’ zorunludur. NetGSM panelden Abonelik İşlemleri > API işlemleri menüsünden API izni ve IP kısıtını kontrol edin."
            );
        case "40":
            return (
                "SMS gönderilemedi: mesaj başlığı (NETGSM_SENDER) NetGSM hesabınızda tanımlı değil (NetGSM: 40). " +
                "NetGSM panelden SMS Ayarları > Başlıklarım kısmını kontrol edin."
            );
        case "70":
            return "SMS gönderilemedi: NetGSM’e gönderilen parametrelerden biri hatalı veya eksik (NetGSM: 70).";
        case "80":
            return "SMS gönderilemedi: gönderim sınır aşımı (NetGSM: 80).";
        default:
            return `SMS gönderilemedi (NetGSM: ${code}).`;
    }
}

async function sendNetgsmOtpSms(input: SmsSendInput) {
    // NetGSM OTP SMS endpoint (uses OTP package, not regular SMS credits)
    const endpoint = process.env.NETGSM_OTP_ENDPOINT || "https://api.netgsm.com.tr/sms/send/otp";
    const username = requireEnv("NETGSM_USERNAME");
    const password = requireEnv("NETGSM_PASSWORD");
    const sender = requireEnv("NETGSM_SENDER");

    // OTP SMS uses XML POST format
    const xmlBody = `<?xml version="1.0"?>
<mainbody>
   <header>
       <usercode>${username}</usercode>
       <password>${password}</password>
       <msgheader>${sender}</msgheader>
   </header>
   <body>
       <msg><![CDATA[${input.message}]]></msg>
       <no>${input.to}</no>
   </body>
</mainbody>`;

    const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8" },
        body: xmlBody,
    });
    const text = await res.text();

    if (!res.ok) {
        throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `SMS gönderilemedi (HTTP ${res.status})`,
        });
    }

    // OTP response: XML with <code>0</code> for success, or error code
    // Success example: <code>0</code><jobid>123456</jobid>
    // Error codes: 20, 30, 40-41, 50-52, 60, 70, 100
    const codeMatch = text.match(/<code>(\d+)<\/code>/);
    const code = codeMatch ? codeMatch[1] : text.trim();

    if (code !== "0" && code !== "00") {
        throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message: netgsmOtpErrorMessage(code),
        });
    }
}

function netgsmOtpErrorMessage(code: string): string {
    switch (code) {
        case "20":
            return "SMS gönderilemedi: mesaj metni veya boyu hatalı. OTP SMS max 155 karakter ve Türkçe karakter içermemeli (NetGSM OTP: 20).";
        case "30":
            return (
                "SMS gönderilemedi: NetGSM kullanıcı/şifre hatalı, API erişim izniniz yok veya IP kısıtınız var (NetGSM OTP: 30). " +
                "Not: NetGSM API için 'alt kullanıcı' zorunludur."
            );
        case "40":
        case "41":
            return "SMS gönderilemedi: gönderici adı (NETGSM_SENDER) hatalı veya tanımlı değil (NetGSM OTP: 40/41).";
        case "50":
        case "51":
        case "52":
            return "SMS gönderilemedi: gönderilen numara hatalı (NetGSM OTP: 50-52).";
        case "60":
            return "SMS gönderilemedi: hesabınızda OTP SMS paketi tanımlı değil (NetGSM OTP: 60). NetGSM panelden OTP paketi satın alın.";
        case "70":
            return "SMS gönderilemedi: parametre hatası (NetGSM OTP: 70).";
        case "100":
            return "SMS gönderilemedi: sistem hatası (NetGSM OTP: 100).";
        default:
            return `SMS gönderilemedi (NetGSM OTP: ${code}).`;
    }
}

export async function sendSms(input: SmsSendInput) {
    const provider = (process.env.SMS_PROVIDER || "test").toLowerCase();

    if (provider === "test") {
        // No-op in test mode; useful for local/dev.
        return;
    }

    if (provider === "netgsm") {
        // Use OTP endpoint by default (works with OTP SMS package)
        return sendNetgsmOtpSms(input);
    }

    throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Desteklenmeyen SMS sağlayıcısı: ${provider}`,
    });
}
