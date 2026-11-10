import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/admin-session";
import { getKasirSession } from "@/lib/kasir-session";
import { getOwnerSession } from "@/lib/owner-session";

type TransactionActor = {
  role: "Admin" | "Kasir" | "Owner";
  cashierName: string | null;
  canCreate: boolean;
};

type ManualTransactionInput = {
  productName: string;
  quantity: number;
  unitPrice: string;
  date: Date;
  cashier: string;
  total: string;
};

function jsonError(message: string, status: number) {
  return NextResponse.json({ success: false, message }, { status });
}

function getErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

async function getActor(): Promise<TransactionActor | null> {
  const [adminSession, kasirSession, ownerSession] = await Promise.all([
    getAdminSession(),
    getKasirSession(),
    getOwnerSession(),
  ]);

  if (adminSession) {
    return { role: "Admin", cashierName: null, canCreate: true };
  }
  if (kasirSession) {
    const cashier = await prisma.kasir.findUnique({
      where: { id_kasir: kasirSession.kasirId },
      select: { nama_lengkap: true },
    });
    if (!cashier) return null;
    return { role: "Kasir", cashierName: cashier.nama_lengkap, canCreate: true };
  }
  if (ownerSession) {
    return { role: "Owner", cashierName: null, canCreate: false };
  }
  return null;
}

