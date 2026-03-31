# Soruyorum.online — Kurumsal Dijital Soru & Etkinlik Platformu

## 📋 Proje Hakkında

**Soruyorum.online**, kurumsal etkinlikler, toplantılar, eğitimler ve interaktif sunumlar için geliştirilmiş **web tabanlı** bir platformdur. Katılımcılar PIN veya QR ile katılır; sorularını mobil veya masaüstünden gönderir. Yönetici tarafında canlı ekran, moderasyon, tema ve raporlama desteği vardır.

Yapı **monorepo** (Turbo + pnpm): ana uygulama **Next.js (portal)**, backend **Node API** + **Prisma** + **PostgreSQL**, önbellek **Redis**. Üretimde **Traefik** ile TLS ve çoklu host yönlendirmesi kullanılır.

### Temel Özellikler

- 🖥️ **Canlı Q&A / Quiz akışı** — Duvar, tek tek ve giriş görünümleri; sunum ekranı (`/events/[id]/live`)
- 🔗 **Katılım** — PIN, QR, özelleştirilebilir kayıt alanları (`/join`)
- 🏢 **Çok kiracılı organizasyon modeli** — `organizations` + kullanıcılar; tek PostgreSQL şeması (tenant başına ayrı DB değil, `organization_id` ile ayrım)
- 📱 **Mobil uyumlu** — Katılımcı arayüzü responsive; ayrıca `mobil.*` / `play` uygulaması rotaları
- 🎨 **Özelleştirilebilir tema** — Logo, renkler, arka plan görseli, animasyon tipleri (gradient, mesh, aurora, vb.)
- ✅ **Moderasyon** — Soru onayı, durum alanları (`qanda_submissions`)
- 📊 **Raporlama** — Etkinlik raporları (`reports`)
- 💳 **Premium / faturalama** — PayTR ve abonelik modelleri (yapılandırmaya bağlı)
- 🔐 **Güvenli oturum** — JWT tabanlı API oturumu; isteğe bağlı e-posta doğrulama, SMS OTP
- 🌐 **Özel alan adı** — Cloudflare SaaS ile `organization_domains` akışı (yapılandırmaya bağlı)

---

## 🏗️ Sistem Mimarisi

### Docker ve depo yapısı

```
soruyorum.online/
├── docker-compose.yml           # Kök: Traefik, statik “landing”, /api/auth proxy
├── nginx/
│   ├── default.conf
│   └── api-proxy.conf
├── docs/
│   └── SORUYORUM-OVERVIEW.md    # Bu dosya
└── site/                        # Asıl uygulama monoreposu
    ├── docker-compose.yml       # portal + api + redis + static
    ├── docker-compose.traefik.yml
    ├── apps/
    │   ├── portal/              # Next.js (ana ürün)
    │   ├── play/                # Katılımcı / oyun yüzeyi
    │   ├── admin/               # Yönetim arayüzü
    │   └── web/                 # Pazarlama sitesi parçaları
    ├── packages/
    │   └── database/            # Prisma şeması
    ├── services/
    │   └── api-server/          # REST / tRPC API
    ├── public_html/             # Statik HTML (nginx)
    └── scripts/
        └── deploy-soruyorum.sh
```

### Katman özeti

| Katman | Açıklama |
|--------|----------|
| Edge | Traefik — `soruyorum.online`, `www`, `mobil`, `ekran`, `tablet`, `api.soruyorum.online`, `*.soruyorum.live` vb. |
| Portal | Next.js — dashboard, join, live, pazarlama sayfaları |
| API | Node — Prisma, iş kuralları |
| Redis | Oturum / kuyruk / önbellek (şifreli) |
| PostgreSQL | Harici servis (`DATABASE_URL`) |

---

## 🐳 Konteynerler

`site/docker-compose.yml` (+ `docker-compose.traefik.yml`):

| Konteyner / servis | Açıklama | Not |
|--------------------|----------|-----|
| **soruyorum-portal** | Next.js uygulaması | İç port **3000**; Traefik arkasında yayın |
| **soruyorum-api-server** | Backend API | İç port **4000**; `api.soruyorum.online` ile erişilebilir |
| **soruyorum-redis** | Redis 7 | AOF + `requirepass` |
| **soruyorum-static** | Nginx | `public_html` statik dosyalar; örn. **127.0.0.1:8180** |

Önkoşullar: Docker ağı **`infra-network`** (external), Redis için tanımlı **external volume** (compose’taki isim), üretimde **`/etc/soruyorum/portal-api.env`**.

**PostgreSQL** bu compose dosyasında tanımlı değildir; `DATABASE_URL` ile harici instance’a bağlanır.

---

## 🗄️ Veritabanı Yapısı

- **Motor:** PostgreSQL  
- **ORM:** Prisma — şema: `site/packages/database/prisma/schema.prisma`

