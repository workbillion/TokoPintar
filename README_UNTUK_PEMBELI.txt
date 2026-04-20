============================================================
PANDUAN SETUP TOKO PINTAR (EDISI PROFESIONAL)
============================================================

Terima kasih telah membeli source code Toko Pintar! 
Aplikasi ini dirancang untuk langsung bisa digunakan secara 
lokal (offline) tanpa perlu setup yang rumit.

1. MODE LOKAL (DEFAULT)
-----------------------
Saat pertama kali dijalankan, aplikasi akan otomatis masuk ke 
"Mode Lokal". Semua data (Katalog, POS, Pelanggan, Hutang) 
akan tersimpan di browser (HP/Laptop) pengguna masing-masing.
PEMBELI TIDAK PERLU SETUP APA PUN. Tinggal jalankan `npm install` 
dan `npm run dev`.

2. AKTIVASI MODE CLOUD (BACKUP & MULTI-USER)
--------------------------------------------
Jika Anda atau klien Anda ingin mengaktifkan fitur Sinkronisasi 
Cloud (agar data bisa dibuka di banyak HP sekaligus dan 
pendaftaran kasir), ikuti langkah berikut:

   a. Buat Project di Firebase Console (https://console.firebase.google.com)
   b. Aktifkan:
      - Firestore Database
      - Firebase Authentication (Metode Email & Google)
   c. Copy "Firebase Web Config" Anda.
   d. Buka file `firebase-applet-config.json` di folder root.
   e. Tempelkan kunci API Anda di sana.
   f. Deploy Security Rules: Gunakan file `firestore.rules` yang 
      sudah kami sediakan untuk keamanan maksimal.

3. STRUKTURid UNTUK ID AMAN
---------------------------
Aplikasi ini sudah menggunakan `crypto.randomUUID()` untuk semua 
ID Transaksi dan Pelanggan, sehingga aman dari tabrakan data (collision) 
saat sinkronisasi cloud.

4. LOGO & BRANDING
------------------
Ganti file `public/logo.svg` dengan logo bisnis Anda sendiri 
untuk melakukan rebranding total.

============================================================
Toko Pintar - Aplikasi UMKM Cerdas Indonesia
============================================================
