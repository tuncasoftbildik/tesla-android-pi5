// Android sesini çal: Tesla Android'in oynatıcısı (audioplayback.js, <audio> + MediaSource, FLAC/fMP4).
// Tesla tarayıcısında AudioContext yok; bu yol orada çalışıyor. Tarayıcı sesi ilk dokunuşta açar.
(function () {
  window.audioWebsocketUrl = (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ses';
  var basladi = false;
  function baslat() {
    if (typeof window.primeAudioFromGesture === 'function') window.primeAudioFromGesture();
    if (!basladi && typeof window.startAudioPlayback === 'function') {
      basladi = true;
      window.startAudioPlayback();
    }
  }
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (t) {
    document.addEventListener(t, baslat, { capture: true, passive: true });
  });
})();
