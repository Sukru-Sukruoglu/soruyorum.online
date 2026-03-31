# Cloudflare Worker Fallback Origin

Bu adim, `Custom Hostname active` olmasina ragmen tarayicida `no available server` gorunen son katmani cozer.

## Problem

Cloudflare `custom hostname` ve SSL olusturuyor, ancak istek origin'e giderken uygulama dogru host ile cevap veremeyebiliyor.

Mevcut gozlem:

- `test-cf-smoke.keypadsistem.com` Cloudflare tarafinda `active`
- sertifika `active`
- fakat canli istek `503 no available server`

## Cozum

`Worker as fallback origin` modeli kullanilir.

Akis:

1. Custom hostname istegi Cloudflare'a gelir.
2. Worker istegi yakalar.
3. Worker istegi `https://connect.soruyorum.live` upstream'ine proxy eder.
4. Worker, orijinal musteri hostunu `x-forwarded-host` olarak origin'e iletir.
5. Uygulama custom domaini bu header uzerinden tanir.

## Gerekli DNS

### Mevcut upstream

`connect.soruyorum.live`

- tip: `A`
- deger: `46.4.35.233`
- proxied: `true`

### Worker fallback host

`service.soruyorum.live`

- tip: `AAAA`
- deger: `100::`
- proxied: `true`

Bu `100::` kaydi Cloudflare'in originless hedefi icin kullanilir.

## Cloudflare dashboard adimlari

### 1. Fallback origin degistir

`SSL/TLS -> Custom Hostnames`

Fallback origin'i:

- `connect.soruyorum.live` yerine
- `service.soruyorum.live`

olarak degistirin.

### 2. Worker olustur

Repo dosyasi:

- `site/cloudflare/custom-host-origin-worker/src/index.js`

`Workers & Pages` icinde yeni bir Worker olusturun ve bu kodu yapistirin
veya `wrangler.toml` ile deploy edin.

Worker variable:

- `UPSTREAM_ORIGIN = https://connect.soruyorum.live`

### 3. Worker route ayarlari

Cloudflare resmi route onceligi mantigina gore daha spesifik route, genel route'u ezer.

Bu nedenle:

- `*.soruyorum.live/*` -> `None`
- `*/*` -> `soruyorum-custom-host-origin`

Boylece:

- `connect.soruyorum.live`
- `*.soruyorum.live`

dogrudan origin'e gider,
ama custom hostname'ler Worker uzerinden proxy edilir.

## Kod degisiklikleri

Bu repo icinde:

- Next middleware artik `x-forwarded-host` ve `x-original-host` okuyabiliyor
- API proxy route'lari forwarded host header'larini backend'e tasiyor
- Worker kodu custom domaini `x-forwarded-host` ile origin'e iletiyor

## Beklenen sonuc

Worker route aktif olduktan sonra:

- `https://test-cf-smoke.keypadsistem.com` artik `503` yerine uygulama sayfasini acmali
- sonraki custom domainler icin de ayni yapi calismali

## Resmi kaynaklar

- Worker as origin:
  https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/worker-as-origin/
- Routes:
  https://developers.cloudflare.com/workers/configuration/routing/routes/
- Custom origin:
  https://developers.cloudflare.com/cloudflare-for-platforms/cloudflare-for-saas/start/advanced-settings/custom-origin/
