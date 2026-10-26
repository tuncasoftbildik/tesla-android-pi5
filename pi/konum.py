#!/usr/bin/env python3
"""Tesla tarayıcısından gelen konumu Android'e (Waydroid) test GPS'i olarak ver.

POST /konum  gövde: {"lat": .., "lon": .., "acc": ..}
HTTPS :8444, ws-scrcpy ile aynı sertifika; sertifika yoksa düz HTTP (yalnız deneme).
"""
import json
import ssl
import subprocess
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

CIHAZ = "192.168.240.112:5555"
SSL_DIZIN = "/home/pi/tesla-android/ssl"
SAGLAYICILAR = ("gps", "network")
son = {"t": 0.0, "lat": None, "lon": None}


def adb(*komut):
    return subprocess.run(["adb", "-s", CIHAZ, "shell", *komut],
                          capture_output=True, text=True, timeout=10)


def saglayicilari_hazirla():
    # Android yeniden başlayınca test sağlayıcıları kaybolur; her dakika tazele
    while True:
        try:
            subprocess.run(["adb", "connect", CIHAZ], capture_output=True, timeout=10)
            adb("appops", "set", "com.android.shell", "android:mock_location", "allow")
            for s in SAGLAYICILAR:
                adb("cmd", "location", "providers", "add-test-provider", s)
                adb("cmd", "location", "providers", "set-test-provider-enabled", s, "true")
        except Exception as e:
            print("hazırlık hatası:", e, flush=True)
        time.sleep(60)


class Isleyici(BaseHTTPRequestHandler):
    def _cevap(self, kod, govde=b"ok"):
        self.send_response(kod)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(govde)

    def do_OPTIONS(self):
        self._cevap(204, b"")

    def do_GET(self):
        self._cevap(200, json.dumps(son).encode())

    def do_POST(self):
        if self.path != "/konum":
            return self._cevap(404, b"yok")
        try:
            uzunluk = int(self.headers.get("Content-Length", 0))
            d = json.loads(self.rfile.read(uzunluk) or b"{}")
            lat, lon = float(d["lat"]), float(d["lon"])
            acc = max(1.0, float(d.get("acc") or 10))
        except Exception:
            return self._cevap(400, b"hatali")
        for s in SAGLAYICILAR:
            adb("cmd", "location", "providers", "set-test-provider-location", s,
                "--location", f"{lat},{lon}", "--accuracy", f"{acc:.0f}")
        son.update(t=time.time(), lat=lat, lon=lon)
        self._cevap(200)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    threading.Thread(target=saglayicilari_hazirla, daemon=True).start()
    sunucu = ThreadingHTTPServer(("0.0.0.0", 8444), Isleyici)
    try:
        bag = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        bag.load_cert_chain(f"{SSL_DIZIN}/fullchain.pem", f"{SSL_DIZIN}/privkey.pem")
        sunucu.socket = bag.wrap_socket(sunucu.socket, server_side=True)
        print("konum sunucusu https :8444", flush=True)
    except FileNotFoundError:
        print("sertifika yok, http :8444 (yalnız deneme)", flush=True)
    sunucu.serve_forever()
