"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent, type ReactNode } from "react";

type CustomerPage = "dashboard" | "order" | "orders" | "profile";
type IconName =
  | "arrow-left"
  | "box"
  | "cart"
  | "check"
  | "clock"
  | "edit"
  | "eye"
  | "eye-off"
  | "gift"
  | "grid"
  | "info"
  | "lock"
  | "logout"
  | "mail"
  | "map"
  | "minus"
  | "phone"
  | "plus"
  | "shield"
  | "star"
  | "tag"
  | "trash"
  | "user"
  | "wallet"
  | "x";

const iconContents: Record<IconName, ReactNode> = {
  "arrow-left": <path d="M19 12H5m7 7-7-7 7-7" />,
  box: (
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="M3 8v9l9 5 9-5V8m-9 5v9" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.5L22 8H6" />
      <circle cx="10" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  edit: (
    <>
      <path d="m15 5 4 4M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  "eye-off": (
    <>
      <path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1 0 2-.2 2.8-.5" />
    </>
  ),
  gift: (
    <>
      <path d="M20 12v9H4v-9M2 7h20v5H2zm10 15V7" />
      <path d="M12 7H7.5a2.5 2.5 0 1 1 2.5-2.5V7Zm0 0h4.5A2.5 2.5 0 1 0 14 4.5V7Z" />
    </>
  ),
  grid: (
    <>
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5m0-8h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 1 1 8 0v3" />
    </>
  ),
  logout: (
    <>
      <path d="M10 17l5-5-5-5m5 5H3" />
      <path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m4 7 8 6 8-6" />
    </>
  ),
  map: (
    <>
      <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" />
      <path d="M9 3v15m6-12v15" />
    </>
  ),
  minus: <path d="M5 12h14" />,
  phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />,
  plus: <path d="M12 5v14m-7-7h14" />,
  shield: (
    <>
      <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />,
  tag: (
    <>
      <path d="m20.6 13.4-10 10L2 14.8V4h10.8l7.8 7.8a1.1 1.1 0 0 1 0 1.6Z" />
      <circle cx="7.5" cy="8" r="1" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18m-2 0-1 14H6L5 6m4 0V4h6v2m-5 4v6m4-6v6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  wallet: (
    <>
      <rect x="3" y="5" width="18" height="15" rx="2" />
      <path d="M3 9h18m-5 5h2" />
    </>
  ),
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

function CustomerIcon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {iconContents[name]}
    </svg>
  );
}

const products = [
  { id: "beras", name: "Beras Premium 5 kg", category: "Beras · per Karung", price: 68000, image: "beras.jpg", low: true },
  { id: "minyak", name: "Minyak Goreng 1 L", category: "Minyak · per Botol", price: 18000, image: "minyak.jpg", low: false },
  { id: "susu", name: "Susu Kental Manis 370 g", category: "Susu · per Bungkus", price: 13500, image: "susu-kental.jpg", low: true },
  { id: "telur", name: "Telur Ayam 1 Tray", category: "Telur · per Tray", price: 52000, image: "telur.jpg", low: true },
  { id: "tepung", name: "Tepung Terigu 1 kg", category: "Tepung · per Bungkus", price: 14000, image: "tepung.jpg", low: false },
  { id: "kopi", name: "Kopi Bubuk 200 g", category: "Kopi · per Kaleng", price: 16000, image: null, low: false },
  { id: "mie", name: "Mie Instan Goreng", category: "Mie · per Kotak", price: 3500, image: "mie-instan.jpg", low: false },
  { id: "gula", name: "Gula Pasir 1 kg", category: "Gula · per Bungkus", price: 17000, image: "gula.jpg", low: false },
  { id: "teh", name: "Teh Celup 25 pcs", category: "Teh · per Karung", price: 9500, image: "teh.jpg", low: true },
  { id: "garam", name: "Garam Dapur 250 g", category: "Garam · per Bungkus", price: 3000, image: "garam.jpg", low: true },
] as const;

const promos = [
  { id: "gift", title: "Gratis gift spesial", subtitle: "Untuk belanja jumlah tertentu", className: "promo-yellow" },
  { id: "delivery", title: "Gratis ongkir", subtitle: "Pengantaran area Padang", className: "promo-orange" },
  { id: "store", title: "Ambil di toko", subtitle: "Tanpa antre di kasir", className: "promo-cyan" },
] as const;

const pageDetails: Record<CustomerPage, { title: string; description: string; action?: string }> = {
  dashboard: { title: "Halo, Nafisa!", description: "Pilih barang, buat pesanan dari rumah, lalu bayar di kasir Toko Farid.", action: "Buat Pesanan" },
  order: { title: "Buat Pesanan", description: "Pilih barang yang ingin dipesan. Pembayaran dilakukan di kasir." },
  orders: { title: "Pesanan Saya", description: "Lihat informasi dan status pesanan Anda." },
  profile: { title: "Profil Saya", description: "Data akun yang sedang digunakan.", action: "Ubah profil" },
};

function AuthScenery() {
  return (
    <section className="customer-auth-welcome" aria-label="Keunggulan Toko Farid">
      <Link className="customer-auth-brand" href="/beranda">
        <Image alt="" height={34} src="/storefront/toko-farid-logo.png" width={34} />
        <span><strong>Toko Farid</strong><small>Belanja Mudah, Kebutuhan Lengkap</small></span>
      </Link>
      <div className="customer-welcome-copy">
        <h1>Selamat Datang<br />di Toko Farid!</h1>
        <p>Temukan kebutuhan harianmu dengan mudah.<br />Masuk ke akun untuk mulai berbelanja dan memantau pesananmu.</p>
        <ul>
          <li><span><CustomerIcon name="cart" /></span><div><strong>Produk Berkualitas</strong><small>Pilihan kebutuhan pokok terbaik</small></div></li>
          <li><span><CustomerIcon name="tag" /></span><div><strong>Harga Terjangkau</strong><small>Hemat setiap hari</small></div></li>
          <li><span><CustomerIcon name="shield" /></span><div><strong>Transaksi Aman</strong><small>Pembayaran terverifikasi kasir</small></div></li>
        </ul>
      </div>
      <Link className="customer-back-home" href="/beranda"><CustomerIcon name="arrow-left" />Kembali ke Beranda</Link>
    </section>
  );
}

function AuthCard({
  register,
  children,
}: {
  register?: boolean;
  children: ReactNode;
}) {
  return (
    <main className="customer-auth-page">
      <AuthScenery />
      <section className={`customer-auth-panel${register ? " is-register" : ""}`}>
        <div className="customer-auth-card">
          <header className="customer-auth-card-head">
            <span className="customer-auth-title-icon"><CustomerIcon name={register ? "plus" : "user"} /></span>
            <div>
              <h2>{register ? "Registrasi Pelanggan" : "Login sebagai Pelanggan"}</h2>
              <p>{register ? "Isi data berikut untuk membuat akun anda." : "Portal Pelanggan Toko Farid"}</p>
            </div>
          </header>
          {children}
        </div>
      </section>
    </main>
  );
}

function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Login belum dapat diproses karena layanan autentikasi pelanggan belum tersedia. Tidak ada sesi yang dibuat.");
  }

  return (
    <AuthCard>
      <form className="customer-auth-form customer-login-form" onSubmit={submit}>
        <label className="customer-field">
          <span>Username atau Email</span>
          <span className="customer-input-wrap"><CustomerIcon name="user" /><input autoComplete="username" onChange={(event) => setUsername(event.target.value)} placeholder="Masukkan Username atau Email" required value={username} /></span>
        </label>
        <label className="customer-field">
          <span>Password</span>
          <span className="customer-input-wrap"><CustomerIcon name="lock" /><input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan Password" required type={visible ? "text" : "password"} value={password} /><button aria-label={visible ? "Sembunyikan password" : "Tampilkan password"} className="customer-input-action" onClick={() => setVisible((value) => !value)} type="button"><CustomerIcon name={visible ? "eye" : "eye-off"} /></button></span>
        </label>
        <div className="customer-login-options">
          <label className="customer-checkbox"><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" /><span>Ingat saya</span></label>
          {password && <button className="customer-text-button" onClick={() => setNotice("Pengaturan ulang kata sandi belum tersedia karena layanan akun pelanggan belum terhubung.")} type="button">Lupa password?</button>}
        </div>
        <button className="customer-primary-button" type="submit">Masuk <CustomerIcon name="arrow-left" className="customer-arrow-right" /></button>
        {notice && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{notice}</p>}
        <div className="customer-auth-divider" />
        <div className="customer-auth-switch"><span>Belum punya akun?</span><Link className="customer-outline-button" href="/pelanggan/registrasi"><CustomerIcon name="plus" />Registrasi sekarang</Link></div>
      </form>
    </AuthCard>
  );
}