Tek veritabanı; çokluluk **organizasyon** (`organizations`) ve ilişkili `organization_id` alanları ile sağlanır.

```
public (PostgreSQL)
├── organizations          # Şirket / organizasyon, plan, ayarlar
├── organization_domains   # Özel alan adı kayıtları
├── users                  # Kullanıcılar
├── sessions               # Oturum kayıtları
├── subscriptions          # Abonelik
├── events                 # Etkinlikler (PIN, QR, settings JSON, branding)
├── participants           # Katılımcılar
├── qanda_submissions      # Soru metinleri, moderasyon durumu
├── activities             # Aktivite oturumları (quiz vb.)
├── questions              # Soru bankası (quiz)
├── responses              # Cevaplar
├── scores                 # Puan / sıralama
├── bingo_*                # Bingo ile ilgili tablolar (şemada mevcut)
├── reports                # Rapor üretimi
├── audit_logs             # Denetim günlüğü
├── app_settings           # Uygulama anahtar/değer ayarları
├── newsletter_subscriptions
└── contact_submissions
```

---

## 📁 Klasör Yapısı (site/apps/portal özeti)

Next.js App Router — önemli gruplar:

```
site/apps/portal/src/
├── app/
│   ├── (auth)/              # login, register
│   ├── (dashboard)/         # panel, etkinlikler, faturalama, ayarlar
│   ├── (presentation)/      # events/[id]/live — sunum ekranı
│   ├── (public)/            # join, plans, about, …
│   ├── api/                 # Route handlers (auth, events, public, …)
│   └── layout.tsx, globals.css
├── components/
│   ├── events/              # QuizEditorV2, kartlar, Q&A moderatör
│   ├── layout/              # Sidebar, chrome
│   └── ui/                    # Arka plan animasyonları, ortak UI
└── lib/                       # Oturum, API yardımcıları
```

Katılımcı arka plan animasyonları: `app/(public)/join/page.tsx` ve `app/(presentation)/events/[id]/live/page.tsx` içinde `bgAnimationType` dallarıyla eşlenir.

---

## 🎮 Kullanım Kılavuzu

### 1. Organizatör girişi

1. `https://soruyorum.online` üzerinden **Giriş** / **Kayıt**  
2. Dashboard’a yönlendirilirsiniz  
3. Yeni etkinlik oluşturup PIN/QR ile paylaşım yapın  

### 2. Etkinlik oluşturma ve düzenleme

1. Dashboard → **Etkinlikler**  
2. Yeni etkinlik; isim, tip (yapılandırmaya göre quiz/Q&A)  
3. **Düzenleyici** (`/events/[id]/edit`): tema, sunum başlığı, arka plan animasyonu, logo, duvar/tek tek metinleri  
4. **Kaydet**; canlı önizleme editör içinde iframe ile açılabilir  

### 3. Katılımcı daveti

- Join adresi: `https://soruyorum.online/join?pin=XXXXXX` (veya yapılandırılmış mobil alan adı)  
- Sunum ekranında QR kod gösterimi tema ayarına bağlıdır  

### 4. Sunum (projektör)

1. Etkinlikten **Sunum** veya doğrudan `/events/{id}/live`  
2. Görünümler: **Giriş** (QR/PIN), **Duvar**, **Tek tek**  
3. Moderasyon paneli üzerinden soru onayı  

### 5. Katılımcı deneyimi

1. Join linkine gider  
2. PIN (gerekirse) ve kayıt alanları (isim, avatar, KVKK vb. etkinlik ayarına göre)  
3. Bağlandıktan sonra soru yazar ve gönderir  
4. Moderasyon onayından sonra sunumda görünür  

---

## ⚙️ Ayarlar ve Yapılandırma

### Ortam değişkenleri

Tüm örnekler ve açıklamalar: **`site/.env.example`**.

Özet (gerçek değerler repoda tutulmaz):

| Alan | Örnek / not |
|------|-------------|
| `DATABASE_URL` | PostgreSQL bağlantısı |
| `REDIS_PASSWORD`, `REDIS_URL` | Redis |
| `JWT_SECRET` | Oturum imzası |
| `API_URL` | Portal container içinden API (örn. `http://soruyorum-api-server:4000`) |
| `NEXT_PUBLIC_*` | İstemciye gömülür; **build zamanında** sabitlenir |
| `PUBLIC_PLANS_ENABLED` | `/plans` rotasını açar |
| `PRICING_PREVIEW_TOKEN` | `/plans-preview?preview=…` |
| PayTR, SMTP/Brevo, NetGSM | Opsiyonel ürün özellikleri |
| `DOMAIN_SYSTEM_BASE`, Cloudflare | Özel alan SaaS |

Üretim dosyası örneği: **`/etc/soruyorum/portal-api.env`**

### Varsayılan etkinlik / tema davranışı

