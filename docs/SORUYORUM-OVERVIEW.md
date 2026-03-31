# Soruyorum.online — Teknik Genel Bakış

Bu belge, `soruyorum.online` deposunun mimarisi, konteynerler, veritabanı ve operasyon özeti için referanstır.

---

## Proje Hakkında

**Soruyorum.online**, etkinlik yöneticilerinin Q&A / quiz tarzı etkinlik oluşturması, katılımcıların PIN veya QR ile katılması ve sunum ekranında soruların yönetilmesi için kurulmuş bir **monorepo** projesidir. Ana uygulama **Next.js (portal)** ve **Node API sunucusu** üzerinde çalışır; **Traefik** ile HTTPS ve yönlendirme yapılır. Marka varyantı `NEXT_PUBLIC_SITE_VARIANT` ile (ör. `soruyorum`) ayırt edilir.

---

## Temel Özellikler

- Organizasyon ve kullanıcı hesapları; oturum yönetimi
- Etkinlik oluşturma, PIN/QR, katılım (`/join`)
- Canlı sunum görünümü (`/events/[id]/live`) — duvar / tek tek / giriş görünümleri
- Tema: arka plan, animasyon tipleri, logo, metinler
- Q&A gönderileri (`qanda_submissions`) ve moderasyon akışı
- Raporlar, faturalama / premium ile ilgili uçlar (PayTR, abonelik modelleri)
- İsteğe bağlı: e-posta doğrulama, SMS OTP, özel alan adları (Cloudflare SaaS), white-label

---

## Sistem Mimarisi

| Katman      | Açıklama                                                                 |
|------------|---------------------------------------------------------------------------|
| **Edge**   | Traefik: `soruyorum.online`, `www`, `mobil`, `ekran`, `tablet`, `api.soruyorum.online`, `*.soruyorum.live` vb. |
| **Portal** | Next.js: dashboard, public sayfalar, sunum ve join sayfaları (çoğu rota)   |
| **API**    | `services/api-server`: iş mantığı, Prisma ile DB                          |
| **Cache**  | Redis (şifre korumalı)                                                    |
| **Veri**   | PostgreSQL (harici; `DATABASE_URL`)                                     |
| **Statik** | `site/public_html` + ayrı nginx servisi                                  |

Kök `docker-compose.yml` ile `site/docker-compose.yml` farklıdır: kökte çoğunlukla statik ve API proxy; asıl uygulama stack’i `site/` altındadır.

---

## Konteynerler

`site/docker-compose.yml` ve `site/docker-compose.traefik.yml`:

| Servis                 | Rol                                      |
|------------------------|------------------------------------------|
| **soruyorum-portal**   | Next.js portal (iç port 3000)            |
| **soruyorum-api-server** | Backend API (4000)                    |
| **soruyorum-redis**    | Redis 7, AOF + `requirepass`             |
| **soruyorum-static**   | Nginx; `public_html`                     |

Traefik için **`infra-network`** (external) kullanılır. Üretimde ortam dosyası tipik olarak **`/etc/soruyorum/portal-api.env`**.

**Yerel / ops script:** `site/scripts/deploy-soruyorum.sh`

```bash
# Örnek
bash scripts/deploy-soruyorum.sh up
bash scripts/deploy-soruyorum.sh ps
```

İçeride: `docker compose -p soruyorum -f docker-compose.yml -f docker-compose.traefik.yml …`

---

## Veritabanı Yapısı

- **ORM:** Prisma
- **Şema:** `site/packages/database/prisma/schema.prisma`
- **Motor:** PostgreSQL (`DATABASE_URL`)

Öne çıkan modeller (özet):

| Model                    | Açıklama                                      |
|--------------------------|-----------------------------------------------|
| **organizations**      | Organizasyon, plan, ayarlar                   |
| **users**, **sessions**  | Kullanıcı ve oturum                           |
| **events**               | Etkinlik, PIN, QR, `branding` / `settings` JSON |
| **participants**         | Katılımcı                                     |
| **qanda_submissions**    | Soru metni, durum, moderasyon                 |
| **activities**, **questions**, **responses**, **scores** | Quiz akışı              |
| **bingo_***              | Bingo oturumu / kart / kazanan                |
| **reports**              | Rapor üretimi                                 |
| **subscriptions**       | Abonelik                                      |
| **organization_domains** | Özel alan adı doğrulama                       |
| **audit_logs**, **app_settings** | Denetim ve uygulama ayarları        |
| **newsletter_subscriptions**, **contact_submissions** | Pazarlama / iletişim formları |

---

## Klasör Yapısı (özet)

```
soruyorum.online/
├── docker-compose.yml          # Kök: Traefik, statik, API proxy
├── nginx/
├── docs/
│   └── SORUYORUM-OVERVIEW.md   # Bu dosya
└── site/                       # Asıl monorepo
    ├── apps/
    │   ├── portal/             # Next.js ana ürün
    │   ├── play/               # Katılımcı / oyun yüzeyi
    │   ├── admin/              # Yönetim arayüzü
    │   └── web/                # Pazarlama / web sitesi
    ├── packages/
    │   └── database/           # Prisma şeması + client
    ├── services/
    │   └── api-server/         # Backend + Dockerfile
    ├── public_html/            # Statik HTML (nginx)
    ├── docker-compose.yml
    ├── docker-compose.traefik.yml
    └── scripts/
        └── deploy-soruyorum.sh
```

