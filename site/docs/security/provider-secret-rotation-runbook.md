# Provider Secret Rotation Runbook

Bu dokuman git disina alinmis production secret yapisina gore canli rotasyon icin kullanilir.

## Ortak prosedur

1. Provider panelinde yeni credential olustur.
2. `/etc/soruyorum/portal-api.env` icindeki ilgili alanlari guncelle.
3. Ilgili servisi kontrollu yeniden baslat:
   `cd /srv/webhosting/soruyorum.online/site && docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d soruyorum-api-server soruyorum-portal`
4. Canli smoke test yap.
5. Uygulama loglarini kontrol et.
6. Eski credential'i provider panelinden `revoke` et.
7. Olay kaydi birak: tarih, kim dondurdu, hangi ortam, test sonucu.

## PayTR

### Rotate edilecek alanlar

- `PAYTR_MERCHANT_KEY`
- `PAYTR_MERCHANT_SALT`
- Ayrica varsa panelde callback/signature icin ayri secret

### Env alanlari

- `PAYTR_MERCHANT_ID`
- `PAYTR_MERCHANT_KEY`
- `PAYTR_MERCHANT_SALT`
- `PAYTR_OK_URL`
- `PAYTR_FAIL_URL`

### Smoke test

1. Odeme baslatma istegi olusuyor mu kontrol et.
2. Basarili odeme akisini test et.
3. Basarisiz odeme akisini test et.
4. Callback loglarinda `signature mismatch` var mi kontrol et.
5. Gerekliyse iade/iptal sonrasi webhook davranisini test et.

### Basari kriteri

- Token/hash dogrulamasi yeni degerlerle geciyor.
- Callback 2xx donuyor.
- Uygulama loglarinda imza uyumsuzlugu yok.

## NetGSM

### Rotate edilecek alanlar

- `NETGSM_USERNAME`
- `NETGSM_PASSWORD`
- `NETGSM_SENDER`
- Varsa IP whitelist veya ek auth ayarlari

### Env alanlari

- `SMS_PROVIDER`
- `NETGSM_USERNAME`
- `NETGSM_PASSWORD`
- `NETGSM_SENDER`
- `NETGSM_ENDPOINT`

### Smoke test

1. Tek bir OTP gonderimi yap.
2. Yanlis credential ile erisimin reddedildigini dogrula.
3. Rate limit davranisi bozulmadi mi kontrol et.
4. Delivery raporu veya donus kodlari beklenen mi kontrol et.

### Basari kriteri

- OTP gonderimi basarili.
- Auth fail logu yok.
- Sender title ve delivery cevabi beklenen.

## SMTP

### Rotate edilecek alanlar

- `SMTP_PASS`
- Varsa relay token veya app password
- Varsa ayri admin erisimleri

### Env alanlari

- `MAIL_PROVIDER`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `MAIL_FROM`
- `MAIL_FROM_NAME`

### Smoke test

1. Register mail akisini test et.
2. Verify mail akisini test et.
3. Reset password mail akisini test et.
4. Kuyruk varsa takilan job var mi bak.
5. SMTP auth veya TLS hatasi var mi loglardan kontrol et.

### Basari kriteri

- Mail gonderimi basarili.
- TLS baglantisi ve auth temiz.
- SPF/DKIM/DMARC tarafinda beklenmeyen bir bozulma yok.

## Cloudflare

### Rotate edilecek alanlar

- `CLOUDFLARE_SAAS_API_TOKEN`
- Varsa tum global API key kullanimlari

### Scope ilkesi

- Sadece gereken zone
- Sadece gereken yetki
- DNS gerekiyorsa sadece DNS write
- Cache purge gerekiyorsa sadece purge yetkisi
- Account-wide tam yetki verme

### Env alanlari

- `CLOUDFLARE_SAAS_ZONE_ID`
- `CLOUDFLARE_SAAS_API_TOKEN`

### Smoke test

1. Token kullanan otomasyonu tek sefer calistir.
2. Gerekliyse DNS guncelleme veya custom hostname akisini test et.
3. Gerekliyse purge veya deploy entegrasyonunu test et.
4. Audit log'da yeni token kullanimi gorunuyor mu kontrol et.

### Basari kriteri

- Entegrasyon sadece ihtiyac duydugu islemleri yapabiliyor.
- Gereksiz yetki kalmadi.
- Eski token tamamen revoke edildi.

## Hızlı smoke test seti

- `login`
- `register`
- `logout`
- `OTP gonderimi`
- `dogrulama maili`
- `reset password`
- `odeme baslatma`
- `odeme callback`
- `Cloudflare` bagli tek otomasyon calismasi

## Kritik not

Git gecmisinde kalmis olabilecek eski provider credential'lari `sizmis olabilir` varsayimiyla ele alinmalidir.
Yalnizca yeni secret eklemek yeterli degildir; eski secret provider panelinden gecersiz kilinmalidir.
