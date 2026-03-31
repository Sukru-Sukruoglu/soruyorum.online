# Preview, Mobil Logo ve Arka Plan Iyilestirme Raporu

## Faz 1: Mobil Tema Temeli

Bu bolum, ayni gelistirme surecinin bu konusmadan once tamamlanmis ilk asamasini ozetler. Yani burada yazanlar ayri bir is degil; bu raporda anlatilan tum iyilestirmelerin baslangic fazidir. Alt kisimlarda ise bu temel uzerine yapilan devam calismalari, duzeltmeler ve nihai mimari yer almaktadir.

### Ilk Asama Ozet Basliklari

Bu ilk asamada mobil katilim ekrani icin temel mobil tema altyapisi kurulmustu.

Yapilan ana basliklar:

1. `MobileThemeSettings` arayuzune yeni alanlar eklendi
2. Mobil tema acildiginda ana ekrani kopyalama mantigi kuruldu
3. Tasarim paneli `Ana Ekran` ve `Mobil Katilim` olarak ikiye ayrildi
4. Mobil panel beyaz kart yerine koyu temaya cekildi
5. Join sayfasinda hero logo buyuk ve ortali standalone gorunume alindi
6. Join butonundaki roket emojisi kaldirildi
7. Hero panel, baslik ve alt baslik icin renk ozellestirme alanlari eklendi
8. Mobil animasyon icin ac/kapat kontrolu eklendi
9. API tarafinda mobil join ekranina yeni tema alanlari donduruldu

### Ilk Asamada Degisen Alanlar

Ilk asamada degistigi not edilen dosyalar:

1. `apps/portal/src/components/events/QuizEditorV2.tsx`
2. `apps/portal/src/app/(public)/join/page.tsx`
3. `services/api-server/src/routes/participants.ts`

### Ilk Asamadaki Teknik Kazanimlar

#### 1. Mobil tema veri modeli genisletildi

Mobil tema tarafina su alanlar eklenmisti:

1. `heroLogoUrl`
2. `heroPanelColor`
3. `heroTitleColor`
4. `heroSubtitleColor`

Bu alanlar sayesinde mobil join ekraninin ust hero bolumu ayri stillenebilir hale geldi.

#### 2. Ana ekrandan mobil temaya kopyalama akisi kuruldu

Mobil tema ilk acildiginda ana tema degerlerini baz alan bir kopya uretiliyordu. Bu sayede kullanici mobil tasarima sifirdan baslamak zorunda kalmiyordu.

Bu mantik iki yonde kullanildi:

1. Mobil temayi ilk etkinlestirme
2. `Ana Ekrani Kopyala` aksiyonu

#### 3. Tasarim paneli ayrildi

Editor icindeki tasarim paneli iki mantiksal bolume ayrildi:

1. `Ana Ekran`
2. `Mobil Katilim`

Bu ayrim sayesinde desktop presentation tasarimi ile mobil join tasarimi birbirine karismadan yonetilebilir hale geldi.

#### 4. Mobil panel dark theme oldu

Mobil ayar paneli beyaz zemin yerine koyu tonlara cekildi. Bu degisiklik hem editorun genel gorunumune daha iyi uydu hem de mobil odakli ayarlari ayristirdi.

#### 5. Join ekranindaki logo sunumu degisti

Logo, kucuk ikon kutusundan alinip hero bolumde buyuk, ortali ve daha kurumsal gorunume cekildi.

#### 6. Hero bolumu renk bazli ozellestirildi

Mobil join ekraninda:

1. Hero panel zemini
2. Hero baslik rengi
3. Hero alt baslik rengi

ayri ayarlanabilir hale geldi.

#### 7. Mobil animasyon ac/kapat mantigi eklendi

Mobil panel uzerinde background animasyonunu ayri acip kapatmak icin switch eklendi.

#### 8. API'de mobil tema alanlari genisletildi

`participants.ts` tarafinda join ekranina dondurulen payload, mobil hero alanlarini da kapsayacak sekilde genisletildi.

### Ilk Asama Sonunda Acik Kalan Bug

