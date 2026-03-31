const escapeHtml = (value: string): string => {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
};

const resolveMailLogoUrl = (baseUrl: string): string => {
    const fallbackLogoUrl = `${baseUrl}/images/beyazlogouzun.png`;
    const configuredLogoUrl = (process.env.MAIL_LOGO_URL || "").trim();

    if (!configuredLogoUrl) {
        return fallbackLogoUrl;
    }

    return configuredLogoUrl;
};

export const buildEmailVerificationEmail = (params: {
    greetingName: string;
    verifyUrl: string;
}): { subject: string; text: string; html: string } => {
    const greetingName = params.greetingName.trim() || "";
    const verifyUrl = params.verifyUrl;
    const safeGreetingName = escapeHtml(greetingName || "");
    const safeVerifyUrl = escapeHtml(verifyUrl);

    const subject = "E-posta adresinizi doğrulayın";
    const text =
        `Merhaba ${greetingName},\n\n` +
        `Hesabınızı doğrulamak için aşağıdaki bağlantıya tıklayın:\n${verifyUrl}\n\n` +
        `Eğer bu işlemi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.\n`;

    const baseUrl = (process.env.PORTAL_BASE_URL || "https://soruyorum.online").replace(/\/+$/, "");
    const logoUrl = resolveMailLogoUrl(baseUrl);
    const safeLogoUrl = escapeHtml(logoUrl);

    const preheader = "Hesabınızı doğrulamak için butona tıklayın.";

    const html = `
<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0f;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
        preheader,
    )}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#0b0b0f" style="background:#0b0b0f;">
      <tr>
        <td align="center" bgcolor="#0b0b0f" style="padding:24px 16px;background:#0b0b0f;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" bgcolor="#111114" style="max-width:600px;width:100%;background:#111114;border-radius:14px;overflow:hidden;">
            <tr>
              <td height="4" bgcolor="#e11d48" style="background:#e11d48;line-height:4px;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td bgcolor="#0f0f13" style="padding:18px 24px;background:#0f0f13;border-bottom:1px solid #24242b;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" style="font-family:Arial,Helvetica,sans-serif;">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <img src="${safeLogoUrl}" alt="Soruyorum" height="32" style="display:block;height:32px;width:auto;max-width:220px;" />
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;">
                      Hesap doğrulama
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#f3f4f6;">
                <p style="margin:0 0 12px 0;">Merhaba <strong style=\"color:#ffffff;\">${safeGreetingName}</strong>,</p>
                <p style="margin:0 0 16px 0;color:#d1d5db;">Hesabınızı doğrulamak için aşağıdaki butona tıklayın.</p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:20px 0 20px 0;">
                  <tr>
                    <td align="left">
                      <!--[if mso]>
                      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${safeVerifyUrl}" style="height:44px;v-text-anchor:middle;width:210px;" arcsize="18%" strokecolor="#e11d48" fillcolor="#e11d48">
                        <w:anchorlock/>
                        <center style="color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;">E-postamı doğrula</center>
                      </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <table role="presentation" cellspacing="0" cellpadding="0" bgcolor="#e11d48" style="background:#e11d48;border-radius:12px;">
                        <tr>
                          <td align="center" style="padding:12px 16px;">
                            <a href="${safeVerifyUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;">
                              E-postamı doğrula
                            </a>
                          </td>
                        </tr>
                      </table>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px 0;color:#9ca3af;">Buton çalışmazsa bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:</p>
                <div style="margin:0 0 16px 0;padding:10px 12px;border:1px solid #24242b;border-radius:12px;background:#0b0b0f;color:#e5e7eb;font-family:Consolas,Monaco,monospace;font-size:12px;line-height:18px;word-break:break-all;">
                  ${safeVerifyUrl}
                </div>

                <p style="margin:0;color:#9ca3af;font-size:14px;line-height:20px;">
                  Eğer bu işlemi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.
                </p>
              </td>
            </tr>
          </table>

          <div style="max-width:600px;width:100%;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;line-height:18px;padding:12px 8px;">
            Bu e-posta otomatik olarak gönderilmiştir.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

    return { subject, text, html };
};

export const buildPasswordResetEmail = (params: {
    greetingName: string;
    resetUrl: string;
}): { subject: string; text: string; html: string } => {
    const greetingName = params.greetingName.trim() || "";
    const resetUrl = params.resetUrl;
    const safeGreetingName = escapeHtml(greetingName || "");
    const safeResetUrl = escapeHtml(resetUrl);

    const subject = "Şifre sıfırlama isteği";
    const text =
        `Merhaba ${greetingName},\n\n` +
        `Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:\n${resetUrl}\n\n` +
        `Bu bağlantı 1 saat geçerlidir.\n\n` +
        `Eğer bu işlemi siz yapmadıysanız bu e-postayı yok sayabilirsiniz.\n`;

    const baseUrl = (process.env.PORTAL_BASE_URL || "https://soruyorum.online").replace(/\/+$/, "");
    const logoUrl = resolveMailLogoUrl(baseUrl);
    const safeLogoUrl = escapeHtml(logoUrl);

    const preheader = "Şifrenizi sıfırlamak için butona tıklayın.";

    const html = `
<!doctype html>
<html lang="tr">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#0b0b0f;">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(
        preheader,
    )}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" bgcolor="#0b0b0f" style="background:#0b0b0f;">
      <tr>
        <td align="center" bgcolor="#0b0b0f" style="padding:24px 16px;background:#0b0b0f;">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" bgcolor="#111114" style="max-width:600px;width:100%;background:#111114;border-radius:14px;overflow:hidden;">
            <tr>
              <td height="4" bgcolor="#e11d48" style="background:#e11d48;line-height:4px;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td bgcolor="#0f0f13" style="padding:18px 24px;background:#0f0f13;border-bottom:1px solid #24242b;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                  <tr>
                    <td align="left" style="font-family:Arial,Helvetica,sans-serif;">
                      <table role="presentation" cellspacing="0" cellpadding="0">
                        <tr>
                          <td style="vertical-align:middle;">
                            <img src="${safeLogoUrl}" alt="Soruyorum" height="28" style="display:block;height:28px;width:auto;" />
                          </td>
                          <td style="vertical-align:middle;padding-left:10px;font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:22px;font-weight:800;color:#ffffff;">
                            Soruyorum
                          </td>
                        </tr>
                      </table>
                    </td>
                    <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#9ca3af;">
                      Şifre sıfırlama
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:24px;color:#f3f4f6;">
                <p style="margin:0 0 12px 0;">Merhaba <strong style="color:#ffffff;">${safeGreetingName}</strong>,</p>
                <p style="margin:0 0 16px 0;color:#d1d5db;">Şifrenizi sıfırlamak için aşağıdaki butona tıklayın. Bu bağlantı 1 saat geçerlidir.</p>

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:20px 0 20px 0;">
                  <tr>
                    <td align="left">
                      <table role="presentation" cellspacing="0" cellpadding="0" bgcolor="#e11d48" style="background:#e11d48;border-radius:12px;">
                        <tr>
                          <td align="center" style="padding:12px 16px;">
                            <a href="${safeResetUrl}" style="display:inline-block;color:#ffffff;text-decoration:none;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:800;">
                              Şifremi sıfırla
                            </a>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 8px 0;color:#9ca3af;">Buton çalışmazsa bu bağlantıyı tarayıcınıza kopyalayıp yapıştırın:</p>
                <div style="margin:0 0 16px 0;padding:10px 12px;border:1px solid #24242b;border-radius:12px;background:#0b0b0f;color:#e5e7eb;font-family:Consolas,Monaco,monospace;font-size:12px;line-height:18px;word-break:break-all;">
                  ${safeResetUrl}
                </div>

                <p style="margin:0;color:#9ca3af;font-size:14px;line-height:20px;">
                  Eğer bu işlemi siz yapmadıysanız bu e-postayı yok sayabilirsiniz. Şifreniz değişmeyecektir.
                </p>
              </td>
            </tr>
          </table>

          <div style="max-width:600px;width:100%;font-family:Arial,Helvetica,sans-serif;color:#6b7280;font-size:12px;line-height:18px;padding:12px 8px;">
            Bu e-posta otomatik olarak gönderilmiştir.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();

    return { subject, text, html };
};
