# 503 Service Unavailable Hatası - Analiz ve Çözüm

**Tarih:** 11 Şubat 2026

## Sorun Özeti

`https://soruyorum.online/login` sayfasına erişildiğinde:
1. İlk önce 503 (Service Unavailable) hatası
2. Sonra login API'si 404 (Not Found) hatası
3. Giriş yapıldıktan sonra `/dashboard` sayfası 404 hatası
4. Portal'da "Etkinlikler yüklenemedi" - JSON parse hatası

---

## Kök Neden Analizi

### 1. Docker Container'lar Çalışmıyordu
```bash
docker compose ps
# Sonuç: Hiçbir container çalışmıyordu
```

### 2. Statik HTML Dosyaları İçin Sunucu Yoktu
`public_html/` klasöründeki statik HTML dosyaları (login.html, sign-up.html vb.) için bir web sunucusu yapılandırılmamıştı.

### 3. Traefik Routing Karmaşası
- Portal uygulaması `soruyorum.online` domain'ine yönlendirilmişti
- Ama statik HTML sayfaları ayrı bir yerde (public_html) bulunuyordu
- `/api/*` istekleri doğru yere yönlendirilmiyordu

### 4. API Subdomain DNS Eksikliği
`api.soruyorum.online` için DNS kaydı bulunmuyordu.

---

## Yapılan Çözümler

### 1. Container'ları Başlatma
```bash
docker compose up -d
```

### 2. Nginx Statik Sunucu Ekleme

**docker-compose.yml'e eklendi:**
```yaml
soruyorum-static:
  image: nginx:alpine
  volumes:
    - ./public_html:/usr/share/nginx/html:ro
    - ./public_html/nginx.conf:/etc/nginx/conf.d/default.conf:ro
  ports:
    - "127.0.0.1:8180:80"
```

**public_html/nginx.conf oluşturuldu:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # .html uzantısız URL desteği
    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    # Statik asset cache
    location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Traefik Routing Yapılandırması

**docker-compose.traefik.yml güncellendi:**

```yaml
# Statik sayfalar için (yüksek priority)
soruyorum-static:
  labels:
    - "traefik.http.routers.soruyorum-static-https.rule=Host(`soruyorum.online`) && (Path(`/`) || Path(`/login`) || Path(`/sign-up`) || PathPrefix(`/assets`))"
    - "traefik.http.routers.soruyorum-static-https.priority=20"

# Portal için (düşük priority - diğer tüm istekler)
soruyorum-portal:
  labels:
    - "traefik.http.routers.soruyorum-https.rule=Host(`soruyorum.online`) || Host(`www.soruyorum.online`)"
    - "traefik.http.routers.soruyorum-https.priority=1"
```

### 4. API Routing Stratejisi

**Sorun:** Statik HTML'den yapılan `/api/auth/login` istekleri nereye gidecek?

**Çözüm:** Portal'ın Next.js API proxy'sini kullanmak.

Portal zaten `apps/portal/src/app/api/` altında backend'e proxy yapan route handler'lara sahip:
- `/api/events` → Backend'e proxy
- `/api/auth/*` → Backend'e proxy

Bu sayede:
- Statik HTML'den `/api/auth/login` isteği → Portal (Traefik priority=1) → Next.js API Route → Backend
- Portal dashboard'dan `/api/events` isteği → Aynı portal → Next.js API Route → Backend

---

## Son Durum - Routing Akışı

```
https://soruyorum.online/login
    ↓ (Traefik - priority 20, Path match)
    nginx static server
    ↓
    login.html

https://soruyorum.online/dashboard
    ↓ (Traefik - priority 1, catch-all)
    Next.js Portal
    ↓
    Dashboard sayfası

https://soruyorum.online/api/auth/login
    ↓ (Traefik - priority 1, catch-all)
    Next.js Portal
    ↓ (Next.js API Route)
    apps/portal/src/app/api/auth/login/route.ts
    ↓ (Proxy)
    Backend API Server (port 4000)
```

---

## Önemli Notlar

1. **Priority değerleri:** Yüksek priority = önce eşleşir. Statik sayfalar için priority=20, portal için priority=1 kullanıldı.

2. **Extensionless URL:** nginx.conf'da `try_files $uri $uri.html` sayesinde `/login` → `login.html` çalışır.

3. **DNS Gereksinimi:** `api.soruyorum.online` subdomain'i kullanılmak istenirse DNS A kaydı eklenmeli.

4. **Container bağımlılıkları:** API server redis ve postgres'e, portal ise API server'a bağımlı.

---

## Kontrol Komutları

```bash
# Tüm container'ları başlat
docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d

# Container durumlarını kontrol et
docker compose ps

# Logları izle
docker compose logs -f soruyorum-portal soruyorum-api-server

# Routing testleri
curl -s -o /dev/null -w "%{http_code}" https://soruyorum.online/login
curl -s -o /dev/null -w "%{http_code}" https://soruyorum.online/dashboard
curl -s -X POST https://soruyorum.online/api/auth/login -H "Content-Type: application/json" -d '{"email":"test","password":"test"}'
```
