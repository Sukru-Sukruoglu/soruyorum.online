# SoruYorum Operasyonel Rapor

Tarih: 18 Mart 2026

## Kapsam

Bu rapor, 17-18 Mart 2026 boyunca SoruYorum portalinda ele alinan teknik, operasyonel ve urun kurali konularinin ozetini icerir.

## 1. Ayarlar > Domainler Runtime Hatasi

- Belirti: Ayarlar ekraninda Domainler veya Abonelik sekmesine gecis sirasinda `ReferenceError: Cannot access 'V' before initialization` hatasi olustu.
- Kok neden: Domain ayarlari bileseninde bazi `const` degerler tanimlanmadan once kullaniliyordu.
- Uygulanan cozum: Degisken tanim sirasi duzeltildi.
- Sonuc: Runtime hata giderildi ve ayarlar sayfasi yeniden calisir hale geldi.

## 2. Canli Sitede 503 Kesintisi

- Belirti: `https://soruyorum.online/dashboard` ve diger dashboard rotalari 503 dondu.
- Kok neden: Servisler temel compose ile yeniden kalkti; Traefik override dosyasi devreye alinmadigi icin label ve `infra-network` baglantilari kayboldu.
- Uygulanan cozum: Servisler `docker-compose.yml` ve `docker-compose.traefik.yml` birlikte kullanilarak yeniden ayaga kaldirildi.
- Sonuc: Dis erisim geri geldi, dashboard ve ayar rotalari tekrar 200 donmeye basladi.

## 3. Super Admin Yetki Acigi

- Belirti: Yeni kayit olan normal bir kullanici `Billing Ops`, `Canli Izleme`, `Fiyatlandirma Yonetimi` ve `Kullanicilar` gibi sadece super admin alanlarini gorebildi.
- Kok neden 1: Backend tarafinda `admin` rolu yanlislikla varsayilan super admin rolleri listesine eklenmisti.
- Kok neden 2: Portal oturum rolu yalnizca token claim'lerinden okunuyordu; veritabani rolu ile tekrar dogrulanmiyordu.
- Uygulanan cozum:
- Varsayilan super admin rol listesi sikilastirildi.
- Portal session cevabi veritabani kaynakli rol ile beslendi.
- Canli Izleme sayfasina eksik olan super admin guard eklendi.
- Sonuc: Super admin menuleri ve sayfalari normal kullanicilar icin kapatildi.

## 4. Paket ve Yetki Matrisi

Sistemde tanimli temel planlar asagidadir:

- Free
- Event Starter
- Event Standard
- Event Professional
- Starter WL
- Standard WL
- Professional WL
- Corporate
- Corporate Pro
- Corporate WL
- Corporate Pro WL

Temel yetki kurallari:

- White-label yalnizca WL paketlerde aciktir.
- Ozel domain ve subdomain yalnizca WL paketlerde aciktir.
- Full branding yalnizca WL paketlerde aciktir.
- Event Starter, Event Standard ve Event Professional tek etkinlik mantigiyla calisir.
- Corporate ailesi sinirsiz etkinlik mantigiyla calisir.
- Free hesapta varsayilan deneme suresi 14 gundur.

## 5. Paket Gecislerinde Yetki Davranisi

Sistemin mevcut calisma bicimi su sekildedir:

- Bir organizasyonda birden fazla aktif abonelik varsa, sistem en guclu aktif paketi `effective plan` olarak secer.
- Ornek: Bir hesapta hem `Event Starter` hem `Corporate WL` aktifse, sistem `Corporate WL` yetkilerini kullanir.

Bu durumda acilan yetkiler:

- Full branding
- Logo yukleme ve gelismis tasarimlar
- Ozel domain / subdomain
- Sinirsiz etkinlik
- Corporate WL icin 500 kisiye kadar katilimci limiti
- Corporate Pro WL icin 2000 kisiye kadar katilimci limiti

Acilmayan yetkiler:

- Super admin menu ve sayfalari
- Billing Ops
- Kullanicilar
- Canli Izleme
- Fiyatlandirma yonetimi

## 6. Mevcut Eventlerde Katilimci Limiti Davranisi

Mevcut mantikta event olusturuldugu andaki limit event kaydina yazilir. Paket sonradan yukselirse su davranis gecerlidir:

- Ornek: Event Starter ile acilan bir event 100 kisilik limit ile olusur.
- Sonra paket Corporate WL'e yukselirse organizasyonun yeni hakki 500 kisi olur.
- Ancak mevcut event limiti otomatik olarak 500'e cikmaz.
- Event duzenleme ekranina girilip yeniden kaydedilirse yeni ust limite kadar artirilabilir.

Operasyonel yorum:

- Yeni eventler yeni paket limitine gore acilir.
- Eski eventler manuel edit/save gerektirebilir.
- Bu durum sistem hatasi degil; mevcut veri modeli ve guvenli davranis tercihidir.

## 7. Branding Kurali

Urun kurali netlestirildi:

- Free ve standart paketlerde platform markasi gorunmelidir.
- Sadece WL paketlerde platform branding kaldirilabilir.
- Branding logo yukleme ve gelismis tema ayarlari hem UI hem backend tarafinda paket yetkisine baglidir.

## 8. Operasyonel Sonuc

Bugun itibariyla sistemin su alanlari dogrulanmistir:

- Dashboard erisimi geri getirildi.
- Ayarlar sayfasindaki runtime hata giderildi.
- Super admin erisim acigi kapatildi.
- Paket bazli branding ve domain kurallari kod seviyesinde dogrulandi.
- Paket gecislerinde en guclu aktif planin secildigi teyit edildi.

Acik operasyon notu:

- Paket yukselmesi sonrasi mevcut event limitlerini otomatik migrate eden bir mekanizma su anda yok.
- Gerekirse daha sonra upgrade sonrasi bilgi bandi veya tek tikla limit guncelleme gelistirilebilir.

## 9. Onerilen Sonraki Adimlar

- Paket yukselmesi sonrasi event edit ekranina "Yeni paket limitiniz hazir" bilgi bandi eklenmesi
- Mevcut eventler icin tek tikla "Paket limitine yukselt" aksiyonu eklenmesi
- Paket kurallarinin satis ve operasyon ekipleri icin tek bir ic dokumanda standartlastirilmasi
