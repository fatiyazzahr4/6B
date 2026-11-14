"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";

type CustomerProfile = {
  id: string;
  accountId: string;
  name: string;
  username: string;
  email: string;
  phone: string;
  postalCode: string;
  address: string;
  role: "Pelanggan";
};

async function postPelanggan<T>(body: Record<string, unknown>) {
  const response = await fetch("/api/pelanggan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await response.json()) as { error?: string } & T;
  if (!response.ok) throw new Error(data.error || "Permintaan belum dapat diproses.");
  return data;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "P";
}

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

const productImages: Record<string, string> = {
  BR0001: "beras.jpg",
  BR0002: "minyak.jpg",
  BR0003: "gula.jpg",
  BR0004: "telur.jpg",
  BR0005: "tepung.jpg",
  BR0007: "mie-instan.jpg",
  BR0008: "susu-kental.jpg",
  BR0009: "teh.jpg",
  BR0010: "garam.jpg",
};

type CustomerProduct = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  stock: number;
  low: boolean;
};

type CustomerOrder = {
  id: string;
  date: string;
  status: string;
  total: number;
  itemCount: number;
  items: { productId: string; name: string; quantity: number; unitPrice: number; subtotal: number }[];
  transactionId: string | null;
  transactionStatus: string | null;
};

function formatRupiah(value: number) {
  return `Rp ${value.toLocaleString("id-ID")}`;
}

function formatOrderDate(value: string) {
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

function usePelangganData<T>(url: string, initialData: T) {
  const pathname = usePathname();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const result = (await response.json()) as { error?: string } & T;
        if (!response.ok) throw new Error(result.error || "Data belum dapat dimuat.");
        if (active) {
          setData(result);
          setError("");
        }
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Data belum dapat dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [url, revision, pathname]);

  return { data, loading, error, reload: () => setRevision((value) => value + 1) };
}

const promos = [
  { id: "gift", title: "Gratis gift spesial", subtitle: "Untuk belanja jumlah tertentu", className: "promo-yellow" },
  { id: "delivery", title: "Gratis ongkir", subtitle: "Pengantaran area Padang", className: "promo-orange" },
  { id: "store", title: "Ambil di toko", subtitle: "Tanpa antre di kasir", className: "promo-cyan" },
] as const;

const pageDetails: Record<CustomerPage, { title: string; description: string; action?: string }> = {
  dashboard: { title: "Halo!", description: "Pilih barang, buat pesanan dari rumah, lalu bayar di kasir Toko Farid.", action: "Buat Pesanan" },
  order: { title: "Buat Pesanan", description: "Pilih barang yang ingin dipesan. Pembayaran dilakukan di kasir." },
  orders: { title: "Pesanan Saya", description: "Lihat informasi dan status pesanan Anda." },
  profile: { title: "Profil Saya", description: "Data akun yang sedang digunakan." },
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
  const router = useRouter();
  const timerRef = useRef<number | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  function clearRedirectTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function finishLogin() {
    clearRedirectTimer();
    setSuccess(false);
    setBusy(false);
    router.replace("/pelanggan");
    router.refresh();
  }

  useEffect(() => () => clearRedirectTimer(), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await postPelanggan({ action: "login", identifier: username, password, remember });
      setBusy(false);
      setSuccess(true);
      clearRedirectTimer();
      timerRef.current = window.setTimeout(() => {
        finishLogin();
      }, 1200);
    } catch (cause) {
      setBusy(false);
      setNotice(cause instanceof Error ? cause.message : "Login belum dapat diproses.");
    }
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
        <button className="customer-primary-button" disabled={busy} type="submit">{busy ? "Memproses..." : "Masuk"} <CustomerIcon name="arrow-left" className="customer-arrow-right" /></button>
        {notice && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{notice}</p>}
        <div className="customer-auth-divider" />
        <div className="customer-auth-switch"><span>Belum punya akun?</span><Link className="customer-outline-button" href="/pelanggan/registrasi"><CustomerIcon name="plus" />Registrasi sekarang</Link></div>
      </form>
      {success && (
        <CustomerModal title="Login Berhasil!" onClose={finishLogin}>
          <div className="customer-modal-success">
            <span><CustomerIcon name="check" /></span>
            <h3>Login Berhasil !</h3>
          </div>
        </CustomerModal>
      )}
    </AuthCard>
  );
}

