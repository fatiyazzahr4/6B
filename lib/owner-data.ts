import { prisma } from "@/lib/prisma";
import type { OwnerProfile } from "@/lib/owner-session";

const demoProfile: OwnerProfile = {
  id: "OW0001",
  name: "Nabilah Putri",
  username: "biwaaa",
  email: "nabilah.putri@gmail.com",
  phone: "081234567812",
  postalCode: "25156",
  address: "Padang, Sumatera Barat",
  role: "Owner",
};

const demoPayments = [
  { method: "Tunai", status: "Lunas" },
  { method: "Transfer", status: "Lunas" },
  { method: "QRIS", status: "Belum Lunas" },
  { method: "Tunai", status: "Lunas" },
  { method: "Transfer", status: "Lunas" },
];

const demoTransactions = [
  { id: "TR001", date: "2026-10-12", cashier: "Dafina Syafitri", method: "Tunai", total: 104000, status: "Lunas" },
  { id: "TR002", date: "2026-10-13", cashier: "Andi Saputra", method: "Transfer", total: 86000, status: "Lunas" },
  { id: "TR003", date: "2026-10-14", cashier: "Dafina Syafitri", method: "QRIS", total: 58000, status: "Belum Lunas" },
  { id: "TR004", date: "2026-10-15", cashier: "Andi Saputra", method: "Tunai", total: 62000, status: "Lunas" },
  { id: "TR005", date: "2026-10-16", cashier: "Dafina Syafitri", method: "Transfer", total: 31000, status: "Lunas" },
];

const demoSales = [
  { name: "Beras Premium 5 kg", quantity: 1, unit: "Karung", revenue: 68000 },
  { name: "Telur Ayam 1 Tray", quantity: 1, unit: "Tray", revenue: 52000 },
  { name: "Minyak Goreng 1 L", quantity: 2, unit: "Botol", revenue: 36000 },
  { name: "Mie Instan Goreng", quantity: 10, unit: "Kotak", revenue: 35000 },
  { name: "Gula Pasir 1 kg", quantity: 2, unit: "Bungkus", revenue: 34000 },
  { name: "Susu Kental Manis 370 g", quantity: 2, unit: "Kaleng", revenue: 27000 },
  { name: "Teh Celup 25 pcs", quantity: 2, unit: "Karung", revenue: 19000 },
  { name: "Garam Dapur 250 g", quantity: 4, unit: "Bungkus", revenue: 12000 },
];

const demoStock = [
  { id: "ST001", name: "Beras Premium 5 kg", location: "Gudang Samping Toko", quantity: 8, minimum: 10, updatedAt: "2026-10-12" },
  { id: "ST002", name: "Minyak Goreng 1 L", location: "Etalase Toko", quantity: 35, minimum: 20, updatedAt: "2026-10-12" },
  { id: "ST003", name: "Gula Pasir 1 kg", location: "Gudang Samping Toko", quantity: 25, minimum: 15, updatedAt: "2026-10-13" },
  { id: "ST004", name: "Telur Ayam 1 Tray", location: "Etalase Toko", quantity: 5, minimum: 8, updatedAt: "2026-10-13" },
  { id: "ST005", name: "Tepung Terigu 1 kg", location: "Gudang Samping Toko", quantity: 30, minimum: 12, updatedAt: "2026-10-14" },
  { id: "ST006", name: "Kopi Bubuk 200 g", location: "Etalase Toko", quantity: 9, minimum: 10, updatedAt: "2026-10-14" },
  { id: "ST007", name: "Mie Instan Goreng", location: "Gudang Samping Toko", quantity: 120, minimum: 50, updatedAt: "2026-10-15" },
  { id: "ST008", name: "Susu Kental Manis 370 g", location: "Etalase Toko", quantity: 10, minimum: 12, updatedAt: "2026-10-15" },
  { id: "ST009", name: "Teh Celup 25 pcs", location: "Gudang Samping Toko", quantity: 7, minimum: 10, updatedAt: "2026-10-16" },
  { id: "ST010", name: "Garam Dapur 250 g", location: "Etalase Toko", quantity: 40, minimum: 15, updatedAt: "2026-10-16" },
];

const demoArchives = [
  { id: "LP001", kind: "Laporan Penjualan", from: "2026-10-01", to: "2026-10-15", createdAt: "2026-10-16", status: "Diarsipkan Admin" },
  { id: "LP002", kind: "Laporan Transaksi", from: "2026-10-01", to: "2026-10-15", createdAt: "2026-10-17", status: "Diarsipkan Admin" },
];

export const ownerDemoData = {
  profile: demoProfile,
  transactions: demoTransactions,
  sales: demoSales,
  stock: demoStock,
  archives: demoArchives,
  payments: demoPayments,
};

type StockRow = {
  id: string;
  productId: string;
  name: string;
  location: string;
  quantity: number;
  minimum: number;
  updatedAt: Date | null;
  status: string;
};

export async function getOwnerProfile(ownerId: string): Promise<OwnerProfile | null> {
  const owner = await prisma.owner.findUnique({
    where: { id_owner: ownerId },
    include: { akun: true },
  });
  if (!owner) return null;

  return {
    id: owner.id_owner,
    name: owner.nama_lengkap,
    username: owner.username,
    email: owner.email,
    phone: owner.no_telepon,
    postalCode: owner.kode_pos,
    address: owner.alamat_jalan,
    role: "Owner",
  };
}