function RegisterPage() {
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get("password") !== formData.get("confirmPassword")) {
      setNotice("Konfirmasi password belum sama.");
      return;
    }
    setNotice("Registrasi belum dapat diproses karena layanan akun pelanggan belum tersedia. Data ini tidak disimpan.");
  }

  return (
    <AuthCard register>
      <form className="customer-auth-form customer-register-form" onSubmit={submit}>
        <label className="customer-field customer-field-full"><span>Nama Lengkap</span><span className="customer-input-wrap"><CustomerIcon name="user" /><input autoComplete="name" name="name" placeholder="Masukkan Nama Lengkap" required /></span></label>
        <div className="customer-form-grid">
          <label className="customer-field"><span>Username</span><span className="customer-input-wrap"><CustomerIcon name="user" /><input autoComplete="username" name="username" placeholder="Masukkan Username" required /></span></label>
          <label className="customer-field"><span>Email</span><span className="customer-input-wrap"><CustomerIcon name="mail" /><input autoComplete="email" name="email" placeholder="Masukkan Email" required type="email" /></span></label>
          <label className="customer-field"><span>Nomor Telepon</span><span className="customer-input-wrap"><CustomerIcon name="phone" /><input autoComplete="tel" inputMode="tel" name="phone" placeholder="Contoh: 081234567890" required /></span></label>
          <label className="customer-field"><span>Kode Pos</span><span className="customer-input-wrap"><CustomerIcon name="map" /><input autoComplete="postal-code" inputMode="numeric" name="postalCode" pattern="[0-9]{5}" placeholder="5 digit" required /></span></label>
        </div>
        <label className="customer-field customer-field-full"><span>Alamat</span><span className="customer-input-wrap"><CustomerIcon name="map" /><input autoComplete="street-address" name="address" placeholder="Masukkan alamat" required /></span></label>
        <div className="customer-form-grid">
          <label className="customer-field"><span>Password</span><span className="customer-input-wrap"><CustomerIcon name="lock" /><input autoComplete="new-password" minLength={6} name="password" placeholder="Minimal 6 karakter" required type={visible ? "text" : "password"} /></span></label>
          <label className="customer-field"><span>Ulangi Password</span><span className="customer-input-wrap"><CustomerIcon name="lock" /><input autoComplete="new-password" minLength={6} name="confirmPassword" placeholder="Konfirmasi Password" required type={visible ? "text" : "password"} /><button aria-label={visible ? "Sembunyikan password" : "Tampilkan password"} className="customer-input-action" onClick={() => setVisible((value) => !value)} type="button"><CustomerIcon name={visible ? "eye" : "eye-off"} /></button></span></label>
        </div>
        <p className="customer-privacy-note"><CustomerIcon name="shield" />Data Anda hanya digunakan untuk layanan pelanggan Toko Farid.</p>
        {notice && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{notice}</p>}
        <div className="customer-register-actions"><button className="customer-primary-button" type="submit"><CustomerIcon name="check" />Daftar</button><Link className="customer-cancel-button" href="/pelanggan/login">Batal</Link></div>
        <div className="customer-auth-switch"><span>Sudah punya akun?</span><Link className="customer-link-pink" href="/pelanggan/login">Login di sini</Link></div>
      </form>
    </AuthCard>
  );
}

