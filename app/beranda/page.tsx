import Link from "next/link";
import { Icon, SiteHeader } from "../components/storefront";

export const metadata = {
  title: "Beranda",
};

const benefits = [
  {
    className: "benefit-yellow",
    icon: "gift",
    title: "Gratis gift spesial",
    description: "Untuk pembelian tertentu",
  },
  {
    className: "benefit-orange",
    icon: "truck",
    title: "Gratis ongkir",
    description: "Pengantaran area Padang",
  },
  {
    className: "benefit-cyan",
    icon: "store",
    title: "Ambil di toko tanpa antre",
    description: "Pesan dulu, bayar di kasir",
  },
] as const;

const shortcuts = [
  {
    className: "shortcut-yellow",
    icon: "book",
    title: "Tentang Toko Farid",
    description: "Profil, visi, dan lokasi toko.",
    label: "Baca selengkapnya",
    href: "/tentang",
  },
  {
    className: "shortcut-orange",
    icon: "user",
    title: "Panduan Akun",
    description: "Cara daftar, masuk, dan memakai akun.",
    label: "Buka panduan",
    href: "/panduan-akun",
  },
  {
    className: "shortcut-pink",
    icon: "cart",
    title: "Mulai Belanja",
    description: "Login pelanggan · belum punya akun? Registrasi.",
    label: "Masuk pelanggan",
    href: "/pelanggan/login",
  },
] as const;

const portals = [
  {
    className: "portal-blue",
    icon: "shield",
    title: "Admin",
    subtitle: "Portal Admin",
    description: "Kelola semua peran, data barang, laporan, serta backup sistem.",
    points: ["Kelola akun semua peran", "Kelola data barang & harga", "Kelola laporan untuk Owner"],
  },
  {
    className: "portal-green",
    icon: "store",
    title: "Pengelola Toko",
    subtitle: "Portal Pengelola",
    description: "Pantau stok, lokasi penyimpanan, dan riwayat barang masuk/keluar.",
    points: ["Terima notifikasi stok menipis", "Kelola stok barang & restock", "Atur lokasi penyimpanan"],
  },
  {
    className: "portal-orange",
    icon: "wallet",
    title: "Kasir",
    subtitle: "Portal Kasir",
    description: "Catat transaksi, proses pesanan pelanggan, dan cetak struk.",
    points: ["Catat transaksi penjualan", "Proses pesanan pelanggan", "Verifikasi pembayaran non-tunai"],
  },
  {
    className: "portal-purple",
    icon: "chart",
    title: "Owner",
    subtitle: "Portal Owner",
    description: "Lihat laporan transaksi, penjualan, dan informasi stok toko.",
    points: ["Lihat laporan transaksi", "Lihat laporan penjualan", "Pantau informasi stok"],
  },
] as const;

export default function BerandaPage() {
  return (
    <main className="storefront-page">
      <SiteHeader active="beranda" />

      <section className="home-hero">
        <div className="home-hero-copy">
          <h1>
            <span>Belanja kebutuhan</span>
            <span className="home-title-inset">harian, lebih rapi</span>
            <span className="home-title-accent">dan cepat.</span>
          </h1>
        </div>
        <ul className="home-benefits" aria-label="Penawaran Toko Farid">
          {benefits.map((benefit) => (
            <li className={`home-benefit ${benefit.className}`} key={benefit.title}>
              <span className="home-benefit-icon">
                <Icon name={benefit.icon} />
              </span>
              <span>
                <strong>{benefit.title}</strong>
                <small>{benefit.description}</small>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="start-section" id="mulai-belanja">
        <div className="start-panel">
          <h2>Mulai dari sini</h2>
          <p>Kenali toko, pelajari cara memakai akun, lalu langsung belanja!</p>
          <div className="shortcut-grid">
            {shortcuts.map((shortcut) => (
              <article className={`shortcut-card ${shortcut.className}`} key={shortcut.title}>
                <div className="shortcut-heading">
                  <span className="round-icon">
                    <Icon name={shortcut.icon} />
                  </span>
                  <span>
                    <h3>{shortcut.title}</h3>
                    <p>{shortcut.description}</p>
                  </span>
                </div>
                <Link className="button button-light shortcut-button" href={shortcut.href}>
                  {shortcut.label}
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="portal-section">
        <div className="portal-heading">
          <div>
            <h2>Portal Internal Toko Farid</h2>
            <p>Khusus admin, pengelola toko, kasir, dan owner. Akun dibuat oleh Admin.</p>
          </div>
          <span className="restricted-badge">
            <Icon name="lock" />
            Akses terbatas
          </span>
        </div>
        <div className="portal-grid">
          {portals.map((portal) => (
            <article className={`portal-card ${portal.className}`} key={portal.title}>
              <div className="portal-card-heading">
                <span className="round-icon">
                  <Icon name={portal.icon} />
                </span>
                <span>
                  <h3>{portal.title}</h3>
                  <small>{portal.subtitle}</small>
                </span>
              </div>
              <p>{portal.description}</p>
              <ul>
                {portal.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" />
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                className="button button-light portal-button"
                href={
                  portal.title === "Admin"
                    ? "/admin/login"
                    : portal.title === "Pengelola Toko"
                      ? "/pengelola/login"
                    : portal.title === "Owner"
                      ? "/owner/login"
                      : portal.title === "Kasir"
                        ? "/kasir/login"
                      : "/panduan-akun#login"
                }
              >
                Masuk
              </Link>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
