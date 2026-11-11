import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export type IconName =
  | "arrow-left"
  | "book"
  | "box"
  | "cart"
  | "chart"
  | "check"
  | "clock"
  | "gift"
  | "lock"
  | "map-pin"
  | "plus"
  | "shield"
  | "store"
  | "tag"
  | "truck"
  | "user"
  | "users"
  | "wallet";

const navigation = [
  { href: "/beranda", label: "Beranda", key: "beranda" },
  { href: "/tentang", label: "Tentang", key: "tentang" },
  { href: "/panduan-akun", label: "Panduan Akun", key: "panduan" },
] as const;

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  const paths: Record<IconName, ReactNode> = {
    "arrow-left": (
      <>
        <path d="M19 12H5" />
        <path d="m12 19-7-7 7-7" />
      </>
    ),
    book: (
      <>
        <path d="M12 7v14" />
        <path d="M3 18V5a2 2 0 0 1 2-2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 1 2 2v13" />
        <path d="M3 18a2 2 0 0 0 2 2h3a4 4 0 0 1 4 4 4 4 0 0 1 4-4h3a2 2 0 0 0 2-2" />
      </>
    ),
    box: (
      <>
        <path d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path d="M3 8v9l9 5 9-5V8" />
        <path d="M12 13v9" />
      </>
    ),
    cart: (
      <>
        <path d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.9a2 2 0 0 0 1.9-1.5L22 8H6" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h17" />
        <path d="M8 15v-4" />
        <path d="M13 15V7" />
        <path d="M18 15V4" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    gift: (
      <>
        <path d="M20 12v9H4v-9" />
        <path d="M2 7h20v5H2z" />
        <path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 1 1 2.5-2.5V7Z" />
        <path d="M12 7h4.5A2.5 2.5 0 1 0 14 4.5V7Z" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 1 1 8 0v3" />
      </>
    ),
    "map-pin": (
      <>
        <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z" />
        <circle cx="12" cy="10" r="2.5" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14" />
        <path d="M5 12h14" />
      </>
    ),
    shield: (
      <>
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    store: (
      <>
        <path d="M3 10v11h18V10" />
        <path d="m3 10 2-7h14l2 7" />
        <path d="M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0" />
        <path d="M9 21v-6h6v6" />
      </>
    ),
    tag: (
      <>
        <path d="M20.6 13.4 11 3H4v7l10.4 10.6a2 2 0 0 0 2.8 0l3.4-3.4a2 2 0 0 0 0-2.8Z" />
        <circle cx="7.5" cy="7.5" r="1" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h12v12H3z" />
        <path d="M15 10h4l3 3v5h-7" />
        <circle cx="7.5" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="10" cy="7" r="4" />
        <path d="M20 21v-2a4 4 0 0 0-3-3.9" />
        <path d="M16 3.2a4 4 0 0 1 0 7.6" />
      </>
    ),
    wallet: (
      <>
        <rect x="3" y="5" width="18" height="15" rx="2" />
        <path d="M3 9h18" />
        <path d="M16 14h2" />
      </>
    ),
  };

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
      {paths[name]}
    </svg>
  );
}

export function SiteHeader({ active }: { active: string }) {
  return (
    <header className="site-header">
      <Link aria-label="Toko Farid - Beranda" className="brand-lockup" href="/beranda">
        <Image
          alt=""
          className="brand-mark"
          height={52}
          src="/storefront/toko-farid-logo.png"
          width={56}
        />
        <span className="brand-copy">
          <strong>Toko Farid</strong>
          <span>Belanja Mudah</span>
        </span>
      </Link>

      <nav aria-label="Navigasi utama" className="site-navigation">
        {navigation.map((item) => (
          <Link
            aria-current={active === item.key ? "page" : undefined}
            className={active === item.key ? "nav-link is-active" : "nav-link"}
            href={item.href}
            key={item.key}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="header-actions">
        <Link className="button button-outline" href="/pelanggan/login">
          <Icon name="user" />
          <span>Login</span>
        </Link>
        <Link className="button button-pink" href="/pelanggan/registrasi">
          <Icon name="plus" />
          <span>Daftar Gratis</span>
        </Link>
      </div>
    </header>
  );
}

export function PageHero({
  title,
  description,
  theme,
}: {
  title: string;
  description: string;
  theme: "about" | "guide";
}) {
  return (
    <section className={`page-hero page-hero-${theme}`}>
      <div className="page-hero-inner">
        <h1>{title}</h1>
        <p>{description}</p>
        <Link className="button button-light" href="/beranda">
          <Icon name="arrow-left" />
          Kembali ke Beranda
        </Link>
      </div>
    </section>
  );
}

export function IconTile({
  children,
  icon,
  className = "",
}: {
  children: ReactNode;
  icon: IconName;
  className?: string;
}) {
  return (
    <span className={`icon-tile ${className}`}>
      <Icon name={icon} />
      {children}
    </span>
  );
}