---

## Kullanım Kılavuzu (kısa)

1. **Ortam:** `site/.env.example` referans; gerçek değerler sunucuda `portal-api.env` vb.
2. **Geliştirme:** Node ≥ 20, pnpm; `site` içinde `pnpm dev` (Turbo).
3. **Üretim:** `deploy-soruyorum.sh up` veya `docker compose … up -d --build`.
4. **Organizatör:** Portala giriş → etkinlik oluştur → düzenleyicide tema/sunum → sunumu başlat.
5. **Katılımcı:** `https://soruyorum.online/join?pin=…` veya yayınlanan join URL’si.
6. **Sunum:** `/events/{id}/live`; editörde mobil önizleme aynı sayfayı iframe ile açar.

---

## Ayarlar ve Yapılandırma

- **Sunucu / gizli:** `DATABASE_URL`, `REDIS_URL` veya `REDIS_PASSWORD`, `JWT_SECRET`, e-posta (SMTP/Brevo), SMS (NetGSM), PayTR, `EMAIL_TOKEN_SECRET`, `PHONE_OTP_SECRET`, Cloudflare SaaS token’ları.
- **Portal → API:** `API_URL` (Docker içinde genelde `http://soruyorum-api-server:4000`).
- **İstemci (build-time):** `NEXT_PUBLIC_*` — değişince portal imajının yeniden build edilmesi gerekir.
- **Traefik:** Host kuralları ve öncelikler `site/docker-compose.traefik.yml` içinde.

Ayrıntılı örnekler: `site/.env.example`.

---

## Varsayılan Etkinlik Ayarları

- Etkinlik tipi: `events.event_type` (ör. `quiz`); API tarafında `ALLOWED_EVENT_TYPES`.
- Tema ve canlı metinler `events.settings` / `branding` JSON içinde (ör. `theme`: `bgAnimation`, `bgAnimationType`, gradient renkleri, sunum başlığı/açıklaması, duvar ve tek tek başlıkları, logo URL’leri).
- Kodda varsayılan animasyon tipi genelde **`gradient`**; kullanıcı editörden değiştirir ve API ile kalıcı hale gelir.

---

## Teknik Detaylar

- **Monorepo:** Turbo + pnpm workspace (`site/package.json`).
- **Portal:** Next.js App Router; sunum `(presentation)`, join `(public)` gibi route grupları.
- **Gerçek zamanlı:** Socket kullanımı (`play` ve portal’da ilgili modüller).
- **tRPC:** Örn. `events.getPublicInfo` ile portal–API.
- **Prisma:** `packages/database`; migrate/generate buradan.

---

## Demo Modu

- Bayrak: **`NEXT_PUBLIC_DEMO_MODE`** — `true` / `1` / `yes` / `on` (string, build-time).
- **Canlı sunum** (`apps/portal/src/app/(presentation)/events/[id]/live/page.tsx`): demo açıkken, platform markası açık etkinliklerde ve oturumdaki kullanıcı **tam yetkili rolde değilse** ekranda **yarı saydam merkez filigran** gösterilir (`showDemoWatermark`).

---

## Deployment

Önkoşullar:

- Docker ağı: **`infra-network`** (external)
- Redis volume: compose’ta tanımlı external volume (ör. `site_soruyorum_redis_data`)
- **`/etc/soruyorum/portal-api.env`** doldurulmuş olmalı

Örnek ( `site` dizininden ):

```bash
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build
```

Sadece portal:

```bash
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build soruyorum-portal
```

Kök `site` için script: `pnpm ops:up` ( `site/scripts/deploy-soruyorum.sh` ).

---

## Son Değişiklikler

Kayıt için yerel depoda:

```bash
git log --oneline -20
```

Bu belge sabit bir anlık görüntü değildir; önemli mimari değişikliklerde güncellenmelidir.

---

## Geliştirici Notları

- `.env` ve `/etc/soruyorum/*.env` dosyalarını repoya eklemeyin.
- Prisma şema değişikliğinde migrate ve servis yeniden başlatma / imaj build sırasına dikkat edin.
- **Quiz editörü:** `apps/portal/src/components/events/QuizEditorV2.tsx` — büyük tek bileşen; layout/CSS değişiklikleri burada.
- **Join / live arka planları:** `join/page.tsx` ve `live/page.tsx` içinde `bgAnimationType` dalları paralel tutulmalı; yeni animasyon tipi eklerken her iki yolu da güncelleyin.
- Sunucu bileşenlerinde `"use client"` modüllerini doğrudan import etmeyin; oturum/etiket yardımcıları için `lib/` altındaki sunucu-güvenli modülleri kullanın.
