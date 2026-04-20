# 📱 Panduan Membuat APK TokoPintar untuk Play Store

Saya sudah menyiapkan integrasi **Capacitor** di dalam project ini. Karena pembuatan file `.apk` atau `.aab` (format Play Store) membutuhkan **Android Studio** dan **Java SDK** yang hanya bisa berjalan di komputer lokal, silakan ikuti langkah-langkah di bawah ini:

## 🛠 Persiapan di Komputer Kamu
1. **Install Node.js**: Pastikan kamu sudah install Node.js terbaru.
2. **Install Android Studio**: Download dan install dari [developer.android.com](https://developer.android.com/studio).
3. **Download Project Ini**: Gunakan fitur **Export to ZIP** di menu Settings AI Studio ini.

## 🚀 Langkah-langkah Membuat APK

### 1. Ekstrak dan Install Dependency
Buka terminal/CMD di folder project yang sudah di-download, lalu jalankan:
```bash
npm install
```

### 2. Build Project Web
Kita perlu mengubah kode React menjadi file statis:
```bash
npm run build
```

### 3. Sinkronisasi Kode ke Android
Folder `android` sudah saya siapkan di dalam project ini. Setiap kali kamu mengubah kode di React, jalankan ini untuk memperbarui aplikasi Android-nya:
```bash
npm run cap:sync
```

### 4. Buka di Android Studio
Perintah ini akan membuka project Android kamu secara otomatis (pastikan Android Studio sudah terinstall):
```bash
npm run cap:open
```

### 5. Generate Signed APK (Untuk Play Store)
Di dalam **Android Studio**:
1. Pilih menu **Build** > **Generate Signed Bundle / APK...**
2. Pilih **Android App Bundle** (untuk Play Store) atau **APK** (untuk instal langsung).
3. Ikuti petunjuk untuk membuat **Key Store** (simpan file ini baik-baik, jangan sampai hilang karena ini kunci keamanan aplikasi kamu).
4. Setelah selesai, file `.aab` atau `.apk` akan tersedia di folder `android/app/release`.

## 🛡 Tips Lolos Uji Keamanan Play Store
1. **Ubah Package Name**: Saya sudah mengatur `com.tokokita.app`. Jika ingin unik, ubah di `capacitor.config.ts`.
2. **Gunakan ProGuard**: Android Studio secara otomatis mengaktifkan pengecilan kode (minify) untuk keamanan.
3. **Izin (Permissions)**: Aplikasi ini hanya menggunakan fitur standar. Jika nanti menambah fitur Kamera/Lokasi, pastikan menambah deskripsi alasan penggunaan di `AndroidManifest.xml`.
4. **Target SDK**: Pastikan selalu menggunakan Target SDK terbaru (saat ini minimal SDK 34 untuk Play Store).

---
**TokoPintar** siap dipublikasikan! Jika ada kendala saat build di Android Studio, pastikan koneksi internet lancar karena Gradle akan mendownload banyak library di awal.
