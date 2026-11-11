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
import type { PengelolaProfile } from "@/lib/pengelola-session";

type PageName = "dashboard" | "notifications" | "stock" | "locations" | "history" | "profile";
type IconName =
  | "arrow-left" | "arrow-right" | "bell" | "box" | "check" | "close" | "download"
  | "edit" | "grid" | "history" | "info" | "lock" | "logout" | "mail" | "map"
  | "minus" | "phone" | "plus" | "refresh" | "store" | "trash" | "user";
type StockRow = {
  id: string;
  productId: string;
  name: string;
  unit: string;
  locationId: string;
  location: string;
  quantity: number;
  minimum: number;
  updatedAt: string | Date | null;
  status: string;
};
type Location = {
  id: string;
  name: string;
  type: string;
  itemCount: number;
  items: { id: string; name: string; unit: string; quantity: number }[];
};
type Notification = {
  id: string;
  stockId: string;
  message: string;
  date: string | Date;
  status: string;
  product: string;
  unit: string;
  location: string;
  quantity: number;
};
type HistoryRow = {
  id: string;
  stockId: string;
  product: string;
  kind: string;
  quantity: number;
  date: string | Date;
  description: string;
};
type Dashboard = {
  summary: { products: number; lowStock: number; locations: number; notifications: number };
  lowStock: StockRow[];
  history: HistoryRow[];
};
type Product = { id: string; name: string; unit: string; minimum: number };
type ApiError = { error?: string };

const iconShapes: Record<IconName, ReactNode> = {
  "arrow-left": <path d="M19 12H5m7 7-7-7 7-7" />,
  "arrow-right": <path d="M5 12h14m-7-7 7 7-7 7" />,
  bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
  box: <><path d="m3 7 9-4 9 4-9 4-9-4Z" /><path d="M3 7v10l9 4 9-4V7M12 11v10" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v4h14v-4" /></>,
  edit: <><path d="m15 5 4 4M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5m4-1v5l3 2" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
  minus: <path d="M5 12h14" />,
  phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />,
  plus: <path d="M12 5v14m-7-7h14" />,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.6 9a7 7 0 0 1 11.6-2L20 12M4 12l2.8 5a7 7 0 0 0 11.6-2" /></>,
  store: <><path d="M3 10v11h18V10M3 10l2-7h14l2 7" /><path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 21v-6h6v6" /></>,
  trash: <><path d="M3 6h18m-2 0-.8 14H5.8L5 6m4 0V4h6v2m-5 4v6m4-6v6" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor"
      strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
      {iconShapes[name]}
    </svg>
  );
}

const navigation: { href: string; label: string; icon: IconName; page: PageName }[] = [
  { href: "/pengelola", label: "Dashboard", icon: "grid", page: "dashboard" },
  { href: "/pengelola/notifikasi-stok", label: "Notifikasi Stok", icon: "bell", page: "notifications" },
  { href: "/pengelola/stok-barang", label: "Stok Barang", icon: "box", page: "stock" },
  { href: "/pengelola/lokasi-penyimpanan", label: "Lokasi Penyimpanan", icon: "map", page: "locations" },
  { href: "/pengelola/riwayat-stok", label: "Riwayat Stok", icon: "history", page: "history" },
  { href: "/pengelola/profil-saya", label: "Profil Saya", icon: "user", page: "profile" },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "PT";
}

function date(value: string | Date | null | undefined, year = false) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(year ? { year: "numeric" } : {}),
  }).format(parsed);
}

function productImage(name: string) {
  const key = name.toLocaleLowerCase("id-ID");
  const products: [string, string][] = [
    ["beras", "beras.jpg"], ["minyak", "minyak.jpg"], ["susu", "susu-kental.jpg"],
    ["telur", "telur.jpg"], ["tepung", "tepung.jpg"], ["mie", "mie-instan.jpg"],
    ["mi ", "mie-instan.jpg"], ["gula", "gula.jpg"], ["teh", "teh.jpg"],
    ["garam", "garam.jpg"], ["kopi", "kopi.jpg"],
  ];
  const file = products.find(([word]) => key.includes(word))?.[1];
  return file ? `/customer-products/${file}` : null;
}

async function request<T>(body: Record<string, unknown>) {
  const response = await fetch("/api/pengelola", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json() as ApiError & T;
  if (!response.ok) throw new Error(result.error || "Permintaan belum dapat diproses.");
  return result;
}

function useData<T>(url: string, initialData: T) {
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
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [url, revision]);

  return {
    data,
    loading,
    error,
    refresh: () => { setError(""); setLoading(true); setRevision((value) => value + 1); },
  };
}

