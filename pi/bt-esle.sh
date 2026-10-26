#!/bin/bash
# Araçla ilk eşleşme: araçta Bluetooth > "Yeni cihaz ekle" ekranı açıkken çalıştır.
# Kullanım: bt-esle.sh [ad-deseni]   (varsayılan: Tesla|Model)
DESEN="${1:-Tesla|Model}"
sudo bluetoothctl --timeout 25 scan on >/dev/null 2>&1
MAC=$(sudo bluetoothctl devices | grep -E "$DESEN" | head -1 | awk "{print \$2}")
[ -z "$MAC" ] && { echo "Araç bulunamadı (desen: $DESEN). Görülen cihazlar:"; sudo bluetoothctl devices; exit 1; }
echo "Eşleşiliyor: $(sudo bluetoothctl devices | grep $MAC)"
sudo bluetoothctl --agent NoInputNoOutput pair "$MAC" && sudo bluetoothctl trust "$MAC" && sudo bluetoothctl connect "$MAC"
