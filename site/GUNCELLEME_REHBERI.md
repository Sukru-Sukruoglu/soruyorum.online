# SoruYorum Sistemi Güncelleme Notları (15 Şubat 2026)

Bu doküman, sistemdeki bülten abonelik formu ve 45 dakikalık hareketsizlik zaman aşımı (inactivity timeout) özelliklerinin yedek sunucuya nasıl uygulanacağını açıklar.

## 1. Bülten Formu ve Slider Başlatma Fix
Next.js'in script yükleme stratejisi nedeniyle çalışmayan jQuery bileşenlerini düzeltmek için:

**Dosya:** `apps/portal/src/app/page.tsx`
**İşlem:** Sayfanın en sonuna, `</body>` kapanışından hemen öncesine (footer sonrası) şu script bloğunu ekleyin:

```tsx
<Script id="site-init" strategy="lazyOnload">
    {`
    (function() {
        var attempts = 0;
        var maxAttempts = 50;
        function initSite() {
            attempts++;
            if (typeof window.jQuery !== 'undefined') {
                var $ = window.jQuery;
                
                // Slider Başlatma
                if (typeof window.Swiper !== 'undefined') {
                    $(".thm-swiper__slider").each(function () {
                        var elm = $(this);
                        var options = elm.data('swiper-options');
                        if (options && !elm.hasClass('swiper-initialized')) {
                            new Swiper(elm[0], options);
                        }
                    });
                }

                // Bülten Formu Event Bağlama
                var newsletterForm = $(".newsletter-two__form");
                if (newsletterForm.length && !newsletterForm.data('init-done')) {
                    newsletterForm.data('init-done', true);
                    newsletterForm.on("submit", function (e) {
                        e.preventDefault();
                        var form = $(this);
                        var emailInput = form.find('input[type="email"]');
                        var consentInput = form.find('input[type="checkbox"]');
                        var respBox = form.find(".result");
                        var submitBtn = form.find('button[type="submit"]');
                        var email = (emailInput.val() || "").toString().trim();
                        
                        if (!consentInput.is(":checked")) {
                            respBox.html('<div style="color:#ff3d3d;margin-top:10px;">Lütfen gizlilik politikasını kabul edin.</div>');
                            return false;
                        }

                        submitBtn.prop("disabled", true);
                        $.ajax({
                            url: "/api/newsletter/subscribe",
                            method: "POST",
                            contentType: "application/json",
                            data: JSON.stringify({ email: email, consent: true, source: "landing" })
                        }).done(function (data) {
                            respBox.html('<div style="color:#00ff00;margin-top:10px;">Aboneliğiniz alındı.</div>');
                            emailInput.val("");
                        }).fail(function () {
                            respBox.html('<div style="color:#ff3d3d;margin-top:10px;">Bir hata oluştu.</div>');
                        }).always(function () {
                            submitBtn.prop("disabled", false);
                        });
                    });
                }
            } else if (attempts < maxAttempts) {
                setTimeout(initSite, 500);
            }
        }
        initSite();
    })();
    `}
</Script>
```

---

## 2. 45 Dakika Hareketsizlik Zaman Aşımı (Backend)

### A. Aktif Katılımcı Filtrelemesi
**Dosya:** `services/api-server/src/routers/events.ts`
**İşlem:** Katılımcı sayısını ve listesini döndüren fonksiyonlara (özellikle `getPublicInfo` ve `getParticipants`) şu filtreyi ekleyin:

```typescript
const activeThreshold = new Date(Date.now() - 45 * 60 * 1000); // 45 dakika
// Sorgu içindeki where bloğuna şunları ekleyin:
// left_at: null
// last_seen_at: { gte: activeThreshold }
```

### B. Heartbeat ve Re-join Kontrolü
**Dosya:** `services/api-server/src/routes/participants.ts`
**İşlem:** 
1. `/heartbeat` rotasında, katılımcının `last_seen_at` değerini kontrol edin. Eğer 45 dakikadan eskiyse oturumu sonlandırıp `shouldExit: true` döndürün.
2. `/join` rotasında, parmak izi (fingerprint) ile oturum geri getirme kısmına kontrol ekleyin: "Eğer bulunan oturum 45 dakikadan eskiyse, oturumu geri yükleme, yeni kayıt oluştur."

---

## 3. Yayına Alma (Deploy)
Değişikliklerin sunucuda aktif olması için konteynerleri yeniden derleyip başlatın:

```bash
docker compose build soruyorum-portal soruyorum-api-server
docker compose up -d soruyorum-portal soruyorum-api-server
```

Sadece portal tarafinda degisiklik varsa API konteynerini gereksiz yere yeniden baslatmayin:

```bash
docker compose up -d --build --no-deps soruyorum-portal
```

`bash scripts/deploy-soruyorum.sh up soruyorum-portal` komutu da ayni sekilde portal'i tek basina deploy eder.

**Dikkat:** `.env` dosyanızda şifrelerinizde `?` veya `!` gibi özel karakterler varsa, `DATABASE_URL` Prisma tarafından yanlış parçalanabilir. Bu durumda şifreyi URL-encode etmeyi veya database URL'ini tek parça halinde tam string olarak vermeyi unutmayın.