export async function getOwnerDashboard(ownerId: string) {
  const [transactions, sales, lowStock, archives] = await Promise.all([
    prisma.transaksi.aggregate({ _count: { _all: true }, _sum: { total_harga: true } }),
    prisma.transaksi.findMany({
      select: {
        total_harga: true,
        pembayaran: { select: { status_verifikasi: true } },
      },
    }),
    getStockRows(),
    prisma.laporan.count({ where: { id_owner: ownerId } }),
  ]);
  const paidTransactions = sales.filter((transaction) =>
    transaction.pembayaran.some((payment) => isPaid(payment.status_verifikasi)),
  );
  const paidTotal = paidTransactions.reduce(
    (sum, transaction) => sum + Number(transaction.total_harga),
    0,
  );
  const lowStockProducts = new Map<string, { name: string; quantity: number; minimum: number }>();
  for (const row of lowStock) {
    const product = lowStockProducts.get(row.productId) ?? {
      name: row.name,
      quantity: 0,
      minimum: row.minimum,
    };
    product.quantity += row.quantity;
    lowStockProducts.set(row.productId, product);
  }
  const lowStockItems = [...lowStockProducts.values()].filter((product) => product.quantity < product.minimum);

  return {
    transactions: transactions._count._all,
    transactionTotal: Number(transactions._sum.total_harga ?? 0),
    sales: paidTotal,
    paidCount: paidTransactions.length,
    lowStock: lowStockItems.length,
    archives,
    lowStockItems: lowStockItems.map((product) => product.name),
  };
}

function isPaid(status: string) {
  return ["lunas", "terverifikasi", "berhasil", "dibayar", "verified", "paid"].includes(
    status.toLowerCase(),
  );
}

export async function getStockRows(): Promise<StockRow[]> {
  const items = await prisma.barang.findMany({
    include: {
      stok: {
        include: { lokasi: { select: { nama_lokasi: true } } },
        orderBy: { tanggal_update: "desc" },
      },
    },
    orderBy: { nama_barang: "asc" },
  });

  return items.flatMap<StockRow>((item) => {
    if (!item.stok.length) {
      return [{
        id: item.id_barang,
        productId: item.id_barang,
        name: item.nama_barang,
        location: "Belum ditempatkan",
        quantity: 0,
        minimum: item.stok_minimum,
        updatedAt: null,
        status: "Menipis",
      }];
    }
    return item.stok.map((stock) => ({
      id: stock.id_stok,
      productId: item.id_barang,
      name: item.nama_barang,
      location: stock.lokasi.nama_lokasi,
      quantity: stock.jumlah_stok,
      minimum: item.stok_minimum,
      updatedAt: stock.tanggal_update,
      status: stock.jumlah_stok < item.stok_minimum ? "Menipis" : "Aman",
    }));
  });
}

export async function getOwnerTransactions(from: Date, to: Date) {
  const rows = await prisma.transaksi.findMany({
    where: { tanggal_transaksi: { gte: from, lte: to } },
    include: {
      kasir: { select: { nama_lengkap: true } },
      pembayaran: { select: { metode_pembayaran: true, status_verifikasi: true } },
    },
    orderBy: { tanggal_transaksi: "asc" },
  });

  return rows.map((row) => ({
    id: row.id_transaksi,
    date: row.tanggal_transaksi,
    cashier: row.kasir.nama_lengkap,
    method: row.pembayaran[0]?.metode_pembayaran ?? "—",
    total: Number(row.total_harga),
    status: row.pembayaran.some((payment) => isPaid(payment.status_verifikasi))
      ? "Lunas"
      : "Belum Lunas",
  }));
}

export async function getOwnerSales(from: Date, to: Date) {
  const rows = await prisma.transaksi.findMany({
    where: { tanggal_transaksi: { gte: from, lte: to } },
    include: {
      pembayaran: { select: { status_verifikasi: true } },
      detail_transaksi: {
        include: { barang: { select: { nama_barang: true, satuan: true } } },
      },
    },
    orderBy: { tanggal_transaksi: "asc" },
  });

  const products = new Map<string, { name: string; quantity: number; unit: string; revenue: number }>();
  let transactionCount = 0;
  for (const transaction of rows) {
    if (!transaction.pembayaran.some((payment) => isPaid(payment.status_verifikasi))) continue;
    transactionCount += 1;
    for (const detail of transaction.detail_transaksi) {
      const current = products.get(detail.id_barang);
      products.set(detail.id_barang, {
        name: detail.barang.nama_barang,
        quantity: (current?.quantity ?? 0) + detail.jumlah,
        unit: detail.barang.satuan,
        revenue: (current?.revenue ?? 0) + Number(detail.subtotal),
      });
    }
  }

  return {
    rows: [...products.values()].sort((a, b) => b.revenue - a.revenue),
    transactionCount,
  };
}

export async function getOwnerArchives(ownerId: string) {
  return prisma.laporan.findMany({
    where: { id_owner: ownerId },
    orderBy: { tanggal_dibuat: "desc" },
    select: {
      id_laporan: true,
      jenis_laporan: true,
      periode_awal: true,
      periode_akhir: true,
      tanggal_dibuat: true,
      status_arsip: true,
    },
  });
}

export function isPaymentComplete(status: string) {
  return isPaid(status);
}
