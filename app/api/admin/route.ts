import { NextResponse } from "next/server";
import {
  getAdminAccounts,
  getAdminBackups,
  getAdminDashboard,
  getAdminProducts,
  getAdminProfile,
  getAdminReports,
} from "@/lib/admin-data";
import { prisma } from "@/lib/prisma";
import {
  clearAdminSessionCookie,
  createAdminSession,
  getAdminSession,
  setAdminSessionCookie,
} from "@/lib/admin-session";

const accountRoles = [
  "Pelanggan",
  "Pengelola Toko",
  "Owner",
  "Admin",
  "Kasir/Operator",
] as const;

type AccountRole = (typeof accountRoles)[number];
type RequestBody = Record<string, unknown> & { action?: string };

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function getErrorCode(error: unknown) {
  return error && typeof error === "object" && "code" in error
    ? String(error.code)
    : "";
}

function handleApiError(error: unknown, operation: string) {
  const code = getErrorCode(error);
  if (code === "P2002") {
    return jsonError("Username atau email sudah digunakan.", 409);
  }
  if (code === "P2003" || code === "P2014") {
    return jsonError(
      "Data tidak dapat dihapus atau diubah karena masih digunakan oleh data lain.",
      409,
    );
  }
  if (code === "P2025") {
    return jsonError("Data yang diminta tidak ditemukan.", 404);
  }
  console.error(
    `Admin API ${operation} failed:`,
    error instanceof Error ? error.name : "UnknownError",
  );
  return jsonError(
    "Permintaan Admin belum dapat diproses. Periksa koneksi database lalu coba lagi.",
    500,
  );
}

function getText(body: RequestBody, key: string) {
  return typeof body[key] === "string" ? body[key].trim() : "";
}

function getPassword(body: RequestBody) {
  return typeof body.password === "string" ? body.password : "";
}

