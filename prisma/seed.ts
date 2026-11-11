import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../app/generated/prisma/client";

function getClient(connectionString: string, sslRequired: boolean) {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString,
      max: 5,
      ssl: sslRequired ? { rejectUnauthorized: false } : false,
    }),
  });
}

function daysAgo(days: number) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - days);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

async function seedDataToDatabase(targetPrisma: PrismaClient, label: string) {
  console.info(`\n--- Memulai seeding ke [${label}] ---`);

  // 1. Alamat & Kode Pos
  await targetPrisma.alamat.upsert({
    where: { alamat_desa: "Limau Manis" },
    update: {},
    create: {
      alamat_desa: "Limau Manis",
      alamat_kecamatan: "Pauh",
      alamat_kabupaten: "Kota Padang",
      alamat_provinsi: "Sumatera Barat",
    },
  });
  await targetPrisma.alamat.upsert({
    where: { alamat_desa: "Alai Parak Kopi" },
    update: {},
    create: {
      alamat_desa: "Alai Parak Kopi",
      alamat_kecamatan: "Padang Utara",
      alamat_kabupaten: "Kota Padang",
      alamat_provinsi: "Sumatera Barat",
    },
  });

  await targetPrisma.kode_pos.upsert({
    where: { kode_pos: "25163" },
    update: {},
    create: { kode_pos: "25163", alamat_desa: "Limau Manis" },
  });
  await targetPrisma.kode_pos.upsert({
    where: { kode_pos: "25171" },
    update: {},
    create: { kode_pos: "25171", alamat_desa: "Limau Manis" },
  });
  await targetPrisma.kode_pos.upsert({
    where: { kode_pos: "25156" },
    update: {},
    create: { kode_pos: "25156", alamat_desa: "Alai Parak Kopi" },
  });

  // 2. Akun & Data Akun
  const accounts = [
    {
      id_akun: "A0008",
      username: "syafmila.wiradhika",
      password: "ad-0001",
      nama_lengkap: "Syafmila Wiradhika",
      no_telepon: "081234567813",
      email: "syafmila.wiradhika@gmail.com",
      alamat_jalan: "Jl. Gajah Mada No. 4",
      alamat_rt: "03",
      alamat_rw: "01",
      kode_pos: "25171",
      role: "Admin",
    },
    {
      id_akun: "A0002",
      username: "dafina.kasir",
      password: "kasir123",
      nama_lengkap: "Dafina Syafitri",
      no_telepon: "081234567802",
      email: "dafina.syafitri@gmail.com",
      alamat_jalan: "Jl. Dr. Moh. Hatta No. 15",
      alamat_rt: "02",
      alamat_rw: "01",
      kode_pos: "25163",
      role: "Kasir",
    },
    {
      id_akun: "A0003",
      username: "andi.kasir",
      password: "kasir123",
      nama_lengkap: "Andi Saputra",
      no_telepon: "081234567803",
      email: "andi.saputra@gmail.com",
      alamat_jalan: "Jl. Perintis Kemerdekaan No. 8",
      alamat_rt: "01",
      alamat_rw: "03",
      kode_pos: "25163",
      role: "Kasir",
    },
    {
      id_akun: "A0004",
      username: "biwaaa",
      password: "owner123",
      nama_lengkap: "Nabilah Putri",
      no_telepon: "081234567812",
      email: "nabilah.putri@gmail.com",
      alamat_jalan: "Jl. Khatib Sulaiman No. 22",
      alamat_rt: "04",
      alamat_rw: "02",
      kode_pos: "25156",
      role: "Owner",
    },
    {
      id_akun: "A0005",
      username: "pengelola",
      password: "pengelola123",
      nama_lengkap: "Rahmat Hidayat",
      no_telepon: "081234567805",
      email: "rahmat.pengelola@gmail.com",
      alamat_jalan: "Jl. Alai Parak Kopi No. 5",
      alamat_rt: "02",
      alamat_rw: "02",
      kode_pos: "25156",
      role: "Pengelola Toko",
    },
    {
      id_akun: "A0001",
      username: "farrel.alqodri",
      password: "pwd001",
      nama_lengkap: "Muhammad Farrel Alqodri",
      no_telepon: "081234567801",
      email: "farrel.alqodri@gmail.com",
      alamat_jalan: "Jl. Limau Manis No. 12",
      alamat_rt: "01",
      alamat_rw: "02",
      kode_pos: "25163",
      role: "Pelanggan",
    },
    {
      id_akun: "A0006",
      username: "nafisa",
      password: "pwd002",
      nama_lengkap: "Nafisa Zahra",
      no_telepon: "081234567806",
      email: "nafisa.zahra@gmail.com",
      alamat_jalan: "Jl. Binuang No. 7",
      alamat_rt: "03",
      alamat_rw: "01",
      kode_pos: "25163",
      role: "Pelanggan",
    },
  ];

  for (const acc of accounts) {
    await targetPrisma.akun.upsert({
      where: { id_akun: acc.id_akun },
      update: acc,
      create: acc,
    });

    await targetPrisma.data_akun.upsert({
      where: { id_akun: acc.id_akun },
      update: {
        username: acc.username,
        email: acc.email,
        password: acc.password,
        nama_lengkap: acc.nama_lengkap,
        nomor_telepon: acc.no_telepon,
        alamat_jalan: acc.alamat_jalan,
        alamat_rt: acc.alamat_rt,
        alamat_rw: acc.alamat_rw,
        kode_pos: acc.kode_pos,
        role: acc.role,
      },
      create: {
        id_akun: acc.id_akun,
        username: acc.username,
        email: acc.email,
        password: acc.password,
        nama_lengkap: acc.nama_lengkap,
        nomor_telepon: acc.no_telepon,
        alamat_jalan: acc.alamat_jalan,
        alamat_rt: acc.alamat_rt,
        alamat_rw: acc.alamat_rw,
        kode_pos: acc.kode_pos,
        role: acc.role,
      },
    });
  }

  // 3. Tabel Role
  await targetPrisma.admin.upsert({
    where: { id_admin: "AD0001" },
    update: {},
    create: {
      id_admin: "AD0001",
      id_akun: "A0008",
      username: "syafmila.wiradhika",
      password: "ad-0001",
      nama_lengkap: "Syafmila Wiradhika",
      no_telepon: "081234567813",
      email: "syafmila.wiradhika@gmail.com",
      alamat_jalan: "Jl. Gajah Mada No. 4",
      alamat_rt: "03",
      alamat_rw: "01",
      kode_pos: "25171",
    },
  });

  await targetPrisma.kasir.upsert({
    where: { id_kasir: "KS0001" },
    update: {},
    create: {
      id_kasir: "KS0001",
      id_akun: "A0002",
      username: "dafina.kasir",
      password: "kasir123",
      nama_lengkap: "Dafina Syafitri",
      no_telepon: "081234567802",
      email: "dafina.syafitri@gmail.com",
      alamat_jalan: "Jl. Dr. Moh. Hatta No. 15",
      alamat_rt: "02",
      alamat_rw: "01",
      kode_pos: "25163",
    },
  });

  await targetPrisma.kasir.upsert({
    where: { id_kasir: "KS0002" },
    update: {},
    create: {
      id_kasir: "KS0002",
      id_akun: "A0003",
      username: "andi.kasir",
      password: "kasir123",
      nama_lengkap: "Andi Saputra",
      no_telepon: "081234567803",
      email: "andi.saputra@gmail.com",
      alamat_jalan: "Jl. Perintis Kemerdekaan No. 8",
      alamat_rt: "01",
      alamat_rw: "03",
      kode_pos: "25163",
    },
  });

  await targetPrisma.kasir_operator.upsert({
    where: { id_kasir: "KS0001" },
    update: { id_akun: "A0008" },
    create: { id_kasir: "KS0001", id_akun: "A0008" },
  });

  await targetPrisma.owner.upsert({
    where: { id_owner: "OW0001" },
    update: {},
    create: {
      id_owner: "OW0001",
      id_akun: "A0004",
      username: "biwaaa",
      password: "owner123",
      nama_lengkap: "Nabilah Putri",
      no_telepon: "081234567812",
      email: "nabilah.putri@gmail.com",
      alamat_jalan: "Jl. Khatib Sulaiman No. 22",
      alamat_rt: "04",
      alamat_rw: "02",
      kode_pos: "25156",
    },
  });

  await targetPrisma.pengelola_toko.upsert({
    where: { id_pengelola: "PT0001" },
    update: {},
    create: {
      id_pengelola: "PT0001",
      id_akun: "A0005",
      username: "pengelola",
      password: "pengelola123",
      nama_lengkap: "Rahmat Hidayat",
      no_telepon: "081234567805",
      email: "rahmat.pengelola@gmail.com",
      alamat_jalan: "Jl. Alai Parak Kopi No. 5",
      alamat_rt: "02",
      alamat_rw: "02",
      kode_pos: "25156",
    },
  });

  await targetPrisma.pelanggan.upsert({
    where: { id_pelanggan: "PL0001" },
    update: {},
    create: {
      id_pelanggan: "PL0001",
      id_akun: "A0001",
      username: "farrel.alqodri",
      password: "pwd001",
      nama_lengkap: "Muhammad Farrel Alqodri",
      no_telepon: "081234567801",
      email: "farrel.alqodri@gmail.com",
      alamat_jalan: "Jl. Limau Manis No. 12",
      alamat_rt: "01",
      alamat_rw: "02",
      kode_pos: "25163",
    },
  });

  await targetPrisma.pelanggan.upsert({
    where: { id_pelanggan: "PL0002" },
    update: {},
    create: {
      id_pelanggan: "PL0002",
      id_akun: "A0006",
      username: "nafisa",
      password: "pwd002",
      nama_lengkap: "Nafisa Zahra",
      no_telepon: "081234567806",
      email: "nafisa.zahra@gmail.com",
      alamat_jalan: "Jl. Binuang No. 7",
      alamat_rt: "03",
      alamat_rw: "01",
      kode_pos: "25163",
    },
  });

  await targetPrisma.registrasi.upsert({
    where: { id_registrasi: "RG0001" },
    update: {},
    create: {
      id_registrasi: "RG0001",
      id_pelanggan: "PL0001",
      status_registrasi: "Disetujui",
    },
  });

  await targetPrisma.registrasi.upsert({
    where: { id_registrasi: "RG0002" },
    update: {},
    create: {
      id_registrasi: "RG0002",
      id_pelanggan: "PL0002",
      status_registrasi: "Disetujui",
    },
  });

  // 4. Lokasi
  await targetPrisma.lokasi.upsert({
    where: { id_lokasi: "LK0001" },
    update: {},
    create: {
      id_lokasi: "LK0001",
      id_pengelola: "PT0001",
      nama_lokasi: "Gudang Samping Toko",
      jenis_lokasi: "Gudang",
    },
  });

  await targetPrisma.lokasi.upsert({
    where: { id_lokasi: "LK0002" },
    update: {},
    create: {
      id_lokasi: "LK0002",
      id_pengelola: "PT0001",
      nama_lokasi: "Etalase Toko",
      jenis_lokasi: "Toko",
    },
  });

  // 5. Barang (10 Produk Toko Farid)
  const products = [
    { id: "BR0001", name: "Beras Premium 5 kg", cat: "Beras", unit: "Karung", price: 68000, min: 10 },
    { id: "BR0002", name: "Minyak Goreng 1 L", cat: "Minyak", unit: "Botol", price: 18000, min: 20 },
    { id: "BR0003", name: "Gula Pasir 1 kg", cat: "Gula", unit: "Bungkus", price: 17000, min: 15 },
    { id: "BR0004", name: "Telur Ayam 1 Tray", cat: "Telur", unit: "Tray", price: 52000, min: 8 },
    { id: "BR0005", name: "Tepung Terigu 1 kg", cat: "Tepung", unit: "Bungkus", price: 14000, min: 12 },
    { id: "BR0006", name: "Kopi Bubuk 200 g", cat: "Kopi", unit: "Kaleng", price: 16000, min: 10 },
    { id: "BR0007", name: "Mie Instan Goreng", cat: "Mie", unit: "Kotak", price: 3500, min: 50 },
    { id: "BR0008", name: "Susu Kental Manis 370 g", cat: "Susu", unit: "Kaleng", price: 13500, min: 12 },
    { id: "BR0009", name: "Teh Celup 25 pcs", cat: "Teh", unit: "Karung", price: 9500, min: 10 },
    { id: "BR0010", name: "Garam Dapur 250 g", cat: "Garam", unit: "Bungkus", price: 3000, min: 15 },
  ];

  for (const item of products) {
    await targetPrisma.barang.upsert({
      where: { id_barang: item.id },
      update: {
        nama_barang: item.name,
        kategori: item.cat,
        satuan: item.unit,
        harga_satuan: item.price.toFixed(2),
        stok_minimum: item.min,
      },
      create: {
        id_barang: item.id,
        id_admin: "AD0001",
        nama_barang: item.name,
        kategori: item.cat,
        satuan: item.unit,
        harga_satuan: item.price.toFixed(2),
        stok_minimum: item.min,
      },
    });
  }

  // 6. Stok
  const stockItems = [
    { id: "ST0001", loc: "LK0001", prod: "BR0001", qty: 8 },
    { id: "ST0002", loc: "LK0002", prod: "BR0002", qty: 35 },
    { id: "ST0003", loc: "LK0001", prod: "BR0003", qty: 25 },
    { id: "ST0004", loc: "LK0002", prod: "BR0004", qty: 5 },
    { id: "ST0005", loc: "LK0001", prod: "BR0005", qty: 30 },
    { id: "ST0006", loc: "LK0002", prod: "BR0006", qty: 9 },
    { id: "ST0007", loc: "LK0001", prod: "BR0007", qty: 120 },
    { id: "ST0008", loc: "LK0002", prod: "BR0008", qty: 10 },
    { id: "ST0009", loc: "LK0001", prod: "BR0009", qty: 7 },
    { id: "ST0010", loc: "LK0002", prod: "BR0010", qty: 40 },
  ];

  for (const st of stockItems) {
    await targetPrisma.stok.upsert({
      where: { id_stok: st.id },
      update: {
        id_lokasi: st.loc,
        id_barang: st.prod,
        jumlah_stok: st.qty,
      },
      create: {
        id_stok: st.id,
        id_lokasi: st.loc,
        id_barang: st.prod,
        jumlah_stok: st.qty,
      },
    });
  }

  // 7. Notifikasi Stok & Riwayat Stok
  await targetPrisma.notifikasi_stok.upsert({
    where: { id_notifikasi: "NS0001" },
    update: {},
    create: {
      id_notifikasi: "NS0001",
      id_stok: "ST0001",
      id_pengelola: "PT0001",
      pesan: "Stok Beras Premium 5 kg di Gudang Samping Toko berada di bawah batas minimum (8 < 10).",
      status: "Belum Dibaca",
    },
  });

  await targetPrisma.riwayat_stok.upsert({
    where: { id_riwayat: "RS0001" },
    update: {},
    create: {
      id_riwayat: "RS0001",
      id_stok: "ST0001",
      id_pengelola: "PT0001",
      jenis_riwayat: "Masuk",
      jumlah: 15,
      keterangan: "Penerimaan pasokan beras awal",
    },
  });

  // 8. Transaksi Manual (5 data contoh)
  const manualExamples = [
    { id: "TRX-DEMO-001", name: "Beras Premium 5 kg", quantity: 2, price: 68000, daysAgo: 4, cashier: "Dafina Syafitri" },
    { id: "TRX-DEMO-002", name: "Minyak Goreng 1 L", quantity: 4, price: 18000, daysAgo: 3, cashier: "Andi Saputra" },
    { id: "TRX-DEMO-003", name: "Telur Ayam 1 Tray", quantity: 1, price: 52000, daysAgo: 2, cashier: "Dafina Syafitri" },
    { id: "TRX-DEMO-004", name: "Gula Pasir 1 kg", quantity: 3, price: 17000, daysAgo: 1, cashier: "Andi Saputra" },
    { id: "TRX-DEMO-005", name: "Teh Celup 25 Kantong", quantity: 2, price: 12000, daysAgo: 0, cashier: "Dafina Syafitri" },
  ];

  for (const example of manualExamples) {
    const data = {
      nama_barang: example.name,
      jumlah: example.quantity,
      harga_satuan: example.price.toFixed(2),
      tanggal_transaksi: daysAgo(example.daysAgo),
      nama_kasir: example.cashier,
      total_harga: (example.quantity * example.price).toFixed(2),
    };
    await targetPrisma.transaksi_manual.upsert({
      where: { id_transaksi_manual: example.id },
      update: data,
      create: {
        id_transaksi_manual: example.id,
        ...data,
      },
    });
  }

  // 9. Pesanan, Transaksi Kasir, Detail, Pembayaran, Struk
  await targetPrisma.pesanan.upsert({
    where: { id_pesanan: "PS0001" },
    update: {},
    create: {
      id_pesanan: "PS0001",
      id_pelanggan: "PL0001",
      status_pesanan: "Selesai",
      total_harga: "104000.00",
    },
  });
  await targetPrisma.detail_pesanan.upsert({
    where: { id_detail_pesanan: "DP0001" },
    update: {},
    create: {
      id_detail_pesanan: "DP0001",
      id_pesanan: "PS0001",
      id_barang: "BR0001",
      jumlah: 1,
      harga_satuan: "68000.00",
      subtotal: "68000.00",
    },
  });
  await targetPrisma.detail_pesanan.upsert({
    where: { id_detail_pesanan: "DP0002" },
    update: {},
    create: {
      id_detail_pesanan: "DP0002",
      id_pesanan: "PS0001",
      id_barang: "BR0002",
      jumlah: 2,
      harga_satuan: "18000.00",
      subtotal: "36000.00",
    },
  });

  await targetPrisma.transaksi.upsert({
    where: { id_transaksi: "TR0001" },
    update: {},
    create: {
      id_transaksi: "TR0001",
      id_kasir: "KS0001",
      id_pesanan: "PS0001",
      total_harga: "104000.00",
      status_transaksi: "Lunas",
    },
  });
  await targetPrisma.detail_transaksi.upsert({
    where: { id_detail_transaksi: "DT0001" },
    update: {},
    create: {
      id_detail_transaksi: "DT0001",
      id_transaksi: "TR0001",
      id_barang: "BR0001",
      jumlah: 1,
      harga_satuan: "68000.00",
      subtotal: "68000.00",
    },
  });
  await targetPrisma.detail_transaksi.upsert({
    where: { id_detail_transaksi: "DT0002" },
    update: {},
    create: {
      id_detail_transaksi: "DT0002",
      id_transaksi: "TR0001",
      id_barang: "BR0002",
      jumlah: 2,
      harga_satuan: "18000.00",
      subtotal: "36000.00",
    },
  });
  await targetPrisma.pembayaran.upsert({
    where: { id_pembayaran: "PB0001" },
    update: {},
    create: {
      id_pembayaran: "PB0001",
      id_transaksi: "TR0001",
      metode_pembayaran: "Tunai",
      jumlah_pembayaran: "104000.00",
      status_verifikasi: "Terverifikasi",
    },
  });
  await targetPrisma.struk.upsert({
    where: { id_struk: "ST0001" },
    update: {},
    create: {
      id_struk: "ST0001",
      id_transaksi: "TR0001",
      id_kasir: "KS0001",
      total_bayar: "104000.00",
    },
  });

  // 10. Laporan & Backup Data
  await targetPrisma.laporan.upsert({
    where: { id_laporan: "LP0001" },
    update: {},
    create: {
      id_laporan: "LP0001",
      id_owner: "OW0001",
      id_admin: "AD0001",
      jenis_laporan: "Laporan Penjualan",
      periode_awal: daysAgo(30),
      periode_akhir: daysAgo(0),
      status_arsip: "Diarsipkan Admin",
    },
  });

  await targetPrisma.backup_data.upsert({
    where: { id_backup: "BK0001" },
    update: {},
    create: {
      id_backup: "BK0001",
      id_admin: "AD0001",
      tanggal_backup: new Date(),
      nama_file: "backup_toko_farid_initial.json",
      status: "Berhasil",
    },
  });

  console.info(`✓ Selesai seeding ke [${label}].`);
}

