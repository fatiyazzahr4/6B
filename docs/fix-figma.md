# Dokumentasi Perbaikan Figma & Fitur Toko Farid (docs/fix-figma.md)

Dokumen ini memetakan temuan analisis, inventaris Figma, perbedaan desain, dan rencana perbaikan untuk 3 masalah utama (M1, M2, M3).

---

## Log Kemajuan Tahap

| Fase / Masalah | Status | Catatan |
|---|:---:|---|
| **Fase 0: Baca Figma dan Petakan Masalah** | **SELESAI** | Figma API membutuhkan otentikasi (403: Invalid Token). Seluruh kondisi awal (git, docker, env, port, kode) telah dipetakan lengkap. |
| **M1: Notifikasi "Logout Berhasil" untuk Semua Aktor** | RENCANA SIAP | Menyiapkan mekanisme query param/cookie notifikasi toast seragam untuk 5 aktor. |
| **M2: Desain Ulang Pengelola Toko Sesuai Figma** | MENUNGGU SCREENSHOT FIGMA | Menunggu screenshot frame Pengelola Toko dari pengguna agar tidak mengarang desain (sesuai aturan 0.2). |
| **M3: Perbaiki Registrasi Pelanggan** | RENCANA SIAP | Akar masalah ditemukan: form submit statis dummy, belum ada API pelanggan dan session handler. |

---

## 1. Kondisi Awal Sistem (Fase 0.5)

* **Git Status**:
  * Branch `master`, up to date dengan `origin/master`.
  * Perubahan sesi (`await connection()`) dan seed idempotent di `prisma/seed.ts` sudah lolos lint & build.
* **Docker & Database**:
  * Container `postgres-enamBE` (Image: `postgres`) berstatus **Up 3+ hours**.
  * Port `5432` terikat ke `0.0.0.0:5432->5432/tcp`, koneksi TCP ::1/127.0.0.1 port 5432 **sukses (TcpTestSucceeded: True)** tanpa konflik.
* **Variabel Lingkungan (Nama Variabel)**:
  * `.env`: `DATABASE_URL`, `DIRECT_URL`, `DATABASE_URL_LOCAL`, `DB_SSL`, `AUTH_SECRET`.
  * `.env.local`: `VERCEL_OIDC_TOKEN`.

---

## 2. Status Akses Figma (Fase 0.1 & 0.2)

* **Tautan Figma Pengguna**: `https://www.figma.com/design/7vnPqiseJZzwRIhiuFH6gS/UI-DESIGN-6B?node-id=4-3&t=GkYz8i6q4BmEIGuh-1`
* **Hasil Pengujian Akses**:
  * Pemanggilan langsung ke Figma REST API (`https://api.figma.com/v1/files/7vnPqiseJZzwRIhiuFH6gS`) menghasilkan respons:
    `{"status": 403, "err": "Invalid token"}`
  * Endpoint MCP Figma di `.vscode/mcp.json` (`https://mcp.figma.com/mcp`) memerlukan token otentikasi Figma yang belum terpasang di sesi CLI.
* **Tindakan Sesuai Aturan 0.2**:
  > *"Jika Figma TIDAK bisa dibaca (butuh login, akses ditolak, atau tool tidak ada), BERHENTI dan minta saya mengirim screenshot per frame. DILARANG mengarang desain."*
  * Kami melaporkan kendala ini pada **[BERHENTI 1]** dan memohon pengguna untuk mengunggah/mengirimkan screenshot per frame untuk:
    1. Seluruh layar Pengelola Toko (Dashboard, Stok Barang, Lokasi Penyimpanan, Riwayat Stok, Notifikasi, Profil).
    2. Komponen Notifikasi/Toast "Logout berhasil".
    3. Layar Registrasi Pelanggan.

---

## 3. Pemetaan Masalah & Rencana Eksekusi

### A. Masalah M1: Notifikasi "Logout Berhasil"
* **Akar Masalah**:
  * Tombol logout di Admin, Kasir, Owner, dan Pengelola Toko hanya memanggil route handler API lalu melakukan `router.replace("/<role>/login")`.
  * Di Pelanggan, tombol logout hanya berupa tag `<Link href="/pelanggan/login">`.
  * Tidak ada pemindahan state atau penanda notifikasi yang dikirim ke halaman login, sehingga pesan toast tidak pernah muncul.
* **Rencana Perbaikan**:
  1. Pada handler logout tiap aktor, lakukan penghapusan cookie sesi server secara tuntas.
  2. Arahkan pengguna ke halaman login dengan query parameter penanda sementara: `/<role>/login?logout=success`.
  3. Di seluruh komponen login (`AdminLogin`, `KasirLogin`, `OwnerLogin`, `PengelolaLogin`, `CustomerLogin`), tambahkan *Toast Notification*:
     * Teks: **"Logout berhasil"**
     * Desain: Floating toast badge hijau/sukses dengan ikon check.
     * Membersihkan query param dari URL (`window.history.replaceState` atau `router.replace`) agar notifikasi tidak muncul kembali saat halaman di-refresh.
     * Diproteksi di dalam `<Suspense>` agar aman dari dynamic query param di Next.js 16.

### B. Masalah M2: Desain Ulang Halaman Pengelola Toko
* **Akar Masalah**:
  * Komponen pengelola toko saat ini (`app/pengelola/components/pengelola-portal.tsx` dan `pengelola.css`) menggunakan styling sementara dan struktur kartu/tabel generik yang belum disinkronkan dengan frame Figma.
* **Rencana Perbaikan**:
  1. Menggunakan screenshot frame Figma yang dikirim pengguna sebagai acuan absolut.
  2. Menyelaraskan layout sidebar, header, typography, warna hex, spacing, badge status, tabel, dan modal form.
  3. Mempertahankan integrasi database nyata lewat Prisma (`/api/pengelola`).

### C. Masalah M3: Registrasi Pelanggan
* **Akar Masalah**:
  * Form `RegisterPage` di [`customer-portal.tsx`](file:///c:/Users/USER/Downloads/6b/app/pelanggan/components/customer-portal.tsx#L290-L298) memiliki baris hardcode:
    ```tsx
    setNotice("Registrasi belum dapat diproses karena layanan akun pelanggan belum tersedia. Data ini tidak disimpan.");
    ```
  * Tidak ada API Route untuk pelanggan (`/api/pelanggan`).
* **Rencana Perbaikan**:
  1. Membuat Route Handler `/api/pelanggan` yang menangani `POST { action: "register", ... }` dan `POST { action: "login", ... }`.
  2. Validasi input: Nama, Username unik, Email unik & format valid, Nomor Telepon, Kode Pos, Alamat, Password minimal 6 karakter.
  3. Generate ID pelanggan (`PLxxxx`) dan ID akun (`Axxxx`).
  4. Hash password (menggunakan algoritma hashing/bcrypt yang kompatibel atau konsisten dengan skema `akun`).
  5. Simpan ke database: tabel `akun`, `pelanggan`, dan `registrasi` (status `Disetujui`).
  6. Buat sesi pelanggan (cookie `toko_farid_pelanggan_session`) dan helper `lib/pelanggan-session.ts` sehingga pelanggan baru dapat langsung masuk atau diarahkan ke login dengan notifikasi sukses.
