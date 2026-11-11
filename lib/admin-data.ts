import { prisma } from "@/lib/prisma";

export type AdminProfile = {
  id: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  role: "Admin";
};

export async function getAdminProfile(adminId: string): Promise<AdminProfile | null> {
  const admin = await prisma.admin.findUnique({
    where: { id_admin: adminId },
    include: { akun: true },
  });
  if (!admin) return null;

  return {
    id: admin.id_admin,
    name: admin.nama_lengkap,
    username: admin.username,
    email: admin.email,
    phone: admin.no_telepon,
    address: admin.alamat_jalan,
    postalCode: admin.kode_pos,
    role: "Admin",
  };
}

export async function getAdminAccounts() {
  const accounts = await prisma.akun.findMany({
    orderBy: { id_akun: "asc" },
    select: {
      id_akun: true,
      nama_lengkap: true,
      username: true,
      role: true,
      email: true,
      no_telepon: true,
    },
  });

  return accounts.map((account) => ({
    id: account.id_akun,
    name: account.nama_lengkap,
    username: account.username,
    role: account.role,
    email: account.email,
    phone: account.no_telepon,
  }));
}

export async function getAdminProducts() {
  const products = await prisma.barang.findMany({
    orderBy: { id_barang: "asc" },
    include: {
      stok: {
        select: {
          jumlah_stok: true,
          lokasi: { select: { nama_lokasi: true } },
        },
      },
    },
  });

  return products.map((product) => ({
    id: product.id_barang,
    name: product.nama_barang,
    category: product.kategori,
    unit: product.satuan,
    price: Number(product.harga_satuan),
    minimum: product.stok_minimum,
    stock: product.stok.reduce((sum, item) => sum + item.jumlah_stok, 0),
    locations: [...new Set(product.stok.map((item) => item.lokasi.nama_lokasi))],
  }));
}

export async function getAdminReports() {
  const reports = await prisma.laporan.findMany({
    orderBy: [{ tanggal_dibuat: "desc" }, { id_laporan: "asc" }],
    include: { owner: { select: { nama_lengkap: true } } },
  });

  return reports.map((report) => ({
    id: report.id_laporan,
    kind: report.jenis_laporan,
    ownerId: report.id_owner,
    ownerName: report.owner.nama_lengkap,
    from: report.periode_awal,
    to: report.periode_akhir,
    createdAt: report.tanggal_dibuat,
    status: report.status_arsip,
  }));
}

export async function getAdminBackups() {
  const backups = await prisma.backup_data.findMany({
    orderBy: [{ tanggal_backup: "desc" }, { id_backup: "asc" }],
  });

  return backups.map((backup) => ({
    id: backup.id_backup,
    date: backup.tanggal_backup,
    fileName: backup.nama_file,
    status: backup.status,
  }));
}

export async function getAdminDashboard(adminId: string) {
  const [accountCount, productCount, reportCount, backupCount, products, latestBackup] =
    await Promise.all([
      prisma.akun.count(),
      prisma.barang.count(),
      prisma.laporan.count(),
      prisma.backup_data.count(),
      prisma.barang.findMany({
        select: {
          id_barang: true,
          nama_barang: true,
          kategori: true,
          satuan: true,
          stok_minimum: true,
          stok: {
            select: {
              jumlah_stok: true,
              lokasi: { select: { nama_lokasi: true } },
            },
          },
        },
        orderBy: { nama_barang: "asc" },
      }),
      prisma.backup_data.findFirst({
        where: { id_admin: adminId },
        orderBy: { tanggal_backup: "desc" },
      }),
    ]);

  const lowStock = products
    .map((product) => ({
      id: product.id_barang,
      name: product.nama_barang,
      category: product.kategori,
      unit: product.satuan,
      minimum: product.stok_minimum,
      stock: product.stok.reduce((sum, item) => sum + item.jumlah_stok, 0),
      locations: [...new Set(product.stok.map((item) => item.lokasi.nama_lokasi))],
    }))
    .filter((product) => product.stock < product.minimum)
    .sort((left, right) => left.stock - right.stock)
    .map((product) => ({
      ...product,
      location: product.locations.length ? product.locations.join(", ") : "Belum ditempatkan",
    }));

  return {
    accounts: accountCount,
    products: productCount,
    reports: reportCount,
    backups: backupCount,
    lowStock,
    latestBackup: latestBackup
      ? {
          date: latestBackup.tanggal_backup,
          fileName: latestBackup.nama_file,
        }
      : null,
  };
}