Ilk asama sonunda `siyah flash` problemi hala acik bug olarak isaretlenmisti.

Bu raporun devamindaki bolumlerde o acik bug'un nasil cozuldugu ayrintili sekilde anlatilmaktadir.

## Faz 2: Preview, Logo ve Arka Plan Stabilizasyonu

### Amac

Bu dokuman, editorde kullanilan canli preview, mobil preview, logo yonetimi, arka plan okunabilirligi ve mobil performans iyilestirmelerini baska bir projede tekrar uygulayabilmek icin hazirlanmistir.

Bu calismada cozulmus basliklar:

1. Sunum gecislerinde siyah flash sorunu
2. Editor iframe preview yeniden yukleme flash'i
3. Mobil preview ile ana preview arasindaki gecikme ve ara ekran sorunu
4. Sunum Logosu ve Mobil Logo ayrimi
5. Koyu arka planlarda logo gorunurlugu
6. Warp arka planinda metin kontrasti
7. Gradient Dots efektinin mobilde bozuk gorunmesi
8. Mobil join ekraninda buton ve kart stil tutarliligi

---

### Genel Mimari Ozet

Sistem 4 ana bolumde duzenlendi:

1. `QuizEditorV2.tsx`
   Editor, ana preview, mobil preview, logo kontrolleri ve preview sync mekanigi burada yonetiliyor.

2. `live/page.tsx`
   Sunum ekrani, wall / join / rotate gibi presentation state'lerini ve logo render davranisini tasiyor.

3. `join/page.tsx`
   Mobil katilim ekrani, mobil tema, mobil logo ve editor embed preview mesajlarini dinliyor.

4. `participants.ts`
   Mobil join ekranina normalize edilmis theme payload donduruyor.

---

### 1. Sunum Gecislerinde Siyah Flash Sorunu

### Problem

Sunum ekraninda view degisimi yapildiginda, yeni ekran mount edilmeden once arada siyah veya bos bir frame gorunuyordu.

### Kok Neden

1. Presentation layout seviyesinde sabit arka plan yoktu
2. View degisiminde ortak parent bos gorunuyordu
3. View'lar mount/unmount olurken gecis animasyonu yoktu

### Cozum

`(presentation)/layout.tsx` seviyesinde kalici koyu bir arka plan eklendi ve ortak bir `viewFadeIn` keyframe tanimlandi.

### Uygulama Notu

Birden fazla fullscreen presentation state'in oldugu tum projelerde, ortak layout seviyesinde sabit background tutmak gerekir. Aksi halde gecis aninda bos frame gorunur.

---

### 2. Editor Preview Iframe Flash Sorunu

### Problem

Editorde bir ayar degistiginde preview iframe bazen tamamen yok olup yeniden geliyordu. Bu da siyah ekran flash'i olusturuyordu.

### Ilk Kok Neden

Preview iframe `src` degisikliginde tamamen yeniden yukleniyordu.

### Son Kok Neden

Ilk double-buffer denemesinde arka iframe yuklendikten sonra on iframe'in `src` degeri de degistiriliyordu. Bu nedenle gorunen iframe yine yeniden yukleme aliyordu.

### Nihai Cozum

`ScaledIframe` bileseni A/B swap mantigina cevrildi:

1. Iki kalici iframe tutuluyor: A ve B
2. Gorunen iframe `front`, digeri `back`
3. Yeni `src`, sadece arka iframe'e veriliyor
4. `onLoad` sonrasi sadece `front/back` rolu degisiyor
5. Gorunen iframe'in `src` degeri sonradan tekrar overwrite edilmiyor

### Neden Bu Yontem Dogru

Boylece kullanici her zaman ya eski goruntuyu ya da tamamen yuklenmis yeni goruntuyu goruyor. Aradaki bos ekran hic gosterilmiyor.

### Tasinabilir Kalip

Bu yapi su senaryolarda tekrar kullanilabilir:

1. CMS editor preview
2. Email template preview
3. Landing page builder preview
4. Sunum / yayin / kiosk editorleri

---

### 3. Ana Preview ve Mobil Preview Sync Sorunu

### Problem

