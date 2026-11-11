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
import type { OwnerProfile } from "@/lib/owner-session";

type OwnerPageName = "dashboard" | "transactions" | "sales" | "stock" | "archive" | "profile";
type OwnerIconName =
  | "archive"
  | "arrow-left"
  | "arrow-right"
  | "bars"
  | "calendar"
  | "chart"
  | "check"
  | "close"
  | "download"
  | "edit"
  | "eye"
  | "eye-off"
  | "grid"
  | "info"
  | "layers"
  | "lock"
  | "logout"
  | "mail"
  | "map"
  | "phone"
  | "printer"
  | "shield"
  | "trend"
  | "user"
  | "wallet"
  | "warning";

type TransactionRow = {
  id: string;
  date: string;
  cashier: string;
  method: string;
  total: number;
  status: string;
};

type SalesRow = {
  name: string;
  quantity: number;
  unit: string;
  revenue: number;
};

type StockRow = {
  id: string;
  name: string;
  location: string;
  quantity: number;
  minimum: number;
  updatedAt: string | null;
  status: string;
};

type ArchiveRow = {
  id: string;
  kind: string;
  from: string;
  to: string;
  createdAt: string;
  status: string;
};

type DashboardData = {
  profile: OwnerProfile;
  summary: {
    transactions: number;
    transactionTotal: number;
    sales: number;
    paidCount: number;
    lowStock: number;
    archives: number;
    lowStockItems: string[];
  };
  preview: boolean;
};

const iconShapes: Record<OwnerIconName, ReactNode> = {
  archive: <><path d="M3 4h18v5H3z" /><path d="M5 9v11h14V9M10 13h4" /></>,
  "arrow-left": <path d="M19 12H5m7 7-7-7 7-7" />,
  "arrow-right": <path d="M5 12h14m-7-7 7 7-7 7" />,
  bars: <><path d="M4 20V4m0 16h17" /><path d="M8 16v-5m5 5V7m5 9V4" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  chart: <><path d="M4 19V5m0 14h17" /><path d="M8 15v-4m5 4V7m5 8V4" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v4h14v-4" /></>,
  edit: <><path d="m15 5 4 4M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  "eye-off": <><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1 0 2-.2 2.8-.5" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5m-18 5 9 5 9-5" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
  phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />,
  printer: <><path d="M6 9V3h12v6M6 17H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><path d="M6 14h12v7H6z" /><path d="M18 12h.01" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  trend: <><path d="m3 17 6-6 4 4 8-9" /><path d="M15 6h6v6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  wallet: <><rect x="3" y="5" width="18" height="15" rx="2" /><path d="M3 9h18m-5 5h2" /></>,
  warning: <><path d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z" /><path d="M12 9v4m0 3h.01" /></>,
};

function OwnerIcon({ name, className }: { name: OwnerIconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {iconShapes[name]}
    </svg>
  );
}

const links: { href: string; label: string; page: OwnerPageName; icon: OwnerIconName }[] = [
  { href: "/owner", label: "Dashboard", page: "dashboard", icon: "grid" },
  { href: "/owner/laporan-transaksi", label: "Laporan Transaksi", page: "transactions", icon: "wallet" },
  { href: "/owner/laporan-penjualan", label: "Laporan Penjualan", page: "sales", icon: "chart" },
  { href: "/owner/informasi-stok", label: "Informasi Stok", page: "stock", icon: "layers" },
  { href: "/owner/arsip-laporan", label: "Arsip Laporan", page: "archive", icon: "archive" },
  { href: "/owner/profil-saya", label: "Profil Saya", page: "profile", icon: "user" },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "OW";
}

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function ownerIdLabel(id: string) {
  return id.startsWith("OW") ? id.replace(/^OW-?/, "OW-") : id;
}

function useOwnerData<T>(url: string, initialData: T) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { error?: string } & T;
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
  }, [url]);

  return { data, setData, loading, error };
}

function ErrorNotice({ message }: { message: string }) {
  if (!message) return null;
  return <p aria-live="polite" className="owner-error-notice"><OwnerIcon name="info" />{message}</p>;
}

function OwnerHeader({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <header className="owner-page-heading">
      <div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </header>
  );
}