| Ayar | Varsayılan (kod geneli) | Açıklama |
|------|-------------------------|----------|
| `bgAnimationType` | `gradient` | Arka plan animasyon tipi |
| `bgAnimation` | etkinlik/theme’e göre | Animasyon katmanı açık/kapalı |
| `event_type` | `quiz` (yapılandırmaya bağlı) | API `ALLOWED_EVENT_TYPES` ile kısıtlanabilir |
| Sunum metinleri | boş veya şablon | `settings.theme` JSON içinde |

---

## 🔧 Teknik Detaylar

### API ve iletişim

- Portal, API ile **tRPC** ve route handler proxy’leri üzerinden konuşur (ör. `events.getPublicInfo`).  
- Katılım ve public uçlar: `app/api/public/*`, `join-info`, `join`, vb.  

### Güvenlik (özet)

- Şifre hash, JWT oturum  
- HTTPS (Traefik + Let’s Encrypt)  
- İsteğe bağlı e-posta doğrulama, 2FA alanları (kullanıcı modelinde)  
- Ödeme ve hassas anahtarlar yalnızca sunucu ortamında  

### Performans

- Next.js standalone Docker imajı  
- Redis ile yoğun oturum / cache senaryoları  
- Canlı ekranda bazı veriler için kısa aralıklı yenileme (ör. public info polling)  

---

## 📱 Demo modu

- Bayrak: **`NEXT_PUBLIC_DEMO_MODE=true`** (veya `1` / `yes` / `on`) — **build-time**; compose’ta sıkça açıktır.  
- **Canlı sunum** sayfasında: demo açıkken, platform markası açık etkinliklerde ve kullanıcı **tam yetkili rolde değilse** ekranda **yarı saydam merkez filigran** gösterilebilir (`live/page.tsx` — `showDemoWatermark`).  

Demo ile üretim davranışını karıştırmamak için gerçek müşteri ortamında `NEXT_PUBLIC_DEMO_MODE=false` ile **portal imajını yeniden build** edin.

---

## 🚀 Deployment

### Docker ile stack’i kaldırma (`site` dizini)

```bash
cd /srv/webhosting/soruyorum.online/site
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build
```

### Sadece portal

```bash
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build soruyorum-portal
```

### Script (site kökünden)

```bash
cd /srv/webhosting/soruyorum.online/site
bash scripts/deploy-soruyorum.sh up
bash scripts/deploy-soruyorum.sh ps
bash scripts/deploy-soruyorum.sh logs soruyorum-portal
```

### Konteyner durumu

```bash
docker compose -p soruyorum -f docker-compose.yml -f docker-compose.traefik.yml ps
```

### Log

```bash
docker logs soruyorum-soruyorum-portal-1 -f
docker logs soruyorum-soruyorum-api-server-1 -f
```

*(Konteyner adları ortamda `docker ps` ile doğrulanmalıdır.)*

### Veritabanı yedek

PostgreSQL harici olduğundan, barındırdığınız sunucuda `pg_dump` kullanın (connection string `DATABASE_URL`).

---

## 📝 Son Değişiklikler

> Tarihleri güncel tutmak için: `git log --oneline -30`

Örnek kayıtlar (depoya göre değişir):

- Pazarlama header / oturum durumu (ana sayfa, fiyat önizleme)  
- Billing ops ve ödeme aktivasyon akışı düzeltmeleri  
- Sunum başlığı senkronu ve premium faturalama iyileştirmeleri  
- Tema: canlı metin + logo konum kontrolleri  
- Quiz editörü: önizleme + özellikler paneli yerleşimi (geniş ekranda yan yana grid)  

---

## 👨‍💻 Geliştirici notları

- **Node:** ≥ 20, **pnpm** workspace (`site/package.json`).  
- Yerel geliştirme: `cd site && pnpm dev` (Turbo).  
- Prisma migrate sonrası API ve portal’ı yeniden başlatın veya imajı yeniden build edin.  
- `NEXT_PUBLIC_*` değişince **portal Docker build** şart.  
- `QuizEditorV2.tsx` çok büyük bir bileşen; UI düzeni ve tema kontrolleri burada toplanmıştır.  
- Join ve live sayfalarında yeni bir `bgAnimationType` eklerken **iki dosyayı** birlikte güncelleyin: `join/page.tsx`, `live/page.tsx`.  
- Sunucu bileşenlerinde `"use client"` modüllerini doğrudan import etmeyin; paylaşılan yardımcılar `lib/` altında sunucu-uyumlu olacak şekilde ayrılmalıdır.  

---

## 📞 İletişim

**Soruyorum.online**

- Web: https://soruyorum.online  
- Geliştirici / kurumsal iletişim: compose ve sitede görünen `NEXT_PUBLIC_UPGRADE_CONTACT_*` veya organizasyon içi süreçlerinize göre güncelleyin.  

---

*Bu belge mimari özet içindir. Son güncelleme: Mart 2026*