function CustomerSidebar({ active }: { active: CustomerPage }) {
  const links: { href: string; label: string; key: CustomerPage; icon: IconName }[] = [
    { href: "/pelanggan", label: "Dashboard", key: "dashboard", icon: "grid" },
    { href: "/pelanggan/buat-pesanan", label: "Buat Pesanan", key: "order", icon: "cart" },
    { href: "/pelanggan/pesanan-saya", label: "Pesanan Saya", key: "orders", icon: "box" },
    { href: "/pelanggan/profil-saya", label: "Profil Saya", key: "profile", icon: "user" },
  ];

  return (
    <aside className="customer-sidebar">
      <Link className="customer-sidebar-brand" href="/pelanggan">
        <Image alt="" height={34} src="/storefront/toko-farid-logo.png" width={34} />
        <span><strong>Toko Farid</strong><small>Portal Pelanggan</small></span>
      </Link>
      <div className="customer-sidebar-user"><span className="customer-avatar-small">NU</span><span><strong>Nafisa Uldiyah</strong><small>Pelanggan</small></span></div>
      <span className="customer-sidebar-label">MENU UTAMA</span>
      <nav aria-label="Navigasi pelanggan" className="customer-sidebar-nav">
        {links.map((link) => <Link aria-current={active === link.key ? "page" : undefined} className={active === link.key ? "is-active" : ""} href={link.href} key={link.key}><CustomerIcon name={link.icon} /><span>{link.label}</span></Link>)}
      </nav>
      <Link className="customer-logout" href="/pelanggan/login"><CustomerIcon name="logout" />Logout</Link>
    </aside>
  );
}

