"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import type { KasirProfile } from "@/lib/kasir-session";

type IconName =
  | "arrow-left"
  | "arrow-right"
  | "bars"
  | "box"
  | "check"
  | "close"
  | "edit"
  | "eye"
  | "eye-off"
  | "grid"
  | "info"
  | "lock"
  | "logout"
  | "mail"
  | "map"
  | "minus"
  | "phone"
  | "plus"
  | "printer"
  | "receipt"
  | "shield"
  | "shopping-cart"
  | "user"
  | "wallet"
  | "warning";

type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  minimum: number;
  stock: number;
};

type Customer = { id: string; name: string; username: string };
type OrderItem = {
  productId: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  stock?: number;
};
type KasirOrder = {
  id: string;
  date: string;
  customer: string;
  customerId: string;
  total: number;
  status: string;
  transactionId: string | null;
  canProcess: boolean;
  items: OrderItem[];
};
type KasirTransaction = {
  id: string;
  date: string;
  cashier: string;
  orderId: string;
  customer: string;
  method: string;
  received: number;
  total: number;
  status: string;
  paymentId: string | null;
  items: OrderItem[];
};
type DashboardPayload = {
  summary: {
    transactions: number;
    pendingOrders: number;
    unpaid: number;
    paidTotal: number;
    paidCount: number;
  };
  latest: KasirTransaction[];
  pendingOrders: KasirOrder[];
};
type ApiError = { error?: string };

const iconShapes: Record<IconName, ReactNode> = {
  "arrow-left": <path d="M19 12H5m7 7-7-7 7-7" />,
  "arrow-right": <path d="M5 12h14m-7-7 7 7-7 7" />,
  bars: <><path d="M4 20V4m0 16h17" /><path d="M8 16v-5m5 5V7m5 9V4" /></>,
  box: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  edit: <><path d="m15 5 4 4M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  "eye-off": <><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1 0 2-.2 2.8-.5" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
  minus: <path d="M5 12h14" />,
  phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />,
  plus: <path d="M12 5v14m-7-7h14" />,
  printer: <><path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /><path d="M18 12h.01" /></>,
  receipt: <><path d="M5 3h14v18l-3-2-4 2-4-2-3 2V3Z" /><path d="M8 8h8M8 12h8M8 16h4" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  "shopping-cart": <><circle cx="9" cy="20" r="1" /><circle cx="18" cy="20" r="1" /><path d="M2 3h2l2.7 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 8H5" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18m-5 5h2" /></>,
  warning: <><path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
};

function KasirIcon({ name, className }: { name: IconName; className?: string }) {
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
      {iconShapes[name]}
    </svg>
  );
}

const navItems: { href: string; label: string; icon: IconName }[] = [
  { href: "/kasir", label: "Dashboard", icon: "grid" },
  { href: "/kasir/transaksi-baru", label: "Transaksi Baru", icon: "plus" },
  { href: "/kasir/daftar-transaksi", label: "Daftar Transaksi", icon: "receipt" },
  { href: "/kasir/pesanan-pelanggan", label: "Pesanan Pelanggan", icon: "shopping-cart" },
  { href: "/kasir/profil-saya", label: "Profil Saya", icon: "user" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "KS";
}

function currency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatDate(value: string | Date | null | undefined, year = false) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" } : {}),
  }).format(date);
}

async function postKasir<T>(body: Record<string, unknown>) {
  const response = await fetch("/api/kasir", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json() as ApiError & T;
  if (!response.ok) throw new Error(data.error || "Permintaan belum dapat diproses.");
  return data;
}

function useKasirData<T>(url: string, initialData: T) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as ApiError & T;
        if (!response.ok) throw new Error(result.error || "Data belum dapat dimuat.");
        if (active) setData(result);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : "Data belum dapat dimuat.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [url, revision]);

  function refresh() {
      setLoading(true);
      setError("");
      setRevision((value) => value + 1);
  }

  return { data, setData, loading, error, refresh };
}

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return (
    <p aria-live="polite" className="kasir-error-notice">
      <KasirIcon name="info" />
      {message}
    </p>
  );
}