function OwnerPortalShell({
  children,
  profile,
  preview,
}: {
  children: ReactNode;
  profile: OwnerProfile;
  preview: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const active = links.find((link) => link.href === pathname)?.page ?? "dashboard";
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
      if (!response.ok) throw new Error("Logout belum dapat diproses.");
      router.replace("/owner/login");
    } catch (error) {
      setLoggingOut(false);
      window.alert(error instanceof Error ? error.message : "Logout belum dapat diproses.");
    }
  }

  return (
    <div className="owner-portal">
      <aside className="owner-sidebar">
        <Link aria-label="Toko Farid Dashboard Owner" className="owner-brand" href="/owner">
          <Image alt="" height={34} src="/storefront/toko-farid-logo.png" width={34} />
          <span><strong>Toko Farid</strong><small>Portal Owner</small></span>
        </Link>
        <div className="owner-user-card"><span className="owner-avatar-small">{initials(profile.name)}</span><span><strong>{profile.name}</strong><small>Owner</small></span></div>
        <span className="owner-nav-label">MENU UTAMA</span>
        <nav aria-label="Navigasi Owner" className="owner-navigation">
          {links.map((link) => (
            <Link aria-current={active === link.page ? "page" : undefined} className={active === link.page ? "is-active" : ""} href={link.href} key={link.page}>
              <OwnerIcon name={link.icon} /><span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <button className="owner-logout" disabled={loggingOut} onClick={logout} type="button"><OwnerIcon name="logout" />{loggingOut ? "Keluar..." : "Logout"}</button>
      </aside>
      <main className="owner-main">
        {preview && <div className="owner-preview-banner"><OwnerIcon name="info" />Pratinjau lokal menggunakan data contoh dari referensi. Perubahan profil tidak disimpan ke database.</div>}
        {children}
      </main>
    </div>
  );
}

export { OwnerPortalShell };

export function OwnerLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [noticeKind, setNoticeKind] = useState<"error" | "success" | "info">("error");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "login", identifier, password, remember }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Login Owner gagal.");
      setNoticeKind("success");
      setNotice("Login Berhasil!");
      window.setTimeout(() => router.replace("/owner"), 650);
    } catch (error) {
      setNoticeKind("error");
      setNotice(error instanceof Error ? error.message : "Login Owner gagal.");
    } finally {
      setBusy(false);
    }
  }

  async function preview() {
    setBusy(true);
    setNotice("");
    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "preview" }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Pratinjau belum dapat dibuka.");
      router.push("/owner");
    } catch (error) {
      setNoticeKind("error");
      setNotice(error instanceof Error ? error.message : "Pratinjau belum dapat dibuka.");
      setBusy(false);
    }
  }

  return (
    <main className="owner-login-page">
      <section className="owner-login-welcome">
        <Link className="owner-login-brand" href="/beranda">
          <Image alt="" height={34} src="/storefront/toko-farid-logo.png" width={34} />
          <span><strong>Toko Farid</strong><small>Belanja Mudah, Kebutuhan Lengkap</small></span>
        </Link>
        <div className="owner-login-copy">
          <h1>Portal Internal<br />Toko Farid</h1>
          <p>Masuk sebagai Owner untuk mengelola toko.<br />Akun internal dibuat dan dikelola oleh Admin.</p>
          <ul>
            <li><span><OwnerIcon name="wallet" /></span><div><strong>Lihat laporan transaksi</strong><small>Menu di Portal Owner</small></div></li>
            <li><span><OwnerIcon name="chart" /></span><div><strong>Lihat laporan penjualan</strong><small>Menu di Portal Owner</small></div></li>
            <li><span><OwnerIcon name="layers" /></span><div><strong>Pantau informasi stok</strong><small>Menu di Portal Owner</small></div></li>
            <li><span><OwnerIcon name="archive" /></span><div><strong>Buka arsip laporan</strong><small>Menu di Portal Owner</small></div></li>
          </ul>
        </div>
        <Link className="owner-back-home" href="/beranda"><OwnerIcon name="arrow-left" />Kembali ke Beranda</Link>
      </section>
      <section className="owner-login-panel">
        <div className="owner-login-card">
          <header className="owner-login-card-head">
            <span className="owner-login-card-icon"><OwnerIcon name="chart" /></span>
            <div><h2>Login Owner</h2><p>Portal Internal Toko Farid</p></div>
          </header>
          <form className="owner-login-form" onSubmit={submit}>
            <label className="owner-field">
              <span>Username atau Email</span>
              <span className="owner-input-wrap"><OwnerIcon name="user" /><input autoComplete="username" onChange={(event) => setIdentifier(event.target.value)} placeholder="Masukkan Username atau Email" required value={identifier} /></span>
            </label>
            <label className="owner-field">
              <span>Password</span>
              <span className="owner-input-wrap"><OwnerIcon name="lock" /><input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan Password" required type={visible ? "text" : "password"} value={password} /><button aria-label={visible ? "Sembunyikan password" : "Tampilkan password"} className="owner-input-action" onClick={() => setVisible((value) => !value)} type="button"><OwnerIcon name={visible ? "eye" : "eye-off"} /></button></span>
            </label>
            <div className="owner-login-options">
              <label className="owner-checkbox"><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" /><span>Ingat saya</span></label>
              <button className="owner-text-button" onClick={() => { setNoticeKind("info"); setNotice("Hubungi Admin Toko Farid untuk membuat atau memulihkan akun Owner."); }} type="button">Hubungi Admin</button>
            </div>
            <button className="owner-primary-button" disabled={busy} type="submit">{busy ? "Memeriksa..." : "Masuk"}<OwnerIcon name="arrow-right" /></button>
            {notice && <p aria-live="polite" className={`owner-login-notice is-${noticeKind}`}><OwnerIcon name={noticeKind === "success" ? "check" : "info"} />{notice}</p>}
            <div className="owner-login-info"><span><OwnerIcon name="info" /></span><p><strong>Akun internal tidak bisa mendaftar sendiri.</strong><small>Minta Admin Toko Farid untuk membuatkan akun.</small></p></div>
            {process.env.NODE_ENV !== "production" && <button className="owner-preview-link" disabled={busy} onClick={preview} type="button">Pratinjau desain Owner dengan data contoh</button>}
          </form>
        </div>
      </section>
    </main>
  );
}

