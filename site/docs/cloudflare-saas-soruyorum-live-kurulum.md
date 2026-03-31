# Cloudflare SaaS Kurulumu

Bu kurulum `soruyorum.online` ana marka alan adini tasimadan, `soruyorum.live` u kontrol domaini olarak kullanir.

## Hedef yapi

- Ana marka: `soruyorum.online`
- Sistem subdomainleri: `firma.soruyorum.live`
- Cloudflare connect host: `connect.soruyorum.live`
- Musteri custom domaini: `event.firma.com`

## Neden soruyorum.live

- Sistem subdomaini olarak daha dogal duruyor.
- Kod ve env su an buna gore hazirlandi.
- `soruyorum.app` elde tutulabilir ama altyapi icin ilk tercih `soruyorum.live`.

## Cloudflare tarafinda gerekenler

### 1. Zone

- `soruyorum.live` yeni Cloudflare hesabinda aktif olmali.
- Zone ID bu hesaptan alinmali.

### 2. Connect host

- `connect.soruyorum.live` kaydi olusturun.
- Bu kayit `proxied` olmali.
- Bu host, portalin ayni originine gitmeli.

Not:
Cloudflare custom hostname isteklerinde origin'e giden `Host` basligi musteri domaini olabilir. Bu nedenle origin tarafinda bilinmeyen hostlari portal uygulamasina dusuren dusuk oncelikli bir router kullaniyoruz. `connect.soruyorum.live` fallback origin olarak kalir.

Kaynak:
https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/custom-origin/

### 3. API token

Scoped API token kullanin.

Minimum yetki:
- `SSL and Certificates: Write`

Bu yetki Cloudflare Custom Hostnames create/edit/delete istekleri icin resmi API dokumaninda kabul edilen yetki olarak gecer.

Kaynak:
https://developers.cloudflare.com/api/resources/custom_hostnames/methods/create/
https://developers.cloudflare.com/api/resources/custom_hostnames/methods/edit/

## Uygulama env ayarlari

`site/.env` icinde:

```env
DOMAIN_SYSTEM_BASE=soruyorum.live
DOMAIN_CONNECT_TARGET=connect.soruyorum.live
LEGACY_JOIN_BASE_URL=https://mobil.soruyorum.online
CLOUDFLARE_SAAS_ZONE_ID=your_zone_id
CLOUDFLARE_SAAS_API_TOKEN=your_scoped_token
```

Sonra servisleri yeniden baslatin:

```bash
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build soruyorum-api-server soruyorum-portal
```

## Hizli kontrol

`site` klasorunde:

```bash
node scripts/cloudflare-saas-check.mjs
```

Bu script:
- env degerlerini okur
- Custom Hostnames API erisimini test eder
- `connect.soruyorum.live` DNS durumunu kontrol eder

## Ilk canli test

1. WL paketli bir organizasyonda `Ayarlar > Domainler` ekranina girin.
2. `event.firma.com` gibi bir domain ekleyin.
3. Panelin gosterdigi `CNAME` ve `TXT` kayitlarini musteri DNS'ine girin.
4. `Dogrula` butonuna basin.
5. Domain `active` oldugunda `Primary` yapin.
6. Yeni event join URL'sinin custom domain uzerinden uretildigini kontrol edin.

## Bilinen sinir

Ilk fazda yalnizca subdomain desteklenir:
- desteklenir: `event.firma.com`
- desteklenmez: `firma.com`