function CustomerShell({
  page,
  children,
  onAction,
}: {
  page: CustomerPage;
  children: ReactNode;
  onAction?: () => void;
}) {
  const details = pageDetails[page];
  return (
    <div className={`customer-portal customer-page-${page}`}>
      <CustomerSidebar active={page} />
      <main className="customer-main">
        <header className="customer-page-banner">
          <div><h1>{details.title}</h1><p>{details.description}</p></div>
          {details.action && (page === "profile" ? <button className="customer-banner-action" onClick={onAction} type="button"><CustomerIcon name="edit" />{details.action}</button> : <Link className="customer-banner-action" href="/pelanggan/buat-pesanan"><CustomerIcon name="cart" />{details.action}</Link>)}
        </header>
        {children}
      </main>
    </div>
  );
}

function DashboardPage() {
  const [modal, setModal] = useState<"promo" | "applied" | null>(null);

  return (
    <CustomerShell page="dashboard">
      <section aria-label="Ringkasan akun" className="customer-stat-grid">
        <article className="customer-stat-card"><span className="stat-icon stat-pink"><CustomerIcon name="box" /></span><div><small>Pesanan saya</small><strong>0</strong></div></article>
        <article className="customer-stat-card"><span className="stat-icon stat-green"><CustomerIcon name="check" /></span><div><small>Selesai</small><strong>0</strong></div></article>
        <article className="customer-stat-card"><span className="stat-icon stat-orange"><CustomerIcon name="wallet" /></span><div><small>Total belanja</small><strong>Rp 0</strong></div></article>
        <article className="customer-stat-card"><span className="stat-icon stat-purple"><CustomerIcon name="gift" /></span><div><small>Promo aktif</small><strong>3</strong></div></article>
      </section>
      <section aria-label="Promo Toko Farid" className="customer-promo-grid">
        {promos.map((promo) => <article className={`customer-promo-card ${promo.className}`} key={promo.id}>
          <div className="customer-promo-copy"><span className="customer-promo-icon"><CustomerIcon name={promo.id === "gift" ? "gift" : promo.id === "delivery" ? "cart" : "box"} /></span><div><h2>{promo.title}</h2><p>{promo.subtitle}</p></div></div>
          <button onClick={() => setModal("promo")} type="button">Pakai promo</button>
        </article>)}
      </section>
      <p className="customer-data-note"><CustomerIcon name="info" />Data akun dan pesanan belum tersedia. Nama di navigasi hanya contoh dari gambar referensi.</p>
      {modal && <CustomerModal title={modal === "applied" ? "Promo dipilih" : "Promo Bulan Kembar 10.10"} onClose={() => setModal(null)}>
        {modal === "applied" ? <div className="customer-modal-success"><span><CustomerIcon name="check" /></span><h3>Promo dipilih</h3><p>Promo tersimpan sementara di tampilan ini. Belum ada transaksi yang dibuat.</p></div> : <div className="customer-promo-detail"><div className="customer-coupon"><strong>10.10</strong><span>DISKON SPESIAL</span></div><p>Gunakan kode promo untuk penawaran spesial di Toko Farid.</p><code>TOKOFARID10.10</code><button className="customer-primary-button" onClick={() => setModal("applied")} type="button"><CustomerIcon name="check" />Pakai Promo</button></div>}
      </CustomerModal>}
    </CustomerShell>
  );
}

function CustomerModal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="customer-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-label={title} aria-modal="true" className="customer-modal" role="dialog">
        <button aria-label="Tutup dialog" className="customer-modal-close" onClick={onClose} type="button"><CustomerIcon name="x" /></button>
        {children}
      </section>
    </div>
  );
}

