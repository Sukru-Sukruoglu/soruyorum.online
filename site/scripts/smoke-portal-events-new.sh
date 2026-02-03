#!/usr/bin/env bash
set -euo pipefail

PORTAL_URL="${PORTAL_URL:-http://127.0.0.1:3100}"

html="$(curl -fsSL "$PORTAL_URL/events/new")"

required=(
  "Kelime Bulutu"
  "Sıralama"
  "Eşleştirme"
  "Hediye Çarkı"
)

missing=0
for label in "${required[@]}"; do
  if ! grep -Fq "$label" <<<"$html"; then
    echo "MISSING: $label"
    missing=1
  fi
done

# Guard against old naming resurfacing
if grep -Fq "Çarkıfelek" <<<"$html"; then
  echo "FOUND legacy label: Çarkıfelek (should be Hediye Çarkı)"
  missing=1
fi

if [[ "$missing" -ne 0 ]]; then
  echo "FAIL: portal /events/new smoke check failed"
  exit 1
fi

echo "OK: portal /events/new contains required event types"