Ana preview degisiklikleri hizli alirken mobil preview gecikmeli geliyordu. Bazi durumlarda mobil preview once yanlis ekran gosterip sonra dogru hale donuyordu.

### Kok Neden

1. Ana preview `postMessage` ile yerinde guncelleniyordu
2. Mobil preview ise nonce artirip `src` yenileyerek full reload aliyordu
3. `/join` preview tarafi parent'tan gelen preview mesajlarini dinlemiyordu
4. Mobil taraf preview modunda bile polling'e bagimliydi

### Cozum

#### Editor Tarafi

1. Mobil iframe icin ayri ref eklendi: `mobilePreviewIframeRef`
2. `buildMobilePreviewTheme()` fonksiyonu yazildi
3. Mobil preview'a tam theme snapshot gonderen `postMobilePreviewSettings()` eklendi
4. Tema degisikliklerinde mobil preview reload'u kaldirildi
5. Mobil preview icin `postMessage` ile anlik guncelleme akisi eklendi

#### Join Tarafi

1. Preview modunda parent'a `SORUYORUM_PREVIEW_READY` mesajı gonderiliyor
2. `SORUYORUM_PREVIEW_SETTINGS` icin `window.message` listener eklendi
3. Gelen payload `themeSettings` state'ine merge ediliyor

### Sonuc

Mobil preview artik:

1. Full reload yerine anlik state merge aliyor
2. Ara ekran veya gecici yanlis gorunum gostermiyor
3. Ana preview'a daha yakin bir davranis sergiliyor

---

### 4. Sunum Logosu ve Mobil Logo Ayrimi

### Problem

Sunum logosu yuklenince ayni logo mobil ekranda da cikiyordu. Veri modeli ve fallback zinciri karisikti.

### Kok Neden

1. `logoUrl` ve `rightLogoUrl` fallback zinciri ic iceydi
2. Join page bazen `rightLogoUrl || logoUrl` mantigiyla calisiyordu
3. Editor overlay ve live tarafinda mobil logo ile sunum logosu ayrimi tam net degildi

### Cozum

1. `Sag Logo` mantigi `Mobil Logo` olarak netlestirildi
2. Sunum ekranda sadece sol / presentation logo kullanildi
3. Mobil join tarafinda sadece `rightLogoUrl` kullanildi
4. API tarafinda mobil logo alanlari ayri donduruldu
5. Mobil logo ana ekran / wall tarafindan kaldirildi

### Mimari Ders

Presentation branding ile mobile branding ayni varlik gibi modellenmemeli. Bu iki alan veri modelinde ayri tutulmali.

---

### 5. Logo Golge Efekti

### Ilk Durum

Koyu arka planlarda logo zor gorundugu icin tum logolara sabit beyaz glow eklendi.

### Sonradan Gelen Ihtiyac

Glow her zaman acik olmasin, editor uzerinden acilip kapatilabilsin ve rengi secilebilsin.

### Yapilan Cozum

`LogoSettings` yapisina sunlar eklendi:

1. `shadow?: boolean`
2. `shadowColor?: string`

Editor'de iki logo icin de su kontroller eklendi:

1. `Golge` checkbox
2. `input type="color"`

Glow efekti ancak checkbox aciksa uygulanıyor.

### Uygulanan Noktalar

1. Editor overlay logo preview
2. Live page presentation logo render
3. Join page mobil logo render
4. API tarafinda mobil logo icin `rightLogoShadow` ve `rightLogoShadowColor`

### Mimari Ders

Gorsel efektleri sabit davranis olarak degil, veri modeli ile kontrol edilebilir state olarak sunmak daha dogrudur.

---

### 6. Warp Arka Planinda Metin Kontrasti

### Problem

Warp arka plan acik ve turkuaz tonlar icerdigi icin beyaz yazi okunmaz hale geliyordu.

### Cozum

#### Live Page

`bgAnimationType === 'warp'` ise:

1. `textColor` koyu yapildi
2. `textColorSecondary` koyu yari saydam yapildi
3. `textColorMuted` koyu daha dusuk opacity yapildi

#### Join Page

