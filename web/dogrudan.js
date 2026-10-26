// Adres çıplak açılırsa cihaz listesi yerine doğrudan Android ekranına git.
// Cihaz listesi lazımsa: https://android.example.com/#liste
(function () {
  if (location.hash) return;
  var udid = "192.168.240.112:5555";
  var ws = (location.protocol === "https:" ? "wss://" : "ws://") + location.host +
    "/?action=proxy-adb&remote=" + encodeURIComponent("tcp:8886") + "&udid=" + encodeURIComponent(udid);
  // Tesla yolculukta <video>u durduruyor; canvas çizen WebCodecs kullan, yoksa Tiny H264 (wasm, canvas)
  var oynatici = typeof VideoDecoder === "function" ? "webcodecs" : "tinyh264";
  location.replace("#!action=stream&udid=" + encodeURIComponent(udid) + "&player=" + oynatici + "&ws=" + encodeURIComponent(ws));
})();