function MetricCard({ icon, label, value, note, variant }: { icon: OwnerIconName; label: string; value: string; note: string; variant: string }) {
  return <article className="owner-metric-card"><span className={`owner-metric-icon ${variant}`}><OwnerIcon name={icon} /></span><div><small>{label}</small><strong>{value}</strong><span>{note}</span></div></article>;
}

function OwnerDashboard() {
  const { data, loading, error } = useOwnerData<DashboardData>("/api/owner?view=dashboard", {
    profile: { id: "", name: "", username: "", email: "", phone: "", postalCode: "", address: "", role: "Owner" },
    summary: { transactions: 0, transactionTotal: 0, sales: 0, paidCount: 0, lowStock: 0, archives: 0, lowStockItems: [] },
    preview: false,
  });
  const { summary } = data;

  return (
    <>
      <OwnerHeader title={`Halo, ${data.profile.name || "Owner"}!`} description="Lihat laporan transaksi, penjualan, dan stok toko dalam satu tempat." action={<Link className="owner-light-button" href="/owner/laporan-penjualan"><OwnerIcon name="chart" />Laporan Penjualan</Link>} />
      <ErrorNotice message={error} />
      {loading && <p className="owner-loading">Memuat ringkasan Owner...</p>}
      <section aria-label="Ringkasan Owner" className="owner-metric-grid">
        <MetricCard icon="wallet" label="Total transaksi" value={formatCurrency(summary.transactionTotal)} note={`${summary.transactions} transaksi`} variant="purple" />
        <MetricCard icon="trend" label="Total penjualan" value={formatCurrency(summary.sales)} note={`${summary.paidCount} transaksi lunas`} variant="green" />
        <MetricCard icon="warning" label="Stok menipis" value={String(summary.lowStock)} note="Perlu restock" variant="orange" />
        <MetricCard icon="archive" label="Laporan diarsipkan" value={String(summary.archives)} note="oleh Admin" variant="blue" />
      </section>
      <section className="owner-low-stock-banner">
        <span className="owner-banner-icon"><OwnerIcon name="layers" /></span>
        <div><strong>{summary.lowStock} barang berada di bawah stok minimum</strong><p>{summary.lowStockItems.length ? summary.lowStockItems.join(", ") : "Tidak ada barang yang menipis"}{summary.lowStockItems.length ? " — " : " — "}lihat selengkapnya di Informasi Stok.</p></div>
        <Link className="owner-light-button" href="/owner/informasi-stok">Lihat stok</Link>
      </section>
    </>
  );
}