function OrdersPage() {
  return (
    <CustomerShell page="orders">
      <section className="customer-content-card customer-orders-card">
        <div className="customer-section-heading"><div><h2>Daftar Pesanan</h2><p>Riwayat pesanan Anda akan ditampilkan di sini.</p></div><span className="customer-count-badge">0 pesanan</span></div>
        <div className="customer-table-wrap">
          <table className="customer-orders-table">
            <thead><tr><th>ID Pesanan</th><th>Tanggal</th><th>Jumlah Barang</th><th>Total</th><th>Status</th><th>Detail</th></tr></thead>
            <tbody><tr><td className="customer-empty-row" colSpan={6}><span><CustomerIcon name="box" /></span><strong>Belum ada data pesanan</strong><small>Layanan pesanan pelanggan belum terhubung, jadi belum ada riwayat yang dapat ditampilkan.</small><Link className="customer-outline-button" href="/pelanggan/buat-pesanan">Lihat katalog referensi</Link></td></tr></tbody>
          </table>
        </div>
      </section>
    </CustomerShell>
  );
}

function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("Perubahan belum disimpan karena layanan profil pelanggan belum tersedia.");
  }

  return (
    <CustomerShell onAction={() => setEditing(true)} page="profile">
      <div className="customer-profile-grid">
        <section className="customer-profile-summary">
          <div className="customer-profile-cover" />
          <span className="customer-avatar-large">NU</span>
          <div className="customer-profile-identity"><h2>Nafisa Uldiyah</h2><p>@nafisa.uldyah</p><span>Pelanggan</span></div>
          <div className="customer-profile-stats"><div><CustomerIcon name="box" /><strong>—</strong><small>Pesanan</small></div><div><CustomerIcon name="check" /><strong>—</strong><small>Selesai</small></div><div><CustomerIcon name="star" /><strong>—</strong><small>Poin</small></div></div>
          <button className="customer-primary-button" onClick={() => { setEditing(true); setNotice(""); }} type="button">Ubah profil</button>
          <Link className="customer-profile-logout" href="/pelanggan/login"><CustomerIcon name="logout" />Logout</Link>
        </section>
        <section className="customer-content-card customer-profile-data">
          <div className="customer-section-heading"><div><h2>Data akun</h2><p>Data akun yang sedang digunakan.</p></div>{!editing && <button className="customer-profile-edit" onClick={() => setEditing(true)} type="button"><CustomerIcon name="edit" />Ubah profil</button>}</div>
          {editing ? <form className="customer-profile-form" id="edit-profile" onSubmit={save}>
            <label className="customer-field"><span>Nama lengkap</span><input defaultValue="Nafisa Uldiyah" required /></label>
            <label className="customer-field"><span>Username</span><input defaultValue="nafisa.uldyah" required /></label>
            <label className="customer-field"><span>No. telepon</span><input defaultValue="081234567804" required /></label>
            <label className="customer-field"><span>Email</span><input defaultValue="nafisa.uldyah@gmail.com" required type="email" /></label>
            <label className="customer-field"><span>Kode pos</span><input defaultValue="25173" required /></label>
            <label className="customer-field"><span>Alamat</span><input defaultValue="Padang, Sumatera Barat" required /></label>
            {notice && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{notice}</p>}
            <div className="customer-register-actions"><button className="customer-primary-button" type="submit"><CustomerIcon name="check" />Simpan perubahan</button><button className="customer-cancel-button" onClick={() => { setEditing(false); setNotice(""); }} type="button">Batal</button></div>
          </form> : <div className="customer-profile-fields">
            <ProfileField icon="lock" label="ID akun" value="A0004" />
            <ProfileField icon="shield" label="Role" value="Pelanggan" />
            <ProfileField icon="user" label="Nama lengkap" value="Nafisa Uldiyah" />
            <ProfileField icon="user" label="Username" value="nafisa.uldyah" />
            <ProfileField icon="phone" label="No. telepon" value="081234567804" />
            <ProfileField icon="mail" label="Email" value="nafisa.uldyah@gmail.com" />
            <ProfileField icon="map" label="Kode pos" value="25173" />
            <ProfileField icon="map" label="Alamat" value="Padang, Sumatera Barat" />
          </div>}
          <p className="customer-data-note"><CustomerIcon name="info" />Contoh data profil dari desain referensi; belum terhubung ke akun pelanggan.</p>
        </section>
      </div>
    </CustomerShell>
  );
}