function RegisterPage() {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);
  const [visible, setVisible] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);

  function clearRedirectTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  useEffect(() => () => clearRedirectTimer(), []);

  function finishRegistration() {
    clearRedirectTimer();
    setSuccess(false);
    setBusy(false);
    router.replace("/pelanggan");
    router.refresh();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    if (formData.get("password") !== formData.get("confirmPassword")) {
      setNotice("Konfirmasi password belum sama.");
      return;
    }
    const text = (key: string) => String(formData.get(key) ?? "");
    setBusy(true);
    setNotice("");
    try {
      await postPelanggan({
        action: "register",
        name: text("name"),
        username: text("username"),
        email: text("email"),
        phone: text("phone"),
        postalCode: text("postalCode"),
        address: text("address"),
        password: text("password"),
      });
      setBusy(false);
      setSuccess(true);
      clearRedirectTimer();
      timerRef.current = window.setTimeout(() => {
        finishRegistration();
      }, 1400);
    } catch (cause) {
      setBusy(false);
      setNotice(cause instanceof Error ? cause.message : "Registrasi belum dapat diproses.");
    }
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
        <p className="customer-privacy-note"><CustomerIcon name="shield" />Data Anda disimpan aman dan hanya dipakai untuk pesanan di Toko Farid.</p>
        {notice && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{notice}</p>}
        <div className="customer-register-actions"><button className="customer-primary-button" disabled={busy} type="submit"><CustomerIcon name="check" />{busy ? "Memproses..." : "Daftar"}</button><Link className="customer-cancel-button" href="/pelanggan/login">Batal</Link></div>
        <div className="customer-auth-switch"><span>Sudah punya akun?</span><Link className="customer-link-pink" href="/pelanggan/login">Login di sini</Link></div>
      </form>
      {success && <CustomerModal title="Registrasi berhasil" onClose={finishRegistration}><div className="customer-modal-success"><span><CustomerIcon name="check" /></span><h3>Registrasi berhasil</h3><p>Akun Anda sudah dibuat. Anda akan diarahkan ke dashboard.</p><button className="customer-primary-button" onClick={finishRegistration} type="button">Masuk ke Dashboard</button></div></CustomerModal>}
    </AuthCard>
  );
}

function useCustomerLogout() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await postPelanggan({ action: "logout" });
      setLoggingOut(false);
      router.replace("/pelanggan/login");
      router.refresh();
    } catch {
      setLoggingOut(false);
      window.alert("Logout belum dapat diproses. Coba lagi.");
    }
  }

  return { logout, loggingOut };
}

function CustomerSidebar({ active, profile }: { active: CustomerPage; profile: CustomerProfile }) {
  const { logout, loggingOut } = useCustomerLogout();
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
      <div className="customer-sidebar-user"><span className="customer-avatar-small">{initials(profile.name)}</span><span><strong>{profile.name}</strong><small>Pelanggan</small></span></div>
      <span className="customer-sidebar-label">MENU UTAMA</span>
      <nav aria-label="Navigasi pelanggan" className="customer-sidebar-nav">
        {links.map((link) => <Link aria-current={active === link.key ? "page" : undefined} className={active === link.key ? "is-active" : ""} href={link.href} key={link.key}><CustomerIcon name={link.icon} /><span>{link.label}</span></Link>)}
      </nav>
      <button className="customer-logout" disabled={loggingOut} onClick={logout} type="button"><CustomerIcon name="logout" />{loggingOut ? "Keluar..." : "Logout"}</button>
    </aside>
  );
}

function CustomerShell({
  page,
  profile,
  children,
}: {
  page: CustomerPage;
  profile: CustomerProfile;
  children: ReactNode;
}) {
  const details = pageDetails[page];
  const title = page === "dashboard" ? `Halo, ${profile.name.split(/\s+/)[0]}!` : details.title;
  return (
    <div className={`customer-portal customer-page-${page}`}>
      <CustomerSidebar active={page} profile={profile} />
      <main className="customer-main">
        <header className="customer-page-banner">
          <div><h1>{title}</h1><p>{details.description}</p></div>
          {details.action && <Link className="customer-banner-action" href="/pelanggan/buat-pesanan"><CustomerIcon name="cart" />{details.action}</Link>}
        </header>
        {children}
      </main>
    </div>
  );
}

