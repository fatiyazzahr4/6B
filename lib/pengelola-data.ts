import { prisma } from "@/lib/prisma";
import type { PengelolaProfile } from "@/lib/pengelola-session";

export async function getPengelolaProfile(
  pengelolaId: string,
): Promise<PengelolaProfile | null> {
  const pengelola = await prisma.pengelola_toko.findUnique({
    where: { id_pengelola: pengelolaId },
  });
  if (!pengelola) return null;

  return {
    id: pengelola.id_pengelola,
    name: pengelola.nama_lengkap,
    username: pengelola.username,
    email: pengelola.email,
    phone: pengelola.no_telepon,
    postalCode: pengelola.kode_pos,
    address: pengelola.alamat_jalan,
    role: "Pengelola Toko",
  };
}

export async function getPengelolaStock(pengelolaId: string) {
  const rows = await prisma.stok.findMany({
    where: { lokasi: { id_pengelola: pengelolaId } },
    include: {
      barang: {
        select: {
          id_barang: true,
          nama_barang: true,
          satuan: true,
          stok_minimum: true,
        },
      },
      lokasi: { select: { id_lokasi: true, nama_lokasi: true } },
    },
    orderBy: [{ barang: { nama_barang: "asc" } }, { tanggal_update: "desc" }],
  });

  return rows.map((row) => ({
    id: row.id_stok,
    productId: row.barang.id_barang,
    name: row.barang.nama_barang,
    unit: row.barang.satuan,
    locationId: row.lokasi.id_lokasi,
    location: row.lokasi.nama_lokasi,
    quantity: row.jumlah_stok,
    minimum: row.barang.stok_minimum,
    updatedAt: row.tanggal_update,
    status: row.jumlah_stok < row.barang.stok_minimum ? "Menipis" : "Aman",
  }));
}

export async function getPengelolaLocations(pengelolaId: string) {
  const rows = await prisma.lokasi.findMany({
    where: { id_pengelola: pengelolaId },
    include: {
      stok: {
        include: {
          barang: {
            select: {
              id_barang: true,
              nama_barang: true,
              satuan: true,
              stok_minimum: true,
            },
          },
        },
        orderBy: { tanggal_update: "desc" },
      },
    },
    orderBy: { nama_lokasi: "asc" },
  });

  return rows.map((row) => ({
    id: row.id_lokasi,
    name: row.nama_lokasi,
    type: row.jenis_lokasi,
    itemCount: row.stok.length,
    items: row.stok.map((stock) => ({
      id: stock.barang.id_barang,
      name: stock.barang.nama_barang,
      unit: stock.barang.satuan,
      quantity: stock.jumlah_stok,
    })),
  }));
}

export async function getPengelolaNotifications(pengelolaId: string) {
  const rows = await prisma.notifikasi_stok.findMany({
    where: { id_pengelola: pengelolaId },
    include: {
      stok: {
        include: {
          barang: { select: { nama_barang: true, satuan: true } },
          lokasi: { select: { nama_lokasi: true } },
        },
      },
    },
    orderBy: { tanggal_notifikasi: "desc" },
    take: 100,
  });

  return rows.map((row) => ({
    id: row.id_notifikasi,
    stockId: row.id_stok,
    message: row.pesan,
    date: row.tanggal_notifikasi,
    status: row.status,
    product: row.stok.barang.nama_barang,
    unit: row.stok.barang.satuan,
    location: row.stok.lokasi.nama_lokasi,
    quantity: row.stok.jumlah_stok,
  }));
}

export async function getPengelolaHistory(pengelolaId: string) {
  const rows = await prisma.riwayat_stok.findMany({
    where: { id_pengelola: pengelolaId },
    include: {
      stok: {
        include: {
          barang: { select: { nama_barang: true } },
        },
      },
    },
    orderBy: { tanggal_riwayat: "desc" },
    take: 500,
  });

  return rows.map((row) => ({
    id: row.id_riwayat,
    stockId: row.id_stok,
    product: row.stok.barang.nama_barang,
    kind: row.jenis_riwayat,
    quantity: row.jumlah,
    date: row.tanggal_riwayat,
    description: row.keterangan ?? "",
  }));
}

export async function getPengelolaDashboard(pengelolaId: string) {
  const [stocks, locations, notifications, history] = await Promise.all([
    getPengelolaStock(pengelolaId),
    prisma.lokasi.count({ where: { id_pengelola: pengelolaId } }),
    prisma.notifikasi_stok.count({
      where: { id_pengelola: pengelolaId, status: { not: "Dibaca" } },
    }),
    prisma.riwayat_stok.findMany({
      where: { id_pengelola: pengelolaId },
      include: {
        stok: { include: { barang: { select: { nama_barang: true } } } },
      },
      orderBy: { tanggal_riwayat: "desc" },
      take: 5,
    }),
  ]);
  const lowStock = stocks.filter((row) => row.quantity < row.minimum);

  return {
    summary: {
      products: new Set(stocks.map((row) => row.productId)).size,
      lowStock: lowStock.length,
      locations,
      notifications,
    },
    lowStock: lowStock.slice(0, 5),
    history: history.map((row) => ({
      id: row.id_riwayat,
      product: row.stok.barang.nama_barang,
      kind: row.jenis_riwayat,
      quantity: row.jumlah,
      date: row.tanggal_riwayat,
      description: row.keterangan ?? "",
    })),
  };
}
