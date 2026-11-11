import { Icon, PageHero, SiteHeader } from "../components/storefront";

export const metadata = {
  title: "Tentang Toko Farid",
};

const facts = [
  { icon: "box", value: "10", label: "Produk kebutuhan pokok", className: "fact-pink" },
  { icon: "map-pin", value: "2", label: "Lokasi: toko & gudang", className: "fact-blue" },
  { icon: "users", value: "5", label: "Peran dalam sistem", className: "fact-green" },
  { icon: "wallet", value: "3", label: "Metode pembayaran", className: "fact-orange" },
] as const;

export default function AboutPage() {
  return (
    <main className="storefront-page">
      <SiteHeader active="tentang" />
      <PageHero
        description="Supermarket keluarga di Padang. Belanja mudah, kebutuhan lengkap."
        theme="about"
        title="Tentang Toko Farid"
      />

      <section className="about-content">
        <article className="story-card">
          <h2>Cerita kami</h2>
          <p>
            Toko Farid hadir untuk memudahkan warga Padang memenuhi kebutuhan harian:
            beras, minyak, gula, telur, kopi, hingga mie instan — dengan harga
            terjangkau dan stok yang selalu terpantau. Pelanggan dapat membuat pesanan
            dari rumah, lalu menyelesaikan pembayaran di kasir tanpa antre panjang.
          </p>
          <ul className="story-facts">
            <li>
              <span className="story-icon">
                <Icon name="shield" />
              </span>
              <strong>Transaksi aman</strong>
            </li>
            <li>
              <span className="story-icon">
                <Icon name="clock" />
              </span>
              <strong>Buka 07.00 – 21.00</strong>
            </li>
            <li>
              <span className="story-icon">
                <Icon name="map-pin" />
              </span>
              <strong>Padang, Sumbar</strong>
            </li>
          </ul>
        </article>

        <div className="facts-grid">
          {facts.map((fact) => (
            <article className={`fact-card ${fact.className}`} key={fact.label}>
              <span className="round-icon">
                <Icon name={fact.icon} />
              </span>
              <span className="fact-copy">
                <strong>{fact.value}</strong>
                <small>{fact.label}</small>
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
