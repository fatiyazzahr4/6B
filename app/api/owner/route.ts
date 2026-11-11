import { NextResponse } from "next/server";
import {
  getOwnerArchives,
  getOwnerDashboard,
  getOwnerProfile,
  getOwnerSales,
  getOwnerTransactions,
  getStockRows,
  ownerDemoData,
} from "@/lib/owner-data";
import { prisma } from "@/lib/prisma";
import {
  clearOwnerSessionCookie,
  createOwnerSession,
  getOwnerSession,
  setOwnerSessionCookie,
  type OwnerProfile,
} from "@/lib/owner-session";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

function serializeProfile(profile: OwnerProfile) {
  return profile;
}

function parseDateRange(searchParams: URLSearchParams) {
  const fromValue = searchParams.get("from");
  const toValue = searchParams.get("to");
  const from = fromValue ? new Date(`${fromValue}T00:00:00`) : new Date("2026-10-01T00:00:00");
  const to = toValue ? new Date(`${toValue}T23:59:59.999`) : new Date("2026-10-23T23:59:59.999");
  if (!Number.isFinite(from.getTime()) || !Number.isFinite(to.getTime()) || from > to) {
    return null;
  }
  return { from, to };
}

export async function GET(request: Request) {
  try {
    const session = await getOwnerSession();
    if (!session) return jsonError("Sesi Owner tidak ditemukan. Silakan login kembali.", 401);

    const { searchParams } = new URL(request.url);
    const view = searchParams.get("view");
    const range = parseDateRange(searchParams);

    if (session.preview) {
      switch (view) {
        case "session":
        case "profile":
          return NextResponse.json({ profile: session.profile ?? ownerDemoData.profile, preview: true });
        case "dashboard":
          return NextResponse.json({
            profile: session.profile ?? ownerDemoData.profile,
            summary: {
              transactions: 5,
              transactionTotal: 341000,
              sales: 283000,
              paidCount: 4,
              lowStock: 5,
              archives: 3,
              lowStockItems: ["Beras", "Telur", "Kopi", "Susu Kental Manis", "Teh Celup"],
            },
            preview: true,
          });
        case "stock":
          return NextResponse.json({ rows: ownerDemoData.stock.map((row) => ({ ...row, status: row.quantity < row.minimum ? "Menipis" : "Aman" })), preview: true });
        case "transactions":
          return NextResponse.json({ rows: ownerDemoData.transactions, preview: true });
        case "sales":
          return NextResponse.json({ rows: ownerDemoData.sales, transactionCount: 4, preview: true });
        case "archive":
          return NextResponse.json({ rows: ownerDemoData.archives, preview: true });
        default:
          return jsonError("Jenis data Owner tidak dikenal.", 400);
      }
    }

    const profile = await getOwnerProfile(session.ownerId);
    if (!profile) {
      await clearOwnerSessionCookie();
      return jsonError("Akun Owner tidak ditemukan. Silakan login kembali.", 401);
    }

    switch (view) {
      case "session":
      case "profile":
        return NextResponse.json({ profile, preview: false });
      case "dashboard": {
        const summary = await getOwnerDashboard(session.ownerId);
        return NextResponse.json({
          profile,
          summary,
          preview: false,
        });
      }
      case "stock":
        return NextResponse.json({ rows: await getStockRows(), preview: false });
      case "transactions":
      case "sales": {
        if (!range) return jsonError("Rentang tanggal tidak valid.", 400);
        if (view === "transactions") {
          const rows = await getOwnerTransactions(range.from, range.to);
          return NextResponse.json({ rows, from: range.from, to: range.to, preview: false });
        }
        const sales = await getOwnerSales(range.from, range.to);
        return NextResponse.json({
          ...sales,
          from: range.from,
          to: range.to,
          preview: false,
        });
      }
      case "archive":
        return NextResponse.json({
          rows: (await getOwnerArchives(session.ownerId)).map((row) => ({
            id: row.id_laporan,
            kind: row.jenis_laporan,
            from: row.periode_awal,
            to: row.periode_akhir,
            createdAt: row.tanggal_dibuat,
            status: row.status_arsip,
          })),
          preview: false,
        });
      default:
        return jsonError("Jenis data Owner tidak dikenal.", 400);
    }
  } catch (error) {
    console.error("Owner API GET failed:", error instanceof Error ? error.name : "UnknownError");
    return jsonError("Data Owner belum dapat dimuat. Periksa koneksi database lalu coba lagi.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as Record<string, unknown>;
    const action = body.action;

    if (action === "preview") {
      if (process.env.NODE_ENV === "production") return jsonError("Pratinjau hanya tersedia di development.", 404);
      const session = createOwnerSession("preview", { preview: true, profile: ownerDemoData.profile });
      await setOwnerSessionCookie(session, false);
      return NextResponse.json({ profile: ownerDemoData.profile, preview: true });
    }

    if (action === "login") {
      const identifier = typeof body.identifier === "string" ? body.identifier.trim() : "";
      const password = typeof body.password === "string" ? body.password : "";
      if (!identifier || !password || identifier.length > 100 || password.length > 200) {
        return jsonError("Username/email dan password wajib diisi.", 400);
      }

      const owner = await prisma.owner.findFirst({
        where: {
          OR: [
            { username: { equals: identifier, mode: "insensitive" } },
            { email: { equals: identifier, mode: "insensitive" } },
          ],
        },
        include: { akun: true },
      });
      if (!owner || (owner.password !== password && owner.akun.password !== password)) {
        return jsonError("Username/email atau password tidak sesuai.", 401);
      }

      const profile = await getOwnerProfile(owner.id_owner);
      if (!profile) return jsonError("Data profil Owner tidak dapat dimuat.", 500);
      const token = createOwnerSession(owner.id_owner);
      await setOwnerSessionCookie(token, body.remember === true);
      return NextResponse.json({ profile: serializeProfile(profile) });
    }

    if (action === "logout") {
      await clearOwnerSessionCookie();
      return NextResponse.json({ success: true });
    }

    const session = await getOwnerSession();
    if (!session) return jsonError("Sesi Owner berakhir. Silakan login kembali.", 401);

    if (action === "profile") {
      const fields = ["name", "username", "email", "phone", "postalCode", "address"] as const;
      const values = Object.fromEntries(fields.map((field) => [field, body[field]])) as Record<(typeof fields)[number], unknown>;
      if (fields.some((field) => typeof values[field] !== "string" || !values[field].trim())) {
        return jsonError("Semua data profil wajib diisi.", 400);
      }
      const profileData = Object.fromEntries(
        fields.map((field) => [field, (values[field] as string).trim()]),
      ) as Record<(typeof fields)[number], string>;
      if (profileData.email.length > 100 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileData.email)) {
        return jsonError("Alamat email tidak valid.", 400);
      }
      if (profileData.username.length > 50 || profileData.name.length > 100 || profileData.phone.length > 20 || profileData.postalCode.length > 10 || profileData.address.length > 150) {
        return jsonError("Salah satu data profil melebihi batas karakter.", 400);
      }

      if (session.preview) {
        const profile = { ...(session.profile ?? ownerDemoData.profile), ...profileData };
        await setOwnerSessionCookie(createOwnerSession("preview", { preview: true, profile }), false);
        return NextResponse.json({ profile });
      }

      const current = await prisma.owner.findUnique({ where: { id_owner: session.ownerId } });
      if (!current) return jsonError("Akun Owner tidak ditemukan.", 404);
      await prisma.$transaction([
        prisma.owner.update({
          where: { id_owner: session.ownerId },
          data: {
            nama_lengkap: profileData.name,
            username: profileData.username,
            email: profileData.email,
            no_telepon: profileData.phone,
            kode_pos: profileData.postalCode,
            alamat_jalan: profileData.address,
          },
        }),
        prisma.akun.update({
          where: { id_akun: current.id_akun },
          data: {
            nama_lengkap: profileData.name,
            username: profileData.username,
            email: profileData.email,
            no_telepon: profileData.phone,
            kode_pos: profileData.postalCode,
            alamat_jalan: profileData.address,
          },
        }),
      ]);
      const profile = await getOwnerProfile(session.ownerId);
      if (!profile) return jsonError("Profil Owner tersimpan tetapi tidak dapat dimuat ulang.", 500);
      return NextResponse.json({ profile });
    }

    return jsonError("Aksi Owner tidak dikenal.", 400);
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "P2002") return jsonError("Username atau email sudah digunakan.", 409);
    console.error("Owner API POST failed:", error instanceof Error ? error.name : "UnknownError");
    return jsonError("Permintaan Owner belum dapat diproses. Periksa koneksi database lalu coba lagi.", 500);
  }
}
