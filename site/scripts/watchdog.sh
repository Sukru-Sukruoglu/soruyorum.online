#!/bin/bash

# SoruYorum.Online Watchdog Script
# Bu script sitenin aktif olup olmadığını kontrol eder ve kapanmışsa otomatik kaldırır.

URL="https://soruyorum.online"
PROJECT_DIR="/srv/webhosting/soruyorum.online/site"
LOG_FILE="$PROJECT_DIR/scripts/watchdog.log"

# Log dosyasına tarih ekleyerek mesaj yazan fonksiyon
log_message() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

# Saniye saniye log kirliliği olmasın diye sadece olay olduğunda yazacağız
check_site() {
    status_code=$(curl -L -s -o /dev/null -I -w "%{http_code}" -m 10 "$URL")
    echo "$status_code"
}

STATUS=$(check_site)

# Eğer durum kodu 200 veya 3xx değilse sorun vardır
if [[ "$STATUS" -ne 200 && "$STATUS" -ne 301 && "$STATUS" -ne 302 ]]; then
    # 20 saniye bekle ve bir kez daha emin olmak için kontrol et
    sleep 20
    STATUS=$(check_site)
    
    if [[ "$STATUS" -ne 200 && "$STATUS" -ne 301 && "$STATUS" -ne 302 ]]; then
        log_message "HATA: Siteye erisilemiyor (HTTP Durum: $STATUS). Restart baslatiliyor..."
        
        cd "$PROJECT_DIR"
        # Traefik ile birlikte ayaga kaldir
        docker compose -f docker-compose.yml -f docker-compose.traefik.yml up -d >> "$LOG_FILE" 2>&1
        
        if [ $? -eq 0 ]; then
            log_message "BASARILI: Sistem otomatik olarak restart edildi."
            # Restart sonrasi 2 dk bekleme (stabilizasyon için)
            sleep 120
        else
            log_message "KRITIK HATA: Docker baslatilamadi!"
        fi
    fi
fi
