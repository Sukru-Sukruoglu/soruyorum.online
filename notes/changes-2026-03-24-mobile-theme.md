# Mobil Tema & Join Ekranı Geliştirmeleri — 24 Mart 2026

## Özet

Bu oturumda mobil katılım ekranı (join screen) için logo desteği, renk özelleştirme, tasarım paneli ayrımı ve animasyon kontrolü eklendi.

---

## 1. Değiştirilen Dosyalar

### `apps/portal/src/components/events/QuizEditorV2.tsx`
### `apps/portal/src/app/(public)/join/page.tsx`
### `services/api-server/src/routes/participants.ts`

---

## 2. Yapılan Değişiklikler

### 2.1 MobileThemeSettings Arayüzüne Yeni Alanlar Eklendi

`QuizEditorV2.tsx` içindeki `MobileThemeSettings` interface'ine şu alanlar eklendi:

```typescript
heroLogoUrl: string | null;
heroPanelColor: string | null;
heroTitleColor: string | null;
heroSubtitleColor: string | null;
```

`DEFAULT_MOBILE_THEME_SETTINGS` içinde bu alanlar `null` olarak tanımlandı.

---

### 2.2 Mobil Tema Ana Ekranı Kopyalama Fonksiyonları

```typescript
// Ana ekrandaki tüm tema ayarlarını mobil temaya kopyalar
function buildMobileThemeFromMain(): MobileThemeSettings {
  return {
    ...DEFAULT_MOBILE_THEME_SETTINGS,
    bgType: themePreview.bgType,
    bgColor: themePreview.bgColor,
    bgGradientStart: themePreview.bgGradientStart,
    bgGradientEnd: themePreview.bgGradientEnd,
    bgImageUrl: themePreview.bgImageUrl,
    bgAnimation: themePreview.bgAnimation,
    category: themePreview.category,
    logoUrl: themePreview.logoUrl,
    // ... diğer tema alanları
  };
}

// Mobil tema açıldığında ana ekranı kopyalar
const enableCustomMobileTheme = useCallback(() => {
  const mobileFromMain = buildMobileThemeFromMain();
  setMobileThemePreview(mobileFromMain);
  setMobileThemeEnabled(true);
}, [themePreview]);

// "Ana Ekranı Kopyala" butonu için
const syncMobileThemeWithMain = useCallback(() => {
  const mobileFromMain = buildMobileThemeFromMain();
  setMobileThemePreview(mobileFromMain);
}, [themePreview]);
```

---

### 2.3 Tasarım Paneli Ayrımı: "Ana Ekran" ve "Mobil Katılım"

`designPanelView` state'i eklendi:

```typescript
const [designPanelView, setDesignPanelView] = useState<'main' | 'mobile'>('main');
```

Design `TabsContent` içinde iki sekme butonu:

```tsx
<div className="flex gap-2 mb-4">
  <button
    onClick={() => setDesignPanelView('main')}
    className={designPanelView === 'main' ? 'bg-blue-600 text-white ...' : '...'}
  >
    Ana Ekran
  </button>
  <button
    onClick={() => setDesignPanelView('mobile')}
    className={designPanelView === 'mobile' ? 'bg-blue-600 text-white ...' : '...'}
  >
    Mobil Katılım
  </button>
</div>

{designPanelView === 'main' && (
  // Ana ekran tema/arkaplan/logo kontrolleri
)}

{designPanelView === 'mobile' && (
  // Mobil-özel kart (dark theme)
)}
```

---

### 2.4 Mobil Panel Dark Tema

Mobil panel kartı beyaz yerine koyu renk yapıldı:

```tsx
// Dış kart
<div className="bg-[#232846] border border-[#3d4468] rounded-xl p-4">

// "Ana ekranla eşitle" iç kutusu
<div className="bg-[#2b3153] rounded-lg p-3">

// Metin renkleri
<span className="text-white">...</span>
<span className="text-[#b5bedf]">...</span>
```

---

### 2.5 Join Sayfası: Logo Standalone Gösterimi

`join/page.tsx` — Hero bölümünde logo varsa büyük ve ortalanmış göster:

