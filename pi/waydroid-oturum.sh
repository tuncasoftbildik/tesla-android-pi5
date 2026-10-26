#!/bin/bash
# labwc masaüstü açılana kadar bekle, sonra Waydroid oturumunu ön planda çalıştır
export XDG_RUNTIME_DIR=/run/user/$(id -u) WAYLAND_DISPLAY=wayland-0
until [ -S "$XDG_RUNTIME_DIR/$WAYLAND_DISPLAY" ]; do sleep 2; done
exec /usr/bin/waydroid session start
