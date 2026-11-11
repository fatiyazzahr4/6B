# Toko Farid - Audit Matrix & Progress Log

Dokumen ini mencatat kemajuan perbaikan, status uji, dan matriks fitur Toko Farid sesuai panduan bertahap.

---

## Log Kemajuan Tahap

| Tahap | Status | Tanggal / Waktu | Catatan |
|---|:---:|:---:|---|
| **Tahap 1: Perbaiki Error Date.now() di /tentang** | **SELESAI** | 2026-11-11 | Selesai diperbaiki, lint & build lolos (47/47 halaman). Menunggu konfirmasi `LANJUT` [BERHENTI 1]. |
| **Tahap 2: Audit dan Perbaikan Aktor + Fitur (Lokal)** | BELUM DIMULAI | - | Menunggu perintah `LANJUT`. |
| **Tahap 3: Neon dan Pencocokan dengan Lokal** | BELUM DIMULAI | - | Menunggu penyelesaian Tahap 2. |

---

## Rincian Tahap 1: Error Date.now() & Prerender /tentang

### 1.1 Status `cacheComponents` di `next.config.ts`
- **Nilai**: `cacheComponents: true` (AKTIF bersama `partialPrefetching: true`).

### 1.2 Alur `parseAdminSession`
- **Sumber Data**: Cookie HTTP-only `toko_farid_admin_session`.
- **Alur**: `getAdminSession()` membaca cookie via `(await cookies()).get(ADMIN_SESSION_COOKIE)?.value`. Token dipecah menjadi `payload` dan `signature`. Signature diverifikasi via HMAC SHA-256. Payload base64url didecode ke JSON `AdminSession` (`adminId`, `expiresAt`). `expiresAt` dibandingkan dengan waktu sekarang (`Date.now() / 1000`).
- **Pemanggil**:
  1. `getAdminSession()` di `lib/admin-session.ts`
  2. `app/admin/(portal)/layout.tsx`
  3. `app/api/admin/route.ts`
  4. `app/transaksi/page.tsx`
  5. `app/api/transaksi/route.ts`

### 1.3 & 1.4 Analisis Keterkaitan Halaman Publik `/tentang`
- Halaman publik `/tentang` (`app/tentang/page.tsx`) dan `/beranda` tidak membutuhkan sesi admin.
- Namun compiler Next.js 16 (Turbopack) dengan Cache Components mengaudit seluruh pohon kode server saat build/prerender. Jika `Date.now()` dieksekusi tanpa penanda dynamic execution context (`await connection()`), Next.js menandainya sebagai "unstable value" yang memblokir prerendering statis.
- Rantai penelusuran:
  - `app/layout.tsx` (RootLayout bersama)
  - `app/transaksi/page.tsx` -> `getAdminSession()` -> `lib/admin-session.ts:55` (`Date.now()`)
  - Shared public components (`app/components/storefront.tsx`) pada `/beranda` dan `/tentang`.

### 1.5 Perbaikan yang Dilakukan
- Menambahkan `await connection()` dari `next/server` pada fungsi pembaca sesi:
  - `lib/admin-session.ts`
  - `lib/kasir-session.ts`
  - `lib/owner-session.ts`
  - `lib/pengelola-session.ts`
- Memastikan `Date.now()` di-evaluate hanya setelah context koneksi dinamis aktif atau dipassing dari pemanggil dinamis.
- Memastikan pembacaan sesi di rute campuran (`app/transaksi/page.tsx`) terisolasi di dalam `<Suspense fallback={...}>`.
- Halaman publik (`/tentang`, `/beranda`, `/panduan-akun`, `/`) tetap murni statis tanpa pemanggilan sesi.

### 1.6 & 1.7 Hasil Uji Lint & Build
- `npm run lint`: **LOLOS** (0 error, 0 warning).
- `npm run build`: **LOLOS** (47/47 halaman ter-generate sempurna: 13 Static `○`, 17 Partial Prerender `◐`, 17 Dynamic `ƒ`).
- Halaman `/tentang` ter-generate statis (`○ /tentang`) tanpa error dan tanpa badge Issue.

---

## Matriks Fitur (Disiapkan untuk Tahap 2)

| Fitur | Aktor | Tabel DB Terkait | Sumber Data | Status Lokal | Status Neon |
|---|---|---|:---:|:---:|:---:|
| Health Check | Publik | `akun` | DB | Belum Diuji | Belum Diuji |
| Halaman Statis Publik (`/`, `/beranda`, `/tentang`, `/panduan-akun`) | Publik | - | DB / Konten | Siap | Belum Diuji |
| Registrasi Pelanggan | Pelanggan | `akun`, `pelanggan`, `registrasi`, `alamat`, `kode_pos` | DB | Belum Diuji | Belum Diuji |
| Login & Profil Pelanggan | Pelanggan | `akun`, `pelanggan` | DB | Belum Diuji | Belum Diuji |
| Katalog & Pesanan Pelanggan | Pelanggan | `barang`, `stok`, `pesanan`, `detail_pesanan` | DB | Belum Diuji | Belum Diuji |
| Login & Profil Admin | Admin | `akun`, `admin` | DB | Belum Diuji | Belum Diuji |
| Kelola Akun Semua Peran | Admin | `akun`, role tables | DB | Belum Diuji | Belum Diuji |
| Kelola Barang & Harga | Admin | `barang`, `stok` | DB | Belum Diuji | Belum Diuji |
| Kelola Laporan & Backup | Admin | `laporan`, `backup_data` | DB | Belum Diuji | Belum Diuji |
| Login & Profil Kasir | Kasir | `akun`, `kasir` | DB | Belum Diuji | Belum Diuji |
| Proses Pesanan & Transaksi Kasir | Kasir | `pesanan`, `transaksi`, `detail_transaksi` | DB | Belum Diuji | Belum Diuji |
| Pembayaran & Cetak Struk | Kasir | `pembayaran`, `struk` | DB | Belum Diuji | Belum Diuji |
| Login & Profil Pengelola Toko | Pengelola Toko | `akun`, `pengelola_toko` | DB | Belum Diuji | Belum Diuji |
| Lokasi & Stok Barang | Pengelola Toko | `lokasi`, `stok`, `riwayat_stok` | DB | Belum Diuji | Belum Diuji |
| Notifikasi Stok Minimum | Pengelola Toko | `notifikasi_stok` | DB | Belum Diuji | Belum Diuji |
| Login & Profil Owner | Owner | `akun`, `owner` | DB | Belum Diuji | Belum Diuji |
| Laporan & Arsip Owner | Owner | `laporan` | DB | Belum Diuji | Belum Diuji |
| Transaksi Manual & Riwayat | Admin, Kasir, Owner | `transaksi_manual`, `transaksi` | DB | Belum Diuji | Belum Diuji |
