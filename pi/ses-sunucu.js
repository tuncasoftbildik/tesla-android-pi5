// Android sesini tarayıcıya akıt: PipeWire "tesla_ses" çıkışının monitörü -> ffmpeg FLAC, parçalı MP4
// (Tesla Android'in yöntemi) -> WebSocket (127.0.0.1:8091, giriş kapısı /ses yolunu buraya verir).
// Yeni bağlanana önce başlangıç parçası (ftyp+moov), sonra her moof+mdat tek mesaj olarak gider.
// ffmpeg yalnız dinleyen varken çalışır.
'use strict';
const WebSocket = require('/home/pi/ws-scrcpy/node_modules/ws');
const { spawn } = require('child_process');

const wss = new WebSocket.Server({ host: '127.0.0.1', port: 8091 });
let ff = null;
let durdurZamanlayici = null;

function yay(paket) {
    for (const c of wss.clients) {
        // Yavaş bağlantıda birikme olmasın: 256 KB'den fazla bekleyen varsa paketi atla
        if (c.readyState === WebSocket.OPEN && c.basladi && c.bufferedAmount < 262144) c.send(paket);
    }
}

// MP4 kutularını ayır: ftyp+moov başlangıç parçası, moof+mdat çiftleri ses parçaları
let baslangic = null;
function mp4Cozucu() {
    let tampon = Buffer.alloc(0);
    let bas = [];
    let moof = null;
    return (veri) => {
        tampon = Buffer.concat([tampon, veri]);
        while (tampon.length >= 8) {
            const boy = tampon.readUInt32BE(0);
            if (boy < 8) { tampon = Buffer.alloc(0); return; }
            if (tampon.length < boy) return;
            const tur = tampon.toString('latin1', 4, 8);
            const kutu = tampon.subarray(0, boy);
            tampon = tampon.subarray(boy);
            if (tur === 'ftyp') bas = [kutu];
            else if (tur === 'moov') {
                baslangic = Buffer.concat([...bas, kutu]);
                for (const c of wss.clients) if (c.readyState === WebSocket.OPEN && !c.basladi) { c.send(baslangic); c.basladi = true; }
            } else if (tur === 'moof') moof = kutu;
            else if (tur === 'mdat' && moof) { yay(Buffer.concat([moof, kutu])); moof = null; }
        }
    };
}

function basla() {
    if (ff) return;
    ff = spawn('ffmpeg', [
        '-hide_banner', '-loglevel', 'error',
        '-f', 'pulse', '-fragment_size', '3840', '-i', 'tesla_ses.monitor',
        '-ac', '2', '-ar', '48000',
        '-c:a', 'flac', '-frame_size', '960', '-strict', 'experimental',
        '-f', 'mp4', '-movflags', '+frag_keyframe+empty_moov+default_base_moof', '-frag_duration', '100000',
        '-flush_packets', '1', 'pipe:1',
    ], { env: { ...process.env, XDG_RUNTIME_DIR: '/run/user/$(id -u)' } });
    baslangic = null;
    ff.stdout.on('data', mp4Cozucu());
    ff.stderr.on('data', (d) => process.stderr.write(d));
    ff.on('exit', (kod) => {
        ff = null;
        // Dinleyen varken düşerse yeniden; yeni başlangıç parçası gelince istemciler yeniden bağlanmalı
        for (const c of wss.clients) c.close();
        console.log('ffmpeg çıktı', kod);
    });
    console.log('ses akışı başladı');
}

wss.on('connection', (ws) => {
    clearTimeout(durdurZamanlayici);
    if (baslangic) { ws.send(baslangic); ws.basladi = true; }
    basla();
    ws.on('close', () => {
        if (wss.clients.size) return;
        durdurZamanlayici = setTimeout(() => { if (ff && !wss.clients.size) ff.kill(); }, 10000);
    });
});
console.log('ses sunucusu 127.0.0.1:8091');