function TransactionTable({ rows }: { rows: TransactionRow[] }) {
  return (
    <div className="owner-table-scroll"><table className="owner-table owner-transaction-table">
      <thead><tr><th>ID</th><th>TANGGAL</th><th>KASIR</th><th>METODE</th><th>TOTAL</th><th>STATUS</th></tr></thead>
      <tbody>{rows.length ? rows.map((row) => <tr key={row.id}><td className="owner-id-cell">{row.id}</td><td>{formatDate(row.date)}</td><td>{row.cashier}</td><td><span className={`owner-method-badge ${row.method.toLowerCase()}`}>{row.method}</span></td><td className="owner-amount-cell">{formatCurrency(row.total)}</td><td><span className={`owner-status ${row.status === "Lunas" ? "paid" : "unpaid"}`}>{row.status}</span></td></tr>) : <tr><td className="owner-empty-cell" colSpan={6}>Belum ada transaksi pada periode ini.</td></tr>}</tbody>
    </table></div>
  );
}

function OwnerStock() {
  const { data, loading, error } = useOwnerData<{ rows: StockRow[] }>("/api/owner?view=stock", { rows: [] });
  const lowCount = new Set(data.rows.filter((row) => row.status === "Menipis").map((row) => row.name)).size;
  return (
    <>
      <OwnerHeader title="Informasi Stok Barang" description="Lihat stok di toko dan gudang (hanya baca)." />
      <section className="owner-content-panel owner-stock-panel">
        <div className="owner-section-title"><div><h2>Stok barang</h2><p>Lihat stok di toko dan gudang (hanya baca).</p></div><span className="owner-readonly-badge"><OwnerIcon name="lock" />Hanya baca</span></div>
        <ErrorNotice message={error} />
        {loading && <p className="owner-loading">Memuat informasi stok...</p>}
        <div className="owner-table-scroll"><table className="owner-table owner-stock-table">
          <thead><tr><th>ID</th><th>BARANG</th><th>LOKASI</th><th>JUMLAH</th><th>MIN.</th><th>UPDATE</th><th>STATUS</th></tr></thead>
          <tbody>{data.rows.length ? data.rows.map((row) => <tr key={row.id}><td className="owner-id-cell">{row.id}</td><td className="owner-amount-cell">{row.name}</td><td>{row.location}</td><td>{row.quantity}</td><td>{row.minimum}</td><td>{formatDate(row.updatedAt)}</td><td><span className={`owner-status ${row.status === "Aman" ? "paid" : "unpaid"}`}>{row.status}</span></td></tr>) : !loading && <tr><td className="owner-empty-cell" colSpan={7}>Belum ada data stok yang tercatat.</td></tr>}</tbody>
        </table></div>
        {!loading && data.rows.length > 0 && <p className="owner-stock-footnote">{lowCount} jenis barang berada di bawah stok minimum.</p>}
      </section>
    </>
  );
}

function ReportFilters({
  from,
  to,
  setFrom,
  setTo,
  onDownload,
  onPrint,
}: {
  from: string;
  to: string;
  setFrom: (value: string) => void;
  setTo: (value: string) => void;
  onDownload: () => void;
  onPrint: () => void;
}) {
  return (
    <form className="owner-report-filters" onSubmit={(event) => event.preventDefault()}>
      <label><span>Dari tanggal</span><span className="owner-date-input"><OwnerIcon name="calendar" /><input aria-label="Dari tanggal" onChange={(event) => setFrom(event.target.value)} type="date" value={from} /></span></label>
      <label><span>Sampai tanggal</span><span className="owner-date-input"><OwnerIcon name="calendar" /><input aria-label="Sampai tanggal" onChange={(event) => setTo(event.target.value)} type="date" value={to} /></span></label>
      <div className="owner-report-actions"><button onClick={onDownload} type="button"><OwnerIcon name="download" />Unduh PDF</button><button onClick={onPrint} type="button"><OwnerIcon name="printer" />Cetak</button></div>
    </form>
  );
}

function dateParam(value: string) {
  return value;
}

