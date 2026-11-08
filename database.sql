DROP TABLE IF EXISTS pembayaran CASCADE;
DROP TABLE IF EXISTS detail_transaksi CASCADE;
DROP TABLE IF EXISTS transaksi CASCADE;
DROP TABLE IF EXISTS detail_pesanan CASCADE;
DROP TABLE IF EXISTS pesanan CASCADE;
DROP TABLE IF EXISTS riwayat_stok CASCADE;
DROP TABLE IF EXISTS notifikasi_stok CASCADE;
DROP TABLE IF EXISTS stok CASCADE;
DROP TABLE IF EXISTS lokasi CASCADE;
DROP TABLE IF EXISTS barang CASCADE;
DROP TABLE IF EXISTS registrasi CASCADE;
DROP TABLE IF EXISTS pengguna CASCADE;
DROP TABLE IF EXISTS pelanggan CASCADE;
DROP TABLE IF EXISTS kasir CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS owner CASCADE;
DROP TABLE IF EXISTS pengelola_toko CASCADE;
DROP TABLE IF EXISTS kode_pos CASCADE;
DROP TABLE IF EXISTS alamat CASCADE;
DROP TABLE IF EXISTS akun CASCADE;

CREATE TABLE akun (
    id_akun VARCHAR(10) PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    alamat_jalan VARCHAR(150) NOT NULL,
    alamat_rt VARCHAR(10) NOT NULL,
    alamat_rw VARCHAR(10) NOT NULL,
    kode_pos VARCHAR(10) NOT NULL,
    role VARCHAR(30) NOT NULL
);

CREATE TABLE alamat (
    alamat_desa VARCHAR(100) PRIMARY KEY,
    alamat_kecamatan VARCHAR(100) NOT NULL,
    alamat_kabupaten VARCHAR(100) NOT NULL,
    alamat_provinsi VARCHAR(100) NOT NULL
);