`data-warp` attribute'u ile CSS override kullanildi.

Bu override su alanlari degistiriyor:

1. `text-white` tonlari siyaha donuyor
2. Beyaz placeholder tonlari siyahimsi hale geliyor
3. Karti ve input'u tasiyan yari saydam beyaz paneller daha okunur hale geliyor

### Mimari Ders

Arka plan turune gore otomatik tipografi override etmek, sabit renk secmekten daha dogru bir yaklasimdir.

---

### 7. Gradient Dots Mobil Optimizasyonu

### Problem

`GradientDotsBackground` mobilde titresek, bozuk veya asiri yogun gorunuyordu.

### Kok Neden

1. Cok fazla gradient katmani vardi
2. Animasyon araligi buyuktu
3. Dot araligi kucuktu
4. Mobil GPU icin gereksiz derecede pahaliydi

### Cozum

1. Dot spacing buyutuldu
2. Dot size buyutuldu
3. Gradient katmani azaltildi
4. Animasyon menzili dusuruldu
5. Animasyon suresi uzatildi

### Mimari Ders

Desktop odakli shader ve gradient arka planlar mobilde ayri optimize edilmelidir. Ayni efektin basitlestirilmis bir versiyonu daha iyi sonuc verir.

---

### 8. Mobil Join UI Tutarliligi

### Yapilanlar

1. `Soruyu Gonder` butonu glassmorphism stile cekildi
2. Butona beyaz cerceve eklendi
3. `Soru Sor` karti ile daha uyumlu bir gorunum elde edildi

### Neden

Join ekraninda kart ve CTA elementlerinin ayni gorsel aileye ait oldugu hissini vermek icin.

---

### 9. API Tarafindaki Normalize Theme Mantigi

Mobil join ekranina dogrudan ham DB theme objesi degil, normalize edilmis bir `theme` payload donuldu.

Bu payload su alanlari iceriyor:

1. `bgAnimation`
2. `bgAnimationType`
3. `auroraColorPreset`
4. `colorPalette`
5. `backgroundColor`
6. `backgroundImage`
7. `background`
8. `textColor`
9. `buttonColorStart`
10. `buttonColorEnd`
11. `heroLogoUrl`
12. `heroPanelColor`
13. `heroTitleColor`
14. `heroSubtitleColor`
15. `logoUrl`
16. `rightLogoUrl`
17. `rightLogoShadow`
18. `rightLogoShadowColor`

### Mimari Ders

Frontend'de theme hesaplatmak yerine API'de normalize theme dondurmek daha stabil bir cozumdur.

---

## Faz 3: Nihai Mimari ve Tasinabilir Uygulama Rehberi

### Dosya Bazli Degisiklik Haritasi

### 1. `site/apps/portal/src/components/events/QuizEditorV2.tsx`

Ana sorumluluklar:

1. `ScaledIframe` A/B swap double-buffer
2. `livePreviewIframeRef`
3. `mobilePreviewIframeRef`
4. `postPreviewUpdate`
5. `postPreviewSettings`
6. `buildMobilePreviewTheme`
7. `postMobilePreviewSettings`
8. Logo UI ve shadow kontrolleri

### 2. `site/apps/portal/src/app/(presentation)/events/[id]/live/page.tsx`

Ana sorumluluklar:

1. Presentation logo render
2. Warp modunda koyu text override
3. Logo shadow uygulamasi
4. Presentation genel okunabilirlik ayarlari

### 3. `site/apps/portal/src/app/(public)/join/page.tsx`

Ana sorumluluklar:

1. Mobil preview READY handshake
2. Preview settings message listener
3. Mobil logo render
4. Logo glow uygulamasi
5. Warp modunda metin override
6. Mobil CTA button glass stili

### 4. `site/apps/portal/src/app/(presentation)/layout.tsx`

Ana sorumluluklar:

1. Kalici arka plan
2. `viewFadeIn` keyframes

### 5. `site/apps/portal/src/components/ui/gradient-dots-background.tsx`

Ana sorumluluklar:

1. Mobil dostu dots pattern
2. Daha dengeli animasyon yukleri

