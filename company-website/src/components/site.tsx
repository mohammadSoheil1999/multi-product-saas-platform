"use client";
/* eslint-disable @next/next/no-img-element -- centralized local SVG brand mark */
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  ChevronDown,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Package,
  ShieldCheck,
  Sun,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { brand } from "@/config/brand";
import { dictionaries, type Locale } from "@/lib/i18n";
import { authClient } from "@/lib/auth-client";

export function Navbar({ locale }: { locale: Locale }) {
  const t = dictionaries[locale];
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof document === "undefined") return "dark";
    const current = document.documentElement.dataset.theme;
    return current === "light" || current === "dark"
      ? current
      : matchMedia("(prefers-color-scheme: light)").matches
        ? "light"
        : "dark";
  });
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user as
    { name: string; email: string; role?: string } | undefined;
  const admin = user?.role === "ADMIN";
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);
  const switchLocale = (l: string) => {
    const rest = path.replace(/^\/(en|ar|he)/, "");
    document.cookie = `locale=${l};path=/;max-age=31536000`;
    window.location.assign(`/${l}${rest || "/"}`);
  };
  const toggleTheme = () =>
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  const logout = async () => {
    await authClient.signOut();
    window.location.assign(`/${locale}`);
  };
  const publicLinks: [[string, string], ...Array<[string, string]>] = [
    [t.nav.solutions, `/${locale}/#solutions`],
    [t.nav.demos, `/${locale}/demos`],
    [t.nav.pricing, `/${locale}/pricing`],
    [t.nav.custom, `/${locale}/#custom`],
    [t.nav.about, `/${locale}/about`],
    [t.nav.contact, `/${locale}/contact`],
  ];
  const memberLinks: [[string, string], ...Array<[string, string]>] = [
    [t.nav.dashboard, `/${locale}/dashboard`],
    [t.nav.myProducts, `/${locale}/dashboard/products`],
    [t.nav.support, `/${locale}/dashboard/support`],
    [t.nav.solutions, `/${locale}/#solutions`],
  ];
  const adminLinks: [[string, string], ...Array<[string, string]>] = [
    ["Owner overview", `/${locale}/admin`],
    ["Services & pricing", `/${locale}/admin/products`],
    ["Memberships", `/${locale}/admin/subscriptions`],
    ["Clients", `/${locale}/admin/clients`],
  ];
  const links = admin ? adminLinks : user ? memberLinks : publicLinks;
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link className="brand" href={admin ? `/${locale}/admin` : `/${locale}`}>
          <img src={brand.companyLogo} alt="" />
          {brand.companyName}
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {links.map(([label, href]) => (
            <Link
              className={path === href ? "active" : ""}
              key={href}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="nav-actions">
          <select
            aria-label={t.nav.language}
            value={locale}
            onChange={(e) => switchLocale(e.target.value)}
            className="button"
          >
            <option value="en">EN</option>
            <option value="ar">ع</option>
            <option value="he">עב</option>
          </select>
          <button
            className="button"
            aria-label={t.nav.theme}
            onClick={toggleTheme}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {!isPending && !user && (
            <>
              <Link className="button hide-mobile" href={`/${locale}/login`}>
                {t.nav.login}
              </Link>
              <Link
                className="button primary hide-mobile"
                href={`/${locale}/pricing`}
              >
                {t.nav.start}
              </Link>
            </>
          )}
          {!isPending && user && (
            <div className="account-menu hide-mobile">
              <button
                className="button account-trigger"
                onClick={() => setAccountOpen((x) => !x)}
                aria-expanded={accountOpen}
              >
                <span className="avatar-dot">
                  <User size={15} />
                </span>
                <span className="account-label">{user.name}</span>
                <ChevronDown size={15} />
              </button>
              {accountOpen && (
                <div className="account-dropdown">
                  <div className="account-summary">
                    <strong>{user.name}</strong>
                    <small>{user.email}</small>
                  </div>
                  {admin ? (
                    <Link href={`/${locale}/admin`}>
                      <ShieldCheck size={16} />
                      Owner panel
                    </Link>
                  ) : (
                    <>
                      <Link href={`/${locale}/dashboard`}>
                        <LayoutDashboard size={16} />
                        {t.nav.dashboard}
                      </Link>
                      <Link href={`/${locale}/dashboard/products`}>
                        <Package size={16} />
                        {t.nav.myProducts}
                      </Link>
                    </>
                  )}
                  <button onClick={logout}>
                    <LogOut size={16} />
                    {t.nav.logout}
                  </button>
                </div>
              )}
            </div>
          )}
          <button
            className="button mobile-toggle"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={t.nav.menu}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </div>
      {open && (
        <nav className="container mobile-menu" aria-label={t.nav.menu}>
          {user && (
            <div className="mobile-account">
              <strong>{user.name}</strong>
              <small>{user.email}</small>
            </div>
          )}
          {links.map(([label, href]) => (
            <Link onClick={() => setOpen(false)} key={href} href={href}>
              {label}
            </Link>
          ))}
          {user ? (
            <button onClick={logout}>
              <LogOut size={17} />
              {t.nav.logout}
            </button>
          ) : (
            <>
              <Link onClick={() => setOpen(false)} href={`/${locale}/login`}>
                {t.nav.login}
              </Link>
              <Link
                className="button primary"
                onClick={() => setOpen(false)}
                href={`/${locale}/pricing`}
              >
                {t.nav.start}
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const path = usePathname();
  const t = dictionaries[locale].footer;
  if (path.includes("/admin")) return null;
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Link className="brand" href={`/${locale}`}>
            <img src={brand.companyLogo} alt="" />
            {brand.companyName}
          </Link>
          <p className="muted">{t.tagline}</p>
        </div>
        <div>
          <strong>{t.products}</strong>
          <Link href={`/${locale}/products/appointments`}>
            {t.appointments}
          </Link>
          <Link href={`/${locale}/products/ecommerce`}>{t.ecommerce}</Link>
          <Link href={`/${locale}/products/real-estate`}>{t.realEstate}</Link>
        </div>
        <div>
          <strong>{t.company}</strong>
          <Link href={`/${locale}/about`}>{t.about}</Link>
          <Link href={`/${locale}/contact`}>{t.contact}</Link>
          <Link href={`/${locale}/request-demo`}>{t.requestDemo}</Link>
          <Link href={`/${locale}/case-studies`}>{t.caseStudies}</Link>
        </div>
        <div>
          <strong>{t.legal}</strong>
          <Link href={`/${locale}/privacy`}>{t.privacy}</Link>
          <Link href={`/${locale}/terms`}>{t.terms}</Link>
          <a href={`mailto:${brand.companyEmail}`}>{brand.companyEmail}</a>
        </div>
      </div>
      <div className="container muted" style={{ marginTop: 50, fontSize: 13 }}>
        © {new Date().getFullYear()} {brand.companyName}. {t.rights}
      </div>
    </footer>
  );
}

export function ProductVisual({ kind }: { kind: string }) {
  return (
    <div
      className="ui-window"
      style={{
        position: "relative",
        width: "100%",
        inset: "auto",
        transform: "none",
      }}
    >
      <div className="window-top">
        <i className="dot" />
        <i className="dot" />
        <i className="dot" />
      </div>
      <div className="mini-grid">
        <div className="mini tall">
          {kind === "appointments" ? "Calendar" : "Overview"}
        </div>
        <div className="mini tall">
          {kind === "ecommerce"
            ? "Orders"
            : kind === "real-estate"
              ? "Listings"
              : "Live map"}
        </div>
        <div>
          <div className="mini">Analytics</div>
          <div className="mini" style={{ marginTop: 9 }}>
            Activity
          </div>
        </div>
      </div>
    </div>
  );
}

export function DemoLaunch({ url, name }: { url: string; name: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="button accent" onClick={() => setOpen(true)}>
        Launch demo <ExternalLink size={16} />
      </button>
      {open && (
        <div
          className="demo-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="demo-title"
        >
          <div className="card">
            <h2 id="demo-title">Launch {name}</h2>
            <p className="muted">
              This environment is provided for demonstration purposes.
              Information entered into the demo may be reset periodically. Do
              not enter sensitive personal or payment information.
            </p>
            <div className="actions">
              <a
                className="button accent"
                href={url || "#"}
                target="_blank"
                rel="noreferrer"
              >
                Continue to demo <ArrowRight size={16} />
              </a>
              <button className="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
            {!url && (
              <p style={{ color: "#fca5a5" }}>
                This demo URL has not been configured yet.
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