function DashboardPage({ profile }: { profile: CustomerProfile }) {
  const [modal, setModal] = useState<"promo" | "applied" | null>(null);
  const { data } = usePelangganData<{ orders: CustomerOrder[] }>("/api/pelanggan?view=orders", { orders: [] });
  const finished = data.orders.filter((order) => order.status.toLowerCase() === "selesai");
  const spent = finished.reduce((sum, order) => sum + order.total, 0);

  return (
    <CustomerShell page="dashboard" profile={profile}>
      <section aria-label="Ringkasan akun" className="customer-stat-grid">
        <article className="customer-stat-card"><span className="stat-icon stat-pink"><CustomerIcon name="box" /></span><div><small>Pesanan saya</small><strong>{data.orders.length}</strong></div></article>
        <article className="customer-stat-card"><span className="stat-icon stat-green"><CustomerIcon name="check" /></span><div><small>Selesai</small><strong>{finished.length}</strong></div></article>
        <article className="customer-stat-card"><span className="stat-icon stat-orange"><CustomerIcon name="wallet" /></span><div><small>Total belanja</small><strong>{formatRupiah(spent)}</strong></div></article>
        <article className="customer-stat-card"><span className="stat-icon stat-purple"><CustomerIcon name="gift" /></span><div><small>Promo aktif</small><strong>3</strong></div></article>
      </section>
      <section aria-label="Promo Toko Farid" className="customer-promo-grid">
        {promos.map((promo) => <article className={`customer-promo-card ${promo.className}`} key={promo.id}>
          <div className="customer-promo-copy"><span className="customer-promo-icon"><CustomerIcon name={promo.id === "gift" ? "gift" : promo.id === "delivery" ? "cart" : "box"} /></span><div><h2>{promo.title}</h2><p>{promo.subtitle}</p></div></div>
          <button onClick={() => setModal("promo")} type="button">Pakai promo</button>
        </article>)}
      </section>
      <p className="customer-data-note"><CustomerIcon name="info" />Promo di atas hanya contoh tampilan; belum terhubung ke transaksi.</p>
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
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="customer-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-label={title} aria-modal="true" className="customer-modal" role="dialog">
        <button aria-label="Tutup dialog" className="customer-modal-close" onClick={onClose} type="button"><CustomerIcon name="x" /></button>
        {children}
      </section>
    </div>
  );
}

