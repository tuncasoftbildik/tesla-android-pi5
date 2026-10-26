# /boot/firmware ayarları

**config.txt** — Pi 5 çekirdeği 16K sayfa kullanır, Android (binder/ashmem) 4K ister:

```ini
kernel=kernel8.img
```

**cmdline.txt** — satırın sonuna ekle. PSI kapalıyken Android'in `lmkd`'si çıkar ve sistem 16 sn içinde kapanır:

```
psi=1
```

Değiştirmeden önce yedek al: `sudo cp /boot/firmware/config.txt{,.yedek}`.