### 6. `site/services/api-server/src/routes/participants.ts`

Ana sorumluluklar:

1. Join page'e normalize theme response
2. Mobil logo shadow alanlari
3. `rightLogoUrl` ayrimi

---

### Baska Bir Yerde Uygulamak Icin Adim Adim Plan

1. Presentation / editor preview varsa iframe yenileme davranisini incele
2. `src` degisimlerinde flicker varsa A/B swap double-buffer yapisina gec
3. Parent editor ile child preview arasina `postMessage` tabanli sync ekle
4. Child preview sayfasina `READY` handshake ekle
5. Tema degisikliklerini reload yerine message ile merge et
6. Mobil branding ve presentation branding alanlarini ayir
7. API response'unu normalize theme object olarak duzenle
8. Background tipine gore text contrast override kur
9. Mobilde agir shader / dots / particles efektlerini sadeleştir
10. Logo glow gibi efektleri state tabanli opsiyonel ozellik yap

---

### Yeniden Kullanilabilir Prompt

Asagidaki prompt'u baska bir projede kullanabilirsin:

```md
Benim editor tabanli bir preview sistemim var. Su problemleri birlikte sistematik olarak cozelim:

1. Ana preview veya sunum iframe'i ayar degistiginde siyah flash veriyor
2. Mobil preview ana preview ile senkron degil
3. Mobil preview bazen once yanlis state / ekran gosterip sonra dogru hale geliyor
4. Presentation logo ile mobile logo birbirine karisiyor, tamamen ayrilmali
5. Koyu arka planlarda logolar zayif gorunuyor; glow opsiyonel olmali, renk secilebilir olmali
6. Acik renkli / warp benzeri arka planlarda yazi kontrasti otomatik ayarlanmalı
7. Mobilde dots / shader / particle tarzı arka planlar bozuk veya agir gorunuyor, optimize edilmeli
8. Join ekranindaki kart ve buton stilleri tutarli hale getirilmeli

Lutfen su yaklasimla ilerle:

1. Once preview mimarisini incele
2. Iframe'ler nasil render ediliyor, hangi degisikliklerde reload oluyor, hangileri postMessage ile gidiyor bunu tespit et
3. Full reload yerine mumkun olan her yerde postMessage ile state merge uygula
4. Gerekirse A/B swap double-buffer iframe sistemi kur
5. Parent-child preview arasina READY handshake ekle
6. Mobil preview icin tam theme snapshot gonderen bir helper kur
7. API tarafinda mobil join sayfasina normalize theme payload dondur
8. Presentation logo ve mobile logo alanlarini fallback'siz ayir
9. Logo glow'u checkbox + color picker ile editor ayari yap
10. Warp benzeri arka planlarda text contrast override uygula
11. Mobilde agir background animasyonlarini sadeleştir

Bekledigim cikti:

1. Kok neden analizi
2. Dosya bazli degisiklik listesi
3. Uygulanmis cozum
4. Build / deploy adimlari
5. Baska projeye tasinabilir mimari ozet

Kod degisikligi gerekiyorsa dogrudan uygula. Gereksiz reload, gereksiz fallback ve cakisan branding mantiklarini temizle.
```

---

### Kisa Sonuc

Bu calisma sonunda sistem su hale getirildi:

1. Presentation gecisleri daha temiz
2. Editor preview flash'i minimize edildi
3. Mobil preview anlik ve daha stabil hale geldi
4. Mobil logo ve sunum logosu tamamen ayrildi
5. Logo glow kullanici kontrollu hale geldi
6. Warp arka planinda okunabilirlik duzeldi
7. Gradient Dots mobilde daha dengeli hale geldi
8. Join ekraninin UI tutarliligi artirildi

---

### Build / Deploy Notu

Portal degisikliklerinden sonra tipik akış:

```bash
cd /srv/webhosting/soruyorum.online/site
pnpm --filter portal build
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build --force-recreate soruyorum-portal
```

API degisiklikleri de varsa:

```bash
cd /srv/webhosting/soruyorum.online/site
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build --force-recreate soruyorum-portal soruyorum-api-server
```
