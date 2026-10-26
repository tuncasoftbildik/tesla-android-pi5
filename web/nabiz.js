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
      ws.addEventListener("message", function () { sonVeri = Date.now(); });
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
      "&vd=" + (typeof VideoDecoder) + "&oy=" + ((location.hash.match(/player=(\w+)/) || [])[1] || "-");
    try { fetch("/nabiz?" + q, { cache: "no-store", credentials: "same-origin" }).catch(function () {}); } catch (x) {}
  }
  var acilis = Date.now(), sonVeri = 0;
  setInterval(function () {
    bildir("nabiz");
    // Sayfa açıldı ama 15 sn'de ekran bağlantısı hiç açılmadıysa yeniden dene
    if (Date.now() - acilis > 15000 && (!ekran || ekran.readyState !== 1)) { bildir("ekransiz"); yenile(); }
    // Açık görünüp veri akmayan (yarı ölü) bağlantı: 8 sn veri gelmezse yeniden dene
    else if (ekran && ekran.readyState === 1 && sonVeri && Date.now() - sonVeri > 8000) { bildir("akissiz"); yenile(); }
  }, 2000);
  document.addEventListener("visibilitychange", function () { bildir("gorunum"); });
  var hataSay = 0;
  window.addEventListener("error", function (e) { if (++hataSay > 3) return; bildir("hata&m=" + encodeURIComponent(String(e.message).slice(0, 120))); });
  window.addEventListener("pagehide", function () { bildir("pagehide"); });
  window.addEventListener("freeze", function () { bildir("freeze"); });
  window.addEventListener("resume", function () { bildir("resume"); });
  bildir("acildi");
})();