CREATE TABLE kode_pos (
    kode_pos VARCHAR(10) PRIMARY KEY,
    alamat_desa VARCHAR(100) NOT NULL,
    FOREIGN KEY (alamat_desa) REFERENCES alamat(alamat_desa)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE pelanggan (
    id_pelanggan VARCHAR(10) PRIMARY KEY,
    id_akun VARCHAR(10) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alamat_jalan VARCHAR(150) NOT NULL,
    alamat_rt VARCHAR(10) NOT NULL,
    alamat_rw VARCHAR(10) NOT NULL,
    kode_pos VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE pengguna (
    id_pengguna VARCHAR(10) PRIMARY KEY,
    id_akun VARCHAR(10) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alamat_jalan VARCHAR(150) NOT NULL,
    alamat_rt VARCHAR(10) NOT NULL,
    alamat_rw VARCHAR(10) NOT NULL,
    kode_pos VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE pengelola_toko (
    id_pengelola VARCHAR(10) PRIMARY KEY,
    id_akun VARCHAR(10) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alamat_jalan VARCHAR(150) NOT NULL,
    alamat_rt VARCHAR(10) NOT NULL,
    alamat_rw VARCHAR(10) NOT NULL,
    kode_pos VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE owner (
    id_owner VARCHAR(10) PRIMARY KEY,
    id_akun VARCHAR(10) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alamat_jalan VARCHAR(150) NOT NULL,
    alamat_rt VARCHAR(10) NOT NULL,
    alamat_rw VARCHAR(10) NOT NULL,
    kode_pos VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE admin (
    id_admin VARCHAR(10) PRIMARY KEY,
    id_akun VARCHAR(10) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alamat_jalan VARCHAR(150) NOT NULL,
    alamat_rt VARCHAR(10) NOT NULL,
    alamat_rw VARCHAR(10) NOT NULL,
    kode_pos VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE kasir (
    id_kasir VARCHAR(10) PRIMARY KEY,
    id_akun VARCHAR(10) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(100) NOT NULL,
    nama_lengkap VARCHAR(100) NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    email VARCHAR(100) NOT NULL,
    alamat_jalan VARCHAR(150) NOT NULL,
    alamat_rt VARCHAR(10) NOT NULL,
    alamat_rw VARCHAR(10) NOT NULL,
    kode_pos VARCHAR(10) NOT NULL,
    FOREIGN KEY (id_akun) REFERENCES akun(id_akun)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE registrasi (
    id_registrasi VARCHAR(10) PRIMARY KEY,
    id_pelanggan VARCHAR(10) NOT NULL,
    tanggal_registrasi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_registrasi VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE barang (
    id_barang VARCHAR(10) PRIMARY KEY,
    id_admin VARCHAR(10) NOT NULL,
    nama_barang VARCHAR(100) NOT NULL,
    kategori VARCHAR(50) NOT NULL,
    satuan VARCHAR(20) NOT NULL,
    harga_satuan NUMERIC(12,2) NOT NULL CHECK (harga_satuan >= 0),
    stok_minimum INTEGER NOT NULL CHECK (stok_minimum >= 0),
    FOREIGN KEY (id_admin) REFERENCES admin(id_admin)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE lokasi (
    id_lokasi VARCHAR(10) PRIMARY KEY,
    id_pengelola VARCHAR(10) NOT NULL,
    nama_lokasi VARCHAR(100) NOT NULL,
    jenis_lokasi VARCHAR(50) NOT NULL,
    FOREIGN KEY (id_pengelola) REFERENCES pengelola_toko(id_pengelola)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE stok (
    id_stok VARCHAR(10) PRIMARY KEY,
    id_lokasi VARCHAR(10) NOT NULL,
    id_barang VARCHAR(10) NOT NULL,
    jumlah_stok INTEGER NOT NULL CHECK (jumlah_stok >= 0),
    tanggal_update TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (id_lokasi) REFERENCES lokasi(id_lokasi)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_barang) REFERENCES barang(id_barang)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE notifikasi_stok (
    id_notifikasi VARCHAR(10) PRIMARY KEY,
    id_stok VARCHAR(10) NOT NULL,
    id_pengelola VARCHAR(10) NOT NULL,
    pesan TEXT NOT NULL,
    tanggal_notifikasi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_stok) REFERENCES stok(id_stok)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_pengelola) REFERENCES pengelola_toko(id_pengelola)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE riwayat_stok (
    id_riwayat VARCHAR(10) PRIMARY KEY,
    id_stok VARCHAR(10) NOT NULL,
    id_pengelola VARCHAR(10) NOT NULL,
    jenis_riwayat VARCHAR(30) NOT NULL,
    jumlah INTEGER NOT NULL CHECK (jumlah > 0),
    tanggal_riwayat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    keterangan TEXT,
    FOREIGN KEY (id_stok) REFERENCES stok(id_stok)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_pengelola) REFERENCES pengelola_toko(id_pengelola)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE pesanan (
    id_pesanan VARCHAR(10) PRIMARY KEY,
    id_pelanggan VARCHAR(10) NOT NULL,
    tanggal_pesanan TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_pesanan VARCHAR(30) NOT NULL,
    total_harga NUMERIC(12,2) NOT NULL CHECK (total_harga >= 0),
    FOREIGN KEY (id_pelanggan) REFERENCES pelanggan(id_pelanggan)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE detail_pesanan (
    id_detail_pesanan VARCHAR(10) PRIMARY KEY,
    id_pesanan VARCHAR(10) NOT NULL,
    id_barang VARCHAR(10) NOT NULL,
    jumlah INTEGER NOT NULL CHECK (jumlah > 0),
    harga_satuan NUMERIC(12,2) NOT NULL CHECK (harga_satuan >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_barang) REFERENCES barang(id_barang)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

    id_transaksi VARCHAR(10) PRIMARY KEY,
    id_kasir VARCHAR(10) NOT NULL,
    id_pesanan VARCHAR(10) NOT NULL,
    tanggal_transaksi TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_harga NUMERIC(12,2) NOT NULL CHECK (total_harga >= 0),
    status_transaksi VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_kasir) REFERENCES kasir(id_kasir)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_pesanan) REFERENCES pesanan(id_pesanan)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE detail_transaksi (
    id_detail_transaksi VARCHAR(10) PRIMARY KEY,
    id_transaksi VARCHAR(10) NOT NULL,
    id_barang VARCHAR(10) NOT NULL,
    jumlah INTEGER NOT NULL CHECK (jumlah > 0),
    harga_satuan NUMERIC(12,2) NOT NULL CHECK (harga_satuan >= 0),
    subtotal NUMERIC(12,2) NOT NULL CHECK (subtotal >= 0),
    FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_barang) REFERENCES barang(id_barang)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE pembayaran (
    id_pembayaran VARCHAR(10) PRIMARY KEY,
    id_transaksi VARCHAR(10) NOT NULL,
    tanggal_pembayaran TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    metode_pembayaran VARCHAR(50) NOT NULL,
    jumlah_pembayaran NUMERIC(12,2) NOT NULL CHECK (jumlah_pembayaran >= 0),
    bukti_pembayaran VARCHAR(255),
    status_verifikasi VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE struk (
    id_struk VARCHAR(10) PRIMARY KEY,
    id_transaksi VARCHAR(10) NOT NULL,
    id_kasir VARCHAR(10) NOT NULL,
    tanggal_cetak TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_bayar NUMERIC(12,2) NOT NULL CHECK (total_bayar >= 0),
    FOREIGN KEY (id_transaksi) REFERENCES transaksi(id_transaksi)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_kasir) REFERENCES kasir(id_kasir)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE laporan (
    id_laporan VARCHAR(10) PRIMARY KEY,
    id_owner VARCHAR(10) NOT NULL,
    id_admin VARCHAR(10) NOT NULL,
    jenis_laporan VARCHAR(50) NOT NULL,
    periode_awal TIMESTAMP NOT NULL,
    periode_akhir TIMESTAMP NOT NULL,
    tanggal_dibuat TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status_arsip VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_owner) REFERENCES owner(id_owner)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    FOREIGN KEY (id_admin) REFERENCES admin(id_admin)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE backup_data (
    id_backup VARCHAR(10) PRIMARY KEY,
    id_admin VARCHAR(10) NOT NULL,
    tanggal_backup TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    nama_file VARCHAR(150) NOT NULL,
    status VARCHAR(30) NOT NULL,
    FOREIGN KEY (id_admin) REFERENCES admin(id_admin)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

INSERT INTO akun (id_akun, username, password, nama_lengkap, no_telepon, email, alamat_jalan, alamat_rt, alamat_rw, kode_pos, role)
VALUES 
('A0001', 'farrel.alqodri', 'pwd001', 'Muhammad Farrel Alqodri', '081234567801', 'farrel.alqodri@gmail.com', 'Jl. Limau Manis No. 12', 'RT 01', 'RW 02', '25163', 'Pelanggan'),
('A0008', 'syafmila.wiradhika', 'ad-0001', 'Syafmila Wiradhika', '081234567813', 'syafmila.wiradhika@gmail.com', 'Jl. Gajah Mada No. 4', 'RT 03', 'RW 01', '25171', 'Admin');

INSERT INTO alamat (alamat_desa, alamat_kecamatan, alamat_kabupaten, alamat_provinsi)
VALUES ('Limau Manis', 'Pauh', 'Kota Padang', 'Sumatera Barat');

INSERT INTO kode_pos (kode_pos, alamat_desa)
VALUES ('25163', 'Limau Manis');

INSERT INTO pelanggan (id_pelanggan, id_akun, username, password, nama_lengkap, no_telepon, email, alamat_jalan, alamat_rt, alamat_rw, kode_pos)
VALUES ('PL0001', 'A0001', 'farrel.alqodri', 'pwd001', 'Muhammad Farrel Alqodri', '081234567801', 'farrel.alqodri@gmail.com', 'Jl. Limau Manis No. 12', 'RT 01', 'RW 02', '25163');