function OrdersPage({ profile }: { profile: CustomerProfile }) {
  const { data, loading, error, reload } = usePelangganData<{ orders: CustomerOrder[] }>("/api/pelanggan?view=orders", { orders: [] });
  const orders = data.orders;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editItems, setEditItems] = useState<{ productId: string; name: string; unitPrice: number; quantity: number }[] | null>(null);
  const [editingId, setEditingId] = useState("");
  const [deleting, setDeleting] = useState<CustomerOrder | null>(null);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const selected = orders.find((order) => order.id === selectedId) ?? orders[0] ?? null;
  const canChange = (order: CustomerOrder) => !order.transactionId && order.status.toLowerCase() === "menunggu";

  function startEdit(order: CustomerOrder) {
    setActionError("");
    setEditingId(order.id);
    setEditItems(order.items.map((item) => ({ productId: item.productId, name: item.name, unitPrice: item.unitPrice, quantity: item.quantity })));
  }

  async function saveEdit() {
    if (!editItems) return;
    setBusy(true);
    setActionError("");
    try {
      await postPelanggan({ action: "order:update", orderId: editingId, items: editItems.map((item) => ({ productId: item.productId, quantity: item.quantity })) });
      setEditItems(null);
      setFeedback(`Pesanan ${editingId} berhasil diperbarui.`);
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Perubahan belum dapat disimpan.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    const deletedId = deleting.id;
    setBusy(true);
    setActionError("");
    try {
      await postPelanggan({ action: "order:delete", orderId: deletedId });
      setDeleting(null);
      setSelectedId(null);
      setFeedback(`Pesanan ${deletedId} berhasil dihapus.`);
      reload();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Pesanan belum dapat dihapus.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <CustomerShell page="orders" profile={profile}>
      <section className="customer-content-card customer-orders-card">
        <div className="customer-section-heading"><div><h2>Daftar pembelian</h2><p>Daftar pembelian dan status.</p></div><span className="customer-count-badge">{orders.length} pesanan</span></div>
        {(error || actionError) && !editItems && !deleting && <p className="customer-form-notice"><CustomerIcon name="info" />{actionError || error}</p>}
        <div className="customer-table-wrap">
          <table className="customer-orders-table">
            <thead><tr><th>ID</th><th>Tanggal</th><th>Item</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {orders.length === 0 ? <tr><td className="customer-empty-row" colSpan={6}><span><CustomerIcon name="box" /></span><strong>{loading ? "Memuat pesanan..." : "Belum ada data pesanan"}</strong>{!loading && <small>Pesanan yang Anda buat akan muncul di sini.</small>}<Link className="customer-outline-button" href="/pelanggan/buat-pesanan">Buat pesanan</Link></td></tr> : orders.map((order) => <tr aria-selected={selected?.id === order.id} key={order.id}>
                <td className="customer-order-id">{order.id}</td>
                <td>{formatOrderDate(order.date)}</td>
                <td>{order.itemCount} barang</td>
                <td>{formatRupiah(order.total)}</td>
                <td><span className="customer-order-status" data-status={order.status.toLowerCase()}>{order.status}</span></td>
                <td><div className="customer-order-actions">
                  <button className="is-detail" onClick={() => setSelectedId(order.id)} type="button"><CustomerIcon name="eye" />Detail</button>
                  {canChange(order) && <button className="is-edit" onClick={() => startEdit(order)} type="button"><CustomerIcon name="edit" />Ubah</button>}
                  {canChange(order) && <button className="is-danger" onClick={() => { setActionError(""); setDeleting(order); }} type="button"><CustomerIcon name="trash" />Hapus</button>}
                </div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
      </section>
      {selected && <section className="customer-content-card customer-order-detail">
        <div className="customer-section-heading"><h2>Detail {selected.id} - {formatOrderDate(selected.date)}</h2>{selected.transactionId && <span className="customer-order-status" data-status="lunas">Transaksi {selected.transactionId}{selected.transactionStatus ? ` (${selected.transactionStatus})` : ""}</span>}</div>
        <ul className="customer-order-detail-items">
          {selected.items.map((item) => <li key={item.productId}><strong>{item.name}</strong><small>{formatRupiah(item.unitPrice)} × {item.quantity}</small><span>{formatRupiah(item.subtotal)}</span></li>)}
        </ul>
        <p className="customer-order-detail-total">{formatRupiah(selected.total)}</p>
      </section>}
      {editItems && <CustomerModal title="Ubah pesanan" onClose={() => setEditItems(null)}>
        <div className="customer-order-edit">
          <h3>Ubah pesanan {editingId}</h3>
          <ul>
            {editItems.map((item) => <li key={item.productId}>
              <span>{item.name}<small>{formatRupiah(item.unitPrice)}</small></span>
              <div className="customer-quantity-control"><button aria-label={`Kurangi ${item.name}`} onClick={() => setEditItems((current) => current && current.map((row) => row.productId === item.productId ? { ...row, quantity: Math.max(1, row.quantity - 1) } : row))} type="button"><CustomerIcon name="minus" /></button><span>{item.quantity}</span><button aria-label={`Tambah ${item.name}`} onClick={() => setEditItems((current) => current && current.map((row) => row.productId === item.productId ? { ...row, quantity: row.quantity + 1 } : row))} type="button"><CustomerIcon name="plus" /></button></div>
              <button aria-label={`Hapus ${item.name}`} disabled={editItems.length === 1} onClick={() => setEditItems((current) => current && current.filter((row) => row.productId !== item.productId))} type="button"><CustomerIcon name="trash" /></button>
            </li>)}
          </ul>
          <p className="customer-order-edit-total">Total {formatRupiah(editItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0))}</p>
          {actionError && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{actionError}</p>}
          <button className="customer-primary-button" disabled={busy} onClick={saveEdit} type="button"><CustomerIcon name="check" />{busy ? "Menyimpan..." : "Simpan perubahan"}</button>
        </div>
      </CustomerModal>}
      {deleting && <CustomerModal title="Hapus pesanan" onClose={() => setDeleting(null)}>
        <div className="customer-modal-success customer-modal-warning"><span><CustomerIcon name="trash" /></span><h3>Hapus pesanan {deleting.id}?</h3><p>Pesanan ini akan dihapus dan tidak bisa dikembalikan.</p>
          {actionError && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{actionError}</p>}
          <button className="customer-primary-button" disabled={busy} onClick={confirmDelete} type="button">{busy ? "Menghapus..." : "Ya, hapus"}</button>
          <button className="customer-cancel-button" disabled={busy} onClick={() => setDeleting(null)} type="button">Batal</button></div>
      </CustomerModal>}
      {feedback && <CustomerModal title="Notifikasi pesanan" onClose={() => setFeedback("")}>
        <div className="customer-modal-success"><span><CustomerIcon name="check" /></span><h3>Berhasil</h3><p>{feedback}</p>
          <button className="customer-primary-button" onClick={() => setFeedback("")} type="button">Mengerti</button></div>
      </CustomerModal>}
    </CustomerShell>
  );
}

function ProfilePage({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const { logout, loggingOut } = useCustomerLogout();
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { data: orderData } = usePelangganData<{ orders: CustomerOrder[] }>("/api/pelanggan?view=orders", { orders: [] });
  const finishedCount = orderData.orders.filter((order) => order.status.toLowerCase() === "selesai").length;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const text = (key: string) => String(formData.get(key) ?? "");
    setSaving(true);
    setNotice("");
    try {
      await postPelanggan({
        action: "profile",
        name: text("name"),
        username: text("username"),
        phone: text("phone"),
        email: text("email"),
        postalCode: text("postalCode"),
        address: text("address"),
        password: text("password"),
      });
      setEditing(false);
      setSaved(true);
      router.refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Perubahan belum dapat disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <CustomerShell page="profile" profile={profile}>
      <div className="customer-profile-grid">
        <section className="customer-profile-summary">
          <div className="customer-profile-cover" />
          <span className="customer-avatar-large">{initials(profile.name)}</span>
          <div className="customer-profile-identity"><h2>{profile.name}</h2><p>@{profile.username}</p><span>Pelanggan</span></div>
          <div className="customer-profile-stats"><div><CustomerIcon name="box" /><strong>{orderData.orders.length}</strong><small>Pesanan</small></div><div><CustomerIcon name="check" /><strong>{finishedCount}</strong><small>Selesai</small></div><div><CustomerIcon name="star" /><strong>—</strong><small>Poin</small></div></div>
          <button className="customer-primary-button" onClick={() => { setEditing(true); setNotice(""); }} type="button"><CustomerIcon name="edit" />Ubah profil</button>
          <button className="customer-profile-logout" disabled={loggingOut} onClick={logout} type="button"><CustomerIcon name="logout" />{loggingOut ? "Keluar..." : "Logout"}</button>
        </section>
        <section className="customer-content-card customer-profile-data">
          <div className="customer-section-heading"><div><h2>Data akun</h2><p>Data akun yang sedang digunakan.</p></div></div>
          {editing ? <form className="customer-profile-form" id="edit-profile" onSubmit={save}>
            <label className="customer-field"><span>Nama lengkap</span><input defaultValue={profile.name} maxLength={100} name="name" required /></label>
            <label className="customer-field"><span>Username</span><input defaultValue={profile.username} maxLength={50} name="username" required /></label>
            <label className="customer-field"><span>No. telepon</span><input defaultValue={profile.phone} maxLength={20} name="phone" required /></label>
            <label className="customer-field"><span>Email</span><input defaultValue={profile.email} maxLength={100} name="email" required type="email" /></label>
            <label className="customer-field"><span>Kode pos</span><input defaultValue={profile.postalCode} name="postalCode" pattern="[0-9]{5}" required /></label>
            <label className="customer-field"><span>Alamat</span><input defaultValue={profile.address} maxLength={150} name="address" required /></label>
            <label className="customer-field"><span>Password baru (opsional)</span><input autoComplete="new-password" minLength={6} name="password" placeholder="Kosongkan jika tidak diubah" type="password" /></label>
            {notice && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{notice}</p>}
            <div className="customer-register-actions"><button className="customer-primary-button" disabled={saving} type="submit"><CustomerIcon name="check" />{saving ? "Menyimpan..." : "Simpan perubahan"}</button><button className="customer-cancel-button" onClick={() => { setEditing(false); setNotice(""); }} type="button">Batal</button></div>
          </form> : <div className="customer-profile-fields">
            <ProfileField icon="lock" label="ID akun" value={profile.accountId} />
            <ProfileField icon="shield" label="Role" value="Pelanggan" />
            <ProfileField icon="user" label="Nama lengkap" value={profile.name} />
            <ProfileField icon="user" label="Username" value={profile.username} />
            <ProfileField icon="phone" label="No. telepon" value={profile.phone} />
            <ProfileField icon="mail" label="Email" value={profile.email} />
            <ProfileField icon="map" label="Kode pos" value={profile.postalCode} />
            <ProfileField icon="map" label="Alamat" value={profile.address} />
          </div>}
        </section>
      </div>
      {saved && <CustomerModal title="Profil berhasil diubah" onClose={() => setSaved(false)}><div className="customer-modal-success"><span><CustomerIcon name="check" /></span><h3>Profil berhasil diubah</h3><p>Data akun Anda sudah diperbarui.</p><button className="customer-primary-button" onClick={() => setSaved(false)} type="button">Mengerti</button></div></CustomerModal>}
    </CustomerShell>
  );
}

function ProfileField({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <article className="customer-profile-field"><span className="customer-profile-field-icon"><CustomerIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong></div></article>;
}

function OrderPage({ profile }: { profile: CustomerProfile }) {
  const router = useRouter();
  const timerRef = useRef<number | null>(null);
  const { data, loading, error, reload } = usePelangganData<{ products: CustomerProduct[] }>("/api/pelanggan?view=catalog", { products: [] });
  const products = data.products;
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cart, setCart] = useState<Record<string, number>>({});
  const [result, setResult] = useState<{ id: string; total: number } | null>(null);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cartItems = products.filter((product) => cart[product.id]);
  const itemCount = cartItems.reduce((sum, product) => sum + cart[product.id], 0);
  const total = cartItems.reduce((sum, product) => sum + product.price * cart[product.id], 0);

  function clearRedirectTimer() {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function closeResultModal() {
    clearRedirectTimer();
    setResult(null);
  }

  function goToOrders() {
    closeResultModal();
    router.push("/pelanggan/pesanan-saya");
    router.refresh();
  }

  useEffect(() => () => clearRedirectTimer(), []);

  function setQuantity(id: string, value: number) {
    setQuantities((current) => ({ ...current, [id]: Math.max(1, value) }));
  }

  function addToCart(product: CustomerProduct) {
    setCart((current) => {
      const wanted = (current[product.id] ?? 0) + (quantities[product.id] ?? 1);
      return { ...current, [product.id]: Math.min(wanted, Math.max(product.stock, 1)) };
    });
  }

  async function confirmOrder() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await postPelanggan<{ order: { id: string; total: number } }>({
        action: "order:create",
        items: cartItems.map((product) => ({ productId: product.id, quantity: cart[product.id] })),
      });
      setResult(response.order);
      setCart({});
      reload();
      clearRedirectTimer();
      timerRef.current = window.setTimeout(() => {
        setResult(null);
        timerRef.current = null;
        router.push("/pelanggan/pesanan-saya");
        router.refresh();
      }, 1800);
    } catch (cause) {
      setSubmitError(cause instanceof Error ? cause.message : "Pesanan belum dapat dikirim.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CustomerShell page="order" profile={profile}>
      {error && <p className="customer-data-note"><CustomerIcon name="info" />{error}</p>}
      {loading && <p className="customer-data-note"><CustomerIcon name="clock" />Memuat katalog...</p>}
      <div className="customer-order-layout">
        <section aria-label="Daftar produk" className="customer-product-grid">
          {products.map((product) => {
            const image = productImages[product.id];
            const soldOut = product.stock <= 0;
            return <article className="customer-product-card" key={product.id}>
              {product.low && <span className="customer-stock-badge">{soldOut ? "Habis" : "Menipis"}</span>}
              <div className="customer-product-image">{image ? <Image alt={product.name} height={160} src={`/customer-products/${image}`} width={190} /> : <span aria-hidden="true" className="customer-product-placeholder"><CustomerIcon name="box" /></span>}</div>
              <h2>{product.name}</h2><p>{product.category} · per {product.unit}</p><strong className="customer-product-price">{formatRupiah(product.price)}</strong>
              <div className="customer-product-actions"><div className="customer-quantity-control"><button aria-label={`Kurangi ${product.name}`} onClick={() => setQuantity(product.id, (quantities[product.id] ?? 1) - 1)} type="button"><CustomerIcon name="minus" /></button><span>{quantities[product.id] ?? 1}</span><button aria-label={`Tambah ${product.name}`} onClick={() => setQuantity(product.id, (quantities[product.id] ?? 1) + 1)} type="button"><CustomerIcon name="plus" /></button></div><button className="customer-add-button" disabled={soldOut} onClick={() => addToCart(product)} type="button"><CustomerIcon name="plus" />Tambah</button></div>
            </article>;
          })}
        </section>
        <aside aria-label="Ringkasan pesanan" className="customer-cart-card">
          <div className="customer-cart-heading"><h2>Pesanan baru</h2><span>{itemCount} barang</span></div>
          {cartItems.length > 0 && <ul className="customer-cart-items">{cartItems.map((product) => <li key={product.id}><span>{product.name}<small>{cart[product.id]} × {formatRupiah(product.price)}</small></span><strong>{formatRupiah(cart[product.id] * product.price)}</strong><button aria-label={`Hapus ${product.name}`} onClick={() => setCart((current) => { const next = { ...current }; delete next[product.id]; return next; })} type="button"><CustomerIcon name="trash" /></button></li>)}</ul>}
          <div className="customer-cart-total"><span>Total harga</span><strong>{formatRupiah(total)}</strong></div>
          <div className="customer-cashier-note"><CustomerIcon name="info" /><p><strong>Pembayaran dilakukan di kasir.</strong><span>Stok dicek otomatis saat pesanan dikonfirmasi.</span></p></div>
          <div className="customer-cart-assurance"><span><CustomerIcon name="shield" />Transaksi aman</span><span><CustomerIcon name="clock" />Siap diproses kasir</span></div>
          {submitError && <p aria-live="polite" className="customer-form-notice"><CustomerIcon name="info" />{submitError}</p>}
          <button className="customer-primary-button" disabled={cartItems.length === 0 || submitting} onClick={confirmOrder} type="button"><CustomerIcon name="check" />{submitting ? "Mengirim..." : "Konfirmasi Pembelian"}</button>
          <button className="customer-clear-cart" disabled={cartItems.length === 0 || submitting} onClick={() => setCart({})} type="button"><CustomerIcon name="trash" />Kosongkan pesanan</button>
        </aside>
      </div>
      {result && <CustomerModal title="Pesanan Telah Diproses" onClose={closeResultModal}><div className="customer-modal-success"><span><CustomerIcon name="check" /></span><h3>Pesanan Telah Diproses</h3><p>Nomor pesanan {result.id} dengan total {formatRupiah(result.total)}. Bayar di kasir Toko Farid untuk menyelesaikannya.</p><button className="customer-primary-button" onClick={goToOrders} type="button">Lihat Pesanan Saya</button></div></CustomerModal>}
    </CustomerShell>
  );
}

export default function CustomerPortal({ page, profile }: { page: CustomerPage; profile: CustomerProfile }) {
  const pathname = usePathname();
  if (page === "dashboard") return <DashboardPage key={pathname} profile={profile} />;
  if (page === "order") return <OrderPage key={pathname} profile={profile} />;
  if (page === "orders") return <OrdersPage key={pathname} profile={profile} />;
  return <ProfilePage key={pathname} profile={profile} />;
}

export function CustomerLogin() {
  const pathname = usePathname();
  return <LoginPage key={pathname} />;
}

export function CustomerRegistration() {
  const pathname = usePathname();
  return <RegisterPage key={pathname} />;
}
