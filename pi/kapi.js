// Giriş kapısı: android.example.com (Cloudflare tüneli) -> ws-scrcpy.
// Şifre bir kez girilir, araç tarayıcısı 1 yıl hatırlar (imzalı çerez).
// Kullanım: node kapi.js            -> 127.0.0.1:8090'da dinler
//           node kapi.js sifre      -> stdin'den yeni şifre okur, kaydeder, tüm oturumları kapatır
'use strict';
const http = require('http');
const https = require('https');
const net = require('net');
const fs = require('fs');
const crypto = require('crypto');

const DIZIN = '/home/pi/tesla-android/kapi';
const AYAR = DIZIN + '/ayar.json';
const PORT = 8090;
const HEDEF = { host: '127.0.0.1', port: 8000 };
const KONUM = { host: '127.0.0.1', port: 8444 };
const SES = { host: '127.0.0.1', port: 8091 };
const SURE = 365 * 24 * 3600; // saniye

function ayarOku() { return JSON.parse(fs.readFileSync(AYAR, 'utf8')); }

if (process.argv[2] === 'sifre') {
    let girdi = '';
    process.stdin.on('data', (d) => { girdi += d; });
    process.stdin.on('end', () => {
        const sifre = girdi.replace(/\r?\n$/, '');
        if (sifre.length < 8) { console.error('şifre en az 8 karakter olmalı'); process.exit(1); }
        const tuz = crypto.randomBytes(16).toString('hex');
        const ozet = crypto.scryptSync(sifre, tuz, 64).toString('hex');
        const anahtar = crypto.randomBytes(32).toString('hex'); // yenilenince eski çerezler geçersiz
        fs.mkdirSync(DIZIN, { recursive: true, mode: 0o700 });
        fs.writeFileSync(AYAR, JSON.stringify({ tuz, ozet, anahtar }), { mode: 0o600 });
        console.log('şifre kaydedildi, eski oturumlar kapandı');
    });
    return;
}

let ayar = ayarOku();
fs.watchFile(AYAR, () => { try { ayar = ayarOku(); } catch (e) { /* yazılırken */ } });

function imza(bitis) {
    return crypto.createHmac('sha256', ayar.anahtar).update('v1:' + bitis).digest('hex');
}
function cerezGecerli(baslik) {
    const m = /(?:^|;\s*)ta=(\d+)\.([0-9a-f]{64})/.exec(baslik || '');
    if (!m || Number(m[1]) < Date.now() / 1000) return false;
    const a = Buffer.from(m[2], 'hex');
    const b = Buffer.from(imza(m[1]), 'hex');
    return crypto.timingSafeEqual(a, b);
}

// Kaba kuvvete karşı: IP başına 10 dakikada 5 hatalı deneme
const hatalar = new Map();
function engelli(ip) {
    const k = hatalar.get(ip);
    return k && k.sayi >= 5 && Date.now() - k.ilk < 600000;
}
function hataYaz(ip) {
    const k = hatalar.get(ip);
    if (!k || Date.now() - k.ilk >= 600000) hatalar.set(ip, { sayi: 1, ilk: Date.now() });
    else k.sayi++;
}

const SABLON = fs.readFileSync(__dirname + '/giris.html', 'utf8');
function girisSayfasi(res, mesaj) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(SABLON.replace('{{MESAJ}}', mesaj ? '<p class="hata">' + mesaj + '</p>' : ''));
}

function vekil(req, res, hedef, tls) {
    const istek = (tls ? https : http).request({
        host: hedef.host, port: hedef.port, method: req.method, path: req.url,
        headers: req.headers, servername: 'android.example.com', // konum sunucusunun LE sertifikası
    }, (yanit) => {
        // Her açılışta sürüm sorulsun (değişmediyse 304 gelir): güncellemeden sonra araç eski sürümde kalmasın
        const basliklar = { ...yanit.headers, 'cache-control': 'no-cache' };
        res.writeHead(yanit.statusCode, basliklar);
        yanit.pipe(res);
    });
    istek.on('error', () => { if (!res.headersSent) res.writeHead(502); res.end('Android hazır değil'); });
    req.pipe(istek);
}

const sunucu = http.createServer((req, res) => {
    const ip = req.headers['cf-connecting-ip'] || req.socket.remoteAddress;
    if (req.method === 'POST' && req.url === '/giris') {
        if (engelli(ip)) return girisSayfasi(res, 'Çok fazla deneme, 10 dakika bekle.');
        hataYaz(ip); // denemeyi baştan say: eşzamanlı isteklerle sınır aşılmasın, başarıda silinir
        let govde = '';
        req.on('data', (d) => { govde += d; if (govde.length > 4096) req.destroy(); });
        req.on('end', () => {
            const sifre = new URLSearchParams(govde).get('sifre') || '';
            const ozet = crypto.scryptSync(sifre, ayar.tuz, 64);
            if (!crypto.timingSafeEqual(ozet, Buffer.from(ayar.ozet, 'hex'))) {
                return girisSayfasi(res, 'Şifre yanlış.');
            }
            hatalar.delete(ip);
            const bitis = Math.floor(Date.now() / 1000) + SURE;
            res.writeHead(303, {
                'Set-Cookie': `ta=${bitis}.${imza(bitis)}; Max-Age=${SURE}; Path=/; Secure; HttpOnly; SameSite=Lax`,
                Location: '/',
            });
            res.end();
        });
        return;
    }
    if (!cerezGecerli(req.headers.cookie)) return girisSayfasi(res);
    if (req.url.startsWith('/nabiz?')) {
        console.log('nabız', req.url.slice(7));
        res.writeHead(204, { 'Cache-Control': 'no-store' });
        return res.end();
    }
    if (req.url === '/konum') return vekil(req, res, KONUM, true);
    vekil(req, res, HEDEF, false);
});

// WebSocket: /ses ses sunucusuna, geri kalanı (görüntü akışı ve dokunma) ws-scrcpy'ye
sunucu.on('upgrade', (req, soket, bas) => {
    if (!cerezGecerli(req.headers.cookie)) {
        soket.end('HTTP/1.1 401 Unauthorized\r\n\r\n');
        return;
    }
    const yer = req.url.startsWith('/ses') ? SES : HEDEF;
    const arka = net.connect(yer.port, yer.host, () => {
        let ham = `${req.method} ${req.url} HTTP/1.1\r\n`;
        for (let i = 0; i < req.rawHeaders.length; i += 2) ham += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
        arka.write(ham + '\r\n');
        if (bas && bas.length) arka.write(bas);
        arka.pipe(soket);
        soket.pipe(arka);
        const t0 = Date.now(), tur = req.url.startsWith("/ses") ? "ses" : "ekran";
        console.log("bağlandı", tur, req.headers["cf-connecting-ip"] || "-");
        soket.on("close", () => console.log("koptu", tur, Math.round((Date.now() - t0) / 1000) + " sn"));
    });
    arka.on('error', () => soket.destroy());
    soket.on('error', () => arka.destroy());
});

sunucu.listen(PORT, '127.0.0.1', () => console.log('kapı dinliyor 127.0.0.1:' + PORT));