function ErrorNotice({ children }: { children: string }) {
  return children ? <p aria-live="polite" className="pengelola-error"><Icon name="info" />{children}</p> : null;
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
    <header className="pengelola-page-heading">
      <div><h1>{title}</h1><p>{description}</p></div>
      {action}
    </header>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="pengelola-modal-backdrop" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <button aria-label="Tutup" className="pengelola-modal-close" onClick={onClose} type="button">
        <Icon name="close" />
      </button>
      <section aria-label={title ? undefined : "Pemberitahuan"} aria-labelledby="pengelola-modal-title"
        aria-modal="true" className="pengelola-modal" role="dialog">
        <h2 id="pengelola-modal-title">{title}</h2>
        {children}
      </section>
    </div>
  );
}

function Feedback({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;
  return (
    <Modal onClose={onClose} title="">
      <div className="pengelola-feedback">
        <span><Icon name="check" /></span>
        <h3>{message}</h3>
        <button className="pengelola-primary-button" onClick={onClose} type="button">Selesai</button>
      </div>
    </Modal>
  );
}

export function PengelolaShell({
  profile,
  children,
}: {
  profile: PengelolaProfile;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try {
      await request({ action: "logout" });
      router.replace("/pengelola/login");
    } catch (cause) {
      setLoggingOut(false);
      window.alert(cause instanceof Error ? cause.message : "Logout belum dapat diproses.");
    }
  }

  return (
    <div className="pengelola-shell">
      <aside className="pengelola-sidebar">
        <Link aria-label="Toko Farid Dashboard Pengelola Toko" className="pengelola-brand" href="/pengelola">
          <Image alt="" height={34} priority src="/storefront/toko-farid-logo.png" width={34} />
          <span><strong>Toko Farid</strong><small>Portal Pengelola</small></span>
        </Link>
        <div className="pengelola-user-card">
          <span className="pengelola-avatar-small">{initials(profile.name)}</span>
          <span><strong>{profile.name}</strong><small>Pengelola Toko</small></span>
        </div>
        <span className="pengelola-nav-label">MENU UTAMA</span>
        <nav aria-label="Menu Pengelola Toko" className="pengelola-navigation">
          {navigation.map((item) => {
            const active = item.page === "dashboard" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link aria-current={active ? "page" : undefined} className={active ? "is-active" : ""}
                href={item.href} key={item.page}>
                <Icon name={item.icon} /><span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <button className="pengelola-logout" disabled={loggingOut} onClick={logout} type="button">
          <Icon name="logout" />{loggingOut ? "Keluar..." : "Logout"}
        </button>
      </aside>
      <main className="pengelola-main">
        <header className="pengelola-mobile-header">
          <Link className="pengelola-brand" href="/pengelola">
            <Image alt="" height={34} src="/storefront/toko-farid-logo.png" width={34} />
            <span><strong>Toko Farid</strong><small>Portal Pengelola</small></span>
          </Link>
          <button className="pengelola-mobile-logout" disabled={loggingOut} onClick={logout} type="button">
            <Icon name="logout" />Logout
          </button>
        </header>
        <nav aria-label="Menu Pengelola Toko mobile" className="pengelola-mobile-navigation">
          {navigation.map((item) => (
            <Link aria-current={pathname === item.href ? "page" : undefined}
              className={pathname === item.href ? "is-active" : ""} href={item.href} key={item.page}>
              <Icon name={item.icon} /><span>{item.label}</span>
            </Link>
          ))}
        </nav>
        {children}
      </main>
    </div>
  );
}

export function PengelolaLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [contact, setContact] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await request({ action: "login", identifier, password, remember });
      setSuccess(true);
      window.setTimeout(() => router.replace("/pengelola"), 800);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Login belum dapat diproses.");
      setBusy(false);
    }
  }

  return (
    <main className="pengelola-login-page">
      <section className="pengelola-login-story">
        <Link className="pengelola-login-brand" href="/beranda">
          <Image alt="" height={34} src="/storefront/toko-farid-logo.png" width={34} />
          <span><strong>Toko Farid</strong><small>Belanja Mudah, Kebutuhan Lengkap</small></span>
        </Link>
        <div className="pengelola-login-copy">
          <h1>Portal Internal<br />Toko Farid</h1>
          <p>Masuk sebagai Pengelola Toko untuk mengelola toko.<br />Akun internal dibuat dan dikelola oleh Admin.</p>
          <ul>
            <li><span><Icon name="bell" /></span><div><strong>Terima notifikasi stok menipis</strong><small>Menu di Portal Pengelola Toko</small></div></li>
            <li><span><Icon name="box" /></span><div><strong>Kelola stok barang &amp; restock</strong><small>Menu di Portal Pengelola Toko</small></div></li>
            <li><span><Icon name="map" /></span><div><strong>Atur lokasi penyimpanan</strong><small>Menu di Portal Pengelola Toko</small></div></li>
            <li><span><Icon name="history" /></span><div><strong>Pantau riwayat stok masuk/keluar</strong><small>Menu di Portal Pengelola Toko</small></div></li>
          </ul>
        </div>
        <Link className="pengelola-back-home" href="/beranda"><Icon name="arrow-left" />Kembali ke Beranda</Link>
      </section>
      <section className="pengelola-login-panel">
        <div className="pengelola-login-card">
          <header className="pengelola-login-card-head">
            <span><Icon name="store" /></span>
            <div><h2>Login Pengelola Toko</h2><p>Portal Internal Toko Farid</p></div>
          </header>
          <form className="pengelola-login-form" onSubmit={submit}>
            <label htmlFor="pengelola-identifier">Username atau Email</label>
            <div className="pengelola-login-input">
              <Icon name="user" />
              <input autoComplete="username" id="pengelola-identifier" onChange={(event) => setIdentifier(event.target.value)}
                placeholder="Masukkan Username atau Email" required value={identifier} />
            </div>
            <label htmlFor="pengelola-password">Password</label>
            <div className="pengelola-login-input">
              <Icon name="lock" />
              <input autoComplete="current-password" id="pengelola-password" onChange={(event) => setPassword(event.target.value)}
                placeholder="Masukkan Password" required type={visible ? "text" : "password"} value={password} />
              <button aria-label={visible ? "Sembunyikan password" : "Tampilkan password"}
                onClick={() => setVisible((value) => !value)} type="button"><Icon name="info" /></button>
            </div>
            <div className="pengelola-login-options">
              <label><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" />Ingat saya</label>
              <button onClick={() => setContact((value) => !value)} type="button">Hubungi Admin</button>
            </div>
            <ErrorNotice>{error}</ErrorNotice>
            <button className="pengelola-login-submit" disabled={busy} type="submit">
              {busy ? "Memeriksa..." : "Masuk"}<Icon name="arrow-right" />
            </button>
            <div className="pengelola-login-note">
              <Icon name="info" />
              <p><strong>Akun internal tidak bisa mendaftar sendiri.</strong>
                <small>{contact ? "Silakan hubungi Admin Toko Farid untuk bantuan akun." : "Minta Admin Toko Farid untuk membuatkan akun."}</small>
              </p>
            </div>
          </form>
        </div>
      </section>
      {success && <Feedback message="Login Berhasil!" onClose={() => router.replace("/pengelola")} />}
    </main>
  );
}

function Table({
  headings,
  children,
  empty,
}: {
  headings: string[];
  children: ReactNode;
  empty?: boolean;
}) {
  return (
    <div className="pengelola-table-scroll">
      <table className="pengelola-table">
        <thead><tr>{headings.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead>
        <tbody>{empty
          ? <tr><td className="pengelola-empty" colSpan={headings.length}>Belum ada data untuk ditampilkan.</td></tr>
          : children}</tbody>
      </table>
    </div>
  );
}

function ProductThumbnail({ name }: { name: string }) {
  const image = productImage(name);
  return (
    <span className="pengelola-product-image">
      {image ? <Image alt={name} fill sizes="54px" src={image} /> : <Icon name="box" />}
    </span>
  );
}

function Status({ children }: { children: string }) {
  return <span className={`pengelola-status ${children.toLocaleLowerCase("id-ID").includes("dibaca") || children === "Aman" ? "is-good" : "is-warning"}`}>{children}</span>;
}

function DashboardPage() {
  const { data, loading, error } = useData<Dashboard>(
    "/api/pengelola?view=dashboard",
    { summary: { products: 0, lowStock: 0, locations: 0, notifications: 0 }, lowStock: [], history: [] },
  );
  return (
    <div className="pengelola-page">
      <PageHeading title="Dashboard" description="Pantau stok barang dan aktivitas toko." />
      <ErrorNotice>{error}</ErrorNotice>
      <section aria-label="Ringkasan stok" className="pengelola-summary-grid">
        <Link aria-label="Jenis barang, buka Stok Barang" className="pengelola-summary-card" href="/pengelola/stok-barang">
          <span><Icon name="box" /></span><div><small>Jenis barang</small><strong>{loading ? "—" : data.summary.products}</strong></div>
        </Link>
        <Link aria-label="Stok menipis, buka Stok Barang" className="pengelola-summary-card is-warning" href="/pengelola/stok-barang">
          <span><Icon name="bell" /></span><div><small>Stok menipis</small><strong>{loading ? "—" : data.summary.lowStock}</strong></div>
        </Link>
        <Link aria-label="Lokasi penyimpanan, buka Lokasi Penyimpanan" className="pengelola-summary-card is-blue" href="/pengelola/lokasi-penyimpanan">
          <span><Icon name="map" /></span><div><small>Lokasi penyimpanan</small><strong>{loading ? "—" : data.summary.locations}</strong></div>
        </Link>
        <Link aria-label="Notifikasi belum dibaca, buka Notifikasi Stok" className="pengelola-summary-card" href="/pengelola/notifikasi-stok">
          <span><Icon name="history" /></span><div><small>Notifikasi belum dibaca</small><strong>{loading ? "—" : data.summary.notifications}</strong></div>
        </Link>
      </section>
      <section className="pengelola-panel">
        <div className="pengelola-section-heading">
          <div><h2>Stok barang menipis</h2><p>Kelola stok di toko dan gudang.</p></div>
          <Link className="pengelola-outline-button" href="/pengelola/stok-barang">Lihat stok barang</Link>
        </div>
        <Table headings={["FOTO", "ID", "BARANG", "LOKASI", "JML", "MIN", "UPDATE", "STATUS"]} empty={!loading && !data.lowStock.length}>
          {data.lowStock.map((row) => (
            <tr key={row.id}><td><ProductThumbnail name={row.name} /></td><td className="pengelola-id">{row.id}</td>
              <td className="pengelola-item-name">{row.name}</td><td>{row.location}</td><td className="is-low">{row.quantity}</td>
              <td>{row.minimum}</td><td>{date(row.updatedAt)}</td><td><Status>{row.status}</Status></td></tr>
          ))}
        </Table>
      </section>
      <section className="pengelola-panel">
        <div className="pengelola-section-heading">
          <div><h2>Riwayat stok terbaru</h2><p>Catatan barang masuk dan keluar.</p></div>
          <Link className="pengelola-outline-button" href="/pengelola/riwayat-stok">Lihat riwayat</Link>
        </div>
        <Table headings={["ID", "BARANG", "JENIS", "JUMLAH", "TANGGAL", "KETERANGAN"]} empty={!loading && !data.history.length}>
          {data.history.map((row) => (
            <tr key={row.id}><td className="pengelola-id">{row.id}</td><td className="pengelola-item-name">{row.product}</td>
              <td><Status>{row.kind}</Status></td><td className={row.quantity < 0 ? "is-low" : ""}>{row.quantity > 0 ? `+${row.quantity}` : row.quantity}</td>
              <td>{date(row.date, true)}</td><td>{row.description || "—"}</td></tr>
          ))}
        </Table>
      </section>
    </div>
  );
}

function StockPage() {
  const { data, loading, error, refresh } = useData<{ rows: StockRow[] }>(
    "/api/pengelola?view=stock", { rows: [] },
  );
  const [catalog, setCatalog] = useState<{ products: Product[]; locations: Location[] }>({ products: [], locations: [] });
  const [modal, setModal] = useState<"create" | "edit" | "restock" | "delete" | "">("");
  const [selected, setSelected] = useState<StockRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    fetch("/api/pengelola?view=catalog", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as ApiError & { products: Product[]; locations: Location[] };
        if (!response.ok) throw new Error(result.error || "Data barang belum dapat dimuat.");
        setCatalog({ products: result.products, locations: result.locations });
      })
      .catch((cause: unknown) => {
        setActionError(cause instanceof Error ? cause.message : "Data barang belum dapat dimuat.");
      });
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected && modal !== "create") return;
    setBusy(true);
    setActionError("");
    const form = new FormData(event.currentTarget);
    try {
      if (modal === "create") {
        await request({ action: "stock:create", productId: form.get("productId"), locationId: form.get("locationId"), quantity: Number(form.get("quantity")) });
        setFeedback("Berhasil ditambahkan!");
      } else if (modal === "edit" && selected) {
        await request({ action: "stock:update", stockId: selected.id, quantity: Number(form.get("quantity")), locationId: form.get("locationId") });
        setFeedback("Berhasil diubah!");
      } else if (modal === "restock" && selected) {
        await request({ action: "stock:restock", stockId: selected.id, quantity: Number(form.get("quantity")) });
        setFeedback("Berhasil direstok!");
      } else if (modal === "delete" && selected) {
        await request({ action: "stock:delete", stockId: selected.id });
        setFeedback("Berhasil dihapus!");
      }
      setModal("");
      setSelected(null);
      refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Perubahan stok belum dapat disimpan.");
    } finally {
      setBusy(false);
    }
  }

  const lowCount = data.rows.filter((row) => row.quantity < row.minimum).length;
  return (
    <div className="pengelola-page">
      <PageHeading action={<button className="pengelola-white-button" onClick={() => { setSelected(null); setActionError(""); setModal("create"); }} type="button"><Icon name="plus" />Tambah Stok</button>}
        description="Kelola stok di toko dan gudang." title="Stok Barang" />
      <section className="pengelola-panel">
        <div className="pengelola-section-heading"><div><h2>Stok barang ({lowCount} di bawah minimum)</h2><p>Kelola stok di toko dan gudang.</p></div>
          <button aria-label="Muat ulang stok" className="pengelola-icon-button" onClick={refresh} type="button"><Icon name="refresh" /></button></div>
        <ErrorNotice>{error || actionError}</ErrorNotice>
        {loading ? <p className="pengelola-loading-note">Memuat stok barang...</p> : (
          <Table headings={["FOTO", "ID", "BARANG", "LOKASI", "JML", "MIN", "UPDATE", "STATUS", "AKSI"]} empty={!data.rows.length}>
            {data.rows.map((row) => (
              <tr key={row.id}><td><ProductThumbnail name={row.name} /></td><td className="pengelola-id">{row.id}</td>
                <td className="pengelola-item-name">{row.name}</td><td>{row.location}</td>
                <td className={row.quantity < row.minimum ? "is-low" : "pengelola-strong"}>{row.quantity}</td>
                <td>{row.minimum}</td><td>{date(row.updatedAt)}</td><td><Status>{row.status}</Status></td>
                <td className="pengelola-actions">
                  <button className="pengelola-action restock" onClick={() => { setSelected(row); setActionError(""); setModal("restock"); }} type="button"><Icon name="refresh" /><span>Restock</span></button>
                  <button aria-label={`Ubah ${row.name}`} className="pengelola-action edit" onClick={() => { setSelected(row); setActionError(""); setModal("edit"); }} type="button"><Icon name="edit" /></button>
                  <button aria-label={`Hapus ${row.name}`} className="pengelola-action delete" onClick={() => { setSelected(row); setActionError(""); setModal("delete"); }} type="button"><Icon name="trash" /></button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </section>
      {modal && (
        <Modal onClose={() => { setModal(""); setActionError(""); }} title={
          modal === "create" ? "Tambah Stok" : modal === "edit" ? "Ubah Stok Barang" : modal === "restock" ? "Restock Barang" : "Hapus Stok Barang"
        }>
          {modal === "delete" ? (
            <form className="pengelola-dialog-form" onSubmit={submit}>
              <p>Hapus stok {selected?.name} dari daftar stok barang?</p><ErrorNotice>{actionError}</ErrorNotice>
              <div className="pengelola-form-actions"><button className="pengelola-outline-button" onClick={() => setModal("")} type="button">Batal</button>
                <button className="pengelola-danger-button" disabled={busy} type="submit">{busy ? "Menghapus..." : "Hapus"}</button></div>
            </form>
          ) : (
            <form className="pengelola-dialog-form" onSubmit={submit}>
              {modal === "create" && <label>Barang<select name="productId" required defaultValue=""><option disabled value="">Pilih barang</option>
                {catalog.products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>}
              <label>{modal === "restock" ? "Jumlah tambahan" : "Jumlah stok"}
                <input min={modal === "restock" ? 1 : 0} name="quantity" required type="number" defaultValue={modal === "edit" ? selected?.quantity : ""} /></label>
              {modal !== "restock" && <label>Lokasi<select name="locationId" required defaultValue={modal === "edit" ? selected?.locationId : ""}>
                <option disabled value="">Pilih lokasi</option>{catalog.locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>}
              <ErrorNotice>{actionError}</ErrorNotice>
              <div className="pengelola-form-actions"><button className="pengelola-outline-button" onClick={() => setModal("")} type="button">Batal</button>
                <button className="pengelola-primary-button" disabled={busy} type="submit">{busy ? "Menyimpan..." : "Simpan"}</button></div>
            </form>
          )}
        </Modal>
      )}
      <Feedback message={feedback} onClose={() => setFeedback("")} />
    </div>
  );
}

function LocationsPage() {
  const { data, loading, error, refresh } = useData<{ rows: Location[] }>(
    "/api/pengelola?view=locations", { rows: [] },
  );
  const [modal, setModal] = useState<"create" | "edit" | "delete" | "">("");
  const [selected, setSelected] = useState<Location | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected && modal !== "create") return;
    setBusy(true);
    setActionError("");
    const form = new FormData(event.currentTarget);
    try {
      const action = modal === "create" ? "location:create" : modal === "edit" ? "location:update" : "location:delete";
      await request({
        action,
        locationId: selected?.id,
        name: form.get("name"),
        type: form.get("type"),
      });
      setModal("");
      setSelected(null);
      setFeedback(modal === "create" ? "Berhasil ditambahkan!" : modal === "edit" ? "Berhasil diubah!" : "Berhasil dihapus!");
      refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Perubahan lokasi belum dapat disimpan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pengelola-page">
      <PageHeading action={<button className="pengelola-white-button" onClick={() => { setSelected(null); setActionError(""); setModal("create"); }} type="button"><Icon name="plus" />Tambah Lokasi</button>}
        description="Tempat barang disimpan di toko dan gudang." title="Lokasi Penyimpanan" />
      <ErrorNotice>{error}</ErrorNotice>
      {loading ? <p className="pengelola-loading-note">Memuat lokasi penyimpanan...</p> : (
        <>
          <section aria-label="Barang di lokasi" className="pengelola-location-cards">
            {data.rows.map((location, index) => (
              <article className={`pengelola-location-card ${index % 2 ? "is-blue" : ""}`} key={location.id}>
                <header><span><Icon name={location.type.toLocaleLowerCase("id-ID").includes("gudang") ? "box" : "store"} /></span>
                  <div><h2>{location.name}</h2><p>{location.id} · Jenis: {location.type} · {location.itemCount} item stok</p></div></header>
                <div className="pengelola-location-content">
                  <strong>Barang yang disimpan</strong>
                  {location.items.length ? <div className="pengelola-location-items">
                    {location.items.map((item, index) => <div key={`${location.id}-${item.id}-${index}`}>
                      <ProductThumbnail name={item.name} /><b>{item.name}</b><small>{item.quantity} {item.unit}</small>
                    </div>)}
                  </div> : <p className="pengelola-empty-note">Belum ada barang disimpan.</p>}
                  <div className="pengelola-location-actions">
                    <button className="pengelola-action edit" onClick={() => { setSelected(location); setActionError(""); setModal("edit"); }} type="button"><Icon name="edit" />Ubah</button>
                    <button className="pengelola-action delete" onClick={() => { setSelected(location); setActionError(""); setModal("delete"); }} type="button"><Icon name="trash" />Hapus</button>
                  </div>
                </div>
              </article>
            ))}
          </section>
          <section className="pengelola-panel">
            <div className="pengelola-section-heading"><div><h2>Daftar lokasi</h2><p>Tempat barang disimpan di toko dan gudang.</p></div></div>
            <Table headings={["ID", "NAMA LOKASI", "JENIS", "JUMLAH ITEM STOK", "AKSI"]} empty={!data.rows.length}>
              {data.rows.map((location) => (
                <tr key={location.id}><td className="pengelola-id">{location.id}</td><td className="pengelola-item-name">{location.name}</td>
                  <td><span className={`pengelola-location-type ${location.type.toLowerCase().includes("gudang") ? "is-blue" : ""}`}>{location.type}</span></td>
                  <td>{location.itemCount}</td><td className="pengelola-actions">
                    <button className="pengelola-action edit" onClick={() => { setSelected(location); setActionError(""); setModal("edit"); }} type="button"><Icon name="edit" />Ubah</button>
                    <button className="pengelola-action delete" onClick={() => { setSelected(location); setActionError(""); setModal("delete"); }} type="button"><Icon name="trash" />Hapus</button>
                  </td></tr>
              ))}
            </Table>
          </section>
        </>
      )}
      {modal && <Modal onClose={() => { setModal(""); setActionError(""); }} title={
        modal === "create" ? "Tambah Lokasi" : modal === "edit" ? "Ubah Lokasi Penyimpanan" : "Hapus Lokasi Penyimpanan"
      }>
        <form className="pengelola-dialog-form" onSubmit={submit}>
          {modal === "delete" ? <p>Hapus lokasi {selected?.name}?</p> : <>
            <label>Nama lokasi<input maxLength={100} name="name" required defaultValue={modal === "edit" ? selected?.name : ""} /></label>
            <label>Jenis lokasi<select name="type" required defaultValue={modal === "edit" ? selected?.type : ""}>
              <option disabled value="">Pilih jenis lokasi</option><option value="Toko">Toko</option><option value="Gudang">Gudang</option>
            </select></label>
          </>}
          <ErrorNotice>{actionError}</ErrorNotice>
          <div className="pengelola-form-actions"><button className="pengelola-outline-button" onClick={() => setModal("")} type="button">Batal</button>
            <button className={modal === "delete" ? "pengelola-danger-button" : "pengelola-primary-button"} disabled={busy} type="submit">
              {busy ? "Menyimpan..." : modal === "delete" ? "Hapus" : "Simpan"}</button></div>
        </form>
      </Modal>}
      <Feedback message={feedback} onClose={() => setFeedback("")} />
    </div>
  );
}

function NotificationsPage() {
  const { data, loading, error, refresh } = useData<{ rows: Notification[] }>(
    "/api/pengelola?view=notifications", { rows: [] },
  );
  const [selected, setSelected] = useState<Notification | null>(null);
  const [amount, setAmount] = useState("1");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [feedback, setFeedback] = useState("");

  async function markRead(notification: Notification) {
    setBusy(true);
    setActionError("");
    try {
      await request({ action: "notifications:read", notificationId: notification.id });
      refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Notifikasi belum dapat ditandai.");
    } finally {
      setBusy(false);
    }
  }

  async function markAllRead() {
    setBusy(true);
    setActionError("");
    try {
      await request({ action: "notifications:read-all" });
      refresh();
      setFeedback("Berhasil ditandai!");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Notifikasi belum dapat ditandai.");
    } finally {
      setBusy(false);
    }
  }

  async function restock(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setBusy(true);
    setActionError("");
    try {
      await request({ action: "stock:restock", stockId: selected.stockId, quantity: Number(amount) });
      await request({ action: "notifications:read", notificationId: selected.id });
      setSelected(null);
      refresh();
      setFeedback("Berhasil direstok!");
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Stok belum dapat direstok.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pengelola-page">
      <PageHeading action={<button className="pengelola-white-button" disabled={busy} onClick={markAllRead} type="button"><Icon name="check" />Tandai semua dibaca</button>}
        description="Pemberitahuan saat stok berada di bawah minimum." title="Notifikasi Stok" />
      <ErrorNotice>{error || actionError}</ErrorNotice>
      <section aria-label="Daftar notifikasi stok" className="pengelola-notification-list">
        {loading ? <p className="pengelola-loading-note">Memuat notifikasi...</p> : data.rows.length ? data.rows.map((notification) => {
          const unread = !notification.status.toLocaleLowerCase("id-ID").includes("dibaca");
          return (
            <article className={`pengelola-notification ${unread ? "is-unread" : ""}`} key={notification.id}>
              <ProductThumbnail name={notification.product} />
              <div className="pengelola-notification-copy"><strong>{notification.message}</strong>
                <small>{date(notification.date, true)} · {notification.id} · {notification.stockId}</small></div>
              <Status>{unread ? "Belum Dibaca" : "Dibaca"}</Status>
              {unread && <button className="pengelola-action edit" disabled={busy} onClick={() => markRead(notification)} type="button"><Icon name="check" /><span>Tandai dibaca</span></button>}
              <button className="pengelola-restock-button" onClick={() => { setSelected(notification); setAmount("1"); setActionError(""); }} type="button">Restock</button>
            </article>
          );
        }) : <p className="pengelola-empty-note">Tidak ada notifikasi stok.</p>}
      </section>
      {selected && <Modal onClose={() => setSelected(null)} title="Restock Barang">
        <form className="pengelola-dialog-form" onSubmit={restock}>
          <p>{selected.product} · {selected.location} · stok saat ini {selected.quantity} {selected.unit}</p>
          <label>Jumlah tambahan<input min="1" onChange={(event) => setAmount(event.target.value)} required type="number" value={amount} /></label>
          <ErrorNotice>{actionError}</ErrorNotice>
          <div className="pengelola-form-actions"><button className="pengelola-outline-button" onClick={() => setSelected(null)} type="button">Batal</button>
            <button className="pengelola-primary-button" disabled={busy} type="submit">{busy ? "Menyimpan..." : "Restock"}</button></div>
        </form>
      </Modal>}
      <Feedback message={feedback} onClose={() => setFeedback("")} />
    </div>
  );
}

function HistoryPage() {
  const { data, loading, error } = useData<{ rows: HistoryRow[] }>(
    "/api/pengelola?view=history", { rows: [] },
  );
  const [feedback, setFeedback] = useState("");

  function download() {
    const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
    const lines = [
      ["FOTO", "ID", "BARANG", "JENIS", "JUMLAH", "TANGGAL", "KETERANGAN"].map(escape).join(","),
      ...data.rows.map((row) => [
        productImage(row.product) ?? "",
        row.id,
        row.product,
        row.kind,
        row.quantity,
        date(row.date, true),
        row.description,
      ].map(escape).join(",")),
    ];
    const blob = new Blob(["\uFEFF", lines.join("\r\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "riwayat-stok.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setFeedback("Berhasil diunduh!");
  }

  return (
    <div className="pengelola-page">
      <PageHeading action={<button className="pengelola-white-button" disabled={loading || !data.rows.length} onClick={download} type="button"><Icon name="download" />Unduh riwayat</button>}
        description="Catatan barang masuk dan keluar." title="Riwayat Stok" />
      <section className="pengelola-panel">
        <div className="pengelola-section-heading"><div><h2>Riwayat stok</h2><p>Catatan barang masuk dan keluar.</p></div></div>
        <ErrorNotice>{error}</ErrorNotice>
        {loading ? <p className="pengelola-loading-note">Memuat riwayat stok...</p> : (
          <Table headings={["FOTO", "ID", "BARANG", "JENIS", "JUMLAH", "TANGGAL", "KETERANGAN"]} empty={!data.rows.length}>
            {data.rows.map((row) => <tr key={row.id}><td><ProductThumbnail name={row.product} /></td><td className="pengelola-id">{row.id}</td>
              <td className="pengelola-item-name">{row.product}</td><td><Status>{row.kind}</Status></td>
              <td className={row.quantity < 0 ? "is-low" : "pengelola-strong"}>{row.quantity}</td>
              <td>{date(row.date, true)}</td><td>{row.description || "—"}</td></tr>)}
          </Table>
        )}
      </section>
      <Feedback message={feedback} onClose={() => setFeedback("")} />
    </div>
  );
}

function ProfilePage({ initialProfile }: { initialProfile: PengelolaProfile }) {
  const { data, loading, error, refresh } = useData<{ profile: PengelolaProfile }>(
    "/api/pengelola?view=profile", { profile: initialProfile },
  );
  const [editing, setEditing] = useState(false);
  const [values, setValues] = useState(initialProfile);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");
  const [feedback, setFeedback] = useState("");
  const profile = data.profile;

  function setField(field: keyof PengelolaProfile, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setActionError("");
    try {
      const result = await request<{ profile: PengelolaProfile }>({ action: "profile", ...values });
      setValues(result.profile);
      setEditing(false);
      setFeedback("Data berhasil diubah!");
      refresh();
    } catch (cause) {
      setActionError(cause instanceof Error ? cause.message : "Profil belum dapat diperbarui.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pengelola-page">
      <PageHeading action={!editing && <button className="pengelola-white-button" onClick={() => { setValues(profile); setActionError(""); setEditing(true); }} type="button"><Icon name="edit" />Ubah profil</button>}
        description="Data akun yang sedang digunakan." title="Profil Saya" />
      <ErrorNotice>{error || actionError}</ErrorNotice>
      {loading ? <p className="pengelola-loading-note">Memuat profil...</p> : (
        <div className="pengelola-profile-layout">
          <section className="pengelola-profile-card">
            <div className="pengelola-profile-cover" />
            <span className="pengelola-avatar-large">{initials(profile.name)}</span>
            <h2>{profile.name}</h2><p>@{profile.username}</p><Status>{profile.role}</Status>
            {editing ? <button className="pengelola-outline-button" onClick={() => { setEditing(false); setValues(profile); }} type="button">Batal ubah profil</button>
              : <button className="pengelola-primary-button" onClick={() => { setValues(profile); setEditing(true); }} type="button"><Icon name="edit" />Ubah profil</button>}
          </section>
          <section className="pengelola-profile-details">
            <div className="pengelola-section-heading"><div><h2>Data akun</h2><p>Data akun yang sedang digunakan.</p></div></div>
            {editing ? <form className="pengelola-profile-form" onSubmit={submit}>
              <label>Nama lengkap<input maxLength={100} onChange={(event) => setField("name", event.target.value)} required value={values.name} /></label>
              <label>Username<input maxLength={50} onChange={(event) => setField("username", event.target.value)} required value={values.username} /></label>
              <label>No. telepon<input maxLength={20} onChange={(event) => setField("phone", event.target.value)} required value={values.phone} /></label>
              <label>Email<input maxLength={100} onChange={(event) => setField("email", event.target.value)} required type="email" value={values.email} /></label>
              <label>Kode pos<input maxLength={10} onChange={(event) => setField("postalCode", event.target.value)} required value={values.postalCode} /></label>
              <label>Alamat<input maxLength={150} onChange={(event) => setField("address", event.target.value)} required value={values.address} /></label>
              <ErrorNotice>{actionError}</ErrorNotice>
              <div className="pengelola-form-actions"><button className="pengelola-outline-button" onClick={() => { setEditing(false); setValues(profile); }} type="button">Batal</button>
                <button className="pengelola-primary-button" disabled={busy} type="submit">{busy ? "Menyimpan..." : "Simpan perubahan"}</button></div>
            </form> : <div className="pengelola-profile-grid">
              <ProfileInfo icon="lock" label="ID akun" value={profile.id} />
              <ProfileInfo icon="info" label="Role" value={profile.role} />
              <ProfileInfo icon="user" label="Nama lengkap" value={profile.name} />
              <ProfileInfo icon="user" label="Username" value={profile.username} />
              <ProfileInfo icon="phone" label="No. telepon" value={profile.phone} />
              <ProfileInfo icon="mail" label="Email" value={profile.email} />
              <ProfileInfo icon="map" label="Kode pos" value={profile.postalCode} />
              <ProfileInfo icon="map" label="Alamat" value={profile.address} />
            </div>}
          </section>
        </div>
      )}
      <Feedback message={feedback} onClose={() => setFeedback("")} />
    </div>
  );
}

function ProfileInfo({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <article className="pengelola-profile-info"><span><Icon name={icon} /></span><p><small>{label}</small><strong>{value || "—"}</strong></p></article>;
}

export function PengelolaPage({ page }: { page: PageName }) {
  const [profile, setProfile] = useState<PengelolaProfile | null>(null);
  const [profileError, setProfileError] = useState("");
  useEffect(() => {
    if (page !== "profile") return;
    fetch("/api/pengelola?view=profile", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as ApiError & { profile: PengelolaProfile };
        if (!response.ok) throw new Error(result.error || "Profil belum dapat dimuat.");
        setProfile(result.profile);
      })
      .catch((cause: unknown) => {
        setProfileError(cause instanceof Error ? cause.message : "Profil belum dapat dimuat.");
      });
  }, [page]);

  if (page === "dashboard") return <DashboardPage />;
  if (page === "stock") return <StockPage />;
  if (page === "locations") return <LocationsPage />;
  if (page === "notifications") return <NotificationsPage />;
  if (page === "history") return <HistoryPage />;
  if (profile) return <ProfilePage initialProfile={profile} />;
  return profileError
    ? <div className="pengelola-page"><ErrorNotice>{profileError}</ErrorNotice></div>
    : <p className="pengelola-loading-note">Memuat profil...</p>;
}