function PageHeading({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="kasir-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

function Modal({
  title,
  onClose,
  children,
  className = "",
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className="kasir-modal-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button
        aria-label="Tutup"
        className="kasir-modal-close"
        onClick={onClose}
        type="button"
      >
        <KasirIcon name="close" />
      </button>
      <section
        aria-labelledby="kasir-modal-title"
        aria-modal="true"
        className={`kasir-modal ${className}`}
        role="dialog"
      >
        <h2 id="kasir-modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const kind = normalized === "lunas" || normalized === "selesai"
    ? "paid"
    : normalized.includes("belum") || normalized.includes("proses")
      ? "pending"
      : "neutral";
  return <span className={`kasir-status kasir-status-${kind}`}>{status}</span>;
}

function KasirBrand({ compact = false }: { compact?: boolean }) {
  return (
    <Link aria-label="Toko Farid Portal Kasir" className="kasir-brand" href="/kasir">
      <Image
        alt=""
        className="kasir-brand-logo"
        height={42}
        priority
        src="/storefront/toko-farid-logo.png"
        width={42}
      />
      <span>
        <strong>Toko Farid</strong>
        <small>{compact ? "Portal Kasir/Operator" : "Belanja Mudah, Kebutuhan Lengkap"}</small>
      </span>
    </Link>
  );
}

export function KasirShell({
  profile: initialProfile,
  children,
}: {
  profile: KasirProfile;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await postKasir({ action: "logout" });
      router.replace("/kasir/login");
    } catch (error) {
      setLoggingOut(false);
      window.alert(error instanceof Error ? error.message : "Logout belum dapat diproses.");
    }
  }

  return (
    <div className="kasir-portal-shell">
      <aside className="kasir-sidebar">
        <KasirBrand compact />
        <div className="kasir-sidebar-profile">
          <span className="kasir-avatar-small">{initials(initialProfile.name)}</span>
          <span><strong>{initialProfile.name}</strong><small>Kasir/Operator</small></span>
        </div>
        <p className="kasir-menu-label">MENU UTAMA</p>
        <nav aria-label="Menu Kasir" className="kasir-nav">
          {navItems.map((item) => {
            const active = item.href === "/kasir"
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`kasir-nav-link${active ? " is-active" : ""}`}
                href={item.href}
                key={item.href}
              >
                <KasirIcon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button
          className="kasir-logout-button"
          disabled={loggingOut}
          onClick={logout}
          type="button"
        >
          <KasirIcon name="logout" />
          {loggingOut ? "Keluar..." : "Logout"}
        </button>
      </aside>
      <main className="kasir-main">
        <div className="kasir-mobile-topbar">
          <KasirBrand compact />
          <button
            className="kasir-mobile-logout"
            disabled={loggingOut}
            onClick={logout}
            type="button"
          >
            <KasirIcon name="logout" />Logout
          </button>
        </div>
        <nav aria-label="Menu Kasir mobile" className="kasir-mobile-nav">
          {navItems.map((item) => (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              className={pathname === item.href ? "is-active" : ""}
              href={item.href}
              key={item.href}
            >
              <KasirIcon name={item.icon} />{item.label}
            </Link>
          ))}
        </nav>
        {children}
      </main>
    </div>
  );
}

export function KasirLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [contactNote, setContactNote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await postKasir({
        action: "login",
        identifier,
        password,
        remember,
      });
      setSuccess(true);
      window.setTimeout(() => router.replace("/kasir"), 1100);
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Login belum dapat diproses.");
    }
  }

  return (
    <main className="kasir-login-page">
      <section className="kasir-login-story">
        <KasirBrand />
        <div className="kasir-login-intro">
          <h1>Portal Internal<br />Toko Farid</h1>
          <p>Masuk sebagai Kasir/Operator untuk mengelola toko.<br />Akun internal dibuat dan dikelola oleh Admin.</p>
        </div>
        <div className="kasir-login-features">
          <div><span><KasirIcon name="plus" /></span><p><strong>Catat transaksi penjualan</strong><small>Menu di Portal Kasir/Operator</small></p></div>
          <div><span><KasirIcon name="shopping-cart" /></span><p><strong>Proses pesanan pelanggan</strong><small>Menu di Portal Kasir/Operator</small></p></div>
          <div><span><KasirIcon name="check" /></span><p><strong>Verifikasi pembayaran non-tunai</strong><small>Menu di Portal Kasir/Operator</small></p></div>
          <div><span><KasirIcon name="printer" /></span><p><strong>Baca &amp; cetak struk</strong><small>Menu di Portal Kasir/Operator</small></p></div>
        </div>
        <Link className="kasir-back-home" href="/beranda">
          <KasirIcon name="arrow-left" />Kembali ke Beranda
        </Link>
      </section>
      <section className="kasir-login-form-side">
        <div className="kasir-login-card">
          <header className="kasir-login-card-header">
            <span><KasirIcon name="wallet" /></span>
            <div><h2>Login Kasir/Operator</h2><p>Portal Internal Toko Farid</p></div>
          </header>
          <form className="kasir-login-form" onSubmit={submit}>
            <label htmlFor="kasir-identifier">Username atau Email</label>
            <div className="kasir-login-input">
              <KasirIcon name="user" />
              <input
                autoComplete="username"
                id="kasir-identifier"
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Masukkan Username atau Email"
                required
                value={identifier}
              />
            </div>
            <label htmlFor="kasir-password">Password</label>
            <div className="kasir-login-input">
              <KasirIcon name="lock" />
              <input
                autoComplete="current-password"
                id="kasir-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan Password"
                required
                type={showPassword ? "text" : "password"}
                value={password}
              />
              <button
                aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setShowPassword((value) => !value)}
                type="button"
              >
                <KasirIcon name={showPassword ? "eye-off" : "eye"} />
              </button>
            </div>
            <div className="kasir-login-options">
              <label className="kasir-checkbox-label">
                <input
                  checked={remember}
                  onChange={(event) => setRemember(event.target.checked)}
                  type="checkbox"
                />
                <span>Ingat saya</span>
              </label>
              <button
                className="kasir-contact-link"
                onClick={() => setContactNote((value) => !value)}
                type="button"
              >
                Hubungi Admin
              </button>
            </div>
            <ErrorNotice message={error} />
            <button className="kasir-login-submit" disabled={busy} type="submit">
              {busy ? "Memeriksa..." : "Masuk"}
              <KasirIcon name="arrow-right" />
            </button>
            <div className="kasir-login-note">
              <KasirIcon name="info" />
              <p>
                <strong>Akun internal tidak bisa mendaftar sendiri.</strong>
                <span>{contactNote ? "Silakan hubungi Admin Toko Farid untuk bantuan akun." : "Minta Admin Toko Farid untuk membuatkan akun."}</span>
              </p>
            </div>
          </form>
        </div>
      </section>
      {success && (
        <Modal className="kasir-success-modal" onClose={() => router.replace("/kasir")} title="Login Berhasil!">
          <span className="kasir-success-check"><KasirIcon name="check" /></span>
          <h3>Login Berhasil !</h3>
          <p>Menyiapkan Portal Kasir...</p>
        </Modal>
      )}
    </main>
  );
}

function DataTable({
  headers,
  children,
  empty,
}: {
  headers: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="kasir-table-wrap">
      <table className="kasir-table">
        <thead><tr>{headers.map((header) => <th key={header}>{header}</th>)}</tr></thead>
        <tbody>
          {empty ? (
            <tr><td className="kasir-empty-cell" colSpan={headers.length}>Belum ada data untuk ditampilkan.</td></tr>
          ) : children}
        </tbody>
      </table>
    </div>
  );
}

function DashboardPage() {
  const { data, loading, error } = useKasirData<DashboardPayload>(
    "/api/kasir?view=dashboard",
    {
      summary: { transactions: 0, pendingOrders: 0, unpaid: 0, paidTotal: 0, paidCount: 0 },
      latest: [],
      pendingOrders: [],
    },
  );
  const summary = data.summary;
  return (
    <div className="kasir-page">
      <PageHeading
        action={<Link className="kasir-hero-action" href="/kasir/transaksi-baru"><KasirIcon name="plus" />Transaksi Baru</Link>}
        description="Catat transaksi, proses pesanan pelanggan, dan verifikasi pembayaran."
        title="Halo, Kasir!"
      />
      <ErrorNotice message={error} />
      <section aria-label="Ringkasan kasir" className="kasir-stat-grid">
        <article className="kasir-stat-card"><span className="kasir-stat-icon brown"><KasirIcon name="receipt" /></span><div><small>Transaksi</small><strong>{loading ? "—" : summary.transactions}</strong><span>Semua transaksi</span></div></article>
        <article className="kasir-stat-card"><span className="kasir-stat-icon orange"><KasirIcon name="shopping-cart" /></span><div><small>Pesanan menunggu</small><strong>{loading ? "—" : summary.pendingOrders}</strong><span>Perlu diproses</span></div></article>
        <article className="kasir-stat-card"><span className="kasir-stat-icon pink"><KasirIcon name="warning" /></span><div><small>Belum lunas</small><strong>{loading ? "—" : summary.unpaid}</strong><span>Pembayaran non-tunai</span></div></article>
        <article className="kasir-stat-card"><span className="kasir-stat-icon green"><KasirIcon name="wallet" /></span><div><small>Total lunas</small><strong>{loading ? "—" : currency(summary.paidTotal)}</strong><span>{summary.paidCount} transaksi</span></div></article>
      </section>
      <div className="kasir-dashboard-grid">
        <section className="kasir-content-card kasir-latest-card">
          <div className="kasir-section-heading"><div><h2>Transaksi terbaru</h2><p>{loading ? "Memuat transaksi..." : `${data.latest.length} transaksi terakhir`}</p></div></div>
          <DataTable empty={!loading && data.latest.length === 0} headers={["ID", "TANGGAL", "KASIR", "TOTAL", "STATUS"]}>
            {data.latest.map((transaction) => (
              <tr key={transaction.id}>
                <td className="kasir-table-id">{transaction.id}</td>
                <td>{formatDate(transaction.date)}</td>
                <td>{transaction.cashier}</td>
                <td className="kasir-table-total">{currency(transaction.total)}</td>
                <td><StatusBadge status={transaction.status} /></td>
              </tr>
            ))}
          </DataTable>
        </section>
        <div className="kasir-dashboard-side">
          <section className="kasir-start-card">
            <div className="kasir-start-card-intro"><span><KasirIcon name="plus" /></span><p><strong>Mulai transaksi baru</strong><small>Cari barang, cek stok, catat pembayaran.</small></p></div>
            <Link href="/kasir/transaksi-baru"><KasirIcon name="arrow-right" />Transaksi Baru</Link>
          </section>
          <section className="kasir-content-card kasir-pending-card">
            <div className="kasir-section-heading"><div><h2>Pesanan menunggu</h2><p>Proses pesanan pelanggan</p></div></div>
            {data.pendingOrders.length === 0 ? (
              <p className="kasir-empty-note">{loading ? "Memuat pesanan..." : "Tidak ada pesanan menunggu."}</p>
            ) : data.pendingOrders.map((order) => (
              <article className="kasir-pending-row" key={order.id}>
                <span className="kasir-customer-avatar">{initials(order.customer)}</span>
                <p><strong>{order.customer}</strong><small>{order.id} · {currency(order.total)}</small></p>
                <Link href={`/kasir/transaksi-baru?pesanan=${encodeURIComponent(order.id)}`}>Proses</Link>
              </article>
            ))}
          </section>
        </div>
      </div>
      <section className="kasir-payment-strip">
        <span><i><KasirIcon name="wallet" /></i><strong>Tunai</strong></span>
        <span><i><KasirIcon name="receipt" /></i><strong>Transfer</strong></span>
        <span><i><KasirIcon name="grid" /></i><strong>QRIS</strong></span>
        <small>Metode pembayaran yang didukung toko</small>
      </section>
    </div>
  );
}

function TransactionsPage() {
  const { data, loading, error, refresh } = useKasirData<{ rows: KasirTransaction[] }>(
    "/api/kasir?view=transactions",
    { rows: [] },
  );
  const [selected, setSelected] = useState<KasirTransaction | null>(null);
  const [busyId, setBusyId] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");

  async function verify(transaction: KasirTransaction) {
    if (!transaction.paymentId) return;
    setBusyId(transaction.id);
    setActionError("");
    try {
      await postKasir({ action: "payment:verify", paymentId: transaction.paymentId });
      refresh();
      setNotice("Pembayaran berhasil diverifikasi.");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Pembayaran belum dapat diverifikasi.");
    } finally {
      setBusyId("");
    }
  }

  async function printReceipt(transaction: KasirTransaction) {
    setBusyId(transaction.id);
    setActionError("");
    try {
      await postKasir({ action: "receipt:create", transactionId: transaction.id });
      setNotice("Struk siap dicetak.");
      const cleanup = () => document.body.classList.remove("kasir-printing");
      window.addEventListener("afterprint", cleanup, { once: true });
      document.body.classList.add("kasir-printing");
      window.setTimeout(() => window.print(), 80);
      window.setTimeout(cleanup, 30000);
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Struk belum dapat dicetak.");
    } finally {
      setBusyId("");
    }
  }

  return (
    <div className="kasir-page">
      <PageHeading description="Baca struk dan verifikasi pembayaran non-tunai." title="Daftar Transaksi" />
      <section className="kasir-content-card">
        <div className="kasir-section-heading"><div><h2>Daftar transaksi</h2><p>Baca struk dan verifikasi pembayaran non-tunai.</p></div></div>
        <ErrorNotice message={error || actionError} />
        {notice && <p aria-live="polite" className="kasir-success-notice">{notice}<button onClick={() => setNotice("")} type="button">Tutup</button></p>}
        {loading ? <p className="kasir-loading-note">Memuat transaksi...</p> : (
          <DataTable empty={data.rows.length === 0} headers={["ID", "TANGGAL", "KASIR", "PESANAN", "TOTAL", "METODE", "STATUS", "AKSI"]}>
            {data.rows.map((transaction) => (
              <tr key={transaction.id}>
                <td className="kasir-table-id">{transaction.id}</td>
                <td>{formatDate(transaction.date)}</td>
                <td>{transaction.cashier}</td>
                <td>{transaction.orderId}</td>
                <td className="kasir-table-total">{currency(transaction.total)}</td>
                <td><span className={`kasir-method-pill ${transaction.method.toLowerCase()}`}>{transaction.method}</span></td>
                <td><StatusBadge status={transaction.status} /></td>
                <td className="kasir-action-cell">
                  <button className="kasir-pill-button blue" onClick={() => setSelected(transaction)} type="button"><KasirIcon name="printer" />Struk</button>
                  {transaction.status !== "Lunas" && transaction.method !== "Tunai" && transaction.paymentId && (
                    <button className="kasir-pill-button green" disabled={busyId === transaction.id} onClick={() => verify(transaction)} type="button">
                      <KasirIcon name="check" />{busyId === transaction.id ? "..." : "Verifikasi"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
      {selected && (
        <ReceiptModal
          busy={busyId === selected.id}
          error={actionError}
          onClose={() => setSelected(null)}
          onPrint={() => printReceipt(selected)}
          transaction={selected}
        />
      )}
    </div>
  );
}

function ReceiptModal({
  transaction,
  onClose,
  onPrint,
  busy,
  error,
}: {
  transaction: KasirTransaction;
  onClose: () => void;
  onPrint: () => void;
  busy: boolean;
  error: string;
}) {
  const paid = transaction.method === "Tunai" || transaction.status === "Lunas";
  const change = transaction.method === "Tunai"
    ? Math.max(0, transaction.received - transaction.total)
    : 0;
  return (
    <Modal className="kasir-receipt-modal" onClose={onClose} title="Struk Transaksi">
      <div className="kasir-receipt-print">
        <h3>Toko Farid</h3>
        <p className="kasir-receipt-meta">{transaction.id} · {formatDate(transaction.date, true)} · a.n. {transaction.customer}</p>
        <div className="kasir-receipt-lines">
          {transaction.items.map((item, index) => (
            <div className="kasir-receipt-line" key={`${item.name}-${index}`}>
              <div><strong>{item.name}</strong><small>{item.quantity} × {currency(item.unitPrice)}</small></div>
              <strong>{currency(item.subtotal)}</strong>
            </div>
          ))}
        </div>
        <div className="kasir-receipt-total"><strong>Total harga</strong><b>{currency(transaction.total)}</b></div>
        <div className="kasir-receipt-total"><strong>{transaction.method}</strong><b>{currency(transaction.received)}</b></div>
        {transaction.method === "Tunai" && <div className="kasir-receipt-change"><strong>Kembalian</strong><b>{currency(change)}</b></div>}
        {!paid && <p className="kasir-receipt-pending">Status pembayaran: Belum Lunas</p>}
      </div>
      <ErrorNotice message={error} />
      <div className="kasir-modal-actions">
        <button className="kasir-outline-button" onClick={onClose} type="button">Batal</button>
        <button className="kasir-primary-button" disabled={busy} onClick={onPrint} type="button">
          <KasirIcon name="printer" />{busy ? "Menyiapkan..." : "Cetak"}
        </button>
      </div>
    </Modal>
  );
}

function OrdersPage() {
  const { data, loading, error, refresh } = useKasirData<{ rows: KasirOrder[] }>(
    "/api/kasir?view=orders",
    { rows: [] },
  );
  const [selected, setSelected] = useState<KasirOrder | null>(null);
  return (
    <div className="kasir-page">
      <PageHeading description="Proses pesanan pelanggan menjadi transaksi." title="Pesanan Pelanggan" />
      <section className="kasir-content-card">
        <div className="kasir-section-heading"><div><h2>Pesanan masuk</h2><p>Proses pesanan pelanggan menjadi transaksi.</p></div><button className="kasir-refresh-button" onClick={refresh} type="button">Muat ulang</button></div>
        <ErrorNotice message={error} />
        {loading ? <p className="kasir-loading-note">Memuat pesanan...</p> : (
          <DataTable empty={data.rows.length === 0} headers={["ID", "TANGGAL", "PELANGGAN", "TOTAL", "STATUS", "AKSI"]}>
            {data.rows.map((order) => (
              <tr key={order.id}>
                <td className="kasir-table-id">{order.id}</td>
                <td>{formatDate(order.date, true)}</td>
                <td><span className="kasir-customer-table"><span>{initials(order.customer)}</span><strong>{order.customer}</strong></span></td>
                <td className="kasir-table-total">{currency(order.total)}</td>
                <td><StatusBadge status={order.status} /></td>
                <td className="kasir-action-cell">
                  <button className="kasir-pill-button blue" onClick={() => setSelected(order)} type="button"><KasirIcon name="eye" />Detail</button>
                  {order.canProcess && (
                    <Link className="kasir-pill-button brown" href={`/kasir/transaksi-baru?pesanan=${encodeURIComponent(order.id)}`}>
                      <KasirIcon name="arrow-right" />Proses
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </section>
      {selected && <OrderModal onClose={() => setSelected(null)} order={selected} />}
    </div>
  );
}

function OrderModal({ order, onClose }: { order: KasirOrder; onClose: () => void }) {
  return (
    <Modal className="kasir-detail-modal" onClose={onClose} title="Pesanan Pelanggan">
      <p className="kasir-receipt-meta">{order.id} · {formatDate(order.date, true)} · a.n. {order.customer}</p>
      <div className="kasir-detail-lines">
        {order.items.map((item, index) => (
          <div className="kasir-receipt-line" key={`${item.productId}-${index}`}>
            <div><strong>{item.name}</strong><small>{item.quantity} × {currency(item.unitPrice)}</small></div>
            <strong>{currency(item.subtotal)}</strong>
          </div>
        ))}
      </div>
      <div className="kasir-receipt-total"><strong>Total pesanan</strong><b>{currency(order.total)}</b></div>
      <StatusBadge status={order.status} />
      <div className="kasir-modal-actions">
        <button className="kasir-outline-button" onClick={onClose} type="button">Tutup</button>
        {order.canProcess && <Link className="kasir-primary-button" href={`/kasir/transaksi-baru?pesanan=${encodeURIComponent(order.id)}`}><KasirIcon name="arrow-right" />Proses Pesanan</Link>}
      </div>
    </Modal>
  );
}

function productImage(name: string) {
  const key = name.toLocaleLowerCase("id-ID");
  const images: [string, string][] = [
    ["beras", "beras.jpg"],
    ["minyak", "minyak.jpg"],
    ["susu", "susu-kental.jpg"],
    ["telur", "telur.jpg"],
    ["tepung", "tepung.jpg"],
    ["mie", "mie-instan.jpg"],
    ["mi ", "mie-instan.jpg"],
    ["gula", "gula.jpg"],
    ["teh", "teh.jpg"],
    ["garam", "garam.jpg"],
  ];
  const image = images.find(([word]) => key.includes(word))?.[1];
  return image ? `/customer-products/${image}` : null;
}

function CheckoutPage({ orderId }: { orderId?: string }) {
  const { data: catalog, loading: catalogLoading, error: catalogError } = useKasirData<{
    products: Product[];
    customers: Customer[];
  }>("/api/kasir?view=catalog", { products: [], customers: [] });
  const [order, setOrder] = useState<KasirOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(Boolean(orderId));
  const [orderError, setOrderError] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerId, setCustomerId] = useState("");
  const [method, setMethod] = useState("Tunai");
  const [received, setReceived] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  useEffect(() => {
    let active = true;
    if (!orderId) return () => { active = false; };
    fetch(`/api/kasir?view=order&id=${encodeURIComponent(orderId)}`, { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as { order?: KasirOrder; error?: string };
        if (!response.ok || !data.order) throw new Error(data.error || "Pesanan belum dapat dimuat.");
        if (active) {
          setOrder(data.order);
          setCustomerId(data.order.customerId);
          setCart(Object.fromEntries(data.order.items.map((item) => [item.productId, item.quantity])));
        }
      })
      .catch((cause: unknown) => {
        if (active) setOrderError(cause instanceof Error ? cause.message : "Pesanan belum dapat dimuat.");
      })
      .finally(() => { if (active) setOrderLoading(false); });
    return () => { active = false; };
  }, [orderId]);

  const productsById = new Map(catalog.products.map((product) => [product.id, product]));
  const cartItems = Object.entries(cart)
    .filter(([, quantity]) => quantity > 0)
    .map(([id, quantity]) => {
      const source = order?.items.find((item) => item.productId === id);
      const product = productsById.get(id);
      return {
        id,
        name: source?.name ?? product?.name ?? id,
        unit: source?.unit ?? product?.unit ?? "",
        quantity,
        price: source?.unitPrice ?? product?.price ?? 0,
        stock: product?.stock ?? source?.stock ?? 0,
        baseQuantity: source?.quantity ?? 0,
      };
    });
  const total = Number(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2));
  const amountReceived = method === "Tunai" ? Number(received) : total;
  const change = Number.isFinite(amountReceived) ? Math.max(0, amountReceived - total) : 0;

  function addProduct(product: Product) {
    setCart((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }));
  }

  function decrement(productId: string, minimum: number) {
    setCart((current) => {
      const next = { ...current };
      const quantity = next[productId] ?? 0;
      if (quantity > minimum) next[productId] = quantity - 1;
      else if (!order && quantity <= 1) delete next[productId];
      else if (!order && quantity > 0) next[productId] = quantity - 1;
      return next;
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await postKasir<{ transaction: { id: string; orderId: string; total: number; status: string } }>({
        action: "transaction:create",
        orderId: order?.id,
        customerId: order ? order.customerId : customerId,
        items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity })),
        paymentMethod: method,
        amountReceived: method === "Tunai" ? Number(received) : total,
      });
      setSuccess(`${result.transaction.id} berhasil dicatat. Status pembayaran: ${result.transaction.status}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Transaksi belum dapat disimpan.");
    } finally {
      setSaving(false);
    }
  }

  function clearCart() {
    if (order) {
      setCart(Object.fromEntries(order.items.map((item) => [item.productId, item.quantity])));
    } else {
      setCart({});
    }
    setReceived("");
    setError("");
  }

  return (
    <div className="kasir-page kasir-checkout-page">
      <PageHeading
        description="Cari barang, cek info dan stok, lalu catat pembayaran."
        title="Catat Transaksi Penjualan"
      />
      <ErrorNotice message={catalogError || orderError} />
      <form className="kasir-checkout-layout" onSubmit={submit}>
        <section aria-label="Katalog barang" className="kasir-products-grid">
          {catalogLoading || orderLoading ? <p className="kasir-loading-note">Memuat katalog barang...</p> : catalog.products.length === 0 ? (
            <p className="kasir-empty-note">Data barang belum tersedia di database.</p>
          ) : catalog.products.map((product) => {
            const lowStock = product.stock <= product.minimum;
            const image = productImage(product.name);
            return (
              <article className="kasir-product-card" key={product.id}>
                {lowStock && <span className="kasir-low-stock-badge">Menipis</span>}
                <div className="kasir-product-image">
                  {image ? <Image alt={product.name} fill sizes="(max-width: 700px) 42vw, 190px" src={image} /> : <span aria-hidden="true"><KasirIcon name="box" /></span>}
                </div>
                <h2>{product.name}</h2>
                <p>{product.category} · per {product.unit}</p>
                <strong className="kasir-product-price">{currency(product.price)}</strong>
                <small className="kasir-stock-label">Stok tersedia: {product.stock}</small>
                <div className="kasir-product-actions">
                  <div className="kasir-quantity-stepper">
                    <button aria-label={`Kurangi ${product.name}`} disabled={(cart[product.id] ?? 0) <= (order?.items.find((item) => item.productId === product.id)?.quantity ?? 0)} onClick={() => decrement(product.id, order?.items.find((item) => item.productId === product.id)?.quantity ?? 0)} type="button"><KasirIcon name="minus" /></button>
                    <span>{cart[product.id] ?? 0}</span>
                    <button aria-label={`Tambah ${product.name}`} disabled={product.stock <= (cart[product.id] ?? 0)} onClick={() => addProduct(product)} type="button"><KasirIcon name="plus" /></button>
                  </div>
                  <button className="kasir-add-button" disabled={product.stock <= (cart[product.id] ?? 0)} onClick={() => addProduct(product)} type="button"><KasirIcon name="plus" />Tambah</button>
                </div>
              </article>
            );
          })}
        </section>
        <aside className="kasir-checkout-card">
          <h2>Transaksi saat ini</h2>
          {order && (
            <div className="kasir-order-source">
              <KasirIcon name="shopping-cart" />
              <p><strong>Diambil dari pesanan pelanggan</strong><span>{order.id} · {order.customer} · {currency(order.total)}</span></p>
            </div>
          )}
          {!order && (
            <label className="kasir-customer-select">
              <span>Pelanggan terdaftar</span>
              <select onChange={(event) => setCustomerId(event.target.value)} required value={customerId}>
                <option value="">Pilih pelanggan</option>
                {catalog.customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} · {customer.username}</option>)}
              </select>
              <small>Transaksi baru ditautkan ke pesanan pelanggan sesuai relasi database.</small>
            </label>
          )}
          <div className="kasir-cart-lines">
            {cartItems.length === 0 ? <p className="kasir-empty-note">Belum ada barang ditambahkan.</p> : cartItems.map((item) => (
              <div className="kasir-cart-line" key={item.id}>
                <p><strong>{item.name}</strong><small>{item.quantity} × {currency(item.price)}</small></p>
                <b>{currency(item.price * item.quantity)}</b>
              </div>
            ))}
          </div>
          <div className="kasir-cart-total"><span>Total harga</span><strong>{currency(total)}</strong></div>
          <fieldset className="kasir-method-fieldset">
            <legend>Metode pembayaran</legend>
            <div className="kasir-method-options">
              {["Tunai", "Transfer", "QRIS"].map((item) => (
                <button
                  aria-pressed={method === item}
                  className={method === item ? "is-selected" : ""}
                  key={item}
                  onClick={() => setMethod(item)}
                  type="button"
                >
                  <KasirIcon name={item === "Tunai" ? "wallet" : item === "Transfer" ? "receipt" : "grid"} />{item}
                </button>
              ))}
            </div>
          </fieldset>
          {method === "Tunai" && (
            <>
              <label className="kasir-money-input">
                <span>Jumlah uang diterima (Rp)</span>
                <input inputMode="numeric" min={0} onChange={(event) => setReceived(event.target.value)} placeholder="Masukkan jumlah uang" required type="number" value={received} />
              </label>
              <div className="kasir-change-row"><span>Kembalian</span><strong>{currency(change)}</strong></div>
            </>
          )}
          {method !== "Tunai" && <p className="kasir-payment-hint"><KasirIcon name="info" />Pembayaran akan berstatus Belum Lunas hingga diverifikasi di Daftar Transaksi.</p>}
          <ErrorNotice message={error} />
          <div className="kasir-checkout-actions">
            <button className="kasir-primary-button" disabled={saving || total <= 0 || (method === "Tunai" && amountReceived < total) || (order ? orderLoading || Boolean(order.transactionId) : !customerId)} type="submit">
              <KasirIcon name="printer" />{saving ? "Menyimpan..." : "Catat & Cetak Struk"}
            </button>
            <button className="kasir-outline-button" disabled={cartItems.length === 0} onClick={clearCart} type="button">Kosongkan</button>
          </div>
        </aside>
      </form>
      {success && (
        <Modal className="kasir-success-modal" onClose={() => setSuccess("")} title="Transaksi berhasil">
          <span className="kasir-success-check"><KasirIcon name="check" /></span>
          <h3>Transaksi berhasil dicatat!</h3>
          <p>{success}</p>
          <div className="kasir-modal-actions">
            <button className="kasir-outline-button" onClick={() => setSuccess("")} type="button">Transaksi baru</button>
            <button className="kasir-primary-button" onClick={() => router.push("/kasir/daftar-transaksi")} type="button">Daftar Transaksi</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProfilePage() {
  const { data, loading, error, refresh } = useKasirData<{ profile: KasirProfile }>(
    "/api/kasir?view=profile",
    {
      profile: {
        id: "",
        name: "",
        username: "",
        email: "",
        phone: "",
        postalCode: "",
        address: "",
        role: "Kasir",
      },
    },
  );
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [saved, setSaved] = useState(false);
  const [password, setPassword] = useState("");
  const [values, setValues] = useState(data.profile);
  const router = useRouter();
  const profile = data.profile;

  function setField(field: keyof KasirProfile, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrorMessage("");
    try {
      const response = await postKasir<{ profile: KasirProfile }>({
        action: "profile",
        ...values,
        password,
      });
      setValues(response.profile);
      setPassword("");
      setEditing(false);
      setSaved(true);
      refresh();
      router.refresh();
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "Profil belum dapat diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    try {
      await postKasir({ action: "logout" });
      router.replace("/kasir/login");
    } catch (cause) {
      setErrorMessage(cause instanceof Error ? cause.message : "Logout belum dapat diproses.");
    }
  }
  return (
    <div className="kasir-page">
      <PageHeading
        action={!editing && <button className="kasir-hero-action" onClick={() => { setValues(profile); setEditing(true); }} type="button"><KasirIcon name="edit" />Ubah profil</button>}
        description="Data akun yang sedang digunakan."
        title={editing ? "Ubah Profil" : "Profil Saya"}
      />
      <ErrorNotice message={error || errorMessage} />
      {loading ? <p className="kasir-loading-note">Memuat profil...</p> : (
        <div className="kasir-profile-layout">
          <section className="kasir-profile-card">
            <div className="kasir-profile-cover" />
            <span className="kasir-avatar-large">{initials(profile.name)}</span>
            <h2>{profile.name}</h2>
            <p>@{profile.username}</p>
            <span className="kasir-role-badge">Kasir</span>
            <button className="kasir-primary-button kasir-profile-edit-button" onClick={() => { setValues(profile); setEditing((value) => !value); }} type="button">
              <KasirIcon name={editing ? "close" : "edit"} />{editing ? "Batal ubah profil" : "Ubah profil"}
            </button>
            <button className="kasir-outline-button kasir-profile-logout" onClick={logout} type="button"><KasirIcon name="logout" />Logout</button>
          </section>
          <section className="kasir-profile-details">
            <div className="kasir-section-heading"><div><h2>Data akun</h2><p>Data akun yang sedang digunakan.</p></div></div>
            {editing ? (
              <form className="kasir-profile-form" onSubmit={submit}>
                <label>Nama lengkap<input maxLength={100} onChange={(event) => setField("name", event.target.value)} required value={values.name} /></label>
                <label>Username<input maxLength={50} onChange={(event) => setField("username", event.target.value)} required value={values.username} /></label>
                <label>No. telepon<input maxLength={20} onChange={(event) => setField("phone", event.target.value)} required value={values.phone} /></label>
                <label>Email<input maxLength={100} onChange={(event) => setField("email", event.target.value)} required type="email" value={values.email} /></label>
                <label>Kode pos<input maxLength={10} onChange={(event) => setField("postalCode", event.target.value)} required value={values.postalCode} /></label>
                <label>Alamat<input maxLength={150} onChange={(event) => setField("address", event.target.value)} required value={values.address} /></label>
                <label className="kasir-profile-password">Password baru <small>(kosongkan jika tidak diubah)</small><input autoComplete="new-password" maxLength={100} onChange={(event) => setPassword(event.target.value)} value={password} /></label>
                <div className="kasir-profile-form-actions"><button className="kasir-outline-button" onClick={() => { setEditing(false); setValues(profile); setPassword(""); }} type="button">Batal</button><button className="kasir-primary-button" disabled={busy} type="submit">{busy ? "Menyimpan..." : "Simpan perubahan"}</button></div>
              </form>
            ) : (
              <div className="kasir-profile-info-grid">
                <ProfileInfo icon="lock" label="ID akun" value={profile.id} />
                <ProfileInfo icon="shield" label="Role" value={profile.role} />
                <ProfileInfo icon="user" label="Nama lengkap" value={profile.name} />
                <ProfileInfo icon="user" label="Username" value={profile.username} />
                <ProfileInfo icon="phone" label="No. telepon" value={profile.phone} />
                <ProfileInfo icon="mail" label="Email" value={profile.email} />
                <ProfileInfo icon="map" label="Kode pos" value={profile.postalCode} />
                <ProfileInfo icon="map" label="Alamat" value={profile.address} />
              </div>
            )}
          </section>
        </div>
      )}
      {saved && (
        <Modal className="kasir-success-modal" onClose={() => setSaved(false)} title="Data berhasil diubah!">
          <span className="kasir-success-check"><KasirIcon name="check" /></span>
          <h3>Data berhasil diubah!</h3>
          <p>Informasi profil Kasir sudah diperbarui.</p>
          <button className="kasir-primary-button" onClick={() => setSaved(false)} type="button">Selesai</button>
        </Modal>
      )}
    </div>
  );
}

function ProfileInfo({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return (
    <article className="kasir-profile-info">
      <span><KasirIcon name={icon} /></span>
      <p><small>{label}</small><strong>{value || "—"}</strong></p>
    </article>
  );
}

export function KasirPage({
  page,
  orderId,
}: {
  page: "dashboard" | "checkout" | "transactions" | "orders" | "profile";
  orderId?: string;
}) {
  if (page === "checkout") return <CheckoutPage key={orderId ?? "manual"} orderId={orderId} />;
  if (page === "transactions") return <TransactionsPage />;
  if (page === "orders") return <OrdersPage />;
  if (page === "profile") return <ProfilePage />;
  return <DashboardPage />;
}
