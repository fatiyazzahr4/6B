import { prisma } from "@/lib/prisma";
import type { KasirProfile } from "@/lib/kasir-session";

const paidStatuses = new Set([
  "lunas",
  "terverifikasi",
  "berhasil",
  "dibayar",
  "verified",
  "paid",
]);
const completedOrderStatuses = new Set(["selesai", "dibatalkan", "cancelled"]);

export function isKasirPaymentPaid(status: string) {
  return paidStatuses.has(status.toLowerCase());
}

export async function getKasirProfile(kasirId: string): Promise<KasirProfile | null> {
  const kasir = await prisma.kasir.findUnique({
    where: { id_kasir: kasirId },
    include: { akun: true },
  });
  if (!kasir) return null;

  return {
    id: kasir.id_kasir,
    name: kasir.nama_lengkap,
    username: kasir.username,
    email: kasir.email,
    phone: kasir.no_telepon,
    postalCode: kasir.kode_pos,
    address: kasir.alamat_jalan,
    role: "Kasir",
  };
}

function productStock(rows: { jumlah_stok: number }[]) {
  return rows.reduce((total, row) => total + row.jumlah_stok, 0);
}

export async function getKasirCatalog() {
  const [items, customers] = await Promise.all([
    prisma.barang.findMany({
      include: { stok: { select: { jumlah_stok: true } } },
      orderBy: { nama_barang: "asc" },
      take: 200,
    }),
    prisma.pelanggan.findMany({
      select: {
        id_pelanggan: true,
        nama_lengkap: true,
        username: true,
      },
      orderBy: { nama_lengkap: "asc" },
      take: 500,
    }),
  ]);

  return {
    products: items.map((item) => ({
      id: item.id_barang,
      name: item.nama_barang,
      category: item.kategori,
      unit: item.satuan,
      price: Number(item.harga_satuan),
      minimum: item.stok_minimum,
      stock: productStock(item.stok),
    })),
    customers: customers.map((customer) => ({
      id: customer.id_pelanggan,
      name: customer.nama_lengkap,
      username: customer.username,
    })),
  };
}

export async function getKasirOrders(take = 100) {
  const rows = await prisma.pesanan.findMany({
    include: {
      pelanggan: { select: { nama_lengkap: true } },
      transaksi: {
        select: {
          id_transaksi: true,
          pembayaran: { select: { status_verifikasi: true } },
        },
      },
      detail_pesanan: {
        include: {
          barang: { select: { nama_barang: true, satuan: true } },
        },
      },
    },
    orderBy: { tanggal_pesanan: "desc" },
    take,
  });

  return rows.map((row) => {
    const transaction = row.transaksi[0];
    const paid = transaction?.pembayaran.some((payment) =>
      isKasirPaymentPaid(payment.status_verifikasi),
    ) ?? false;
    const status = transaction
      ? paid
        ? "Selesai"
        : "Belum Lunas"
      : row.status_pesanan;

    return {
      id: row.id_pesanan,
      date: row.tanggal_pesanan,
      customer: row.pelanggan.nama_lengkap,
      customerId: row.id_pelanggan,
      total: Number(row.total_harga),
      status,
      transactionId: transaction?.id_transaksi ?? null,
      canProcess:
        !transaction &&
        !completedOrderStatuses.has(row.status_pesanan.toLowerCase()),
      items: row.detail_pesanan.map((detail) => ({
        productId: detail.id_barang,
        name: detail.barang.nama_barang,
        unit: detail.barang.satuan,
        quantity: detail.jumlah,
        unitPrice: Number(detail.harga_satuan),
        subtotal: Number(detail.subtotal),
      })),
    };
  });
}

