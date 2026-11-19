# Accurate Online - Converter Sumber.xlsx ke OtherPayment.xlsx

Aplikasi web modern berbasis **Next.js 14**, **TypeScript**, dan **Tailwind CSS** untuk mengkonversi data jurnal/transaksi pengeluaran kas & bank dari format **`Sumber.xlsx`** menjadi format file impor **`OtherPayment.xlsx`** (Pembayaran Lainnya) yang siap diimpor langsung ke **Accurate Online**.

---

## 🚀 Fitur Utama

1. **Konversi Otomatis & Cerdas**:
   - Membaca file input Excel dengan struktur identik `Sumber.xlsx`.
   - Mengelompokkan transaksi secara otomatis berdasarkan `No. bukti` (voucher).
   - Menyusun struktur berjenjang (*hierarchical*): 1 baris **`HEADER`** (warna hijau) diikuti oleh rincian baris **`ACCOUNT`** (warna biru).
   - Memasukkan sheet pendukung (`Penjelasan Kolom Header` dan `Penjelasan Kolom Account`) agar template 100% compliant dengan Accurate Online.
2. **Fleksibilitas Pengaturan Format**:
   - **Format Kode Akun**: Pilihan menggunakan kode akun bersih 6-digit (contoh: `614.01` dan `110.12`) atau kode lengkap dengan departemen (`614.01.1000`).
   - **Pilihan Hapus Titik**: Konversi `614.01` menjadi `61401` jika daftar akun di Accurate Online Anda tidak menggunakan tanda titik.
   - **Pemetaan No. Bukti**: Opsi mengisi kolom *No Pembayaran* dan/atau *No Cek*.
   - **Catatan Header**: Dari keterangan baris pertama, gabungan seluruh baris, atau dikosongkan.
   - **Pembersihan Otomatis Departemen**: Menghapus spasi tersembunyi (*non-breaking space* `\u00A0`).
3. **Pratinjau Interaktif (Live Preview)**:
   - Tab **Hasil OtherPayment**: Tampilan hierarki baris hijau (HEADER) & biru (ACCOUNT) dengan toggle ciutkan/bentangkan.
   - Tab **Data Sumber**: Menampilkan data mentah hasil pembacaan.
   - Tab **Distribusi Akun & Dept**: Statistik distribusi kas/bank dan departemen.
   - Fitur pencarian instan berdasarkan No. Bukti, Nama Akun, atau Keterangan.
4. **Ringkasan Finansial**:
   - Total Voucher/Transaksi, Total Baris Akun, Total Nilai Rupiah, dan Rentang Tanggal.
5. **Dua Mode Konversi**:
   - Client-side (langsung di browser pengguna untuk kecepatan maksimal dan keamanan privasi).
   - Server-side API endpoint (`/api/convert`) untuk integrasi sistem.

---

## 📋 Pemetaan Kolom (Sumber &rarr; OtherPayment)

| Data Sumber (`Sumber.xlsx`) | Target Kolom `OtherPayment.xlsx` | Posisi Baris | Keterangan |
|---|---|---|---|
| `No. bukti` | **No Pembayaran** &amp; **No Cek** | `HEADER` | Mengelompokkan transaksi per voucher |
| `Tanggal` | **Tanggal** &amp; **Tanggal Cek** | `HEADER` | Diformat menjadi `DD/MM/YYYY` |
| `Kredit` (pendek/bersih) | **Kas/Bank** | `HEADER` | Kode akun Kas & Bank yang dikredit |
| `Keterangan` | **Catatan** (Header) | `HEADER` | Keterangan voucher |
| `Debit` (pendek/bersih) | **No Akun** | `ACCOUNT` | Kode akun biaya/beban/titipan yang didebit |
| `Nama Akun` | **Nama Akun** | `ACCOUNT` | Nama akun pembayaran |
| `Nilai` | **Nilai Akun** | `ACCOUNT` | Nominal rupiah per rincian akun |
| `Nama Departemen` | **Nama Departemen** | `ACCOUNT` | Nama departemen (dibersihkan spasi & nbsp) |
| `Keterangan` | **Catatan Akun** | `ACCOUNT` | Catatan/memo per baris rincian |

---

## 🛠️ Cara Menjalankan Aplikasi

### 1. Mode Development
```bash
npm run dev
```
Buka browser di [http://localhost:3000](http://localhost:3000).

### 2. Mode Produksi (Build & Run)
```bash
npm run build
npm start
```

---

## 📥 Cara Impor ke Accurate Online

1. Buka database Accurate Online Anda.
2. Masuk ke menu **Kas & Bank** &rarr; **Pembayaran**.
3. Klik tombol **Impor Data** (ikon berkas di sudut kanan atas).
4. Pilih file hasil konversi (`OtherPayment_...xlsx`).
5. Pada kolom pemetaan, semua nama kolom sudah sesuai dengan template baku Accurate Online sehingga dapat langsung dilanjutkan hingga selesai.
