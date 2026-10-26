#!/bin/bash
# Wi-Fi görev dağılımı.
#  İkinci kart (USB anten) takılıysa: wlan0 = "Tesla" yayını (hep açık),
#    ikinci kart = internet (ev ağı ya da telefon hotspot'u).
#  Takılı değilse: tek kart, eski davranış (ev ağı öncelikli, yoksa yayın).
ISTEMCI_PROFILLERI=("EV-WIFI" "Telefon-Hotspot")
son=""

ikinci_kart() {
    ls /sys/class/net | grep '^wl' | grep -vx wlan0 | head -1
}

while true; do
    IKINCI=$(ikinci_kart)
    durum=${IKINCI:-tek}
    if [ "$durum" != "$son" ]; then
        for P in "${ISTEMCI_PROFILLERI[@]}"; do
            nmcli -t -f NAME con show | grep -qx "$P" || continue
            nmcli con mod "$P" connection.interface-name "${IKINCI:-wlan0}"
        done
        if [ -n "$IKINCI" ]; then
            nmcli con mod Tesla-AP connection.autoconnect-priority 100
            nmcli con up Tesla-AP >/dev/null
            nmcli dev wifi rescan ifname "$IKINCI" 2>/dev/null
            echo "wifi düzeni: iki kart (yayın wlan0, internet $IKINCI)"
        else
            nmcli con mod Tesla-AP connection.autoconnect-priority -10
            echo "wifi düzeni: tek kart (wlan0)"
        fi
        son=$durum
    fi
    # İki kartta yayın düşerse geri kaldır
    if [ -n "$IKINCI" ] && ! nmcli -t -f NAME con show --active | grep -qx Tesla-AP; then
        nmcli con up Tesla-AP >/dev/null
    fi
    sleep 20
done
