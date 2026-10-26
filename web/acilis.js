// Açılış animasyonu: Android ekranı gelmeden önce kısa bir "motor çalıştı" sahnesi.
// Yoldaki otomatik yenilemelerde (nabiz.js) gösterilmez; ekran hazır olunca açılarak kaybolur.
(function () {
  if (location.hash.indexOf("action=stream") < 0) return;
  try {
    var son = +sessionStorage.getItem("yenilendi") || 0;
    if (Date.now() - son < 20000) return;
  } catch (x) {}

  var css = "" +
    "#acilis{position:fixed;inset:0;z-index:2147483647;background:#07090d;overflow:hidden;display:grid;place-items:center;" +
    "font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Segoe UI',Roboto,Inter,system-ui,sans-serif;color:#eef1f6;" +
    "transition:opacity .7s ease,transform .9s cubic-bezier(.7,0,.2,1),filter .7s ease}" +
    "#acilis.bitti{opacity:0;transform:scale(1.18);filter:blur(14px);pointer-events:none}" +
    "#acilis .isik{position:absolute;inset:-25%;filter:blur(80px);opacity:0;animation:aIsik 1.6s .1s ease forwards, aDon 30s linear infinite;" +
    "background:radial-gradient(35% 40% at 25% 35%,rgba(61,220,132,.45),transparent 70%),radial-gradient(38% 44% at 78% 68%,rgba(62,106,225,.5),transparent 70%),radial-gradient(28% 28% at 60% 15%,rgba(140,90,255,.28),transparent 70%)}" +
    "@keyframes aIsik{to{opacity:.8}}@keyframes aDon{to{transform:rotate(360deg)}}" +
    "#acilis .izgara{position:absolute;left:50%;bottom:-12vh;width:220vw;height:65vh;transform:translateX(-50%) perspective(420px) rotateX(70deg);transform-origin:bottom;opacity:0;" +
    "background:repeating-linear-gradient(90deg,transparent 0 calc(12.5% - 1px),rgba(255,255,255,.07) calc(12.5% - 1px) 12.5%),repeating-linear-gradient(0deg,transparent 0 46px,rgba(61,220,132,.14) 46px 48px);" +
    "animation:aIzGel .8s .3s ease forwards,aAkis .55s linear infinite;-webkit-mask-image:linear-gradient(to top,#000 10%,transparent 85%);mask-image:linear-gradient(to top,#000 10%,transparent 85%)}" +
    "@keyframes aIzGel{to{opacity:1}}@keyframes aAkis{to{background-position:0 0,0 48px}}" +
    "#acilis .orta{position:relative;display:grid;place-items:center;gap:22px;text-align:center}" +
    "#acilis .halka{position:relative;width:200px;height:200px;display:grid;place-items:center}" +
    "#acilis .halka::before{content:'';position:absolute;inset:0;border-radius:50%;padding:3px;" +
    "background:conic-gradient(from 0deg,transparent 0 55%,#3ddc84 75%,#7fd3ff 90%,transparent 100%);" +
    "-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;" +
    "animation:aDon 1.1s linear infinite;opacity:0;animation:aDon 1.1s linear infinite,aIzGel .5s .2s forwards}" +
    "#acilis .halka::after{content:'';position:absolute;inset:-30px;border-radius:50%;border:1px solid rgba(61,220,132,.35);opacity:0;animation:aDalga 1.8s .9s ease-out infinite}" +
    "@keyframes aDalga{0%{transform:scale(.7);opacity:.8}100%{transform:scale(1.5);opacity:0}}" +
    "#acilis svg{width:110px;height:110px;filter:drop-shadow(0 0 22px rgba(61,220,132,.55))}" +
    "#acilis svg .c{fill:none;stroke:url(#ag);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:120;stroke-dashoffset:120;animation:aCiz 1s .25s ease forwards}" +
    "#acilis svg .d{fill:url(#ag);opacity:0;animation:aIzGel .5s 1s forwards}" +
    "#acilis svg .g{fill:#07090d;opacity:0;animation:aGoz 1.6s 1.15s infinite}" +
    "@keyframes aCiz{to{stroke-dashoffset:0}}@keyframes aGoz{0%,40%,48%,100%{opacity:1}44%{opacity:0}}" +
    "#acilis h1{margin:0;font-size:46px;font-weight:700;letter-spacing:.5em;text-indent:.5em;opacity:0;animation:aBaslik 1s .9s cubic-bezier(.2,.8,.2,1) forwards;" +
    "background:linear-gradient(90deg,#fff,#9aa6bd 40%,#3ddc84 60%,#fff);background-size:250% 100%;-webkit-background-clip:text;background-clip:text;color:transparent}" +
    "@keyframes aBaslik{0%{opacity:0;letter-spacing:.9em;filter:blur(8px)}100%{opacity:1;letter-spacing:.18em;text-indent:.18em;filter:blur(0);background-position:100% 0}}" +
    "#acilis p{margin:0;font-size:22px;color:#8a93a6;opacity:0;transform:translateY(8px);animation:aAlt .6s 1.4s ease forwards}" +
    "#acilis p b{font-weight:600;background:linear-gradient(90deg,#3ddc84,#7fd3ff);-webkit-background-clip:text;background-clip:text;color:transparent}" +
    "@keyframes aAlt{to{opacity:1;transform:none}}" +
    "#acilis .cubuk{width:260px;height:3px;border-radius:3px;background:rgba(255,255,255,.08);overflow:hidden;opacity:0;animation:aIzGel .4s 1.5s forwards}" +
    "#acilis .cubuk i{display:block;height:100%;width:0;border-radius:3px;background:linear-gradient(90deg,#3ddc84,#7fd3ff);box-shadow:0 0 12px #3ddc84;animation:aDol 1.4s 1.5s cubic-bezier(.6,0,.2,1) forwards}" +
    "@keyframes aDol{to{width:100%}}" +
    "#acilis .durum{font-size:15px;letter-spacing:.12em;text-transform:uppercase;color:#5d6577;opacity:0;animation:aIzGel .4s 1.6s forwards}" +
    "@media (prefers-reduced-motion:reduce){#acilis *{animation-duration:.01s!important;animation-delay:0s!important}}";

  var s = new Date().getHours();
  var selam = s < 6 ? "İyi geceler" : s < 12 ? "Günaydın" : s < 18 ? "İyi günler" : "İyi akşamlar";
  var html = '<div class="isik"></div><div class="izgara"></div><div class="orta">' +
    '<div class="halka"><svg viewBox="0 0 64 64" aria-hidden="true">' +
    '<defs><linearGradient id="ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3ddc84"/><stop offset="1" stop-color="#7fd3ff"/></linearGradient></defs>' +
    '<path class="c" d="M16 40a16 16 0 0 1 32 0z"/><path class="c" d="M22 21l3.5 5M42 21l-3.5 5"/>' +
    '<path class="d" d="M16 40a16 16 0 0 1 32 0z"/>' +
    '<circle class="g" cx="26" cy="33" r="2"/><circle class="g" cx="38" cy="33" r="2"/></svg></div>' +
    '<h1>TESLA ANDROID</h1><p>' + selam + '</p>' +
    '<div class="cubuk"><i></i></div><div class="durum" id="acilisDurum">Ekran hazırlanıyor</div></div>';

  var stil = document.createElement("style");
  stil.textContent = css;
  var kat = document.createElement("div");
  kat.id = "acilis";
  kat.innerHTML = html;
  document.documentElement.appendChild(stil);
  document.documentElement.appendChild(kat);

  var t0 = Date.now(), bitti = false;
  function kapat() {
    if (bitti) return;
    bitti = true;
    var d = document.getElementById("acilisDurum");
    if (d) d.textContent = "Hazır";
    setTimeout(function () {
      kat.classList.add("bitti");
      setTimeout(function () { kat.remove(); stil.remove(); }, 1000);
    }, 250);
  }
  // En az 3 sn göster; ekran (canvas) çizilmeye başlayınca kapat; en geç 8 sn
  var yokla = setInterval(function () {
    var gecen = Date.now() - t0;
    var c = document.querySelector("canvas");
    var hazir = c && c.width > 0 && c.height > 0;
    if ((gecen > 3000 && hazir) || gecen > 8000) { clearInterval(yokla); kapat(); }
  }, 150);
})();