export async function getKasirOrder(orderId: string) {
  const row = await prisma.pesanan.findUnique({
    where: { id_pesanan: orderId },
    include: {
      pelanggan: { select: { nama_lengkap: true } },
      transaksi: { select: { id_transaksi: true } },
      detail_pesanan: {
        include: {
          barang: {
            include: { stok: { select: { jumlah_stok: true } } },
          },
        },
      },
    },
  });
  if (!row) return null;

  return {
    id: row.id_pesanan,
    date: row.tanggal_pesanan,
    customer: row.pelanggan.nama_lengkap,
    customerId: row.id_pelanggan,
    total: Number(row.total_harga),
    status: row.status_pesanan,
    transactionId: row.transaksi[0]?.id_transaksi ?? null,
    canProcess:
      row.transaksi.length === 0 &&
      !completedOrderStatuses.has(row.status_pesanan.toLowerCase()),
    items: row.detail_pesanan.map((detail) => ({
      productId: detail.id_barang,
      name: detail.barang.nama_barang,
      unit: detail.barang.satuan,
      quantity: detail.jumlah,
      unitPrice: Number(detail.harga_satuan),
      subtotal: Number(detail.subtotal),
      stock: productStock(detail.barang.stok),
    })),
  };
}

export async function getKasirTransactions(take = 100) {
  const rows = await prisma.transaksi.findMany({
    include: {
      kasir: { select: { nama_lengkap: true } },
      pesanan: {
        include: { pelanggan: { select: { nama_lengkap: true } } },
      },
      pembayaran: {
        select: {
          id_pembayaran: true,
          metode_pembayaran: true,
          jumlah_pembayaran: true,
          status_verifikasi: true,
          tanggal_pembayaran: true,
        },
        orderBy: { tanggal_pembayaran: "desc" },
      },
      detail_transaksi: {
        include: {
          barang: { select: { nama_barang: true, satuan: true } },
        },
      },
    },
    orderBy: { tanggal_transaksi: "desc" },
    take,
  });

  return rows.map((row) => {
    const payment = row.pembayaran[0] ?? null;
    const paid = row.pembayaran.some((item) =>
      isKasirPaymentPaid(item.status_verifikasi),
    );
    return {
      id: row.id_transaksi,
      date: row.tanggal_transaksi,
      cashier: row.kasir.nama_lengkap,
      orderId: row.id_pesanan,
      customer: row.pesanan.pelanggan.nama_lengkap,
      method: payment?.metode_pembayaran ?? "—",
      received: payment ? Number(payment.jumlah_pembayaran) : Number(row.total_harga),
      total: Number(row.total_harga),
      status: paid ? "Lunas" : "Belum Lunas",
      paymentId: payment?.id_pembayaran ?? null,
      items: row.detail_transaksi.map((detail) => ({
        name: detail.barang.nama_barang,
        unit: detail.barang.satuan,
        quantity: detail.jumlah,
        unitPrice: Number(detail.harga_satuan),
        subtotal: Number(detail.subtotal),
      })),
    };
  });
}

export async function getKasirDashboard() {
  const [transactionCount, transactions, orders, latest] = await Promise.all([
    prisma.transaksi.count(),
    prisma.transaksi.findMany({
      select: {
        total_harga: true,
        pembayaran: { select: { status_verifikasi: true } },
      },
    }),
    getKasirOrders(1000),
    getKasirTransactions(5),
  ]);

  const paidTransactions = transactions.filter((transaction) =>
    transaction.pembayaran.some((payment) =>
      isKasirPaymentPaid(payment.status_verifikasi),
    ),
  );
  const pendingOrders = orders.filter(
    (order) => order.canProcess && !completedOrderStatuses.has(order.status.toLowerCase()),
  );
  const unpaidCount = transactions.filter(
    (transaction) =>
      transaction.pembayaran.length > 0 &&
      !transaction.pembayaran.some((payment) =>
        isKasirPaymentPaid(payment.status_verifikasi),
      ),
  ).length;

  return {
    summary: {
      transactions: transactionCount,
      pendingOrders: pendingOrders.length,
      unpaid: unpaidCount,
      paidTotal: paidTransactions.reduce(
        (total, transaction) => total + Number(transaction.total_harga),
        0,
      ),
      paidCount: paidTransactions.length,
    },
    latest,
    pendingOrders: pendingOrders.slice(0, 3),
  };
}
