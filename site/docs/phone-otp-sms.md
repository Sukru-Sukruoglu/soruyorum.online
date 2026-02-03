# Telefon Doğrulama (OTP) + SMS Bildirimleri Testi

## 1) ENV ayarları
- Örnek dosya: `.env.example`
- Canlıda/host'ta `.env` içine şu değişkenleri ekleyin:
  - `SMS_PROVIDER=netgsm`
  - `NETGSM_USERNAME=...`
  - `NETGSM_PASSWORD=...`
  - `NETGSM_SENDER=...`
  - (opsiyonel) `PHONE_OTP_SECRET=...` (yoksa `JWT_SECRET` kullanılır)
  - (opsiyonel) `PHONE_OTP_TTL_SECONDS=300`
  - (opsiyonel) `PHONE_OTP_MAX_SENDS_PER_HOUR=5`
  - (opsiyonel) `PHONE_OTP_MESSAGE_TEMPLATE=Doğrulama kodunuz: {{code}}\nBu kodu kimseyle paylaşmayınız.`

Not: `SMS_PROVIDER` boş veya `test` ise sistem SMS göndermez (OTP akışı yine çalışır ama SMS gelmez).

## 2) Deploy / container yenileme
Docker compose kullanıyorsanız env değişikliklerinden sonra servisleri recreate edin (deploy komutunuz ne ise onu kullanın).

## 3) Portal üzerinden uçtan uca test
1. Portal → Ayarlar → Profil (Telefon alanı)
2. Bir telefon girin (TR numarası; farklı formatlar normalize edilir)
3. `Kod Gönder` → telefona SMS gelmeli
4. 6 haneli kodu girip `Doğrula`
5. Doğrulandıktan sonra:
   - Profilde “Doğrulandı” durumu görünür
   - Ayarlar → Bildirimler ekranında `SMS Bildirimleri` toggle artık açılabilir

## 4) Operasyonel notlar
- Çok sık kod istenirse rate-limit devreye girer (`PHONE_OTP_MAX_SENDS_PER_HOUR`).
- Yanlış kod denemeleri 5’ten sonra bloke olur; yeniden kod istenmelidir.
- Prod’da `JWT_SECRET`/`PHONE_OTP_SECRET` mutlaka güçlü olmalı.