function parseDate(value: unknown) {
  if (value === undefined || value === null || value === "") {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  }
  if (typeof value !== "string") return null;

  const dateText = value.trim();
  if (!dateText) {
    const today = new Date();
    return new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateText)) return null;
  const date = new Date(`${dateText}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateText
    ? null
    : date;
}

function parseTransaction(
  body: Record<string, unknown>,
  cashierFromSession: string | null,
): ManualTransactionInput | null {
  const productName = typeof body.productName === "string"
    ? body.productName.trim()
    : "";
  const rawQuantity = body.quantity;
  const quantity = typeof rawQuantity === "string" && rawQuantity.trim() !== ""
    ? Number(rawQuantity)
    : rawQuantity;
  const rawPrice = body.unitPrice;
  const priceText = typeof rawPrice === "number" || typeof rawPrice === "string"
    ? String(rawPrice).trim()
    : "";
  const cashier = cashierFromSession ??
    (typeof body.cashier === "string" ? body.cashier.trim() : "");
  const date = parseDate(body.date);

  if (!productName || productName.length > 100) return null;
  if (!Number.isSafeInteger(quantity) || Number(quantity) < 1 || Number(quantity) > 2_147_483_647) {
    return null;
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(priceText)) return null;
  const priceNumber = Number(priceText);
  const priceCents = Math.round(priceNumber * 100);
  if (!Number.isFinite(priceNumber) || priceNumber > 9_999_999_999.99 ||
    !Number.isSafeInteger(priceCents) || priceCents < 0) {
    return null;
  }
  const totalCents = Number(quantity) * priceCents;
  if (!Number.isSafeInteger(totalCents) || totalCents > 9_999_999_999_999) return null;
  if (!date || !cashier || cashier.length > 100) return null;

  return {
    productName,
    quantity: Number(quantity),
    unitPrice: (priceCents / 100).toFixed(2),
    date,
    cashier,
    total: (totalCents / 100).toFixed(2),
  };
}

function handleApiError(error: unknown, operation: string) {
  const code = getErrorCode(error);
  if (code === "P2002") {
    return jsonError("Transaksi tidak tersimpan karena data sudah digunakan. Silakan coba lagi.", 409);
  }
  if (code === "P2003" || code === "P2014") {
    return jsonError("Transaksi tidak dapat diproses karena data terkait berubah.", 409);
  }
  if (code === "P2025") {
    return jsonError("Transaksi yang diminta tidak ditemukan.", 404);
  }
  console.error(
    `Transaksi API ${operation} failed:`,
    error instanceof Error ? error.name : "UnknownError",
  );
  return jsonError("Transaksi belum dapat diproses. Periksa koneksi database lalu coba lagi.", 500);
}

export async function GET() {
  try {
    const actor = await getActor();
    if (!actor) return jsonError("Sesi login tidak ditemukan. Silakan login kembali.", 401);

    const [manualRows, savedRows, manualSummary, savedSummary] = await Promise.all([
      prisma.transaksi_manual.findMany({
        orderBy: [{ tanggal_transaksi: "desc" }, { created_at: "desc" }],
      }),
      prisma.transaksi.findMany({
        select: {
          id_transaksi: true,
          tanggal_transaksi: true,
          total_harga: true,
          kasir: { select: { nama_lengkap: true } },
          detail_transaksi: {
            select: {
              id_detail_transaksi: true,
              jumlah: true,
              harga_satuan: true,
              barang: { select: { nama_barang: true } },
            },
          },
        },
        orderBy: { tanggal_transaksi: "desc" },
      }),
      prisma.transaksi_manual.aggregate({
        _count: { _all: true },
        _sum: { total_harga: true },
      }),
      prisma.transaksi.aggregate({
        _count: { _all: true },
        _sum: { total_harga: true },
      }),
    ]);

    const transactions = [
      ...manualRows.map((row) => ({
        id: row.id_transaksi_manual,
        productName: row.nama_barang,
        quantity: row.jumlah,
        unitPrice: Number(row.harga_satuan),
        date: row.tanggal_transaksi.toISOString().slice(0, 10),
        cashier: row.nama_kasir,
      })),
      ...savedRows.flatMap((row) => {
        if (row.detail_transaksi.length === 0) {
          return [{
            id: row.id_transaksi,
            productName: "Transaksi",
            quantity: 1,
            unitPrice: Number(row.total_harga),
            date: row.tanggal_transaksi.toISOString().slice(0, 10),
            cashier: row.kasir.nama_lengkap,
          }];
        }
        return row.detail_transaksi.map((detail) => ({
          id: `${row.id_transaksi}-${detail.id_detail_transaksi}`,
          productName: detail.barang.nama_barang,
          quantity: detail.jumlah,
          unitPrice: Number(detail.harga_satuan),
          date: row.tanggal_transaksi.toISOString().slice(0, 10),
          cashier: row.kasir.nama_lengkap,
        }));
      }),
    ].sort((left, right) => right.date.localeCompare(left.date));

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        summary: {
          transactionCount: manualSummary._count._all + savedSummary._count._all,
          totalValue: Number(manualSummary._sum.total_harga ?? 0) +
            Number(savedSummary._sum.total_harga ?? 0),
        },
        currentCashier: actor.cashierName,
        canCreate: actor.canCreate,
      },
    });
  } catch (error) {
    return handleApiError(error, "GET");
  }
}

export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor) return jsonError("Sesi login tidak ditemukan. Silakan login kembali.", 401);
    if (!actor.canCreate) return jsonError("Role Anda tidak memiliki izin menambah transaksi.", 403);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Format permintaan tidak valid.", 400);
    }
    if (!isRecord(body)) return jsonError("Data transaksi tidak valid.", 400);

    const input = parseTransaction(body, actor.cashierName);
    if (!input) {
      return jsonError("Nama barang, jumlah, harga, tanggal, atau kasir tidak valid.", 400);
    }

    const transaction = await prisma.transaksi_manual.create({
      data: {
        nama_barang: input.productName,
        jumlah: input.quantity,
        harga_satuan: input.unitPrice,
        tanggal_transaksi: input.date,
        nama_kasir: input.cashier,
        total_harga: input.total,
      },
      select: {
        id_transaksi_manual: true,
        nama_barang: true,
        jumlah: true,
        harga_satuan: true,
        tanggal_transaksi: true,
        nama_kasir: true,
        total_harga: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: transaction.id_transaksi_manual,
        productName: transaction.nama_barang,
        quantity: transaction.jumlah,
        unitPrice: Number(transaction.harga_satuan),
        date: transaction.tanggal_transaksi.toISOString().slice(0, 10),
        cashier: transaction.nama_kasir,
        total: Number(transaction.total_harga),
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error, "POST");
  }
}
