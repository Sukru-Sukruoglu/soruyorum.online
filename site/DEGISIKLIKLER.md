# Soruyorum.Online — Değişiklik Günlüğü

## 📅 25 Mart 2026 — Repo Kimliği ve Deploy Ayrımı Netleştirildi

### Sorun
- Soruyorum repo kök paketi halen `ks-interaktif` adıyla görünüyordu.
- Operasyon komutları standartlaştırılmadığı için yanlış repodan yanlış compose dosyasını çalıştırma riski vardı.

### Düzeltme
- Kök `package.json` adı `soruyorum-online` olarak güncellendi.
- Soruyorum stack'i için tek yerden çalışan namespaced operasyon komutları eklendi:
  - `pnpm ops:up`
  - `pnpm ops:down`
  - `pnpm ops:ps`
  - `pnpm ops:logs`
  - `pnpm ops:config`
- Bu komutlar her zaman mevcut repo kökünden `docker compose -p soruyorum -f docker-compose.yml -f docker-compose.traefik.yml ...` çalıştırır.

## 📅 24 Mart 2026 — Editör 401 / Auth Session Uyumluluk Düzeltmesi

### Sorun
- `events/[id]/edit` ekranı bazı oturumlarda bozulmuş görünüyordu.
- Tarayıcı konsolunda `GET /api/events/:id 401 (Unauthorized)` hatası düşüyordu.
- Editör gerçek event verisini çekemediği için varsayılan slide state ile açılıyordu.

### Kök Neden
- Portal auth cookie içeriği her zaman JWT varsayılıyordu.
- Bazı kullanıcılarda cookie içinde eski tip Lucia session id kalmıştı.
- Portal session çözümleme akışı bu eski değeri geçersiz sayıyor, event API middleware'i ise yalnız JWT kabul ettiği için event fetch yetkisiz kalıyordu.

### Düzeltme
- Portal session çözümleme akışına legacy Lucia session fallback eklendi.
- API server auth middleware'ine legacy session doğrulama desteği eklendi.
- Event tenant middleware'ine de aynı fallback eklendi.
- Portal ve API server yeniden build edilip canlıya alındı.

### Kalıcı Not
- Ayrıntılı teknik not ve tekrarını önleme checklist'i:
  - `notes/changes-2026-03-24-auth-session-incident.md`

## 📅 13-14 Şubat 2025 — Yapılanlar

### 1. 🌐 LAN Erişimi
- Tüm servislerin (portal `3001`, play `3002`, admin `3003`, web `3005`, API `4000`) LAN üzerinden erişilebilir hale getirildi
- `package.json` dev scriptlerinde `-H 0.0.0.0` eklendi
- API `server.ts` → `app.listen('0.0.0.0')` binding yapıldı
- `nodemon` devDependency olarak eklendi

### 2. 📱 Mobil Erişim
- Mobil cihazlardan `http://192.168.68.73:3001/join?pin=XXXX` ile etkinliklere katılım sağlandı
- URL referansları port `3002` → `3001` olarak güncellendi

### 3. 🌙 Q&A Moderatör Paneli — Koyu Tema
- **Dosya:** `apps/portal/src/components/events/QandaModerator.tsx`
- Tüm panel koyu lacivert/mor temaya dönüştürüldü
- Metin renkleri beyaz/açık gri yapıldı
- Buton ve kart stilleri dark temaya uyumlu hale getirildi
- Onaylı/Reddedilmiş/Bekleyen badge'ler yeniden stillendirildi

### 4. 🎆 "Neden Soru-Yorum" Arka Plan Efekti
- **Dosya:** `apps/portal/src/components/events/QandaModerator.tsx`
- Ana sayfanın `why-choose-one` bölümündeki arka plan moderatör paneline uygulandı:
  - Taban renk: `#11223D`
  - Sol indigo glow: `#6669D8` (%70 opaklık)
  - Sağ pembe glow: `rgba(250,86,116,0.63)` (%60 opaklık)
  - Yüzen dekoratif shape resmi (`floatBobY` animasyonu)
- **Dosya:** `apps/portal/src/app/globals.css` — `floatBobY` animasyonu eklendi

### 5. 🧹 Gereksiz HTML Dosyaları Temizliği
- Aşağıdaki HTML dosyaları silindi (TSX versiyonları zaten mevcut):
  - `apps/web/public/privacy.html`
  - `apps/web/public/terms.html`
  - `apps/web/public/data-deletion.html`
  - `apps/portal/public/acik-riza.html`
  - `apps/portal/public/kvkk.html`
  - `apps/web/public/yeni/` klasörünün tamamı (35 template dosyası)
  - `apps/portal/src/app/page1.tsx` (test dosyası)
  - `public_html/index.html` (test dosyası)

---

## 🚀 Deploy Planı (Bu Gece)

### FileZilla ile Atılacaklar:
- ✅ Tüm dosyalar (`.env` hariç)

### ⛔ FileZilla ile ATILMAYACAKLAR:
- ❌ `.env` (production URL'leri ezer!)
- ❌ `.env.local` / `apps/portal/.env.local` (local ayarlar)

### Deploy Sonrası:
1. Sunucuda `build` komutunu çalıştır
2. Siteyi kontrol et: `https://soruyorum.online`

---

## 📋 Yapılacaklar (Gelecek)

- [ ] Deploy sonrası site testi
- [ ] Diğer bileşenlerde de dark tema tutarlılığı kontrolü
- [ ] Gerekirse diğer sayfaların da koyu temaya çevrilmesi
