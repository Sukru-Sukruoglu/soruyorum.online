# Editör 401 / Auth Session Uyumluluk Olay Notu — 24 Mart 2026

## Özet

Bu olayda `https://soruyorum.online/events/[id]/edit` sayfası bazı kullanıcı oturumlarında bozulmuş göründü.

Belirti:
- Konsolda `GET /api/events/:id 401 (Unauthorized)`
- Editör ilk default slide ile açılıyor
- Gerçek event ayarları yüklenmiyor

Bu sorun Eventimo-Soruyorum bağımlılığı yüzünden oluşmadı.
Sorun doğrudan Soruyorum auth/session uyumluluk katmanındaydı.

---

## Kök Neden

Sistemde iki farklı oturum tipi aynı anda dolaşıyordu:

1. Yeni tip JWT tabanlı auth cookie
2. Eski tip Lucia session id

Kırılma zinciri şu şekilde oluştu:

1. Portal tarafı auth cookie içeriğini JWT varsaydı.
2. Bazı kullanıcıların cookie'sinde eski Lucia session id vardı.
3. Editör sayfası açıldıktan sonra event verisini client-side olarak `/api/events/:id` üzerinden tekrar çekti.
4. Proxy katmanı cookie'den `Authorization: Bearer ...` üretti.
5. API tarafındaki event erişim middleware'i bu bearer değerini sadece JWT gibi yorumladı.
6. Legacy session id organization bilgisine çözülemedi.
7. Backend `401` döndü.
8. Editör event verisi alamadığı için default state ile kaldı ve bozulmuş göründü.

Önemli nokta:
- Kullanıcı bazı ekranlarda giriş yapmış gibi görünebilir.
- Ama editör özellikle event verisini yeniden çektiği için auth uyumsuzluğu burada görünür hale gelir.

---

## Etkilenen Katmanlar

Portal:
- `apps/portal/src/lib/portalAuthSession.ts`
- `apps/portal/src/app/api/auth/session/route.ts`

API server:
- `services/api-server/src/middleware/auth.ts`
- `services/api-server/src/middleware/tenantContext.ts`

Davranışsal etki:
- `events/[id]/edit`
- dolaylı olarak auth gerektiren event fetch akışları

---

## Uygulanan Düzeltme

Yapılan değişiklikler:

1. Portal session çözümleme akışına legacy session fallback eklendi.
2. Session route eski session'ı doğrudan geçersiz saymak yerine backend'de çözmeyi denemeye başladı.
3. API auth middleware JWT doğrulaması başarısız olursa Lucia session doğrulaması da yapar hale getirildi.
4. Event tenant middleware aynı fallback ile organization bağlamını legacy session'dan da kurar hale getirildi.
5. Portal ve API server canlı ortamda rebuild + redeploy edildi.

Sonuç:
- Eski session cookie taşıyan kullanıcılar da event verisini çekebilir hale geldi.
- Editör auth geçişlerinden daha dayanıklı hale geldi.

---

## Bir Daha Olmaması İçin Yapılacaklar

### Acil Operasyonel Liste

- [ ] Auth geçişlerinde desteklenen token tipleri açıkça dokümante edilsin.
- [ ] JWT ve Lucia session birlikte destekleniyorsa bu kural hem portal hem API middleware katmanında tek standart olarak korunsun.
- [ ] Auth uyumluluğu değiştirildiğinde yalnız login ekranı değil `events/[id]/edit` ve `events/[id]` gibi veri çeken ekranlar da test edilsin.
- [ ] `401` alan editör akışları için canlı log alarmı tanımlansın.
- [ ] Eski session cookie temizleme davranışı, fallback doğrulama denendikten sonra çalışsın.

### Kod Kalitesi Listesi

- [ ] Auth doğrulama mantığı tek yerde merkezileştirilsin; portal proxy, session route ve API middleware farklı varsayımlar taşımamalı.
- [ ] `Bearer` içeriğinin JWT mi legacy session mı olduğu kontrollü bir yardımcı fonksiyonla çözümlensin.
- [ ] Event editörü mümkünse kritik ilk veriyi server-side veya güvenli preload ile alsın; sadece client fetch'e bağımlı kalmasın.
- [ ] Auth fallback senaryoları için otomatik test eklenmeli.
- [ ] `organizationId` çözümlenemezse kullanıcıya ham default editor yerine net bir oturum yenileme ekranı gösterilmeli.