function OwnerReports({ kind }: { kind: "sales" | "transactions" }) {
  const [from, setFrom] = useState("2026-10-01");
  const [to, setTo] = useState("2026-10-23");
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState<"download" | "print" | null>(null);
  const isSales = kind === "sales";
  const title = isSales ? "Laporan Penjualan" : "Laporan Transaksi";
  const url = `/api/owner?view=${kind}&from=${dateParam(from)}&to=${dateParam(to)}&refresh=${reloadKey}`;
  const { data, loading, error } = useOwnerData<{
    rows: (SalesRow | TransactionRow)[];
    transactionCount?: number;
  }>(url, { rows: [], transactionCount: 0 });
  const salesRows = isSales ? data.rows as SalesRow[] : [];
  const transactionRows = isSales ? [] : data.rows as TransactionRow[];
  const totalSales = salesRows.reduce((total, row) => total + row.revenue, 0);
  const totalTransactions = transactionRows.reduce((total, row) => total + row.total, 0);
  const itemCount = salesRows.reduce((total, row) => total + row.quantity, 0);
  const paidCount = transactionRows.filter((row) => row.status === "Lunas").length;

  function reportLines() {
    if (isSales) return [
      title,
      `Periode: ${formatDate(from)} - ${formatDate(to)}`,
      "",
      "BARANG | TERJUAL | PENDAPATAN",
      ...salesRows.map((row) => `${row.name} | ${row.quantity} ${row.unit} | ${formatCurrency(row.revenue)}`),
      "",
      `Total penjualan: ${formatCurrency(totalSales)}`,
    ];
    return [
      title,
      `Periode: ${formatDate(from)} - ${formatDate(to)}`,
      "",
      "ID | TANGGAL | KASIR | METODE | TOTAL | STATUS",
      ...transactionRows.map((row) => `${row.id} | ${formatDate(row.date)} | ${row.cashier} | ${row.method} | ${formatCurrency(row.total)} | ${row.status}`),
      "",
      `Total transaksi: ${formatCurrency(totalTransactions)}`,
    ];
  }

  return (
    <>
      <OwnerHeader title={title} description={isSales ? "Penjualan dari transaksi yang sudah lunas." : "Semua transaksi pada periode yang dipilih."} />
      <ReportFilters from={from} to={to} setFrom={setFrom} setTo={setTo} onDownload={() => { downloadPdf(title, reportLines()); setModal("download"); }} onPrint={() => { setModal("print"); window.setTimeout(() => window.print(), 80); }} />
      <ErrorNotice message={error} />
      {loading && <p className="owner-loading">Memuat laporan...</p>}
      {isSales ? (
        <>
          <section className="owner-sales-report">
            <h2>{data.transactionCount ? `${data.transactionCount} transaksi lunas pada ${formatDate(from)} – ${formatDate(to)}` : `Ringkasan penjualan ${formatDate(from)} – ${formatDate(to)}`}</h2>
            <div className="owner-table-scroll"><table className="owner-table owner-sales-table">
              <thead><tr><th>BARANG</th><th>TERJUAL</th><th>PENDAPATAN</th></tr></thead>
              <tbody>{salesRows.length ? salesRows.map((row) => <tr key={row.name}><td className="owner-amount-cell">{row.name}</td><td>{row.quantity} {row.unit}</td><td className="owner-sales-amount">{formatCurrency(row.revenue)}</td></tr>) : !loading && <tr><td className="owner-empty-cell" colSpan={3}>Belum ada barang terjual lunas pada periode ini.</td></tr>}</tbody>
            </table></div>
          </section>
          <section className="owner-sales-total"><div><small>Total penjualan</small><strong>{formatCurrency(totalSales)}</strong></div><strong>{salesRows.length} jenis barang terjual · {itemCount} item</strong></section>
        </>
      ) : (
        <>
          <section className="owner-content-panel owner-transactions-panel">
            <div className="owner-section-title"><div><h2>{transactionRows.length} transaksi pada {formatDate(from)} – {formatDate(to)}</h2><p>Semua transaksi pada periode yang dipilih.</p></div></div>
            <TransactionTable rows={transactionRows} />
          </section>
          <section className="owner-transactions-total"><span className="owner-total-icon"><OwnerIcon name="wallet" /></span><div><strong>{formatCurrency(totalTransactions)}</strong><small>Total nilai transaksi</small></div><strong>{paidCount} lunas, {transactionRows.length - paidCount} belum lunas</strong></section>
        </>
      )}
      {!loading && <button className="owner-refresh-link" onClick={() => setReloadKey((value) => value + 1)} type="button">Perbarui laporan</button>}
      {modal && <NoticeModal title={modal === "download" ? "Berhasil diunduh PDF!" : "Berhasil dicetak!"} onClose={() => setModal(null)} />}
    </>
  );
}

