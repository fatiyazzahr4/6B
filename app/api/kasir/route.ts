import { NextResponse } from "next/server";
import {
  getKasirCatalog,
  getKasirDashboard,
  getKasirOrder,
  getKasirOrders,
  getKasirProfile,
  getKasirTransactions,
  isKasirPaymentPaid,
} from "@/lib/kasir-data";
import { prisma } from "@/lib/prisma";
import {
  clearKasirSessionCookie,
  createKasirSession,
  getKasirSession,
  setKasirSessionCookie,
} from "@/lib/kasir-session";

type RequestBody = Record<string, unknown> & { action?: string };
type SaleItem = { productId: string; quantity: number };
type SaleLine = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

class KasirRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "";
}

function handleApiError(error: unknown, operation: string) {
  if (error instanceof KasirRequestError) {
    return jsonError(error.message, error.status);
  }
  const code = getErrorCode(error);
  if (code === "P2002") {
    return jsonError("Transaksi tidak tersimpan karena ID atau data sudah digunakan. Silakan coba lagi.", 409);
  }
  if (code === "P2003" || code === "P2014") {
    return jsonError("Transaksi tidak dapat diproses karena data terkait berubah.", 409);
  }
  if (code === "P2025") {
    return jsonError("Data yang diminta tidak ditemukan.", 404);
  }
  console.error(
    `Kasir API ${operation} failed:`,
    error instanceof Error ? error.name : "UnknownError",
  );
  return jsonError(
    "Permintaan Kasir belum dapat diproses. Periksa koneksi database lalu coba lagi.",
    500,
  );
}