### Test Listesi

- [ ] JWT cookie ile `events/[id]/edit` açılış testi
- [ ] Legacy Lucia session ile `events/[id]/edit` açılış testi
- [ ] Expired JWT ile beklenen logout davranışı
- [ ] Legacy invalid session ile beklenen logout davranışı
- [ ] `/api/auth/session` yanıtının JWT ve legacy session için tutarlı olması
- [ ] `/api/events/:id` çağrısının her iki oturum tipinde de organization bağlamını doğru kurması

### Dağıtım Listesi

- [ ] Portal build sonrası auth/session route smoke testi çalıştırılsın.
- [ ] API server build sonrası protected event endpoint smoke testi çalıştırılsın.
- [ ] Deploy sonrası canlıda şu iki probe standart hale getirilsin:
  - `/api/auth/session`
  - auth'li `/api/events/:id`
- [ ] Rebuild sonrası container create zamanı ve image create zamanı not edilsin.

---

## Hızlı Teşhis Notu

Benzer olay tekrar görünürse ilk bakılacak sinyaller:

1. Tarayıcı konsolunda `GET /api/events/:id 401`
2. Editörde gerçek event verisi yerine default slide görünmesi
3. `/api/auth/session` ile kullanıcının authenticated görünmesi ama event fetch'in yine de düşmesi
4. Middleware tarafında JWT/legacy session ayrışmasının bozulmuş olması

---

## Kullanılan Deploy Komutu

```bash
cd /srv/webhosting/soruyorum.online/site
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d --build soruyorum-api-server soruyorum-portal
```

---

## Sonuç

Bu olayın nedeni tek cümleyle şuydu:

Portal ve API katmanları auth cookie içeriği konusunda aynı varsayımı paylaşmıyordu; eski session id bazı akışlarda desteklenmediği için editör event verisini yetkisiz kaldı.

---

## Uygulanacak Teknik Tasklar

Bu bölüm, tekrarını önleme checklist'inin doğrudan uygulanabilir iş listesine çevrilmiş halidir.

### P0 — Auth Uyumunu Kalıcılaştır

#### Task 1 — Auth token çözümlemeyi tek yardımcı modülde merkezileştir

Amaç:
- JWT ve legacy Lucia session ayrımının portal ve API tarafında farklı yorumlanmasını bitirmek.

Yapılacaklar:
- Ortak bir `resolveAuthIdentity(...)` helper tanımla.
- Girdi olarak bearer/cookie token alıp şu yapıyı dönsün:
  - `authenticated`
  - `userId`
  - `organizationId`
  - `role`
  - `email`
  - `authType` (`jwt` | `lucia` | `none`)
- Aşağıdaki yerler aynı helper'ı kullansın:
  - `apps/portal/src/lib/portalAuthSession.ts`
  - `apps/portal/src/app/api/auth/session/route.ts`
  - `services/api-server/src/middleware/auth.ts`
  - `services/api-server/src/middleware/tenantContext.ts`

Kabul kriteri:
- Aynı token için tüm katmanlar aynı auth sonucunu üretir.
- JWT ve legacy session için farklı davranış kalmaz.

#### Task 2 — Legacy session destek politikasını açık hale getir

Amaç:
- Kodda “yan etkili fallback” yerine bilinçli destek politikası olması.

Yapılacaklar:
- Repo docs içinde auth support matrix ekle.
- Aşağıyı açık yaz:
  - hangi cookie adı kullanılıyor
  - hangi token tipleri destekleniyor
  - ne zaman legacy session silinir
  - migration tamamlandığında fallback nasıl kaldırılır

Kabul kriteri:
- Yeni geliştirici auth akışını tek dökümandan anlayabilir.

### P0 — Editör Kırılganlığını Azalt

#### Task 3 — Editör ilk açılışta kritik event verisini preload et

Amaç:
- Editörün tamamen client-side auth fetch'e bağımlı olmasını azaltmak.

Yapılacaklar:
- `events/[id]/edit` route'u için server-side preload veya güvenli initial fetch modeli değerlendir.
- `QuizEditorV2` içine `initialEventData` server tarafından verilebiliyorsa bu yol tercih edilsin.
- Event fetch başarısızsa sessiz default state yerine net hata ekranı göster.

