// Sürüşte ne olduğunu görmek için: her 2 sn Pi'ye durum bildir (kapı günlüğüne düşer).
// Ekran soketi koparsa sayfayı yeniden yükle (ws-scrcpy kendisi yeniden bağlanmıyor).
(function () {
  if (location.hash.indexOf("action=stream") < 0) return;
  var Asil = window.WebSocket, ekran = null, sayac = 0;
  window.WebSocket = function (url, p) {
    var ws = p === undefined ? new Asil(url) : new Asil(url, p);
    if (String(url).indexOf("/ses") < 0) {
      ekran = ws;
      // Ağ değişiminden sonra bağlantı "bağlanıyor"da asılı kalabiliyor: 6 sn'de açılmazsa kapat (yenileme tetiklenir)
      var bekci = setTimeout(function () {
        if (ws.readyState === 0) { bildir("asili"); try { ws.close(); } catch (x) {} yenile(); }
      }, 6000);
      ws.addEventListener("open", function () { clearTimeout(bekci); });
      ws.addEventListener("message", function () { sonVeri = Date.now(); yoklandi = 0; });
      // Giden mesajları izle: görüntü ayarı (101) yoklama için saklanır, dokunma (2) zamanı tutulur
      var gonder = ws.send;
      ws.send = function (v) {
        try {
          var b = v instanceof ArrayBuffer ? new Uint8Array(v) :
            ArrayBuffer.isView(v) ? new Uint8Array(v.buffer, v.byteOffset, v.byteLength) : null;
          if (b && b[0] === 101) ayarMesaji = b.slice();
          else if (b && b[0] === 2) sonDokunma = Date.now();
        } catch (x) {}
        return gonder.apply(ws, arguments);
      };
      ws.addEventListener("close", function (e) {
        clearTimeout(bekci);
        bildir("kapandi&kod=" + e.code);
        yenile();
      });
    }
    return ws;
  };
  var yenileniyor = false;
  function yenile() {
    if (yenileniyor) return;
    yenileniyor = true;
    var son = 0;
    try { son = +sessionStorage.getItem("yenilendi") || 0; } catch (x) {}
    var bekle = Date.now() - son < 10000 ? 3000 : 500; // döngüye girerse yavaşla
    setTimeout(function () {
      try { sessionStorage.setItem("yenilendi", Date.now()); } catch (x) {}
      location.reload();
    }, bekle);
  }
  window.WebSocket.prototype = Asil.prototype;
  ["CONNECTING", "OPEN", "CLOSING", "CLOSED"].forEach(function (k) { window.WebSocket[k] = Asil[k]; });
  function bildir(olay) {
    var a = document.querySelector("audio");
    var q = "olay=" + olay + "&n=" + (++sayac) + "&gor=" + document.visibilityState +
      "&ws=" + (ekran ? ekran.readyState : "-") + "&ses=" + (a ? (a.paused ? "dur" : "cal") : "-") +
      "&sessiz=" + Math.round((Date.now() - sonVeri) / 1000) + "&ayar=" + (ayarMesaji ? ayarMesaji.length : 0) +
      "&vd=" + (typeof VideoDecoder) + "&oy=" + ((location.hash.match(/player=(\w+)/) || [])[1] || "-");
    try { fetch("/nabiz?" + q, { cache: "no-store", credentials: "same-origin" }).catch(function () {}); } catch (x) {}
  }
  var acilis = Date.now(), sonVeri = Date.now(), sonDokunma = 0, ayarMesaji = null, yoklandi = 0;
  setInterval(function () {
    bildir("nabiz");
    var simdi = Date.now();
    // Sayfa açıldı ama 15 sn'de ekran bağlantısı hiç açılmadıysa yeniden dene
    if (simdi - acilis > 15000 && (!ekran || ekran.readyState !== 1)) { bildir("ekransiz"); yenile(); return; }
    if (document.visibilityState !== "visible" || !ekran || ekran.readyState !== 1) return;
    // Sessizlik tek başına ölüm değil: Android ekranı durağanken Waydroid hiç kare göndermiyor (dokunsan bile).
    // Yoklandı ama 5 sn'de tek kare gelmediyse bağlantı yarı ölü: yeniden yükle.
    if (yoklandi && simdi - yoklandi > 5000) { bildir("akissiz"); yenile(); return; }
    // 20 sn sessizlik ya da dokunduktan 3 sn sonra hâlâ kare yoksa yokla:
    // aynı görüntü ayarını yeniden göndermek kodlayıcıyı baştan başlatır, canlı bağlantıda kare mutlaka gelir.
    var sessiz = simdi - sonVeri > 20000;
    var dokunmaYanitsiz = sonDokunma > sonVeri && simdi - sonDokunma > 3000;
    if (!yoklandi && ayarMesaji && (sessiz || dokunmaYanitsiz)) {
      yoklandi = simdi;
      bildir("yokla");
      try { ekran.send(ayarMesaji); } catch (x) {}
    }
  }, 2000);
  document.addEventListener("visibilitychange", function () { bildir("gorunum"); });
  var hataSay = 0;
  window.addEventListener("error", function (e) { if (++hataSay > 3) return; bildir("hata&m=" + encodeURIComponent(String(e.message).slice(0, 120))); });
  window.addEventListener("pagehide", function () { bildir("pagehide"); });
  window.addEventListener("freeze", function () { bildir("freeze"); });
  window.addEventListener("resume", function () { bildir("resume"); });
  bildir("acildi");
})();