function nextId(existing: string[], prefix: string, width: number) {
  const largest = existing.reduce((max, value) => {
    const match = value.match(/(\d+)$/);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `${prefix}${String(largest + 1).padStart(width, "0")}`;
}

function validEmail(value: string) {
  return value.length <= 100 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseAccount(body: RequestBody, requirePassword: boolean) {
  const name = getText(body, "name");
  const username = getText(body, "username");
  const email = getText(body, "email");
  const phone = getText(body, "phone");
  const address = getText(body, "address");
  const postalCode = getText(body, "postalCode");
  const password = getPassword(body);
  const role = getText(body, "role");

  if (
    !name ||
    !username ||
    !email ||
    !phone ||
    !role ||
    (requirePassword && !password)
  ) {
    return { error: "Semua data wajib diisi." } as const;
  }
  if (!accountRoles.includes(role as AccountRole)) {
    return { error: "Role akun tidak dikenal." } as const;
  }
  if (!validEmail(email)) {
    return { error: "Alamat email tidak valid." } as const;
  }
  if (
    name.length > 100 ||
    username.length > 50 ||
    phone.length > 20 ||
    address.length > 150 ||
    postalCode.length > 10 ||
    password.length > 100
  ) {
    return { error: "Salah satu data melebihi batas karakter." } as const;
  }

  return {
    value: {
      name,
      username,
      email,
      phone,
      address,
      postalCode,
      password,
      role: role as AccountRole,
    },
  } as const;
}

function parseProduct(body: RequestBody) {
  const name = getText(body, "name");
  const category = getText(body, "category");
  const unit = getText(body, "unit");
  const rawPrice = body.price;
  const rawMinimum = body.minimum;
  const price = typeof rawPrice === "number" ? rawPrice : Number(rawPrice);
  const minimum = typeof rawMinimum === "number" ? rawMinimum : Number(rawMinimum);

  if (!name || !category || !unit || !Number.isFinite(price) || !Number.isInteger(minimum)) {
    return { error: "Lengkapi semua data barang dengan nilai yang valid." } as const;
  }
  if (
    name.length > 100 ||
    category.length > 50 ||
    unit.length > 20 ||
    price < 0 ||
    price > 9999999999 ||
    minimum < 0
  ) {
    return { error: "Data barang melebihi batas atau bernilai negatif." } as const;
  }

  return { value: { name, category, unit, price, minimum } } as const;
}

function parseReportPeriod(body: RequestBody) {
  const from = getText(body, "from");
  const to = getText(body, "to");
  const start = new Date(`${from}T00:00:00`);
  const end = new Date(`${to}T23:59:59.999`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    start > end
  ) {
    return null;
  }
  return { from: start, to: end };
}

export async function GET(request: Request) {
  try {
    const session = await getAdminSession();
    if (!session) return jsonError("Sesi Admin tidak ditemukan. Silakan login kembali.", 401);

    const admin = await getAdminProfile(session.adminId);
    if (!admin) {
      await clearAdminSessionCookie();
      return jsonError("Akun Admin tidak ditemukan. Silakan login kembali.", 401);
    }

    switch (new URL(request.url).searchParams.get("view")) {
      case "session":
      case "profile":
        return NextResponse.json({ profile: admin }, { headers: { "Cache-Control": "no-store" } });
      case "dashboard":
        return NextResponse.json(
          { profile: admin, summary: await getAdminDashboard(session.adminId) },
          { headers: { "Cache-Control": "no-store" } },
        );
      case "accounts":
        return NextResponse.json(
          { rows: await getAdminAccounts() },
          { headers: { "Cache-Control": "no-store" } },
        );
      case "products":
        return NextResponse.json(
          { rows: await getAdminProducts() },
          { headers: { "Cache-Control": "no-store" } },
        );
      case "reports": {
        const [rows, owners] = await Promise.all([
          getAdminReports(),
          prisma.owner.findMany({
            orderBy: { nama_lengkap: "asc" },
            select: { id_owner: true, nama_lengkap: true },
          }),
        ]);
        return NextResponse.json(
          { rows, owners: owners.map((owner) => ({ id: owner.id_owner, name: owner.nama_lengkap })) },
          { headers: { "Cache-Control": "no-store" } },
        );
      }
      case "backups":
        return NextResponse.json(
          {
            rows: await getAdminBackups(),
            supported: false,
            limitation:
              "Skema saat ini hanya menyimpan metadata backup, bukan berkas SQL. Backup, unduh, dan pemulihan belum tersedia.",
          },
          { headers: { "Cache-Control": "no-store" } },
        );
      default:
        return jsonError("Jenis data Admin tidak dikenal.", 400);
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
    const action = body.action;
    if (action === "login") {
      const identifier = getText(body, "identifier");
      const password = getPassword(body);
      if (!identifier || !password || identifier.length > 100 || password.length > 200) {
        return jsonError("Username/email dan password wajib diisi.", 400);
      }

      const admin = await prisma.admin.findFirst({
        where: {
          OR: [
            { username: { equals: identifier, mode: "insensitive" } },
            { email: { equals: identifier, mode: "insensitive" } },
          ],
        },
        include: { akun: true },
      });
      if (
        !admin ||
        admin.akun.role.toLowerCase() !== "admin" ||
        (admin.password !== password && admin.akun.password !== password)
      ) {
        return jsonError("Username/email atau password tidak sesuai.", 401);
      }

      const token = createAdminSession(admin.id_admin);
      await setAdminSessionCookie(token, body.remember === true);
      const profile = await getAdminProfile(admin.id_admin);
      if (!profile) return jsonError("Data profil Admin tidak dapat dimuat.", 500);
      return NextResponse.json({ profile });
    }

    if (action === "logout") {
      await clearAdminSessionCookie();
      return NextResponse.json({ success: true });
    }

    const session = await getAdminSession();
    if (!session) return jsonError("Sesi Admin berakhir. Silakan login kembali.", 401);
    const currentAdmin = await prisma.admin.findUnique({
      where: { id_admin: session.adminId },
      select: { id_akun: true },
    });
    if (!currentAdmin) {
      await clearAdminSessionCookie();
      return jsonError("Akun Admin tidak ditemukan. Silakan login kembali.", 401);
    }

    if (action === "profile") {
      const parsed = parseAccount({ ...body, role: "Admin" }, false);
      if ("error" in parsed && typeof parsed.error === "string") {
        return jsonError(parsed.error, 400);
      }
      const { name, username, email, phone, address, postalCode, password } = parsed.value;
      const adminFields = {
        nama_lengkap: name,
        username,
        email,
        no_telepon: phone,
        alamat_jalan: address,
        kode_pos: postalCode,
        ...(password ? { password } : {}),
      };
      await prisma.$transaction([
        prisma.admin.update({
          where: { id_admin: session.adminId },
          data: adminFields,
        }),
        prisma.akun.update({
          where: { id_akun: currentAdmin.id_akun },
          data: {
            nama_lengkap: name,
            username,
            email,
            no_telepon: phone,
            alamat_jalan: address,
            kode_pos: postalCode,
            ...(password ? { password } : {}),
          },
        }),
      ]);
      const profile = await getAdminProfile(session.adminId);
      if (!profile) return jsonError("Profil Admin tersimpan tetapi tidak dapat dimuat ulang.", 500);
      return NextResponse.json({ profile });
    }

    if (action === "account:create") {
      const parsed = parseAccount(body, true);
      if ("error" in parsed && typeof parsed.error === "string") {
        return jsonError(parsed.error, 400);
      }
      const account = parsed.value;
      await prisma.$transaction(
        async (tx) => {
          const accountRows = await tx.akun.findMany({ select: { id_akun: true } });
          const accountId = nextId(accountRows.map((row) => row.id_akun), "A", 4);
          const common = {
            id_akun: accountId,
            username: account.username,
            password: account.password,
            nama_lengkap: account.name,
            no_telepon: account.phone,
            email: account.email,
            alamat_jalan: account.address,
            alamat_rt: "0",
            alamat_rw: "0",
            kode_pos: account.postalCode,
          };
          await tx.akun.create({
            data: {
              ...common,
              role: account.role,
            },
          });

          if (account.role === "Admin") {
            const rows = await tx.admin.findMany({ select: { id_admin: true } });
            await tx.admin.create({
              data: { ...common, id_admin: nextId(rows.map((row) => row.id_admin), "AD", 3) },
            });
          } else if (account.role === "Owner") {
            const rows = await tx.owner.findMany({ select: { id_owner: true } });
            await tx.owner.create({
              data: { ...common, id_owner: nextId(rows.map((row) => row.id_owner), "OW", 3) },
            });
          } else if (account.role === "Pelanggan") {
            const rows = await tx.pelanggan.findMany({ select: { id_pelanggan: true } });
            await tx.pelanggan.create({
              data: {
                ...common,
                id_pelanggan: nextId(rows.map((row) => row.id_pelanggan), "P", 4),
              },
            });
          } else if (account.role === "Pengelola Toko") {
            const rows = await tx.pengelola_toko.findMany({ select: { id_pengelola: true } });
            await tx.pengelola_toko.create({
              data: {
                ...common,
                id_pengelola: nextId(rows.map((row) => row.id_pengelola), "PG", 3),
              },
            });
          } else {
            const rows = await tx.kasir.findMany({ select: { id_kasir: true } });
            await tx.kasir.create({
              data: { ...common, id_kasir: nextId(rows.map((row) => row.id_kasir), "K", 4) },
            });
          }
        },
        { isolationLevel: "Serializable" },
      );
      return NextResponse.json({ success: true }, { status: 201 });
    }

    if (action === "account:update") {
      const id = getText(body, "id");
      const current = await prisma.akun.findUnique({ where: { id_akun: id } });
      if (!current) return jsonError("Akun tidak ditemukan.", 404);
      const parsed = parseAccount({ ...body, role: current.role }, false);
      if ("error" in parsed && typeof parsed.error === "string") {
        return jsonError(parsed.error, 400);
      }
      const account = parsed.value;
      const common = {
        username: account.username,
        ...(account.password ? { password: account.password } : {}),
        nama_lengkap: account.name,
        no_telepon: account.phone,
        email: account.email,
        alamat_jalan: account.address,
        kode_pos: account.postalCode,
      };

      await prisma.$transaction(async (tx) => {
        await tx.akun.update({ where: { id_akun: id }, data: common });
        if (current.role === "Admin") {
          await tx.admin.updateMany({ where: { id_akun: id }, data: common });
        } else if (current.role === "Owner") {
          await tx.owner.updateMany({ where: { id_akun: id }, data: common });
        } else if (current.role === "Pelanggan") {
          await tx.pelanggan.updateMany({ where: { id_akun: id }, data: common });
        } else if (current.role === "Pengelola Toko") {
          await tx.pengelola_toko.updateMany({ where: { id_akun: id }, data: common });
        } else if (current.role === "Kasir/Operator") {
          await tx.kasir.updateMany({ where: { id_akun: id }, data: common });
        } else {
          throw new Error("Unsupported account role.");
        }
      });
      return NextResponse.json({ success: true });
    }

    if (action === "account:delete") {
      const id = getText(body, "id");
      if (!id) return jsonError("ID akun wajib diisi.", 400);
      if (id === currentAdmin.id_akun) {
        return jsonError("Akun yang sedang digunakan tidak dapat dihapus.", 409);
      }
      const account = await prisma.akun.findUnique({ where: { id_akun: id } });
      if (!account) return jsonError("Akun tidak ditemukan.", 404);
      if (account.role === "Admin" && await prisma.admin.count() <= 1) {
        return jsonError("Admin terakhir tidak dapat dihapus.", 409);
      }
      await prisma.$transaction(async (tx) => {
        if (account.role === "Admin") await tx.admin.deleteMany({ where: { id_akun: id } });
        else if (account.role === "Owner") await tx.owner.deleteMany({ where: { id_akun: id } });
        else if (account.role === "Pelanggan") await tx.pelanggan.deleteMany({ where: { id_akun: id } });
        else if (account.role === "Pengelola Toko") await tx.pengelola_toko.deleteMany({ where: { id_akun: id } });
        else if (account.role === "Kasir/Operator") await tx.kasir.deleteMany({ where: { id_akun: id } });
        await tx.akun.delete({ where: { id_akun: id } });
      });
      return NextResponse.json({ success: true });
    }

    if (action === "product:create" || action === "product:update") {
      const parsed = parseProduct(body);
      if ("error" in parsed && typeof parsed.error === "string") {
        return jsonError(parsed.error, 400);
      }
      const product = parsed.value;
      if (action === "product:create") {
        await prisma.$transaction(
          async (tx) => {
            const rows = await tx.barang.findMany({ select: { id_barang: true } });
            await tx.barang.create({
              data: {
                id_barang: nextId(rows.map((row) => row.id_barang), "BRG", 3),
                id_admin: session.adminId,
                nama_barang: product.name,
                kategori: product.category,
                satuan: product.unit,
                harga_satuan: product.price,
                stok_minimum: product.minimum,
              },
            });
          },
          { isolationLevel: "Serializable" },
        );
        return NextResponse.json({ success: true }, { status: 201 });
      }

      const id = getText(body, "id");
      if (!id) return jsonError("ID barang wajib diisi.", 400);
      await prisma.barang.update({
        where: { id_barang: id },
        data: {
          nama_barang: product.name,
          kategori: product.category,
          satuan: product.unit,
          harga_satuan: product.price,
          stok_minimum: product.minimum,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "product:delete") {
      const id = getText(body, "id");
      if (!id) return jsonError("ID barang wajib diisi.", 400);
      await prisma.barang.delete({ where: { id_barang: id } });
      return NextResponse.json({ success: true });
    }

    if (action === "report:create" || action === "report:update") {
      const kind = getText(body, "kind");
      const period = parseReportPeriod(body);
      if (!kind || kind.length > 50 || !period) {
        return jsonError("Jenis laporan dan rentang periode harus valid.", 400);
      }
      const status = getText(body, "status") || "Belum Diarsipkan";
      if (!["Diarsipkan", "Belum Diarsipkan"].includes(status)) {
        return jsonError("Status laporan tidak valid.", 400);
      }

      if (action === "report:create") {
        const ownerId = getText(body, "ownerId");
        const owner = await prisma.owner.findUnique({ where: { id_owner: ownerId } });
        if (!owner) return jsonError("Pilih akun Owner yang tersedia.", 400);
        await prisma.$transaction(
          async (tx) => {
            const rows = await tx.laporan.findMany({ select: { id_laporan: true } });
            await tx.laporan.create({
              data: {
                id_laporan: nextId(rows.map((row) => row.id_laporan), "LP", 3),
                id_owner: ownerId,
                id_admin: session.adminId,
                jenis_laporan: kind,
                periode_awal: period.from,
                periode_akhir: period.to,
                status_arsip: status,
              },
            });
          },
          { isolationLevel: "Serializable" },
        );
        return NextResponse.json({ success: true }, { status: 201 });
      }

      const id = getText(body, "id");
      if (!id) return jsonError("ID laporan wajib diisi.", 400);
      await prisma.laporan.update({
        where: { id_laporan: id },
        data: {
          jenis_laporan: kind,
          periode_awal: period.from,
          periode_akhir: period.to,
          status_arsip: status,
        },
      });
      return NextResponse.json({ success: true });
    }

    if (action === "report:delete") {
      const id = getText(body, "id");
      if (!id) return jsonError("ID laporan wajib diisi.", 400);
      await prisma.laporan.delete({ where: { id_laporan: id } });
      return NextResponse.json({ success: true });
    }

    return jsonError("Aksi Admin tidak dikenal.", 400);
  } catch (error) {
    return handleApiError(error, "POST");
  }
}
