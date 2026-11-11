"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  createContext,
  useEffect,
  useState,
  useContext,
  type FormEvent,
  type ReactNode,
} from "react";
import type { AdminProfile } from "@/lib/admin-data";

type AdminPageName = "dashboard" | "accounts" | "products" | "reports" | "backups" | "profile";
type IconName =
  | "archive"
  | "arrow-left"
  | "arrow-right"
  | "box"
  | "calendar"
  | "check"
  | "close"
  | "database"
  | "download"
  | "edit"
  | "eye"
  | "eye-off"
  | "file"
  | "grid"
  | "info"
  | "lock"
  | "logout"
  | "mail"
  | "map"
  | "menu"
  | "phone"
  | "plus"
  | "restore"
  | "shield"
  | "trash"
  | "user"
  | "users";

type AccountRow = {
  id: string;
  name: string;
  username: string;
  role: string;
  email: string;
  phone: string;
};

type ProductRow = {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number;
  minimum: number;
  stock: number;
  locations: string[];
};

type ReportRow = {
  id: string;
  kind: string;
  ownerId: string;
  ownerName: string;
  from: string;
  to: string;
  createdAt: string;
  status: string;
};

type BackupRow = {
  id: string;
  date: string;
  fileName: string;
  status: string;
};

type OwnerOption = { id: string; name: string };
type DialogItem = {
  id?: string;
  name?: string;
  username?: string;
  role?: string;
  email?: string;
  phone?: string;
  address?: string;
  postalCode?: string;
  category?: string;
  unit?: string;
  price?: number;
  minimum?: number;
  stock?: number;
  locations?: string[];
  kind?: string;
  ownerId?: string;
  ownerName?: string;
  from?: string;
  to?: string;
  createdAt?: string;
  status?: string;
};

type DialogState =
  | { kind: "form"; entity: "account" | "product" | "report" | "profile"; mode: "create" | "edit"; item?: DialogItem }
  | { kind: "confirm"; entity: "account" | "product" | "report"; item: DialogItem }
  | { kind: "view"; item: DialogItem }
  | { kind: "feedback"; message: string };

type DashboardPayload = {
  profile: AdminProfile;
  summary: {
    accounts: number;
    products: number;
    reports: number;
    backups: number;
    lowStock: Array<{
      id: string;
      name: string;
      category: string;
      unit: string;
      minimum: number;
      stock: number;
      location: string;
    }>;
    latestBackup: { date: string; fileName: string } | null;
  };
};

const AdminProfileContext = createContext<AdminProfile | null>(null);

const iconShapes: Record<IconName, ReactNode> = {
  archive: <><path d="M3 4h18v5H3z" /><path d="M5 9v11h14V9M10 13h4" /></>,
  "arrow-left": <path d="M19 12H5m7 7-7-7 7-7" />,
  "arrow-right": <path d="M5 12h14m-7-7 7 7-7 7" />,
  box: <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 8 9 5 9-5m-9 5v8" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3" /><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M5 17v4h14v-4" /></>,
  edit: <><path d="m15 5 4 4M4 20l4-.8L19.2 8a2.1 2.1 0 0 0-3-3L5 16.2 4 20Z" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  "eye-off": <><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" /><path d="M9.9 5.2A10.7 10.7 0 0 1 12 5c6.5 0 10 7 10 7a15.7 15.7 0 0 1-3.1 3.8M6.2 6.2C3.5 8 2 12 2 12s3.5 7 10 7c1 0 2-.2 2.8-.5" /></>,
  file: <><path d="M6 3h8l5 5v13H6z" /><path d="M14 3v5h5m-9 5h5m-5 4h5" /></>,
  grid: <><rect x="3" y="3" width="8" height="8" rx="1" /><rect x="13" y="3" width="8" height="8" rx="1" /><rect x="3" y="13" width="8" height="8" rx="1" /><rect x="13" y="13" width="8" height="8" rx="1" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
  lock: <><rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 1 1 8 0v3" /></>,
  logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  map: <><path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z" /><path d="M9 3v15m6-12v15" /></>,
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  phone: <path d="M5 3h4l2 5-3 2a15 15 0 0 0 6 6l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2Z" />,
  plus: <path d="M12 5v14m-7-7h14" />,
  restore: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5m4-1v5l4 2" /></>,
  shield: <><path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" /><path d="m9 12 2 2 4-4" /></>,
  trash: <><path d="M4 7h16m-10 4v6m4-6v6M5 7l1 14h12l1-14M9 7V4h6v3" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2m6-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7a4 4 0 0 1 0 8m2 3a4 4 0 0 1 4 4v2" /></>,
};

function AdminIcon({ name, className }: { name: IconName; className?: string }) {
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

const links: Array<{ href: string; label: string; page: AdminPageName; icon: IconName }> = [
  { href: "/admin", label: "Dashboard", page: "dashboard", icon: "grid" },
  { href: "/admin/kelola-akun", label: "Kelola Akun", page: "accounts", icon: "users" },
  { href: "/admin/kelola-barang", label: "Kelola Barang", page: "products", icon: "box" },
  { href: "/admin/kelola-laporan", label: "Kelola Laporan", page: "reports", icon: "file" },
  { href: "/admin/backup-pemulihan", label: "Backup & Pemulihan", page: "backups", icon: "database" },
  { href: "/admin/profil-saya", label: "Profil Saya", page: "profile", icon: "user" },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "AD";
}

function formatDate(value: string | Date | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatCurrency(value: number) {
  return `Rp ${Math.round(value).toLocaleString("id-ID")}`;
}

function useAdminQuery<T>(url: string, initialData: T) {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    fetch(url, { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json() as { error?: string } & T;
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
  }, [url, reloadKey]);

  return { data, loading, error, refresh: () => setReloadKey((key) => key + 1) };
}

async function postAdmin(body: Record<string, unknown>) {
  const response = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error || "Permintaan belum dapat diproses.");
  return result;
}

function ErrorNotice({ message }: { message: string }) {
  return message ? (
    <p aria-live="polite" className="admin-error-notice">
      <AdminIcon name="info" />
      {message}
    </p>
  ) : null;
}

function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="admin-page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </header>
  );
}

