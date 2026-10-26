#!/bin/bash
# certbot deploy kancası: yeni sertifikayı ws-scrcpy ve konum sunucusunun okuyacağı yere kopyala
set -e
KAYNAK=/etc/letsencrypt/live/android.example.com
HEDEF=/home/pi/tesla-android/ssl
install -o pi -g pi -m 644 "$KAYNAK/fullchain.pem" "$HEDEF/fullchain.pem"
install -o pi -g pi -m 600 "$KAYNAK/privkey.pem" "$HEDEF/privkey.pem"
sudo -u pi XDG_RUNTIME_DIR=/run/user/$(id -u) systemctl --user restart ws-scrcpy konum || true
