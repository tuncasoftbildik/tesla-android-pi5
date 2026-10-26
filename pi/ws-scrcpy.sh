#!/bin/bash
# Android açılınca adb bağla, sonra ws-scrcpy sunucusunu çalıştır
CIHAZ=192.168.240.112:5555
until adb connect $CIHAZ >/dev/null 2>&1 && [ "$(adb -s $CIHAZ shell getprop sys.boot_completed 2>/dev/null | tr -d "\r")" = "1" ]; do sleep 3; done
[ -f /home/pi/tesla-android/ssl/privkey.pem ] && export WS_SCRCPY_CONFIG=/home/pi/tesla-android/ws-scrcpy.yaml
cd /home/pi/ws-scrcpy/dist
exec /usr/bin/node index.js