function ProfileField({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <article className="customer-profile-field"><span className="customer-profile-field-icon"><CustomerIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function OrderPage() {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showNotice, setShowNotice] = useState(false);
  const cartItems = products.filter((product) => cart[product.id]);
  const itemCount = cartItems.reduce((sum, product) => sum + cart[product.id], 0);
  const total = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0);
  const currency = (value: number) => `Rp ${value.toLocaleString("id-ID")}`;

  function setQuantity(id: string, value: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(1, value) }));
  }

  function addToCart(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + (quantities[id] ?? 1) }));
  }

  return (
    <CustomerShell page="order">
      <p className="customer-data-note"><CustomerIcon name="info" />Katalog berikut meniru gambar referensi; harga dan stok belum tersambung ke data inventaris.</p>
      <div className="customer-order-layout">
        <section aria-label="Daftar produk" className="customer-product-grid">
          {products.map((product) => <article className="customer-product-card" key={product.id}>
            {product.low && <span className="customer-stock-badge">Menipis</span>}
            <div className="customer-product-image">{product.image ? <Image alt={product.name} height={160} src={`/customer-products/${product.image}`} width={190} /> : <span aria-hidden="true" className="customer-product-placeholder"><CustomerIcon name="box" /></span>}</div>
            <h2>{product.name}</h2><p>{product.category}</p><strong className="customer-product-price">{currency(product.price)}</strong>
            <div className="customer-product-actions"><div className="customer-quantity-control"><button aria-label={`Kurangi ${product.name}`} onClick={() => setQuantity(product.id, (quantities[product.id] ?? 1) - 1)} type="button"><CustomerIcon name="minus" /></button><span>{quantities[product.id] ?? 1}</span><button aria-label={`Tambah ${product.name}`} onClick={() => setQuantity(product.id, (quantities[product.id] ?? 1) + 1)} type="button"><CustomerIcon name="plus" /></button></div><button className="customer-add-button" onClick={() => addToCart(product.id)} type="button"><CustomerIcon name="plus" />Tambah</button></div>
          </article>)}
        </section>
        <aside aria-label="Ringkasan pesanan" className="customer-cart-card">
          <div className="customer-cart-heading"><h2>Pesanan baru</h2><span>{itemCount} barang</span></div>
          {cartItems.length > 0 && <ul className="customer-cart-items">{cartItems.map((product) => <li key={product.id}><span>{product.name}<small>{cart[product.id]} × {currency(product.price)}</small></span><strong>{currency(cart[product.id] * product.price)}</strong><button aria-label={`Hapus ${product.name}`} onClick={() => setCart((current) => { const next = { ...current }; delete next[product.id]; return next; })} type="button"><CustomerIcon name="trash" /></button></li>)}</ul>}
          <div className="customer-cart-total"><span>Total harga</span><strong>{currency(total)}</strong></div>
          <div className="customer-cashier-note"><CustomerIcon name="info" /><p><strong>Pembayaran dilakukan di kasir.</strong><span>Stok dicek otomatis saat pesanan dikonfirmasi.</span></p></div>
          <div className="customer-cart-assurance"><span><CustomerIcon name="shield" />Transaksi aman</span><span><CustomerIcon name="clock" />Siap diproses kasir</span></div>
          <button className="customer-primary-button" disabled={cartItems.length === 0} onClick={() => setShowNotice(true)} type="button"><CustomerIcon name="check" />Konfirmasi Pembelian</button>
          <button className="customer-clear-cart" disabled={cartItems.length === 0} onClick={() => setCart({})} type="button"><CustomerIcon name="trash" />Kosongkan pesanan</button>
        </aside>
      </div>
      {showNotice && <CustomerModal title="Pesanan belum diproses" onClose={() => setShowNotice(false)}><div className="customer-modal-success customer-modal-warning"><span><CustomerIcon name="info" /></span><h3>Pesanan belum diproses</h3><p>Keranjang ini hanya tersimpan sementara di browser. Layanan pemesanan belum terhubung, sehingga pesanan tidak dikirim atau disimpan.</p><button className="customer-primary-button" onClick={() => setShowNotice(false)} type="button">Mengerti</button></div></CustomerModal>}
    </CustomerShell>
  );
}

export default function CustomerPortal({ page }: { page: CustomerPage }) {
  if (page === "dashboard") return <DashboardPage />;
  if (page === "order") return <OrderPage />;
  if (page === "orders") return <OrdersPage />;
  return <ProfilePage />;
}

export function CustomerLogin() {
  return <LoginPage />;
}

export function CustomerRegistration() {
  return <RegisterPage />;
}
