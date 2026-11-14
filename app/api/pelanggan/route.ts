import { NextResponse } from "next/server";
import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  getPelangganCatalog,
  getPelangganOrders,
  getPelangganProfile,
} from "@/lib/pelanggan-data";
import {
  clearPelangganSessionCookie,
  createPelangganSession,
  getPelangganSession,
  setPelangganSessionCookie,
} from "@/lib/pelanggan-session";

type RequestBody = Record<string, unknown> & { action?: string };

class PelangganRequestError extends Error {
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
  if (error instanceof PelangganRequestError) {
    return jsonError(error.message, error.status);
  }
  const code = getErrorCode(error);
  if (code === "P2002") {
    return jsonError("Username, email, atau data lain sudah digunakan.", 409);
  }
  if (code === "P2025") {
    return jsonError("Data yang diminta tidak ditemukan.", 404);
  }
  console.error(
    `Pelanggan API ${operation} failed:`,
    error instanceof Error ? error.name : "UnknownError",
  );
  return jsonError(
    "Permintaan Pelanggan belum dapat diproses. Periksa koneksi database lalu coba lagi.",
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

function parseOrderItems(value: unknown) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw new PelangganRequestError("Tambahkan setidaknya satu barang ke pesanan.", 400);
  }

  const quantities = new Map<string, number>();
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new PelangganRequestError("Daftar barang tidak valid.", 400);
    }
    const productId = "productId" in item && typeof item.productId === "string"
      ? item.productId.trim()
      : "";
    const quantity = "quantity" in item ? Number(item.quantity) : 0;
    if (!productId || productId.length > 10 || !Number.isSafeInteger(quantity) || quantity < 1) {
      throw new PelangganRequestError("Jumlah barang harus berupa bilangan bulat lebih dari nol.", 400);
    }
    quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
  }
  return [...quantities].map(([productId, quantity]) => ({ productId, quantity }));
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateProfileFields(body: RequestBody) {
  const name = getText(body, "name");
  const username = getText(body, "username");
  const email = getText(body, "email");
  const phone = getText(body, "phone");
  const address = getText(body, "address");
  const postalCode = getText(body, "postalCode");

  if (!name || !username || !email || !phone || !address || !postalCode) {
    throw new PelangganRequestError("Semua data wajib diisi.", 400);
  }
  if (!emailPattern.test(email)) {
    throw new PelangganRequestError("Alamat email tidak valid.", 400);
  }
  if (!/^[0-9]{5}$/.test(postalCode)) {
    throw new PelangganRequestError("Kode pos harus 5 digit angka.", 400);
  }
  if (
    name.length > 100 ||
    username.length > 50 ||
    email.length > 100 ||
    phone.length > 20 ||
    address.length > 150
  ) {
    throw new PelangganRequestError("Salah satu data melebihi batas karakter.", 400);
  }
  return { name, username, email, phone, address, postalCode };
}

type OrderTx = Prisma.TransactionClient;
async function priceOrderLines(
  tx: OrderTx,
  items: { productId: string; quantity: number }[],
) {
  const products = await tx.barang.findMany({
    where: { id_barang: { in: items.map((item) => item.productId) } },
    include: { stok: { select: { jumlah_stok: true } } },
  });
  if (products.length !== items.length) {
    throw new PelangganRequestError("Satu atau beberapa barang tidak tersedia.", 409);
  }

  const lines = items.map((item) => {
    const product = products.find((row) => row.id_barang === item.productId)!;
    const stock = product.stok.reduce((sum, row) => sum + row.jumlah_stok, 0);
    if (item.quantity > stock) {
      throw new PelangganRequestError(
        `Stok ${product.nama_barang} tidak mencukupi (tersisa ${stock}).`,
        409,
      );
    }
    const unitPrice = Number(product.harga_satuan);
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      subtotal: Number((unitPrice * item.quantity).toFixed(2)),
    };
  });
  const total = Number(lines.reduce((sum, line) => sum + line.subtotal, 0).toFixed(2));
  if (total > 9_999_999_999) {
    throw new PelangganRequestError("Total pesanan terlalu besar.", 400);
  }
  return { lines, total };
}

async function insertOrderLines(
  tx: OrderTx,
  orderId: string,
  lines: { productId: string; quantity: number; unitPrice: number; subtotal: number }[],
  usedDetailIds: string[],
) {
  const used = [...usedDetailIds];
  const ids = lines.map(() => {
    const id = nextId(used, "DP", 4);
    used.push(id);
    return id;
  });
  await tx.detail_pesanan.createMany({
    data: lines.map((line, index) => ({
      id_detail_pesanan: ids[index],
      id_pesanan: orderId,
      id_barang: line.productId,
      jumlah: line.quantity,
      harga_satuan: line.unitPrice.toFixed(2),
      subtotal: line.subtotal.toFixed(2),
    })),
  });
}

