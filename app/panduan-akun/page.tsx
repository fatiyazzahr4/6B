import { Icon, PageHero, type IconName, SiteHeader } from "../components/storefront";
import Link from "next/link";

export const metadata = {
  title: "Panduan Akun",
};

const steps: {
  icon: IconName;
  title: string;
  description: string;
  className: string;
}[] = [
  {
    icon: "user",
    title: "1. Registrasi",
    description: "Buka Mulai Belanja → pilih Registrasi sekarang, isi data diri.",
    className: "step-pink",
  },
  {
    icon: "lock",
    title: "2. Login",
    description: "Masukkan username/email dan password, lalu tekan Masuk.",
    className: "step-orange",
  },
  {
    icon: "cart",
    title: "3. Buat pesanan",
    description: "Pilih barang, atur jumlah, lalu Konfirmasi Pembelian.",
    className: "step-blue",
  },
  {
    icon: "wallet",
    title: "4. Bayar di kasir",
    description: "Tunjukkan pesanan ke kasir, bayar, dan terima struk.",
    className: "step-green",
  },
];

const roles: {
  icon: IconName;
  title: string;
  points: string[];
  className: string;
}[] = [
  {
    icon: "user",
    title: "Pelanggan",
    points: ["Registrasi & login akun", "Cari barang & buat pesanan", "Pantau status pesanan"],
    className: "role-pink",
  },
  {
    icon: "shield",
    title: "Admin",
    points: ["Kelola akun semua peran", "Kelola data barang & harga", "Kelola laporan untuk Owner"],
    className: "role-blue",
  },
  {
    icon: "store",
    title: "Pengelola Toko",
    points: ["Terima notifikasi stok", "Kelola stok barang & restock", "Atur lokasi penyimpanan"],
    className: "role-green",
  },
  {
    icon: "wallet",
    title: "Kasir/Operator",
    points: ["Catat transaksi penjualan", "Proses pesanan pelanggan", "Verifikasi pembayaran non tunai"],
    className: "role-orange",
  },
  {
    icon: "chart",
    title: "Owner",
    points: ["Lihat laporan transaksi", "Lihat laporan penjualan", "Pantau informasi stok"],
    className: "role-purple",
  },
];

export default function AccountGuidePage() {
  return (
    <main className="storefront-page">
      <SiteHeader active="panduan" />
      <PageHero
        description="Cara daftar, masuk, dan memakai akun Toko Farid langkah demi langkah."
        theme="guide"
        title="Panduan Akun"
      />

      <section className="guide-content">
        <div className="steps-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.title}>
              <span className={`step-icon ${step.className}`}>
                <Icon name={step.icon} />
              </span>
              <h2>{step.title}</h2>
              <p>{step.description}</p>
            </article>
          ))}
        </div>

        <div className="role-heading">
          <h2>Masuk ke akun sesuai peran Anda</h2>
          <p>Pelanggan mendaftar sendiri dan akun internal dibuat oleh Admin.</p>
        </div>
        <div className="roles-grid">
          {roles.map((role) => (
            <article className={`role-card ${role.className}`} key={role.title}>
              <div className="role-title">
                <span className="role-icon">
                  <Icon name={role.icon} />
                </span>
                <h3>{role.title}</h3>
              </div>
              <ul>
                {role.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" />
                    {point}
                  </li>
                ))}
              </ul>
              {role.title === "Pelanggan" && (
                <div className="customer-role-actions">
                  <Link href="/pelanggan/login">Login</Link>
                  <Link href="/pelanggan/registrasi">Registrasi</Link>
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