export function AdminPortalShell({
  children,
  profile,
}: {
  children: ReactNode;
  profile: AdminProfile;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const active = links.find((link) => link.href === pathname)?.page ?? "dashboard";

  async function logout() {
    setLoggingOut(true);
    try {
      await postAdmin({ action: "logout" });
      router.replace("/admin/login");
    } catch (error) {
      setLoggingOut(false);
      window.alert(error instanceof Error ? error.message : "Logout belum dapat diproses.");
    }
  }

  return (
    <AdminProfileContext.Provider value={profile}>
    <div className="admin-portal">
      <button
        aria-label={menuOpen ? "Tutup navigasi" : "Buka navigasi"}
        aria-expanded={menuOpen}
        className="admin-mobile-menu"
        onClick={() => setMenuOpen((open) => !open)}
        type="button"
      >
        <AdminIcon name={menuOpen ? "close" : "menu"} />
      </button>
      {menuOpen && <button aria-label="Tutup navigasi" className="admin-sidebar-scrim" onClick={() => setMenuOpen(false)} type="button" />}
      <aside className={`admin-sidebar${menuOpen ? " is-open" : ""}`}>
        <Link aria-label="Toko Farid Portal Admin" className="admin-brand" href="/admin">
          <Image alt="" height={34} src="/storefront/toko-farid-logo.png" width={34} />
          <span><strong>Toko Farid</strong><small>Portal Admin</small></span>
        </Link>
        <div className="admin-user-card">
          <span className="admin-avatar-small">{initials(profile.name)}</span>
          <span><strong>{profile.name}</strong><small>Admin</small></span>
        </div>
        <span className="admin-nav-label">MENU UTAMA</span>
        <nav aria-label="Navigasi Admin" className="admin-navigation">
          {links.map((link) => (
            <Link
              aria-current={active === link.page ? "page" : undefined}
              className={active === link.page ? "is-active" : ""}
              href={link.href}
              key={link.page}
              onClick={() => setMenuOpen(false)}
            >
              <AdminIcon name={link.icon} />
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>
        <button className="admin-logout" disabled={loggingOut} onClick={logout} type="button">
          <AdminIcon name="logout" />
          {loggingOut ? "Keluar..." : "Logout"}
        </button>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
    </AdminProfileContext.Provider>
  );
}

export function AdminLogin() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(false);
  const [contact, setContact] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await postAdmin({ action: "login", identifier, password, remember });
      setSuccess(true);
      window.setTimeout(() => router.replace("/admin"), 700);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Login Admin gagal.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-login-page">
      <section className="admin-login-welcome">
        <Link className="admin-login-brand" href="/beranda">
          <Image alt="" height={34} src="/storefront/toko-farid-logo.png" width={34} />
          <span><strong>Toko Farid</strong><small>Belanja Mudah, Kebutuhan Lengkap</small></span>
        </Link>
        <div className="admin-login-copy">
          <h1>Portal Internal<br />Toko Farid</h1>
          <p>Masuk sebagai Admin untuk mengelola toko.<br />Akun internal dibuat dan dikelola oleh Admin.</p>
          <ul>
            <li><span><AdminIcon name="users" /></span><div><strong>Kelola akun semua peran</strong><small>Menu di Portal Admin</small></div></li>
            <li><span><AdminIcon name="box" /></span><div><strong>Kelola data barang &amp; harga</strong><small>Menu di Portal Admin</small></div></li>
            <li><span><AdminIcon name="file" /></span><div><strong>Kelola laporan untuk Owner</strong><small>Menu di Portal Admin</small></div></li>
            <li><span><AdminIcon name="database" /></span><div><strong>Backup &amp; pemulihan data</strong><small>Menu di Portal Admin</small></div></li>
          </ul>
        </div>
        <Link className="admin-back-home" href="/beranda"><AdminIcon name="arrow-left" />Kembali ke Beranda</Link>
      </section>
      <section className="admin-login-panel">
        <div className="admin-login-card">
          <header className="admin-login-card-head">
            <span className="admin-login-card-icon"><AdminIcon name="shield" /></span>
            <div><h2>Login Admin</h2><p>Portal Internal Toko Farid</p></div>
          </header>
          <form className="admin-login-form" onSubmit={submit}>
            <label className="admin-field">
              <span>Username atau Email</span>
              <span className="admin-input-wrap">
                <AdminIcon name="user" />
                <input autoComplete="username" onChange={(event) => setIdentifier(event.target.value)} placeholder="Masukkan Username atau Email" required value={identifier} />
              </span>
            </label>
            <label className="admin-field">
              <span>Password</span>
              <span className="admin-input-wrap">
                <AdminIcon name="lock" />
                <input autoComplete="current-password" onChange={(event) => setPassword(event.target.value)} placeholder="Masukkan Password" required type={visible ? "text" : "password"} value={password} />
                <button aria-label={visible ? "Sembunyikan password" : "Tampilkan password"} className="admin-input-action" onClick={() => setVisible((value) => !value)} type="button"><AdminIcon name={visible ? "eye" : "eye-off"} /></button>
              </span>
            </label>
            <div className="admin-login-options">
              <label className="admin-checkbox"><input checked={remember} onChange={(event) => setRemember(event.target.checked)} type="checkbox" /><span>Ingat saya</span></label>
              <button className="admin-text-button" onClick={() => setContact((value) => !value)} type="button">Hubungi Admin</button>
            </div>
            {contact && <p className="admin-login-note">Akun internal tidak dapat mendaftar sendiri. Silakan hubungi pengelola toko.</p>}
            {notice && <p aria-live="polite" className="admin-login-error"><AdminIcon name="info" />{notice}</p>}
            <button className="admin-primary-button admin-login-submit" disabled={busy} type="submit">{busy ? "Memeriksa..." : "Masuk"}<AdminIcon name="arrow-right" /></button>
            <div className="admin-login-info">
              <span><AdminIcon name="info" /></span>
              <p><strong>Akun internal tidak bisa mendaftar sendiri.</strong><small>Minta Admin Toko Farid untuk membuatkan akun.</small></p>
            </div>
          </form>
        </div>
      </section>
      {success && <FeedbackModal message="Login Berhasil!" onClose={() => router.replace("/admin")} />}
    </main>
  );
}

function FeedbackModal({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section aria-label={message} aria-modal="true" className="admin-feedback-modal" role="dialog">
        <button aria-label="Tutup" className="admin-modal-close" onClick={onClose} type="button"><AdminIcon name="close" /></button>
        <AdminIcon className="admin-feedback-check" name="check" />
        <h2>{message}</h2>
      </section>
    </div>
  );
}

function MetricCard({
  icon,
  label,
  value,
  note,
  variant,
}: {
  icon: IconName;
  label: string;
  value: string;
  note: string;
  variant: string;
}) {
  return (
    <article className="admin-metric-card">
      <span className={`admin-metric-icon ${variant}`}><AdminIcon name={icon} /></span>
      <div><small>{label}</small><strong>{value}</strong><span>{note}</span></div>
    </article>
  );
}

function LoadingRows({ columns }: { columns: number }) {
  return (
    <div aria-label="Memuat data" className="admin-loading-rows">
      {Array.from({ length: 5 }, (_, row) => (
        <div className="admin-skeleton-row" key={row}>
          {Array.from({ length: columns }, (_, column) => <span key={column} />)}
        </div>
      ))}
    </div>
  );
}

function DashboardPage() {
  const { data, loading, error } = useAdminQuery<DashboardPayload>("/api/admin?view=dashboard", {
    profile: { id: "", name: "", username: "", email: "", phone: "", address: "", postalCode: "", role: "Admin" },
    summary: { accounts: 0, products: 0, reports: 0, backups: 0, lowStock: [], latestBackup: null },
  });

  return (
    <>
      <PageHeader
        title={`Halo, ${data.profile.name || "Admin"}!`}
        description="Pantau data toko, lalu kelola akun, barang, laporan, dan backup."
        action={<Link className="admin-light-button" href="/admin/kelola-akun"><AdminIcon name="users" />Kelola Akun</Link>}
      />
      <ErrorNotice message={error} />
      <section aria-label="Ringkasan Admin" className="admin-metric-grid admin-dashboard-metrics">
        <MetricCard icon="users" label="Akun" value={loading ? "—" : String(data.summary.accounts)} note="Pengguna terdaftar" variant="blue" />
        <MetricCard icon="box" label="Barang" value={loading ? "—" : String(data.summary.products)} note="Item di katalog" variant="green" />
        <MetricCard icon="file" label="Laporan" value={loading ? "—" : String(data.summary.reports)} note="Laporan tersimpan" variant="purple" />
        <MetricCard icon="database" label="Backup terakhir" value={data.summary.latestBackup ? formatDate(data.summary.latestBackup.date) : "—"} note={data.summary.latestBackup?.fileName ?? "Belum ada metadata"} variant="orange" />
      </section>
      <section className="admin-panel admin-dashboard-stock">
        <div className="admin-panel-heading">
          <div><h2>Barang di bawah stok minimum</h2><p>Segera koordinasikan dengan Pengelola Toko</p></div>
        </div>
        {loading ? <LoadingRows columns={5} /> : (
          <div className="admin-table-scroll">
            <table className="admin-table admin-stock-table">
              <thead><tr><th>Barang</th><th>Lokasi</th><th>Jumlah</th><th>Min.</th><th>Status</th></tr></thead>
              <tbody>
                {data.summary.lowStock.map((item) => (
                  <tr key={item.id}>
                    <td><ProductCell name={item.name} category={item.category} unit={item.unit} /></td>
                    <td>{item.location}</td>
                    <td className="admin-number-low">{item.stock}</td>
                    <td>{item.minimum}</td>
                    <td><span className="admin-status is-warning">Menipis</span></td>
                  </tr>
                ))}
                {!data.summary.lowStock.length && <tr><td className="admin-empty-cell" colSpan={5}>Tidak ada barang di bawah stok minimum.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <section aria-label="Menu cepat" className="admin-quick-links">
        <Link className="admin-quick-link blue" href="/admin/kelola-akun"><span><AdminIcon name="users" /></span><div><strong>Kelola Akun</strong><small>Tambah / ubah pengguna</small></div></Link>
        <Link className="admin-quick-link green" href="/admin/kelola-barang"><span><AdminIcon name="box" /></span><div><strong>Kelola Barang</strong><small>Katalog &amp; harga</small></div></Link>
        <Link className="admin-quick-link purple" href="/admin/kelola-laporan"><span><AdminIcon name="file" /></span><div><strong>Kelola Laporan</strong><small>Untuk dibaca Owner</small></div></Link>
        <Link className="admin-quick-link orange" href="/admin/backup-pemulihan"><span><AdminIcon name="database" /></span><div><strong>Backup Data</strong><small>Simpan &amp; pulihkan</small></div></Link>
      </section>
    </>
  );
}

function RoleBadge({ role }: { role: string }) {
  const roleClass = role.toLowerCase().replace(/[^a-z]+/g, "-");
  return <span className={`admin-role-badge role-${roleClass}`}>{role}</span>;
}

function ActionIconButton({
  label,
  icon,
  tone,
  onClick,
}: {
  label: string;
  icon: IconName;
  tone: "edit" | "delete";
  onClick: () => void;
}) {
  return <button aria-label={label} className={`admin-icon-button is-${tone}`} onClick={onClick} title={label} type="button"><AdminIcon name={icon} /></button>;
}

function AdminModal({
  dialog,
  owners = [],
  onClose,
  onSubmit,
  onDelete,
}: {
  dialog: DialogState;
  owners?: OwnerOption[];
  onClose: () => void;
  onSubmit?: (values: Record<string, unknown>) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const item = dialog.kind === "feedback" ? undefined : dialog.item;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!onSubmit) return;
    setBusy(true);
    setError("");
    const formData = new FormData(event.currentTarget);
    const values: Record<string, unknown> = Object.fromEntries(formData.entries());
    if (dialog.kind === "form" && dialog.entity === "product") {
      values.price = Number(values.price);
      values.minimum = Number(values.minimum);
    }
    try {
      await onSubmit(values);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data belum dapat disimpan.");
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!onDelete) return;
    setBusy(true);
    setError("");
    try {
      await onDelete();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Data belum dapat dihapus.");
      setBusy(false);
    }
  }

  if (dialog.kind === "feedback") {
    return <FeedbackModal message={dialog.message} onClose={onClose} />;
  }

  if (dialog.kind === "view") {
    return (
      <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
        <section aria-labelledby="admin-view-title" aria-modal="true" className="admin-report-view-modal" role="dialog">
          <button aria-label="Tutup" className="admin-modal-close" onClick={onClose} type="button"><AdminIcon name="close" /></button>
          <h2 id="admin-view-title"><AdminIcon name="eye" />{item?.kind}</h2>
          <div className="admin-report-document">
            <span className="admin-report-document-icon"><AdminIcon name="file" /></span>
            <strong>{item?.kind}</strong>
            <dl>
              <div><dt>ID laporan</dt><dd>{item?.id}</dd></div>
              <div><dt>Owner</dt><dd>{item?.ownerName}</dd></div>
              <div><dt>Periode</dt><dd>{formatDate(item?.from)} – {formatDate(item?.to)}</dd></div>
              <div><dt>Dibuat</dt><dd>{formatDate(item?.createdAt)}</dd></div>
              <div><dt>Status arsip</dt><dd>{item?.status}</dd></div>
            </dl>
            <p>Skema saat ini menyimpan metadata laporan, bukan dokumen lampiran.</p>
          </div>
        </section>
      </div>
    );
  }

  if (dialog.kind === "confirm") {
    const entityName = dialog.entity === "account" ? "akun" : dialog.entity === "product" ? "barang" : "laporan";
    return (
      <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
        <section aria-labelledby="admin-confirm-title" aria-modal="true" className="admin-form-modal admin-confirm-modal" role="dialog">
          <button aria-label="Tutup" className="admin-modal-close" disabled={busy} onClick={onClose} type="button"><AdminIcon name="close" /></button>
          <span className="admin-confirm-icon"><AdminIcon name="trash" /></span>
          <h2 id="admin-confirm-title">Hapus {entityName}?</h2>
          <p>Data <strong>{dialog.item.name ?? dialog.item.kind}</strong> akan dihapus. Tindakan ini tidak dapat dibatalkan.</p>
          <ErrorNotice message={error} />
          <div className="admin-modal-actions">
            <button className="admin-secondary-button" disabled={busy} onClick={onClose} type="button">Batal</button>
            <button className="admin-danger-button" disabled={busy} onClick={handleDelete} type="button">{busy ? "Menghapus..." : "Ya, Hapus"}</button>
          </div>
        </section>
      </div>
    );
  }

  const isEdit = dialog.mode === "edit";
  const title =
    dialog.entity === "account" ? (isEdit ? "Ubah Akun Pengguna" : "Tambah Akun Pengguna") :
    dialog.entity === "product" ? (isEdit ? "Ubah Data Barang" : "Tambah Barang") :
    dialog.entity === "report" ? (isEdit ? "Ubah Laporan" : "Tambah Laporan") :
    "Ubah Profil Admin";
  const value = (key: keyof DialogItem, fallback = "") => {
    const current = item?.[key];
    return current === undefined || current === null ? fallback : String(current);
  };
  const dateValue = (key: "from" | "to") => {
    const current = item?.[key];
    if (!current) return "";
    const date = new Date(current);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  };

  return (
    <div className="admin-modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
      <section aria-labelledby="admin-form-title" aria-modal="true" className="admin-form-modal" role="dialog">
        <button aria-label="Tutup" className="admin-modal-close" disabled={busy} onClick={onClose} type="button"><AdminIcon name="close" /></button>
        <div className="admin-modal-heading"><h2 id="admin-form-title">{title}</h2><p>Lengkapi data di bawah ini.</p></div>
        <form className="admin-entity-form" onSubmit={handleSubmit}>
          {dialog.entity === "account" && (
            <>
              <Field label="Nama lengkap"><input autoComplete="name" defaultValue={value("name")} maxLength={100} name="name" required /></Field>
              <Field label="Username"><input autoComplete="username" defaultValue={value("username")} maxLength={50} name="username" required /></Field>
              <Field label="Email"><input autoComplete="email" defaultValue={value("email")} maxLength={100} name="email" required type="email" /></Field>
              <Field label="No. telepon"><input autoComplete="tel" defaultValue={value("phone")} maxLength={20} name="phone" required /></Field>
              <Field label="Role">
                <select defaultValue={value("role", "Pelanggan")} disabled={isEdit} name="role" required>
                  {["Pelanggan", "Pengelola Toko", "Owner", "Admin", "Kasir/Operator"].map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </Field>
              <Field label={isEdit ? "Password baru (opsional)" : "Password"}>
                <input autoComplete={isEdit ? "new-password" : "new-password"} maxLength={100} name="password" required={!isEdit} type="password" />
              </Field>
              <Field className="is-wide" label="Alamat"><input autoComplete="street-address" defaultValue={value("address")} maxLength={150} name="address" /></Field>
              <Field label="Kode pos"><input defaultValue={value("postalCode")} maxLength={10} name="postalCode" /></Field>
            </>
          )}
          {dialog.entity === "product" && (
            <>
              <Field label="Nama barang"><input defaultValue={value("name")} maxLength={100} name="name" required /></Field>
              <Field label="Kategori"><input defaultValue={value("category")} maxLength={50} name="category" required /></Field>
              <Field label="Satuan"><input defaultValue={value("unit")} maxLength={20} name="unit" required /></Field>
              <Field label="Harga satuan"><input defaultValue={value("price", "0")} min="0" name="price" required type="number" /></Field>
              <Field label="Stok minimum"><input defaultValue={value("minimum", "0")} min="0" name="minimum" required type="number" /></Field>
              <p className="admin-form-hint is-wide">
                Stok saat ini: {isEdit ? `${item?.stock ?? 0}` : "0"} · Jumlah stok aktual dikelola melalui Portal Pengelola Toko.
              </p>
            </>
          )}
          {dialog.entity === "report" && (
            <>
              <Field label="Jenis laporan"><input defaultValue={value("kind")} maxLength={50} name="kind" required /></Field>
              {!isEdit && (
                <Field label="Owner">
                  <select defaultValue="" name="ownerId" required>
                    <option disabled value="">Pilih Owner</option>
                    {owners.map((owner) => <option key={owner.id} value={owner.id}>{owner.name}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Periode awal"><input defaultValue={dateValue("from")} name="from" required type="date" /></Field>
              <Field label="Periode akhir"><input defaultValue={dateValue("to")} name="to" required type="date" /></Field>
              <Field label="Status arsip">
                <select defaultValue={value("status", "Belum Diarsipkan")} name="status">
                  <option value="Belum Diarsipkan">Belum Diarsipkan</option>
                  <option value="Diarsipkan">Diarsipkan</option>
                </select>
              </Field>
              <p className="admin-form-hint is-wide">Laporan menyimpan metadata. Dokumen isi laporan belum didukung skema.</p>
            </>
          )}
          {dialog.entity === "profile" && (
            <>
              <Field label="Nama lengkap"><input autoComplete="name" defaultValue={value("name")} maxLength={100} name="name" required /></Field>
              <Field label="Username"><input autoComplete="username" defaultValue={value("username")} maxLength={50} name="username" required /></Field>
              <Field label="Email"><input autoComplete="email" defaultValue={value("email")} maxLength={100} name="email" required type="email" /></Field>
              <Field label="No. telepon"><input autoComplete="tel" defaultValue={value("phone")} maxLength={20} name="phone" required /></Field>
              <Field className="is-wide" label="Alamat"><input autoComplete="street-address" defaultValue={value("address")} maxLength={150} name="address" required /></Field>
              <Field label="Kode pos"><input defaultValue={value("postalCode")} maxLength={10} name="postalCode" required /></Field>
              <Field label="Password baru (opsional)"><input autoComplete="new-password" maxLength={100} name="password" type="password" /></Field>
            </>
          )}
          {error && <ErrorNotice message={error} />}
          <div className="admin-modal-actions is-wide">
            <button className="admin-secondary-button" disabled={busy} onClick={onClose} type="button">Batal</button>
            <button className="admin-primary-button" disabled={busy || (dialog.entity === "report" && !isEdit && owners.length === 0)} type="submit">{busy ? "Menyimpan..." : "Simpan"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return <label className={`admin-form-field ${className}`}><span>{label}</span>{children}</label>;
}

function initialsClass(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function AccountPage() {
  const { data, loading, error, refresh } = useAdminQuery<{ rows: AccountRow[] }>("/api/admin?view=accounts", { rows: [] });
  const [dialog, setDialog] = useState<DialogState | null>(null);

  async function save(values: Record<string, unknown>) {
    const isEdit = dialog?.kind === "form" && dialog.mode === "edit";
    await postAdmin({ ...values, action: isEdit ? "account:update" : "account:create", ...(isEdit ? { id: dialog.item?.id } : {}) });
    refresh();
    setDialog({ kind: "feedback", message: isEdit ? "Data berhasil diubah!" : "Akun berhasil ditambahkan!" });
  }

  async function remove() {
    if (dialog?.kind !== "confirm") return;
    await postAdmin({ action: "account:delete", id: dialog.item.id });
    refresh();
    setDialog({ kind: "feedback", message: "Berhasil dihapus!" });
  }

  return (
    <>
      <PageHeader title="Kelola Akun Pengguna" description="Admin mengelola akun semua peran." action={<button className="admin-light-button" onClick={() => setDialog({ kind: "form", entity: "account", mode: "create" })} type="button"><AdminIcon name="plus" />Tambah Akun</button>} />
      <ErrorNotice message={error} />
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading"><div><h2>Daftar akun</h2><p>Admin mengelola akun semua peran.</p></div></div>
        {loading ? <LoadingRows columns={7} /> : (
          <div className="admin-table-scroll">
            <table className="admin-table admin-account-table">
              <thead><tr><th>ID</th><th>Nama lengkap</th><th>Username</th><th>Role</th><th>Email</th><th>No. telepon</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-id-cell">{row.id}</td>
                    <td><span className="admin-account-name"><span className="admin-initials">{initialsClass(row.name)}</span><strong>{row.name}</strong></span></td>
                    <td>{row.username}</td><td><RoleBadge role={row.role} /></td><td>{row.email}</td><td>{row.phone}</td>
                    <td><span className="admin-row-actions"><ActionIconButton icon="edit" label={`Ubah ${row.name}`} onClick={() => setDialog({ kind: "form", entity: "account", mode: "edit", item: row })} tone="edit" /><ActionIconButton icon="trash" label={`Hapus ${row.name}`} onClick={() => setDialog({ kind: "confirm", entity: "account", item: row })} tone="delete" /></span></td>
                  </tr>
                ))}
                {!data.rows.length && <tr><td className="admin-empty-cell" colSpan={7}>Belum ada data akun.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <p className="admin-table-foot">Menampilkan {data.rows.length} akun</p>}
      </section>
      {dialog && <AdminModal dialog={dialog} onClose={() => setDialog(null)} onDelete={remove} onSubmit={save} />}
    </>
  );
}

const productImages: Array<[string, string]> = [
  ["beras", "/customer-products/beras.jpg"],
  ["minyak", "/customer-products/minyak.jpg"],
  ["gula", "/customer-products/gula.jpg"],
  ["telur", "/customer-products/telur.jpg"],
  ["tepung", "/customer-products/tepung.jpg"],
  ["mie", "/customer-products/mie-instan.jpg"],
  ["susu", "/customer-products/susu-kental.jpg"],
  ["teh", "/customer-products/teh.jpg"],
  ["garam", "/customer-products/garam.jpg"],
];

function ProductCell({ name, category, unit }: { name: string; category: string; unit: string }) {
  return (
    <span className="admin-product-cell">
      <ProductThumbnail name={name} />
      <span><strong>{name}</strong><small>{category} · {unit}</small></span>
    </span>
  );
}

function ProductThumbnail({ name }: { name: string }) {
  const key = name.toLowerCase();
  const image = productImages.find(([term]) => key.includes(term))?.[1];
  return (
    image
      ? <Image alt="" className="admin-product-thumbnail" height={38} src={image} width={38} />
      : <span className="admin-product-placeholder"><AdminIcon name="box" /></span>
  );
}

function StockBadge({ stock, minimum }: { stock: number; minimum: number }) {
  return <span className={`admin-stock-badge${stock < minimum ? " is-low" : ""}`}>{stock}</span>;
}

function ProductPage() {
  const { data, loading, error, refresh } = useAdminQuery<{ rows: ProductRow[] }>("/api/admin?view=products", { rows: [] });
  const [dialog, setDialog] = useState<DialogState | null>(null);

  async function save(values: Record<string, unknown>) {
    const isEdit = dialog?.kind === "form" && dialog.mode === "edit";
    await postAdmin({ ...values, action: isEdit ? "product:update" : "product:create", ...(isEdit ? { id: dialog.item?.id } : {}) });
    refresh();
    setDialog({ kind: "feedback", message: isEdit ? "Berhasil diubah!" : "Barang berhasil ditambahkan!" });
  }

  async function remove() {
    if (dialog?.kind !== "confirm") return;
    await postAdmin({ action: "product:delete", id: dialog.item.id });
    refresh();
    setDialog({ kind: "feedback", message: "Berhasil dihapus!" });
  }

  return (
    <>
      <PageHeader title="Kelola Data Barang" description="Tambah, ubah, hapus, dan cari data barang." action={<button className="admin-light-button" onClick={() => setDialog({ kind: "form", entity: "product", mode: "create" })} type="button"><AdminIcon name="plus" />Tambah Barang</button>} />
      <ErrorNotice message={error} />
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading"><div><h2>Data barang</h2><p>Tambah, ubah, hapus, dan cari data barang.</p></div></div>
        {loading ? <LoadingRows columns={9} /> : (
          <div className="admin-table-scroll">
            <table className="admin-table admin-product-table">
              <thead><tr><th>Foto</th><th>ID</th><th>Nama barang</th><th>Kategori</th><th>Satuan</th><th>Harga</th><th>Min.</th><th>Stok</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td><ProductThumbnail name={row.name} /></td><td className="admin-id-cell">{row.id}</td><td className="admin-strong-cell">{row.name}</td>
                    <td>{row.category}</td><td>{row.unit}</td><td>{formatCurrency(row.price)}</td><td>{row.minimum}</td><td><StockBadge minimum={row.minimum} stock={row.stock} /></td>
                    <td><span className="admin-row-actions"><ActionIconButton icon="edit" label={`Ubah ${row.name}`} onClick={() => setDialog({ kind: "form", entity: "product", mode: "edit", item: row })} tone="edit" /><ActionIconButton icon="trash" label={`Hapus ${row.name}`} onClick={() => setDialog({ kind: "confirm", entity: "product", item: row })} tone="delete" /></span></td>
                  </tr>
                ))}
                {!data.rows.length && <tr><td className="admin-empty-cell" colSpan={9}>Belum ada data barang.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <p className="admin-table-foot">Terdapat {data.rows.length} barang di katalog</p>}
      </section>
      {dialog && <AdminModal dialog={dialog} onClose={() => setDialog(null)} onDelete={remove} onSubmit={save} />}
    </>
  );
}

function ReportPage() {
  const { data, loading, error, refresh } = useAdminQuery<{ rows: ReportRow[]; owners: OwnerOption[] }>("/api/admin?view=reports", { rows: [], owners: [] });
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const archived = data.rows.filter((row) => isArchived(row.status)).length;

  async function save(values: Record<string, unknown>) {
    const isEdit = dialog?.kind === "form" && dialog.mode === "edit";
    await postAdmin({ ...values, action: isEdit ? "report:update" : "report:create", ...(isEdit ? { id: dialog.item?.id } : {}) });
    refresh();
    setDialog({ kind: "feedback", message: isEdit ? "Berhasil diubah!" : "Laporan berhasil ditambahkan!" });
  }

  async function remove() {
    if (dialog?.kind !== "confirm") return;
    await postAdmin({ action: "report:delete", id: dialog.item.id });
    refresh();
    setDialog({ kind: "feedback", message: "Berhasil dihapus!" });
  }

  return (
    <>
      <PageHeader title="Kelola Data Laporan" description="Buat, ubah, hapus, dan lihat laporan untuk Owner." action={<button className="admin-light-button" onClick={() => setDialog({ kind: "form", entity: "report", mode: "create" })} type="button"><AdminIcon name="plus" />Tambah Laporan</button>} />
      <ErrorNotice message={error} />
      <section aria-label="Ringkasan laporan" className="admin-metric-grid admin-report-metrics">
        <MetricCard icon="file" label="Total laporan" value={loading ? "—" : String(data.rows.length)} note="Laporan tersimpan" variant="blue" />
        <MetricCard icon="archive" label="Sudah diarsipkan" value={loading ? "—" : String(archived)} note="Tersedia untuk Owner" variant="green" />
        <MetricCard icon="calendar" label="Belum diarsipkan" value={loading ? "—" : String(data.rows.length - archived)} note="Menunggu arsip" variant="orange" />
      </section>
      <section className="admin-panel admin-table-panel">
        <div className="admin-panel-heading"><div><h2>Daftar laporan</h2><p>Laporan yang diarsipkan akan muncul di akun Owner.</p></div></div>
        {loading ? <LoadingRows columns={6} /> : (
          <div className="admin-table-scroll">
            <table className="admin-table admin-report-table">
              <thead><tr><th>ID</th><th>Jenis laporan</th><th>Periode</th><th>Dibuat</th><th>Status arsip</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-id-cell">{row.id}</td>
                    <td><span className="admin-report-name"><span><AdminIcon name="file" /></span><strong>{row.kind}</strong></span></td>
                    <td>{formatDate(row.from)} – {formatDate(row.to)}</td><td>{formatDate(row.createdAt)}</td>
                    <td><span className={`admin-status ${isArchived(row.status) ? "is-success" : "is-warning"}`}>{row.status}</span></td>
                    <td><span className="admin-report-actions">
                      <button className="admin-pill-button" onClick={() => setDialog({ kind: "view", item: row })} type="button"><AdminIcon name="eye" />Lihat</button>
                      <button className="admin-pill-button" onClick={() => setDialog({ kind: "form", entity: "report", mode: "edit", item: row })} type="button"><AdminIcon name="edit" />Ubah</button>
                      <button className="admin-pill-button is-danger" onClick={() => setDialog({ kind: "confirm", entity: "report", item: row })} type="button"><AdminIcon name="trash" />Hapus</button>
                    </span></td>
                  </tr>
                ))}
                {!data.rows.length && <tr><td className="admin-empty-cell" colSpan={6}>Belum ada data laporan.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {!loading && <p className="admin-table-foot">{data.rows.length} laporan · {archived} diarsipkan</p>}
      </section>
      {dialog && <AdminModal dialog={dialog} onClose={() => setDialog(null)} onDelete={remove} onSubmit={save} owners={data.owners} />}
    </>
  );
}

function isArchived(status: string) {
  return status.trim().toLowerCase().startsWith("diarsipkan");
}

function BackupPage() {
  const { data, loading, error } = useAdminQuery<{
    rows: BackupRow[];
    supported: boolean;
    limitation: string;
  }>("/api/admin?view=backups", { rows: [], supported: false, limitation: "" });

  return (
    <>
      <PageHeader title="Backup & Pemulihan" description="Simpan salinan data dan pulihkan bila diperlukan." action={<button className="admin-light-button" disabled title="Fitur backup SQL belum tersedia di backend" type="button"><AdminIcon name="database" />Backup Sekarang</button>} />
      <ErrorNotice message={error} />
      <section className="admin-backup-hero">
        <span className="admin-backup-icon"><AdminIcon name="database" /></span>
        <div><small>Backup terakhir</small><strong>{data.rows[0] ? formatDate(data.rows[0].date) : "Belum tersedia"}</strong><span>{data.rows[0]?.fileName ?? "Belum ada berkas backup"}</span></div>
        <button className="admin-backup-callout" disabled title="Fitur backup SQL belum tersedia di backend" type="button"><AdminIcon name="download" />Backup Sekarang</button>
      </section>
      <section className="admin-panel admin-backup-panel">
        <div className="admin-panel-heading"><div><h2>Riwayat backup</h2><p>{loading ? "Memuat riwayat..." : `${data.rows.length} catatan tersimpan.`}</p></div></div>
        {!data.supported && data.limitation && <p className="admin-feature-limitation"><AdminIcon name="info" />{data.limitation}</p>}
        {loading ? <LoadingRows columns={5} /> : (
          <div className="admin-table-scroll">
            <table className="admin-table admin-backup-table">
              <thead><tr><th>ID</th><th>Tanggal</th><th>Nama file</th><th>Status</th><th>Aksi</th></tr></thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="admin-id-cell">{row.id}</td><td>{formatDate(row.date)}</td><td><span className="admin-report-name"><span><AdminIcon name="file" /></span><strong>{row.fileName}</strong></span></td>
                    <td><span className={`admin-status ${row.status.toLowerCase().includes("berhasil") ? "is-success" : "is-warning"}`}>{row.status}</span></td>
                    <td><span className="admin-report-actions"><button className="admin-pill-button" disabled title="Berkas SQL tidak tersedia" type="button"><AdminIcon name="restore" />Pulihkan</button><button className="admin-pill-button" disabled title="Berkas SQL tidak tersedia" type="button"><AdminIcon name="download" />Unduh</button></span></td>
                  </tr>
                ))}
                {!data.rows.length && <tr><td className="admin-empty-cell" colSpan={5}>Belum ada riwayat backup.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}

function ProfilePage() {
  const contextProfile = useContext(AdminProfileContext);
  const profile = contextProfile ?? { id: "", name: "", username: "", email: "", phone: "", address: "", postalCode: "", role: "Admin" as const };
  const { data, loading, error, refresh } = useAdminQuery<DashboardPayload>("/api/admin?view=dashboard", {
    profile,
    summary: { accounts: 0, products: 0, reports: 0, backups: 0, lowStock: [], latestBackup: null },
  });
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const router = useRouter();
  const currentProfile = data.profile.name ? data.profile : profile;

  async function save(values: Record<string, unknown>) {
    await postAdmin({ ...values, role: "Admin", action: "profile" });
    refresh();
    setDialog({ kind: "feedback", message: "Data berhasil diubah!" });
  }

  async function logout() {
    try {
      await postAdmin({ action: "logout" });
      router.replace("/admin/login");
    } catch (cause) {
      window.alert(cause instanceof Error ? cause.message : "Logout belum dapat diproses.");
    }
  }

  return (
    <>
      <PageHeader title="Profil Saya" description="Data akun yang sedang digunakan." action={<button className="admin-light-button" onClick={() => setDialog({ kind: "form", entity: "profile", mode: "edit", item: currentProfile })} type="button"><AdminIcon name="edit" />Ubah profil</button>} />
      <ErrorNotice message={error} />
      <section className="admin-profile-layout">
        <article className="admin-profile-card">
          <div className="admin-profile-cover"><span className="admin-profile-avatar">{initials(currentProfile.name)}</span></div>
          <h2>{currentProfile.name}</h2><p>@{currentProfile.username}</p><RoleBadge role="Admin" />
          <div className="admin-profile-stats">
            <div><AdminIcon name="users" /><strong>{loading ? "—" : data.summary.accounts}</strong><small>Akun</small></div>
            <div><AdminIcon name="box" /><strong>{loading ? "—" : data.summary.products}</strong><small>Barang</small></div>
            <div><AdminIcon name="file" /><strong>{loading ? "—" : data.summary.reports}</strong><small>Laporan</small></div>
          </div>
          <button className="admin-primary-button" onClick={() => setDialog({ kind: "form", entity: "profile", mode: "edit", item: currentProfile })} type="button">Ubah profil</button>
          <button className="admin-outline-button" onClick={logout} type="button"><AdminIcon name="logout" />Logout</button>
        </article>
        <article className="admin-panel admin-profile-details">
          <div className="admin-panel-heading"><div><h2>Data akun</h2><p>Data akun yang sedang digunakan.</p></div></div>
          <div className="admin-profile-grid">
            <ProfileDetail icon="lock" label="ID akun" value={currentProfile.id} />
            <ProfileDetail icon="shield" label="Role" value="Admin" />
            <ProfileDetail icon="user" label="Nama lengkap" value={currentProfile.name} />
            <ProfileDetail icon="user" label="Username" value={currentProfile.username} />
            <ProfileDetail icon="phone" label="No. telepon" value={currentProfile.phone} />
            <ProfileDetail icon="mail" label="Email" value={currentProfile.email} />
            <ProfileDetail icon="map" label="Kode pos" value={currentProfile.postalCode} />
            <ProfileDetail icon="map" label="Alamat" value={currentProfile.address} />
          </div>
        </article>
      </section>
      {dialog && <AdminModal dialog={dialog} onClose={() => setDialog(null)} onSubmit={save} />}
    </>
  );
}

function ProfileDetail({ icon, label, value }: { icon: IconName; label: string; value: string }) {
  return <div className="admin-profile-detail"><span><AdminIcon name={icon} /></span><div><small>{label}</small><strong>{value || "—"}</strong></div></div>;
}

export function AdminPage({ page }: { page: AdminPageName }) {
  if (page === "dashboard") return <DashboardPage />;
  if (page === "accounts") return <AccountPage />;
  if (page === "products") return <ProductPage />;
  if (page === "reports") return <ReportPage />;
  if (page === "backups") return <BackupPage />;
  return <ProfilePage />;
}