```tsx
// Önce: logo küçük ikon kutusunda gösteriliyordu
// Sonra:
{heroLogoUrl ? (
  <img
    src={heroLogoUrl}
    alt="Logo"
    className="h-16 max-w-[220px] object-contain drop-shadow-lg mx-auto mb-2"
  />
) : (
  <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
    <MessageSquare className="h-6 w-6 text-white" />
  </div>
)}
```

---

### 2.6 Join Butonundan Roket Emojisi Kaldırıldı

```tsx
// Önce
<button>🚀 Katıl</button>

// Sonra
<button>Katıl</button>
```

---

### 2.7 Hero Bölümü Özelleştirilebilir Renkler

`join/page.tsx` — Hesaplanan stiller:

```typescript
const heroLogoUrl = mobileTheme?.heroLogoUrl ?? null;
const heroPanelStyle = mobileTheme?.heroPanelColor
  ? { backgroundColor: mobileTheme.heroPanelColor }
  : {};
const heroTitleStyle = mobileTheme?.heroTitleColor
  ? { color: mobileTheme.heroTitleColor }
  : {};
const heroSubtitleStyle = mobileTheme?.heroSubtitleColor
  ? { color: mobileTheme.heroSubtitleColor }
  : {};
```

Bu stiller hero paneline, başlığa ve alt yazıya uygulandı.

---

### 2.8 Mobil Animasyon Toggle

Mobil panel içinde animasyonu aç/kapat switch'i:

```tsx
<div className="flex items-center justify-between">
  <Label className="text-white text-sm">Mobil Animasyonu</Label>
  <Switch
    checked={!!mobileThemePreview.bgAnimation}
    onCheckedChange={(checked) =>
      setMobileThemePreview(prev => ({
        ...prev,
        bgAnimation: checked ? (themePreview.bgAnimation || 'particles') : null
      }))
    }
  />
</div>
```

---

### 2.9 API: Yeni Tema Alanları

`services/api-server/src/routes/participants.ts` — `getJoinInfo` endpoint'ine yeni alanlar eklendi:

```typescript
heroLogoUrl: event.mobileThemeSettings?.heroLogoUrl ?? null,
heroPanelColor: event.mobileThemeSettings?.heroPanelColor ?? null,
heroTitleColor: event.mobileThemeSettings?.heroTitleColor ?? null,
heroSubtitleColor: event.mobileThemeSettings?.heroSubtitleColor ?? null,
```

---

## 3. Deploy Komutu

```bash
cd /srv/webhosting/soruyorum.online/site
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build soruyorum-portal soruyorum-api-server
```

---

## 4. Durum Tablosu

| Özellik | Durum |
|---------|-------|
| Mobil hero logo desteği | ✅ Deploy edildi |
| Join butonundan roket kaldırıldı | ✅ Deploy edildi |
| Hero bölümü renk özelleştirme | ✅ Deploy edildi |
| Ana Ekran / Mobil panel ayrımı | ✅ Deploy edildi |
| Mobil, ana ekranı kopyalayarak başlıyor | ✅ Deploy edildi |
| "Ana Ekranı Kopyala" butonu | ✅ Deploy edildi |
| Join ekranında logo standalone görünüm | ✅ Deploy edildi |
| Mobil panel dark kart teması | ✅ Deploy edildi |
| Mobil animasyon toggle | ✅ Deploy edildi |
| Geçişlerde siyah flash bug'ı | 🔴 Henüz çözülmedi |

---

## 5. Açık Bug: Geçişlerde Siyah Flash

`/srv/webhosting/soruyorum.online/notes/Goruntu.gif` dosyasında kayıt var.

- GIF: 700x378, 19.6 saniye, 588 frame, 30fps
- Ekranlar arası geçişlerde (wall↔rotate veya soru değişimi) kısa siyah flash oluyor
- Muhtemel sebep: CSS transition + `opacity-0` / `bg-black` katmanlarının çakışması
- İncelenecek dosyalar:
  - `apps/portal/src/app/(public)/screen/` dizini
  - `apps/portal/src/app/(public)/live/` dizini
  - `ScaledIframe` componenti
  - Transition/animation CSS sınıfları
