import { prisma } from "@/lib/prisma";
import type { PelangganProfile } from "@/lib/pelanggan-session";

export async function getPelangganProfile(
  pelangganId: string,
): Promise<PelangganProfile | null> {
  const pelanggan = await prisma.pelanggan.findUnique({
    where: { id_pelanggan: pelangganId },
  });
  if (!pelanggan) return null;

  return {
    id: pelanggan.id_pelanggan,
    accountId: pelanggan.id_akun,
    name: pelanggan.nama_lengkap,
    username: pelanggan.username,
    email: pelanggan.email,
    phone: pelanggan.no_telepon,
    postalCode: pelanggan.kode_pos,
    address: pelanggan.alamat_jalan,
    role: "Pelanggan",
  };
}


export type PelangganProduct = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  low: boolean;
};

export type PelangganOrder = {
  id: string;
  date: string;
  status: string;
  total: number;
  itemCount: number;
  items: {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    subtotal: number;
  }[];
  transactionId: string | null;
  transactionStatus: string | null;
};

export async function getPelangganCatalog(): Promise<PelangganProduct[]> {
  const items = await prisma.barang.findMany({
    include: { stok: { select: { jumlah_stok: true } } },
    orderBy: { id_barang: "asc" },
    take: 200,
  });
  return items.map((item) => {
    const stock = item.stok.reduce((sum, row) => sum + row.jumlah_stok, 0);
    return {
      id: item.id_barang,
      name: item.nama_barang,
      category: item.kategori,
      unit: item.satuan,
      price: Number(item.harga_satuan),
      stock,
      low: stock <= item.stok_minimum,
    };
  });
}

export async function getPelangganOrders(pelangganId: string): Promise<PelangganOrder[]> {
  const rows = await prisma.pesanan.findMany({
    where: { id_pelanggan: pelangganId },
    include: {
      detail_pesanan: { include: { barang: { select: { nama_barang: true } } } },
      transaksi: { select: { id_transaksi: true, status_transaksi: true }, take: 1 },
    },
    orderBy: { tanggal_pesanan: "desc" },
    take: 200,
  });
  return rows.map((row) => ({
    id: row.id_pesanan,
    date: row.tanggal_pesanan.toISOString(),
    status: row.status_pesanan,
    total: Number(row.total_harga),
    itemCount: row.detail_pesanan.reduce((sum, line) => sum + line.jumlah, 0),
    items: row.detail_pesanan.map((line) => ({
      productId: line.id_barang,
      name: line.barang.nama_barang,
      quantity: line.jumlah,
      unitPrice: Number(line.harga_satuan),
      subtotal: Number(line.subtotal),
    })),
    transactionId: row.transaksi[0]?.id_transaksi ?? null,
    transactionStatus: row.transaksi[0]?.status_transaksi ?? null,
  }));
}