export async function GET(request: Request) {
  try {
    const session = await getPelangganSession();
    if (!session) {
      return jsonError("Sesi Pelanggan tidak ditemukan. Silakan login kembali.", 401);
    }

    const profile = await getPelangganProfile(session.pelangganId);
    if (!profile) {
      await clearPelangganSessionCookie();
      return jsonError("Akun Pelanggan tidak ditemukan. Silakan login kembali.", 401);
    }

    const { searchParams } = new URL(request.url);
    switch (searchParams.get("view")) {
      case "session":
      case "profile":
        return NextResponse.json({ profile });
      case "catalog":
        return NextResponse.json({ products: await getPelangganCatalog() });
      case "orders":
        return NextResponse.json({ orders: await getPelangganOrders(session.pelangganId) });
      default:
        return jsonError("Jenis data Pelanggan tidak dikenal.", 400);
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

      const pelanggan = await prisma.pelanggan.findFirst({
        where: {
          OR: [
            { username: { equals: identifier, mode: "insensitive" } },
            { email: { equals: identifier, mode: "insensitive" } },
          ],
        },
        include: { akun: true },
      });
      if (
        !pelanggan ||
        pelanggan.akun.role.toLowerCase() !== "pelanggan" ||
        (pelanggan.password !== password && pelanggan.akun.password !== password)
      ) {
        return jsonError("Username/email atau password tidak sesuai.", 401);
      }

      const profile = await getPelangganProfile(pelanggan.id_pelanggan);
      if (!profile) return jsonError("Data profil Pelanggan tidak dapat dimuat.", 500);
      await setPelangganSessionCookie(
        createPelangganSession(pelanggan.id_pelanggan),
        body.remember === true,
      );
      return NextResponse.json({ profile });
    }

    if (body.action === "logout") {
      await clearPelangganSessionCookie();
      return NextResponse.json({ success: true });
    }

    if (body.action === "register") {
      const fields = validateProfileFields(body);
      const password = typeof body.password === "string" ? body.password : "";
      if (password.length < 6 || password.length > 100) {
        return jsonError("Password harus 6 sampai 100 karakter.", 400);
      }

      const created = await prisma.$transaction(
        async (tx) => {
          const duplicate = await tx.akun.findFirst({
            where: {
              OR: [
                { username: { equals: fields.username, mode: "insensitive" } },
                { email: { equals: fields.email, mode: "insensitive" } },
              ],
            },
            select: { id_akun: true },
          });
          if (duplicate) {
            throw new PelangganRequestError("Username atau email sudah terdaftar.", 409);
          }

          const [accounts, customers, registrations] = await Promise.all([
            tx.akun.findMany({ select: { id_akun: true } }),
            tx.pelanggan.findMany({ select: { id_pelanggan: true } }),
            tx.registrasi.findMany({ select: { id_registrasi: true } }),
          ]);
          const accountId = nextId(accounts.map((row) => row.id_akun), "A", 4);
          const customerId = nextId(customers.map((row) => row.id_pelanggan), "PL", 4);
          const registrationId = nextId(registrations.map((row) => row.id_registrasi), "RG", 4);

          const common = {
            username: fields.username,
            email: fields.email,
            password,
            nama_lengkap: fields.name,
            alamat_jalan: fields.address,
            kode_pos: fields.postalCode,
            alamat_rt: "-",
            alamat_rw: "-",
          };
          await tx.akun.create({
            data: {
              id_akun: accountId,
              ...common,
              no_telepon: fields.phone,
              role: "Pelanggan",
            },
          });
          await tx.data_akun.create({
            data: {
              id_akun: accountId,
              ...common,
              nomor_telepon: fields.phone,
              role: "Pelanggan",
            },
          });
          await tx.pelanggan.create({
            data: {
              id_pelanggan: customerId,
              id_akun: accountId,
              ...common,
              no_telepon: fields.phone,
            },
          });
          await tx.registrasi.create({
            data: {
              id_registrasi: registrationId,
              id_pelanggan: customerId,
              status_registrasi: "Disetujui",
            },
          });
          return customerId;
        },
        { isolationLevel: "Serializable" },
      );

      const profile = await getPelangganProfile(created);
      if (!profile) return jsonError("Akun dibuat tetapi profil tidak dapat dimuat.", 500);
      await setPelangganSessionCookie(createPelangganSession(created));
      return NextResponse.json({ profile }, { status: 201 });
    }

    const session = await getPelangganSession();
    if (!session) {
      return jsonError("Sesi Pelanggan berakhir. Silakan login kembali.", 401);
    }
    const current = await prisma.pelanggan.findUnique({
      where: { id_pelanggan: session.pelangganId },
      select: { id_akun: true },
    });
    if (!current) {
      await clearPelangganSessionCookie();
      return jsonError("Akun Pelanggan tidak ditemukan. Silakan login kembali.", 401);
    }

    if (body.action === "profile") {
      const fields = validateProfileFields(body);
      const password = typeof body.password === "string" ? body.password : "";
      if (password && (password.length < 6 || password.length > 100)) {
        return jsonError("Password baru harus 6 sampai 100 karakter.", 400);
      }

      const conflict = await prisma.akun.findFirst({
        where: {
          id_akun: { not: current.id_akun },
          OR: [
            { username: { equals: fields.username, mode: "insensitive" } },
            { email: { equals: fields.email, mode: "insensitive" } },
          ],
        },
        select: { id_akun: true },
      });
      if (conflict) {
        return jsonError("Username atau email sudah digunakan akun lain.", 409);
      }

      const shared = {
        username: fields.username,
        email: fields.email,
        nama_lengkap: fields.name,
        alamat_jalan: fields.address,
        kode_pos: fields.postalCode,
        ...(password ? { password } : {}),
      };
      await prisma.$transaction([
        prisma.pelanggan.update({
          where: { id_pelanggan: session.pelangganId },
          data: { ...shared, no_telepon: fields.phone },
        }),
        prisma.akun.update({
          where: { id_akun: current.id_akun },
          data: { ...shared, no_telepon: fields.phone },
        }),
        prisma.data_akun.updateMany({
          where: { id_akun: current.id_akun },
          data: { ...shared, nomor_telepon: fields.phone },
        }),
      ]);
      const profile = await getPelangganProfile(session.pelangganId);
      if (!profile) return jsonError("Profil tersimpan tetapi tidak dapat dimuat ulang.", 500);
      return NextResponse.json({ profile });
    }

    if (body.action === "order:create") {
      const items = parseOrderItems(body.items);
      const order = await prisma.$transaction(
        async (tx) => {
          const { lines, total } = await priceOrderLines(tx, items);
          const [orderRows, detailRows] = await Promise.all([
            tx.pesanan.findMany({ select: { id_pesanan: true } }),
            tx.detail_pesanan.findMany({ select: { id_detail_pesanan: true } }),
          ]);
          const orderId = nextId(orderRows.map((row) => row.id_pesanan), "PS", 4);
          await tx.pesanan.create({
            data: {
              id_pesanan: orderId,
              id_pelanggan: session.pelangganId,
              status_pesanan: "Menunggu",
              total_harga: total.toFixed(2),
            },
          });
          await insertOrderLines(
            tx,
            orderId,
            lines,
            detailRows.map((row) => row.id_detail_pesanan),
          );
          return { id: orderId, total, status: "Menunggu" };
        },
        { isolationLevel: "Serializable" },
      );
      return NextResponse.json({ order }, { status: 201 });
    }

    if (body.action === "order:update" || body.action === "order:delete") {
      const orderId = getText(body, "orderId");
      if (!orderId || orderId.length > 10) {
        return jsonError("ID pesanan tidak valid.", 400);
      }
      const items = body.action === "order:update" ? parseOrderItems(body.items) : [];
      const order = await prisma.$transaction(
        async (tx) => {
          const existing = await tx.pesanan.findUnique({
            where: { id_pesanan: orderId },
            include: { transaksi: { select: { id_transaksi: true } } },
          });
          if (!existing || existing.id_pelanggan !== session.pelangganId) {
            throw new PelangganRequestError("Pesanan tidak ditemukan.", 404);
          }
          if (existing.transaksi.length > 0 || existing.status_pesanan.toLowerCase() !== "menunggu") {
            throw new PelangganRequestError(
              "Pesanan yang sudah diproses kasir tidak dapat diubah atau dihapus.",
              409,
            );
          }

          await tx.detail_pesanan.deleteMany({ where: { id_pesanan: orderId } });
          if (body.action === "order:delete") {
            await tx.pesanan.delete({ where: { id_pesanan: orderId } });
            return { id: orderId, deleted: true };
          }

          const { lines, total } = await priceOrderLines(tx, items);
          const detailRows = await tx.detail_pesanan.findMany({ select: { id_detail_pesanan: true } });
          await insertOrderLines(
            tx,
            orderId,
            lines,
            detailRows.map((row) => row.id_detail_pesanan),
          );
          await tx.pesanan.update({
            where: { id_pesanan: orderId },
            data: { total_harga: total.toFixed(2) },
          });
          return { id: orderId, total, status: existing.status_pesanan };
        },
        { isolationLevel: "Serializable" },
      );
      return NextResponse.json({ order });
    }

    return jsonError("Aksi Pelanggan tidak dikenal.", 400);
  } catch (error) {
    return handleApiError(error, "POST");
  }
}