async function main() {
  const primaryUrl = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!primaryUrl) {
    throw new Error("DATABASE_URL atau DIRECT_URL diperlukan untuk seeding.");
  }

  const isPrimarySsl = process.env.DB_SSL === "true" || primaryUrl.includes("sslmode=require");
  const primaryPrisma = getClient(primaryUrl, isPrimarySsl);

  try {
    await seedDataToDatabase(primaryPrisma, "Database Utama (Neon/Runtime)");
  } finally {
    await primaryPrisma.$disconnect();
  }

  // Seed ke database lokal jika DATABASE_URL_LOCAL tersedia
  const localUrl = process.env.DATABASE_URL_LOCAL;
  if (localUrl) {
    console.info("\nMengecek koneksi database lokal (DATABASE_URL_LOCAL)...");
    const localPrisma = getClient(localUrl, false);
    try {
      await seedDataToDatabase(localPrisma, "Database PostgreSQL Lokal");
    } catch (err: unknown) {
      console.warn(
        "Peringatan: Gagal melakukan seed ke database lokal (mungkin service PostgreSQL lokal sedang tidak aktif):",
        err instanceof Error ? err.message : String(err),
      );
    } finally {
      await localPrisma.$disconnect();
    }
  }
}

void main().catch((error: unknown) => {
  console.error("Gagal menjalankan seed:", error);
  process.exitCode = 1;
});
