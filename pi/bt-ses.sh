#!/bin/bash
# Eşleşmiş araca sürekli bağlı kal ve Android sesini Bluetooth çıkışına yönlendir
export XDG_RUNTIME_DIR=/run/user/$(id -u)
while true; do
  for MAC in $(sudo bluetoothctl devices Trusted | awk "{print \$2}"); do
    sudo bluetoothctl info "$MAC" | grep -q "Connected: yes" || sudo bluetoothctl connect "$MAC" >/dev/null 2>&1
  done
  SINK=$(pactl list short sinks | awk "/bluez_output/ {print \$2; exit}")
  if [ -n "$SINK" ] && [ "$(pactl get-default-sink)" != "$SINK" ]; then
    pactl set-default-sink "$SINK"
    for G in $(pactl list short sink-inputs | awk "{print \$1}"); do pactl move-sink-input "$G" "$SINK"; done
    echo "ses -> $SINK"
  fi
  sleep 15
done
