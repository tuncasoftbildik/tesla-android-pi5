// Tesla tarayıcısının konumunu Pi'deki konum sunucusuna gönder (saniyede en fazla 1)
(function () {
  if (!navigator.geolocation || !window.isSecureContext) {
    console.warn('konum: güvenli bağlam yok');
    return;
  }
  var son = 0;
  navigator.geolocation.watchPosition(function (p) {
    var t = Date.now();
    if (t - son < 1000) return;
    son = t;
    fetch(location.port ? 'https://' + location.hostname + ':8444/konum' : '/konum', {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ lat: p.coords.latitude, lon: p.coords.longitude, acc: p.coords.accuracy })
    }).catch(function () {});
  }, function (e) {
    console.warn('konum:', e.message);
  }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 });
})();