function getText(body: RequestBody, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

function nextId(existing: string[], prefix: string, width: number) {
  const largest = existing.reduce((max, value) => {
    const match = value.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${String(largest + 1).padStart(width, "0")}`;
}

function nextIds(existing: string[], prefix: string, width: number, count: number) {
  const used = [...existing];
  return Array.from({ length: count }, () => {
    const id = nextId(used, prefix, width);
    used.push(id);
    return id;
  });
}

function parseSaleItems(value: unknown): SaleItem[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new KasirRequestError("Tambahkan setidaknya satu barang ke transaksi.", 400);
  }

  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new KasirRequestError("Daftar barang tidak valid.", 400);
    }
    const productId = "productId" in item && typeof item.productId === "string"
      ? item.productId.trim()
      : "";
    const quantity = "quantity" in item ? Number(item.quantity) : 0;
    if (!productId || productId.length > 10 || !Number.isSafeInteger(quantity) || quantity < 1) {
      throw new KasirRequestError("Jumlah barang harus berupa bilangan bulat lebih dari nol.", 400);
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

function sumLines(lines: SaleLine[]) {
  return Number(lines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2));
}

async function createTransaction(body: RequestBody, kasirId: string) {
  const paymentMethod = getText(body, "paymentMethod");
  if (!["Tunai", "Transfer", "QRIS"].includes(paymentMethod)) {
    throw new KasirRequestError("Pilih metode pembayaran yang tersedia.", 400);
  }

  const orderId = getText(body, "orderId");
  const customerId = getText(body, "customerId");
  const submittedItems = parseSaleItems(body.items);
  const amountValue = typeof body.amountReceived === "number"
    ? body.amountReceived
    : Number(body.amountReceived);
  if (paymentMethod === "Tunai" && (!Number.isFinite(amountValue) || amountValue < 0)) {
    throw new KasirRequestError("Jumlah uang diterima tidak valid.", 400);
  }

  return prisma.$transaction(
    async (tx) => {
      let linkedOrderId = orderId;
      let lines: SaleLine[];
      let orderCustomerId = customerId;

      if (orderId) {
        const order = await tx.pesanan.findUnique({
          where: { id_pesanan: orderId },
          include: {
            transaksi: { select: { id_transaksi: true } },
            detail_pesanan: {
              include: { barang: { select: { nama_barang: true, satuan: true } } },
            },
          },
        });
        if (!order) throw new KasirRequestError("Pesanan pelanggan tidak ditemukan.", 404);
        if (order.transaksi.length > 0) {
          throw new KasirRequestError("Pesanan ini sudah diproses menjadi transaksi.", 409);
        }
        if (["selesai", "dibatalkan", "cancelled"].includes(order.status_pesanan.toLowerCase())) {
          throw new KasirRequestError("Pesanan ini sudah ditutup dan tidak dapat diproses kembali.", 409);
        }
        if (!order.detail_pesanan.length) {
          throw new KasirRequestError("Pesanan tidak memiliki barang yang dapat diproses.", 409);
        }
        orderCustomerId = order.id_pelanggan;
        const orderLines = new Map<string, SaleLine>();
        for (const detail of order.detail_pesanan) {
          const current = orderLines.get(detail.id_barang);
          const quantity = (current?.quantity ?? 0) + detail.jumlah;
          const unitPrice = Number(detail.harga_satuan);
          orderLines.set(detail.id_barang, {
            productId: detail.id_barang,
            name: detail.barang.nama_barang,
            quantity,
            unitPrice,
            subtotal: Number((quantity * unitPrice).toFixed(2)),
          });
        }
        const submittedById = new Map(
          submittedItems.map((item) => [item.productId, item.quantity]),
        );
        for (const line of orderLines.values()) {
          if ((submittedById.get(line.productId) ?? 0) < line.quantity) {
            throw new KasirRequestError("Barang dari pesanan pelanggan tidak dapat dihapus atau dikurangi.", 400);
          }
        }
        const extraItems = submittedItems.filter((item) => !orderLines.has(item.productId));
        const extraProducts = await tx.barang.findMany({
          where: { id_barang: { in: extraItems.map((item) => item.productId) } },
          select: { id_barang: true, nama_barang: true, harga_satuan: true },
        });
        if (extraProducts.length !== extraItems.length) {
          throw new KasirRequestError("Satu atau beberapa barang sudah tidak tersedia.", 409);
        }
        lines = submittedItems.map((item) => {
          const base = orderLines.get(item.productId);
          const product = extraProducts.find((row) => row.id_barang === item.productId);
          const unitPrice = base?.unitPrice ?? Number(product?.harga_satuan ?? 0);
          return {
            productId: item.productId,
            name: base?.name ?? product?.nama_barang ?? item.productId,
            quantity: item.quantity,
            unitPrice,
            subtotal: Number((item.quantity * unitPrice).toFixed(2)),
          };
        });
      } else {
        if (!orderCustomerId || orderCustomerId.length > 10) {
          throw new KasirRequestError("Pilih pelanggan terdaftar untuk transaksi baru.", 400);
        }
        const customer = await tx.pelanggan.findUnique({
          where: { id_pelanggan: orderCustomerId },
          select: { id_pelanggan: true },
        });
        if (!customer) throw new KasirRequestError("Pelanggan tidak ditemukan.", 404);

        const products = await tx.barang.findMany({
          where: { id_barang: { in: submittedItems.map((item) => item.productId) } },
          select: {
            id_barang: true,
            nama_barang: true,
            harga_satuan: true,
          },
        });
        const productById = new Map(products.map((product) => [product.id_barang, product]));
        if (products.length !== submittedItems.length) {
          throw new KasirRequestError("Satu atau beberapa barang sudah tidak tersedia.", 409);
        }
        lines = submittedItems.map((item) => {
          const product = productById.get(item.productId);
          if (!product) throw new KasirRequestError("Barang tidak ditemukan.", 404);
          const unitPrice = Number(product.harga_satuan);
          return {
            productId: product.id_barang,
            name: product.nama_barang,
            quantity: item.quantity,
            unitPrice,
            subtotal: Number((unitPrice * item.quantity).toFixed(2)),
          };
        });
      }

      const total = sumLines(lines);
      if (total <= 0) throw new KasirRequestError("Total transaksi harus lebih dari nol.", 400);
      if (paymentMethod === "Tunai" && amountValue < total) {
        throw new KasirRequestError("Jumlah uang diterima belum mencukupi total transaksi.", 400);
      }

      const stockRows = await tx.stok.findMany({
        where: { id_barang: { in: lines.map((line) => line.productId) } },
        select: {
          id_stok: true,
          id_barang: true,
          jumlah_stok: true,
          tanggal_update: true,
        },
        orderBy: { tanggal_update: "asc" },
      });
      for (const line of lines) {
        const available = stockRows
          .filter((stock) => stock.id_barang === line.productId)
          .reduce((sum, stock) => sum + stock.jumlah_stok, 0);
        if (available < line.quantity) {
          throw new KasirRequestError(
            `Stok ${line.name} tidak mencukupi. Tersedia ${available} ${line.quantity === 1 ? "unit" : "unit"}.`,
            409,
          );
        }
      }

      const stockRemaining = new Map(stockRows.map((stock) => [stock.id_stok, stock.jumlah_stok]));
      for (const line of lines) {
        let remaining = line.quantity;
        for (const stock of stockRows.filter((item) => item.id_barang === line.productId)) {
          if (remaining === 0) break;
          const available = stockRemaining.get(stock.id_stok) ?? 0;
          const reduction = Math.min(available, remaining);
          if (reduction > 0) {
            const result = await tx.stok.updateMany({
              where: { id_stok: stock.id_stok, jumlah_stok: { gte: reduction } },
              data: { jumlah_stok: { decrement: reduction }, tanggal_update: new Date() },
            });
            if (result.count !== 1) {
              throw new KasirRequestError("Stok barang berubah saat transaksi diproses. Muat ulang data lalu coba lagi.", 409);
            }
            stockRemaining.set(stock.id_stok, available - reduction);
            remaining -= reduction;
          }
        }
      }

      if (!linkedOrderId) {
        const orderIds = await tx.pesanan.findMany({ select: { id_pesanan: true } });
        linkedOrderId = nextId(orderIds.map((row) => row.id_pesanan), "PS", 3);
        const detailIds = await tx.detail_pesanan.findMany({
          select: { id_detail_pesanan: true },
        });
        const newDetailIds = nextIds(
          detailIds.map((row) => row.id_detail_pesanan),
          "DP",
          8,
          lines.length,
        );
        await tx.pesanan.create({
          data: {
            id_pesanan: linkedOrderId,
            id_pelanggan: orderCustomerId,
            status_pesanan: paymentMethod === "Tunai" ? "Selesai" : "Diproses",
            total_harga: total,
            detail_pesanan: {
              create: lines.map((line, index) => ({
                id_detail_pesanan: newDetailIds[index],
                id_barang: line.productId,
                jumlah: line.quantity,
                harga_satuan: line.unitPrice,
                subtotal: line.subtotal,
              })),
            },
          },
        });
      } else {
        const existingDetailIds = await tx.detail_pesanan.findMany({
          select: { id_detail_pesanan: true },
        });
        const replacementIds = nextIds(
          existingDetailIds.map((row) => row.id_detail_pesanan),
          "DP",
          8,
          lines.length,
        );
        await tx.detail_pesanan.deleteMany({ where: { id_pesanan: linkedOrderId } });
        await tx.detail_pesanan.createMany({
          data: lines.map((line, index) => ({
            id_detail_pesanan: replacementIds[index],
            id_pesanan: linkedOrderId,
            id_barang: line.productId,
            jumlah: line.quantity,
            harga_satuan: line.unitPrice,
            subtotal: line.subtotal,
          })),
        });
        await tx.pesanan.update({
          where: { id_pesanan: linkedOrderId },
          data: { total_harga: total },
        });
      }

      const transactionIds = await tx.transaksi.findMany({
        select: { id_transaksi: true },
      });
      const transactionId = nextId(
        transactionIds.map((row) => row.id_transaksi),
        "TR",
        3,
      );
      const detailIds = await tx.detail_transaksi.findMany({
        select: { id_detail_transaksi: true },
      });
      const paymentIds = await tx.pembayaran.findMany({
        select: { id_pembayaran: true },
      });
      const newTransactionDetailIds = nextIds(
        detailIds.map((row) => row.id_detail_transaksi),
        "DT",
        8,
        lines.length,
      );
      const paymentBaseIds = paymentIds.map((row) => row.id_pembayaran);
      const paid = paymentMethod === "Tunai";
      const amountReceived = paid ? amountValue : total;

      await tx.transaksi.create({
        data: {
          id_transaksi: transactionId,
          id_kasir: kasirId,
          id_pesanan: linkedOrderId,
          total_harga: total,
          status_transaksi: paid ? "Lunas" : "Belum Lunas",
          detail_transaksi: {
            create: lines.map((line, index) => ({
              id_detail_transaksi: newTransactionDetailIds[index],
              id_barang: line.productId,
              jumlah: line.quantity,
              harga_satuan: line.unitPrice,
              subtotal: line.subtotal,
            })),
          },
          pembayaran: {
            create: {
              id_pembayaran: nextId(paymentBaseIds, "PY", 6),
              metode_pembayaran: paymentMethod,
              jumlah_pembayaran: amountReceived,
              status_verifikasi: paid ? "Lunas" : "Belum Lunas",
            },
          },
        },
      });
      if (orderId) {
        await tx.pesanan.update({
          where: { id_pesanan: linkedOrderId },
          data: { status_pesanan: paid ? "Selesai" : "Diproses" },
        });
      }

      return {
        id: transactionId,
        orderId: linkedOrderId,
        total,
        change: paid ? Number((amountReceived - total).toFixed(2)) : 0,
        status: paid ? "Lunas" : "Belum Lunas",
      };
    },
    { isolationLevel: "Serializable" },
  );
}

export async function GET(request: Request) {
  try {
    const session = await getKasirSession();
    if (!session) return jsonError("Sesi Kasir tidak ditemukan. Silakan login kembali.", 401);

    const profile = await getKasirProfile(session.kasirId);
    if (!profile) {
      await clearKasirSessionCookie();
      return jsonError("Akun Kasir tidak ditemukan. Silakan login kembali.", 401);
    }

    const { searchParams } = new URL(request.url);
    switch (searchParams.get("view")) {
      case "session":
      case "profile":
        return NextResponse.json({ profile });
      case "dashboard":
        return NextResponse.json({ profile, ...(await getKasirDashboard()) });
      case "catalog":
        return NextResponse.json(await getKasirCatalog());
      case "orders":
        return NextResponse.json({ rows: await getKasirOrders() });
      case "order": {
        const orderId = searchParams.get("id") ?? "";
        if (!orderId) return jsonError("ID pesanan wajib diisi.", 400);
        const order = await getKasirOrder(orderId);
        if (!order) return jsonError("Pesanan tidak ditemukan.", 404);
        return NextResponse.json({ order });
      }
      case "transactions":
        return NextResponse.json({ rows: await getKasirTransactions() });
      default:
        return jsonError("Jenis data Kasir tidak dikenal.", 400);
    }
  } catch (error) {
    return handleApiError(error, "GET");
  }
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    const json: unknown = await request.json();
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return jsonError("Format permintaan tidak valid.", 400);
    }
    body = json as RequestBody;
  } catch {
    return jsonError("Format permintaan tidak valid.", 400);
  }

  try {
    if (body.action === "login") {
      const identifier = getText(body, "identifier");
      const password = typeof body.password === "string" ? body.password : "";
      if (!identifier || !password || identifier.length > 100 || password.length > 200) {
        return jsonError("Username/email dan password wajib diisi.", 400);
      }
      const kasir = await prisma.kasir.findFirst({
        where: {
          OR: [
            { username: { equals: identifier, mode: "insensitive" } },
            { email: { equals: identifier, mode: "insensitive" } },
          ],
        },
        include: { akun: true },
      });
      const role = kasir?.akun.role.toLowerCase();
      if (
        !kasir ||
        (role !== "kasir" && role !== "kasir/operator") ||
        (kasir.password !== password && kasir.akun.password !== password)
      ) {
        return jsonError("Username/email atau password tidak sesuai.", 401);
      }

      const profile = await getKasirProfile(kasir.id_kasir);
      if (!profile) return jsonError("Data profil Kasir tidak dapat dimuat.", 500);
      await setKasirSessionCookie(
        createKasirSession(kasir.id_kasir),
        body.remember === true,
      );
      return NextResponse.json({ profile });
    }

    if (body.action === "logout") {
      await clearKasirSessionCookie();
      return NextResponse.json({ success: true });
    }

    const session = await getKasirSession();
    if (!session) return jsonError("Sesi Kasir berakhir. Silakan login kembali.", 401);
    const currentKasir = await prisma.kasir.findUnique({
      where: { id_kasir: session.kasirId },
      select: { id_akun: true },
    });
    if (!currentKasir) {
      await clearKasirSessionCookie();
      return jsonError("Akun Kasir tidak ditemukan. Silakan login kembali.", 401);
    }

    if (body.action === "profile") {
      const name = getText(body, "name");
      const username = getText(body, "username");
      const email = getText(body, "email");
      const phone = getText(body, "phone");
      const address = getText(body, "address");
      const postalCode = getText(body, "postalCode");
      const password = typeof body.password === "string" ? body.password : "";
      if (!name || !username || !email || !phone || !address || !postalCode) {
        return jsonError("Semua data profil wajib diisi.", 400);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return jsonError("Alamat email tidak valid.", 400);
      }
      if (
        name.length > 100 ||
        username.length > 50 ||
        email.length > 100 ||
        phone.length > 20 ||
        address.length > 150 ||
        postalCode.length > 10 ||
        password.length > 100
      ) {
        return jsonError("Salah satu data profil melebihi batas karakter.", 400);
      }
      const profileFields = {
        nama_lengkap: name,
        username,
        email,
        no_telepon: phone,
        alamat_jalan: address,
        kode_pos: postalCode,
        ...(password ? { password } : {}),
      };
      await prisma.$transaction([
        prisma.kasir.update({
          where: { id_kasir: session.kasirId },
          data: profileFields,
        }),
        prisma.akun.update({
          where: { id_akun: currentKasir.id_akun },
          data: profileFields,
        }),
      ]);
      const profile = await getKasirProfile(session.kasirId);
      if (!profile) return jsonError("Profil Kasir tersimpan tetapi tidak dapat dimuat ulang.", 500);
      return NextResponse.json({ profile });
    }

    if (body.action === "transaction:create") {
      return NextResponse.json(
        { transaction: await createTransaction(body, session.kasirId) },
        { status: 201 },
      );
    }

    if (body.action === "payment:verify") {
      const paymentId = getText(body, "paymentId");
      if (!paymentId || paymentId.length > 10) {
        return jsonError("ID pembayaran tidak valid.", 400);
      }
      const payment = await prisma.pembayaran.findUnique({
        where: { id_pembayaran: paymentId },
        include: {
          transaksi: { select: { id_transaksi: true, id_pesanan: true } },
        },
      });
      if (!payment) return jsonError("Pembayaran tidak ditemukan.", 404);
      if (payment.metode_pembayaran === "Tunai") {
        return jsonError("Pembayaran tunai tidak memerlukan verifikasi.", 409);
      }
      if (isKasirPaymentPaid(payment.status_verifikasi)) {
        return jsonError("Pembayaran ini sudah terverifikasi.", 409);
      }
      await prisma.$transaction([
        prisma.pembayaran.update({
          where: { id_pembayaran: paymentId },
          data: { status_verifikasi: "Lunas" },
        }),
        prisma.transaksi.update({
          where: { id_transaksi: payment.transaksi.id_transaksi },
          data: { status_transaksi: "Lunas" },
        }),
        prisma.pesanan.update({
          where: { id_pesanan: payment.transaksi.id_pesanan },
          data: { status_pesanan: "Selesai" },
        }),
      ]);
      return NextResponse.json({ success: true });
    }

    if (body.action === "receipt:create") {
      const transactionId = getText(body, "transactionId");
      if (!transactionId || transactionId.length > 10) {
        return jsonError("ID transaksi tidak valid.", 400);
      }
      const transaction = await prisma.transaksi.findUnique({
        where: { id_transaksi: transactionId },
        select: { total_harga: true },
      });
      if (!transaction) return jsonError("Transaksi tidak ditemukan.", 404);
      const receipt = await prisma.$transaction(async (tx) => {
        const ids = await tx.struk.findMany({ select: { id_struk: true } });
        return tx.struk.create({
          data: {
            id_struk: nextId(ids.map((row) => row.id_struk), "SK", 3),
            id_transaksi: transactionId,
            id_kasir: session.kasirId,
            total_bayar: transaction.total_harga,
          },
          select: { id_struk: true, tanggal_cetak: true },
        });
      }, { isolationLevel: "Serializable" });
      return NextResponse.json({ receipt });
    }

    return jsonError("Aksi Kasir tidak dikenal.", 400);
  } catch (error) {
    return handleApiError(error, "POST");
  }
}
