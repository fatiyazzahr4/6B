import { NextResponse } from "next/server";
import {
  getPengelolaDashboard,
  getPengelolaHistory,
  getPengelolaLocations,
  getPengelolaNotifications,
  getPengelolaProfile,
  getPengelolaStock,
} from "@/lib/pengelola-data";
import { prisma } from "@/lib/prisma";
import {
  clearPengelolaSessionCookie,
  createPengelolaSession,
  getPengelolaSession,
  setPengelolaSessionCookie,
} from "@/lib/pengelola-session";

type Body = Record<string, unknown> & { action?: string };

class RequestError extends Error {
  constructor(message: string, readonly status: number) {
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

function handleError(error: unknown, operation: string) {
  if (error instanceof RequestError) return jsonError(error.message, error.status);
  const code = getErrorCode(error);
  if (code === "P2002") return jsonError("ID, username, atau email sudah digunakan.", 409);
  if (code === "P2003" || code === "P2014") {
    return jsonError("Data tidak dapat diubah karena masih digunakan oleh data lain.", 409);
  }
  if (code === "P2025") return jsonError("Data yang diminta tidak ditemukan.", 404);
  console.error(
    `Pengelola API ${operation} failed:`,
    error instanceof Error ? error.name : "UnknownError",
  );
  return jsonError(
    "Permintaan Pengelola Toko belum dapat diproses. Periksa koneksi database lalu coba lagi.",
    500,
  );
}

function text(body: Body, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

function integer(body: Body, key: string) {
  const value = typeof body[key] === "number" ? body[key] : Number(body[key]);
  if (!Number.isSafeInteger(value)) {
    throw new RequestError("Jumlah harus berupa bilangan bulat.", 400);
  }
  return value;
}

function nextId(existing: string[], prefix: string, width: number) {
  const largest = existing.reduce((max, value) => {
    const match = value.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${String(largest + 1).padStart(width, "0")}`;
}

async function newId(
  model: "stok" | "lokasi" | "riwayat_stok" | "notifikasi_stok",
  prefix: string,
) {
  if (model === "stok") {
    const rows = await prisma.stok.findMany({ select: { id_stok: true } });
    return nextId(rows.map((row) => row.id_stok), prefix, 3);
  }
  if (model === "lokasi") {
    const rows = await prisma.lokasi.findMany({ select: { id_lokasi: true } });
    return nextId(rows.map((row) => row.id_lokasi), prefix, 3);
  }
  if (model === "riwayat_stok") {
    const rows = await prisma.riwayat_stok.findMany({ select: { id_riwayat: true } });
    return nextId(rows.map((row) => row.id_riwayat), prefix, 3);
  }
  const rows = await prisma.notifikasi_stok.findMany({
    select: { id_notifikasi: true },
  });
  return nextId(rows.map((row) => row.id_notifikasi), prefix, 3);
}

async function ensureLowStockNotification(
  stockId: string,
  pengelolaId: string,
  productName: string,
  quantity: number,
  minimum: number,
) {
  if (quantity >= minimum) return;
  const unread = await prisma.notifikasi_stok.findFirst({
    where: { id_stok: stockId, id_pengelola: pengelolaId, status: { not: "Dibaca" } },
    select: { id_notifikasi: true },
  });
  if (unread) return;

  await prisma.notifikasi_stok.create({
    data: {
      id_notifikasi: await newId("notifikasi_stok", "NT"),
      id_stok: stockId,
      id_pengelola: pengelolaId,
      pesan: `Stok ${productName} ${quantity} pcs menipis, segera restock`,
      status: "Belum Dibaca",
    },
  });
}

async function requireOwnedStock(stockId: string, pengelolaId: string) {
  const stock = await prisma.stok.findFirst({
    where: { id_stok: stockId, lokasi: { id_pengelola: pengelolaId } },
    include: { barang: true },
  });
  if (!stock) throw new RequestError("Data stok tidak ditemukan.", 404);
  return stock;
}

export async function GET(request: Request) {
  try {
    const session = await getPengelolaSession();
    if (!session) return jsonError("Sesi Pengelola Toko tidak ditemukan. Silakan login kembali.", 401);

    const profile = await getPengelolaProfile(session.pengelolaId);
    if (!profile) {
      await clearPengelolaSessionCookie();
      return jsonError("Akun Pengelola Toko tidak ditemukan. Silakan login kembali.", 401);
    }

    const view = new URL(request.url).searchParams.get("view");
    switch (view) {
      case "session":
      case "profile":
        return NextResponse.json({ profile });
      case "dashboard":
        return NextResponse.json({
          profile,
          ...(await getPengelolaDashboard(session.pengelolaId)),
        });
      case "stock":
        return NextResponse.json({ rows: await getPengelolaStock(session.pengelolaId) });
      case "locations":
        return NextResponse.json({
          rows: await getPengelolaLocations(session.pengelolaId),
        });
      case "catalog": {
        const [products, locations] = await Promise.all([
          prisma.barang.findMany({
            select: {
              id_barang: true,
              nama_barang: true,
              satuan: true,
              stok_minimum: true,
            },
            orderBy: { nama_barang: "asc" },
          }),
          getPengelolaLocations(session.pengelolaId),
        ]);
        return NextResponse.json({
          products: products.map((product) => ({
            id: product.id_barang,
            name: product.nama_barang,
            unit: product.satuan,
            minimum: product.stok_minimum,
          })),
          locations,
        });
      }
      case "notifications":
        return NextResponse.json({
          rows: await getPengelolaNotifications(session.pengelolaId),
        });
      case "history":
        return NextResponse.json({
          rows: await getPengelolaHistory(session.pengelolaId),
        });
      default:
        return jsonError("Jenis data Pengelola Toko tidak dikenal.", 400);
    }
  } catch (error) {
    return handleError(error, "GET");
  }
}

export async function POST(request: Request) {
  let body: Body;
  try {
    const json: unknown = await request.json();
    if (!json || typeof json !== "object" || Array.isArray(json)) {
      return jsonError("Format permintaan tidak valid.", 400);
    }
    body = json as Body;
  } catch {
    return jsonError("Format permintaan tidak valid.", 400);
  }

  try {
    if (body.action === "login") {
      const identifier = text(body, "identifier");
      const password = typeof body.password === "string" ? body.password : "";
      if (!identifier || !password || identifier.length > 100 || password.length > 200) {
        return jsonError("Username/email dan password wajib diisi.", 400);
      }

      const pengelola = await prisma.pengelola_toko.findFirst({
        where: {
          OR: [
            { username: { equals: identifier, mode: "insensitive" } },
            { email: { equals: identifier, mode: "insensitive" } },
          ],
        },
        include: { akun: true },
      });
      const role = pengelola?.akun.role.toLocaleLowerCase("id-ID");
      if (
        !pengelola ||
        (role !== "pengelola toko" && role !== "pengelola") ||
        (pengelola.password !== password && pengelola.akun.password !== password)
      ) {
        return jsonError("Username/email atau password tidak sesuai.", 401);
      }

      const profile = await getPengelolaProfile(pengelola.id_pengelola);
      if (!profile) return jsonError("Data profil Pengelola Toko tidak dapat dimuat.", 500);
      await setPengelolaSessionCookie(
        createPengelolaSession(pengelola.id_pengelola),
        body.remember === true,
      );
      return NextResponse.json({ profile });
    }

    if (body.action === "logout") {
      await clearPengelolaSessionCookie();
      return NextResponse.json({ success: true });
    }

    const session = await getPengelolaSession();
    if (!session) return jsonError("Sesi Pengelola Toko berakhir. Silakan login kembali.", 401);
    const pengelola = await prisma.pengelola_toko.findUnique({
      where: { id_pengelola: session.pengelolaId },
      select: { id_akun: true },
    });
    if (!pengelola) {
      await clearPengelolaSessionCookie();
      return jsonError("Akun Pengelola Toko tidak ditemukan. Silakan login kembali.", 401);
    }

    if (body.action === "profile") {
      const values = {
        name: text(body, "name"),
        username: text(body, "username"),
        email: text(body, "email"),
        phone: text(body, "phone"),
        postalCode: text(body, "postalCode"),
        address: text(body, "address"),
      };
      if (Object.values(values).some((value) => !value)) {
        return jsonError("Semua data profil wajib diisi.", 400);
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
        return jsonError("Alamat email tidak valid.", 400);
      }
      if (
        values.name.length > 100 ||
        values.username.length > 50 ||
        values.email.length > 100 ||
        values.phone.length > 20 ||
        values.postalCode.length > 10 ||
        values.address.length > 150
      ) {
        return jsonError("Salah satu data profil melebihi batas karakter.", 400);
      }
      const fields = {
        nama_lengkap: values.name,
        username: values.username,
        email: values.email,
        no_telepon: values.phone,
        kode_pos: values.postalCode,
        alamat_jalan: values.address,
      };
      await prisma.$transaction([
        prisma.pengelola_toko.update({
          where: { id_pengelola: session.pengelolaId },
          data: fields,
        }),
        prisma.akun.update({ where: { id_akun: pengelola.id_akun }, data: fields }),
      ]);
      const profile = await getPengelolaProfile(session.pengelolaId);
      if (!profile) throw new RequestError("Profil tersimpan tetapi tidak dapat dimuat ulang.", 500);
      return NextResponse.json({ profile });
    }

    if (body.action === "notifications:read") {
      const notificationId = text(body, "notificationId");
      const result = await prisma.notifikasi_stok.updateMany({
        where: {
          id_notifikasi: notificationId,
          id_pengelola: session.pengelolaId,
        },
        data: { status: "Dibaca" },
      });
      if (!notificationId || result.count !== 1) {
        return jsonError("Notifikasi tidak ditemukan.", 404);
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === "notifications:read-all") {
      await prisma.notifikasi_stok.updateMany({
        where: { id_pengelola: session.pengelolaId, status: { not: "Dibaca" } },
        data: { status: "Dibaca" },
      });
      return NextResponse.json({ success: true });
    }

    if (body.action === "location:create" || body.action === "location:update") {
      const locationId = text(body, "locationId");
      const name = text(body, "name");
      const type = text(body, "type");
      if (!name || !type || name.length > 100 || type.length > 50) {
        return jsonError("Nama lokasi dan jenis lokasi wajib diisi.", 400);
      }
      if (body.action === "location:create") {
        const id = await newId("lokasi", "LK");
        const location = await prisma.lokasi.create({
          data: {
            id_lokasi: id,
            id_pengelola: session.pengelolaId,
            nama_lokasi: name,
            jenis_lokasi: type,
          },
        });
        return NextResponse.json({ location: { id: location.id_lokasi } }, { status: 201 });
      }
      const result = await prisma.lokasi.updateMany({
        where: { id_lokasi: locationId, id_pengelola: session.pengelolaId },
        data: { nama_lokasi: name, jenis_lokasi: type },
      });
      if (!locationId || result.count !== 1) return jsonError("Lokasi tidak ditemukan.", 404);
      return NextResponse.json({ success: true });
    }

    if (body.action === "location:delete") {
      const locationId = text(body, "locationId");
      const location = await prisma.lokasi.findFirst({
        where: { id_lokasi: locationId, id_pengelola: session.pengelolaId },
        include: { _count: { select: { stok: true } } },
      });
      if (!location) return jsonError("Lokasi tidak ditemukan.", 404);
      if (location._count.stok > 0) {
        return jsonError("Lokasi masih digunakan oleh stok barang dan tidak dapat dihapus.", 409);
      }
      await prisma.lokasi.delete({ where: { id_lokasi: locationId } });
      return NextResponse.json({ success: true });
    }

    if (body.action === "stock:create") {
      const productId = text(body, "productId");
      const locationId = text(body, "locationId");
      const quantity = integer(body, "quantity");
      if (!productId || !locationId || quantity < 0) {
        return jsonError("Pilih barang dan lokasi serta masukkan jumlah stok yang valid.", 400);
      }
      const [location, product] = await Promise.all([
        prisma.lokasi.findFirst({
          where: { id_lokasi: locationId, id_pengelola: session.pengelolaId },
        }),
        prisma.barang.findUnique({ where: { id_barang: productId } }),
      ]);
      if (!location || !product) return jsonError("Barang atau lokasi tidak ditemukan.", 404);
      const id = await newId("stok", "ST");
      await prisma.$transaction(async (tx) => {
        await tx.stok.create({
          data: {
            id_stok: id,
            id_lokasi: locationId,
            id_barang: productId,
            jumlah_stok: quantity,
            tanggal_update: new Date(),
          },
        });
        if (quantity > 0) {
          const historyId = nextId(
            (await tx.riwayat_stok.findMany({ select: { id_riwayat: true } }))
              .map((row) => row.id_riwayat),
            "RW",
            3,
          );
          await tx.riwayat_stok.create({
            data: {
              id_riwayat: historyId,
              id_stok: id,
              id_pengelola: session.pengelolaId,
              jenis_riwayat: "Masuk",
              jumlah: quantity,
              keterangan: "Penambahan stok",
            },
          });
        }
      }, { isolationLevel: "Serializable" });
      await ensureLowStockNotification(
        id,
        session.pengelolaId,
        product.nama_barang,
        quantity,
        product.stok_minimum,
      );
      return NextResponse.json({ success: true, id }, { status: 201 });
    }

    if (body.action === "stock:update" || body.action === "stock:restock") {
      const stockId = text(body, "stockId");
      const current = await requireOwnedStock(stockId, session.pengelolaId);
      const nextQuantity = body.action === "stock:restock"
        ? current.jumlah_stok + integer(body, "quantity")
        : integer(body, "quantity");
      const locationId = body.action === "stock:update"
        ? text(body, "locationId")
        : current.id_lokasi;
      if (nextQuantity < 0) return jsonError("Jumlah stok tidak boleh kurang dari nol.", 400);
      const location = await prisma.lokasi.findFirst({
        where: { id_lokasi: locationId, id_pengelola: session.pengelolaId },
      });
      if (!location) return jsonError("Lokasi tidak ditemukan.", 404);
      const difference = nextQuantity - current.jumlah_stok;

      await prisma.$transaction(async (tx) => {
        const result = await tx.stok.updateMany({
          where: { id_stok: stockId, lokasi: { id_pengelola: session.pengelolaId } },
          data: {
            jumlah_stok: nextQuantity,
            id_lokasi: locationId,
            tanggal_update: new Date(),
          },
        });
        if (result.count !== 1) throw new RequestError("Data stok berubah. Muat ulang halaman.", 409);
        if (difference !== 0) {
          const historyId = nextId(
            (await tx.riwayat_stok.findMany({ select: { id_riwayat: true } }))
              .map((row) => row.id_riwayat),
            "RW",
            3,
          );
          await tx.riwayat_stok.create({
            data: {
              id_riwayat: historyId,
              id_stok: stockId,
              id_pengelola: session.pengelolaId,
              jenis_riwayat: difference > 0 ? "Masuk" : "Keluar",
              jumlah: difference,
              keterangan: body.action === "stock:restock" ? "Restock barang" : "Perubahan stok",
            },
          });
        }
      }, { isolationLevel: "Serializable" });
      await ensureLowStockNotification(
        stockId,
        session.pengelolaId,
        current.barang.nama_barang,
        nextQuantity,
        current.barang.stok_minimum,
      );
      if (nextQuantity >= current.barang.stok_minimum) {
        await prisma.notifikasi_stok.updateMany({
          where: {
            id_stok: stockId,
            id_pengelola: session.pengelolaId,
            status: { not: "Dibaca" },
          },
          data: { status: "Dibaca" },
        });
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === "stock:delete") {
      const stockId = text(body, "stockId");
      await requireOwnedStock(stockId, session.pengelolaId);
      const historyCount = await prisma.riwayat_stok.count({ where: { id_stok: stockId } });
      if (historyCount > 0) {
        return jsonError("Stok memiliki riwayat dan tidak dapat dihapus agar catatan tetap utuh.", 409);
      }
      await prisma.$transaction([
        prisma.notifikasi_stok.deleteMany({
          where: { id_stok: stockId, id_pengelola: session.pengelolaId },
        }),
        prisma.stok.delete({ where: { id_stok: stockId } }),
      ]);
      return NextResponse.json({ success: true });
    }

    return jsonError("Aksi Pengelola Toko tidak dikenal.", 400);
  } catch (error) {
    return handleError(error, "POST");
  }
}