Kabul kriteri:
- Auth problemi olduğunda kullanıcı bozuk editör değil açık bir oturum/hata mesajı görür.
- Geçerli oturumda ilk açılışta event bilgisi doğrudan yüklenir.

#### Task 4 — Editör için özel auth hata ekranı ekle

Amaç:
- `401` durumunda yanlış teşhis oluşturan default slide görünümünü kaldırmak.

Yapılacaklar:
- `getEvent(eventId)` veya benzeri kritik fetch `401/403` dönerse:
  - editor canvas render edilmesin
  - kullanıcıya net mesaj gösterilsin
  - gerekirse “Tekrar giriş yap” veya “Sayfayı yenile” aksiyonu verilsin

Kabul kriteri:
- `401` durumunda kullanıcı event datası yokken editörü normal çalışıyor sanmaz.

### P1 — Test Kapsamı Ekle

#### Task 5 — Auth compatibility integration test seti oluştur

Amaç:
- Aynı hata tekrar merge edilmeden yakalansın.

Test senaryoları:
- JWT ile `/api/auth/session`
- legacy Lucia session ile `/api/auth/session`
- JWT ile `/api/events/:id`
- legacy Lucia session ile `/api/events/:id`
- expired JWT ile logout/unauthenticated response
- invalid legacy session ile logout/unauthenticated response

Kabul kriteri:
- Bu senaryolardan biri bozulursa CI kırılır.

#### Task 6 — Edit route smoke testi ekle

Amaç:
- `events/[id]/edit` açılışında event datası gerçekten yükleniyor mu kontrol etmek.

Yapılacaklar:
- Smoke test içinde şunlar doğrulansın:
  - route açılıyor
  - event fetch 200 dönüyor
  - default slide yerine DB'deki event başlığı/ayarları yükleniyor

Kabul kriteri:
- Editör kırıldığı anda test raporunda görünür hale gelir.

### P1 — Gözlemlenebilirlik ve Alarm

#### Task 7 — `401` editor fetch loglarını izlenebilir hale getir

Amaç:
- Sorun kullanıcı şikayetinden önce görülsün.

Yapılacaklar:
- Portal tarafında `events/[id]/edit` ekranındaki auth fetch failure loglarını yapılandır.
- API server tarafında `/api/events/:id` için auth type ve failure reason loglansın.
- Mümkünse `401` spike alarmı tanımlansın.

Kabul kriteri:
- `401` artışı dashboard veya log alarmında görünür olur.

#### Task 8 — Deploy sonrası auth smoke runbook'u standartlaştır

Amaç:
- Canlıya çıkan auth değişiklikleri yalnız build başarılı diye bırakılmasın.

Yapılacaklar:
- Deploy sonrası zorunlu kontrol listesi oluştur:
  - `/api/auth/session`
  - auth'li `/api/events/:id`
  - bir örnek `/events/[id]/edit` açılışı
- Bu adımlar `docs/` altında kısa runbook olarak yazılsın.

Kabul kriteri:
- Her auth deploy'undan sonra aynı smoke prosedürü uygulanır.

### P2 — Legacy Temizliği

#### Task 9 — Legacy session kullanım oranını ölç

Amaç:
- Fallback'in ne kadar süre tutulacağına veriyle karar vermek.

Yapılacaklar:
- Auth çözümleme sonucunda `authType=lucia` sayımını ölç.
- Oran düşerse migration sonlandırma planı çıkar.

Kabul kriteri:
- Legacy desteğin ne zaman kaldırılacağına dair ölçülebilir veri oluşur.

#### Task 10 — Legacy fallback kaldırma planı hazırla

Amaç:
- Geçici çözümün sonsuza kadar kalmasını önlemek.

Yapılacaklar:
- Şartlı kaldırma planı yaz:
  - legacy kullanım oranı hedef eşik altına inecek
  - kullanıcı oturum yenileme stratejisi uygulanacak
  - kaldırma öncesi test matrisi tamamlanacak

Kabul kriteri:
- Fallback kaldırımı plansız değil kontrollü yapılır.

---

## Önerilen Uygulama Sırası

1. Task 1
2. Task 4
3. Task 5
4. Task 6
5. Task 7
6. Task 8
7. Task 3
8. Task 9
9. Task 10
10. Task 2

Not:
- En kritik olanlar P0 içindeki Task 1 ve Task 4.
- Yalnızca fallback eklemek yeterli değil; editörün auth failure durumunda güvenli hata ekranı göstermesi de şart.