function OwnerArchive() {
  const { data, loading, error } = useOwnerData<{ rows: ArchiveRow[] }>("/api/owner?view=archive", { rows: [] });
  const [selected, setSelected] = useState<ArchiveRow | null>(null);
  return (
    <>
      <OwnerHeader title="Arsip Laporan" description="Laporan yang sudah diarsipkan oleh Admin." />
      <ErrorNotice message={error} />
      {loading && <p className="owner-loading">Memuat arsip laporan...</p>}
      <section className="owner-archive-grid">
        {data.rows.map((row) => <article className="owner-archive-card" key={row.id}>
          <div className="owner-archive-cover"><OwnerIcon name="archive" /></div>
          <h2>{row.kind}</h2>
          <p>{formatDate(row.from)} - {formatDate(row.to)}</p>
          <span className="owner-status paid">{row.status}</span>
          <div className="owner-archive-footer"><small>{row.id} · dibuat {formatDate(row.createdAt)}</small><button onClick={() => setSelected(row)} type="button"><OwnerIcon name="eye" />Buka</button></div>
        </article>)}
        {!loading && !data.rows.length && <div className="owner-empty-panel"><OwnerIcon name="archive" /><strong>Belum ada arsip laporan</strong><span>Laporan yang diarsipkan Admin akan tampil di sini.</span></div>}
      </section>
      {selected && <ArchiveModal archive={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function ArchiveModal({ archive, onClose }: { archive: ArchiveRow; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div aria-label={`Pratinjau ${archive.kind}`} aria-modal="true" className="owner-modal-backdrop owner-archive-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
      <button aria-label="Tutup pratinjau" className="owner-modal-close" onClick={onClose} type="button"><OwnerIcon name="close" /></button>
      <article className="owner-archive-preview">
        <h2><OwnerIcon name="eye" />{archive.kind}</h2>
        <div className="owner-document-preview"><span>TOKO FARID</span><strong>{archive.kind.toUpperCase()}</strong><small>Periode {formatDate(archive.from)} - {formatDate(archive.to)}</small><hr /><p>Ringkasan data toko<br />Toko Farid · Padang, Sumatera Barat</p><p>Dokumen arsip {archive.id}<br />Dibuat pada {formatDate(archive.createdAt)}</p><span className="owner-document-mark">TF</span></div>
      </article>
    </div>
  );
}

function ProfileField({ icon, label, value }: { icon: OwnerIconName; label: string; value: string }) {
  return <article className="owner-profile-field"><span><OwnerIcon name={icon} /></span><div><small>{label}</small><strong>{value || "—"}</strong></div></article>;
}

function OwnerProfilePage() {
  const router = useRouter();
  const { data, setData, loading, error } = useOwnerData<{ profile: OwnerProfile }>("/api/owner?view=profile", {
    profile: { id: "", name: "", username: "", email: "", phone: "", postalCode: "", address: "", role: "Owner" },
  });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const profile = data.profile;

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice("");
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    try {
      const response = await fetch("/api/owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "profile", ...values }),
      });
      const result = await response.json() as { profile?: OwnerProfile; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error || "Profil belum dapat disimpan.");
      setData({ profile: result.profile });
      setEditing(false);
      setNotice("Data berhasil diubah!");
      router.refresh();
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : "Profil belum dapat disimpan.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <OwnerHeader title="Profil Saya" description="Data akun yang sedang digunakan." action={!editing && <button className="owner-light-button" onClick={() => { setEditing(true); setNotice(""); }} type="button"><OwnerIcon name="edit" />Ubah profil</button>} />
      <ErrorNotice message={error} />
      {loading && <p className="owner-loading">Memuat profil Owner...</p>}
      <div className="owner-profile-grid">
        <section className="owner-profile-summary">
          <div className="owner-profile-cover" /><span className="owner-avatar-large">{initials(profile.name)}</span>
          <div className="owner-profile-identity"><h2>{profile.name}</h2><p>@{profile.username}</p><span>Owner</span></div>
          <div className="owner-profile-stats"><div><OwnerIcon name="archive" /><strong>1</strong><small>Pesanan</small></div><div><OwnerIcon name="check" /><strong>1</strong><small>Selesai</small></div><div><OwnerIcon name="trend" /><strong>120</strong><small>Poin</small></div></div>
          <button className="owner-primary-button" onClick={() => { setEditing(true); setNotice(""); }} type="button"><OwnerIcon name="edit" />Ubah profil</button>
          <button className="owner-profile-logout" onClick={async () => { await fetch("/api/owner", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "logout" }) }); router.replace("/owner/login"); }} type="button"><OwnerIcon name="logout" />Logout</button>
        </section>
        <section className="owner-content-panel owner-profile-data">
          <div className="owner-section-title"><div><h2>Data akun</h2><p>Data akun yang sedang digunakan.</p></div></div>
          {editing ? <form className="owner-profile-form" onSubmit={save}>
            <label className="owner-field"><span>Nama lengkap</span><input autoComplete="name" defaultValue={profile.name} name="name" required /></label>
            <label className="owner-field"><span>Username</span><input autoComplete="username" defaultValue={profile.username} name="username" required /></label>
            <label className="owner-field"><span>No. telepon</span><input autoComplete="tel" defaultValue={profile.phone} name="phone" required /></label>
            <label className="owner-field"><span>Email</span><input autoComplete="email" defaultValue={profile.email} name="email" required type="email" /></label>
            <label className="owner-field"><span>Kode pos</span><input autoComplete="postal-code" defaultValue={profile.postalCode} name="postalCode" required /></label>
            <label className="owner-field"><span>Alamat</span><input autoComplete="street-address" defaultValue={profile.address} name="address" required /></label>
            <div className="owner-profile-form-actions"><button className="owner-primary-button" disabled={saving} type="submit"><OwnerIcon name="check" />{saving ? "Menyimpan..." : "Simpan perubahan"}</button><button className="owner-cancel-button" onClick={() => { setEditing(false); setNotice(""); }} type="button">Batal</button></div>
          </form> : <div className="owner-profile-fields">
            <ProfileField icon="lock" label="ID akun" value={ownerIdLabel(profile.id)} />
            <ProfileField icon="shield" label="Role" value={profile.role} />
            <ProfileField icon="user" label="Nama lengkap" value={profile.name} />
            <ProfileField icon="user" label="Username" value={profile.username} />
            <ProfileField icon="phone" label="No. telepon" value={profile.phone} />
            <ProfileField icon="mail" label="Email" value={profile.email} />
            <ProfileField icon="map" label="Kode pos" value={profile.postalCode} />
            <ProfileField icon="map" label="Alamat" value={profile.address} />
          </div>}
          {notice && <p aria-live="polite" className={notice === "Data berhasil diubah!" ? "owner-success-notice" : "owner-error-notice"}><OwnerIcon name={notice === "Data berhasil diubah!" ? "check" : "info"} />{notice}</p>}
        </section>
      </div>
      {notice === "Data berhasil diubah!" && <NoticeModal title="Data berhasil diubah!" onClose={() => setNotice("")} />}
    </>
  );
}

