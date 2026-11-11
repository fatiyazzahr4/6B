import Image from "next/image";
import Link from "next/link";
import { Icon } from "./components/storefront";

export const metadata = {
  title: "Selamat Datang",
};

const benefits = [
  { icon: "cart", title: "Produk", subtitle: "Berkualitas" },
  { icon: "tag", title: "Harga", subtitle: "Terjangkau" },
  { icon: "shield", title: "Transaksi", subtitle: "Aman" },
  { icon: "truck", title: "Pelayanan", subtitle: "Cepat" },
] as const;

export default function LandingPage() {
  return (
    <main className="landing-page">
      <Image
        className="landing-logo"
        src="/storefront/toko-farid-logo.png"
        alt="Logo Toko Farid"
        width={56}
        height={52}
        priority
      />
      <div className="landing-brand">
        <strong>Toko Farid</strong>
        <span>Supermarket Keluarga · Padang</span>
      </div>

      <section className="landing-content" aria-labelledby="landing-title">
        <h1 id="landing-title">Toko Farid</h1>
        <span className="landing-rule" />
        <p>Belanja Mudah, Kebutuhan Lengkap</p>
        <Link className="landing-button" href="/beranda">
          Click Here!
        </Link>
        <small>Klik halaman ini untuk masuk ke Beranda</small>
      </section>

      <ul className="landing-benefits" aria-label="Keunggulan Toko Farid">
        {benefits.map((benefit) => (
          <li key={benefit.title}>
            <span className="landing-benefit-icon">
              <Icon name={benefit.icon} />
            </span>
            <strong>{benefit.title}</strong>
            <span>{benefit.subtitle}</span>
          </li>
        ))}
      </ul>
    </main>
  );
}