function NoticeModal({ title, onClose }: { title: string; onClose: () => void }) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div aria-label={title} aria-modal="true" className="owner-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }} role="dialog">
      <button aria-label="Tutup notifikasi" className="owner-modal-close" onClick={onClose} type="button"><OwnerIcon name="close" /></button>
      <div className="owner-notice-modal"><span><OwnerIcon name="check" /></span><h2>{title}</h2></div>
    </div>
  );
}

function pdfEscape(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, " ").replace(/([\\()])/g, "\\$1");
}

function buildPdf(lines: string[]) {
  const content = lines.slice(0, 29).map((line, index) =>
    `BT /F1 10 Tf 48 ${770 - index * 25} Td (${pdfEscape(line)}) Tj ET`,
  ).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${new TextEncoder().encode(content).length} >>\nstream\n${content}\nendstream`,
  ];
  let document = "%PDF-1.4\n";
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(new TextEncoder().encode(document).length);
    document += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(document).length;
  document += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets.slice(1)) document += `${String(offset).padStart(10, "0")} 00000 n \n`;
  document += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([document], { type: "application/pdf" });
}

function downloadPdf(title: string, lines: string[]) {
  const url = URL.createObjectURL(buildPdf(lines));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/\s+/g, "-")}.pdf`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function OwnerPage({ page }: { page: OwnerPageName }) {
  switch (page) {
    case "dashboard": return <OwnerDashboard />;
    case "transactions": return <OwnerReports kind="transactions" />;
    case "sales": return <OwnerReports kind="sales" />;
    case "stock": return <OwnerStock />;
    case "archive": return <OwnerArchive />;
    case "profile": return <OwnerProfilePage />;
  }
}
