// src/shared/ui/AdminShell.jsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import classNames from "classnames";
import {
  Activity,
  Award,
  Clock,
  Eye,
  FileClock,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Newspaper,
  Send,
  ShieldCheck,
  Terminal,
  Users,
  X,
} from "lucide-react";

import { adminApi } from "../api/adminApi.js";
import { clearAuth, loadAuth, saveAuth } from "../auth/authStore.js";
import { formatDateTime } from "../lib/format.js";

/**
 * The frame every admin page sits in.
 *
 * Each page used to render its own header, its own back link and its own copy
 * of the navigation, so the panel had as many layouts as it had pages and
 * adding a section meant editing all of them. This is the one place the
 * chrome is defined.
 */

const NAV = [
  { to: "/admin", label: "Boshqaruv", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Foydalanuvchilar", icon: Users },
  { to: "/admin/sessions", label: "Sessiyalar", icon: ShieldCheck },
  { to: "/admin/messages", label: "Xabarlar", icon: Mail },
  { to: "/admin/certificates", label: "Sertifikatlar", icon: Award },
  { to: "/admin/news", label: "Yangiliklar", icon: Newspaper },
  { to: "/admin/visits", label: "Tashriflar", icon: Eye },
  { to: "/admin/bot", label: "Telegram bot", icon: Send },
  { to: "/admin/audit", label: "Audit jurnali", icon: FileClock },
];

function SessionClock({ expiresAt }) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const t = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 30000);
    return () => clearInterval(t);
  }, []);

  if (!expiresAt) return null;

  const left = expiresAt - now;
  const expired = left <= 0;
  const soon = left > 0 && left < 600;

  const label = expired
    ? "Sessiya tugadi"
    : left < 3600
      ? `${Math.ceil(left / 60)} daqiqa qoldi`
      : `${Math.floor(left / 3600)} soat qoldi`;

  return (
    <div
      className={classNames(
        "rounded-xl border px-3 py-2.5",
        expired
          ? "border-plasma/35 bg-plasma/10"
          : soon
            ? "border-yellow-400/30 bg-yellow-400/[.07]"
            : "border-white/10 bg-white/[.03]",
      )}
    >
      <div className="text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
        Sessiya
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-white/70">
        <Clock
          className={classNames(
            "h-3.5 w-3.5",
            expired ? "text-plasma" : soon ? "text-yellow-300" : "text-signal-400",
          )}
        />
        {label}
      </div>
      <div className="mt-1 text-[10px] text-white/25">{formatDateTime(expiresAt)}</div>
    </div>
  );
}

export function AdminShell({ title, subtitle, actions, children }) {
  const nav = useNavigate();
  const loc = useLocation();

  const [me, setMe] = useState(() => loadAuth().me || null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    adminApi
      .me({ signal: ctrl.signal })
      .then((d) => {
        setMe(d);
        saveAuth({ me: d });
      })
      .catch(() => {
        /* RequireAdmin already handles a dead session */
      });
    return () => ctrl.abort();
  }, []);

  // Any navigation closes the mobile drawer.
  useEffect(() => setMenuOpen(false), [loc.pathname]);

  // Lock the page behind the drawer.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const onLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await adminApi.logout();
    } catch {
      /* the token is cleared regardless */
    } finally {
      clearAuth();
      nav("/", { replace: true });
    }
  }, [nav]);

  const sidebar = useMemo(
    () => (
      <>
        <Link to="/admin" className="flex items-center gap-2.5 px-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-signal-500/35 bg-signal-500/10">
            <Terminal className="h-4 w-4 text-signal-400" />
          </span>
          <span className="font-display text-sm font-bold tracking-tight text-white">
            Cyber<span className="text-signal-400">Nexus</span>
            <span className="ml-1.5 rounded bg-plasma/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-plasma">
              root
            </span>
          </span>
        </Link>

        <nav className="mt-6 flex-1 space-y-1 overflow-y-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                classNames(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                  isActive
                    ? "bg-signal-500/12 text-signal-300"
                    : "text-white/55 hover:bg-white/5 hover:text-white",
                )
              }
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-4 space-y-3">
          <SessionClock expiresAt={me?.expires_at} />

          <div className="rounded-xl border border-white/10 bg-white/[.03] p-3">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyber-500/30 bg-cyber-500/10 text-xs font-bold text-cyber-300">
                {(me?.username || "R").slice(0, 2).toUpperCase()}
              </span>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">
                  {me?.username || "root"}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-white/35">
                  Root admin
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-plasma/30 bg-plasma/[.07] px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-plasma transition-colors hover:bg-plasma/15 disabled:opacity-50"
            >
              <LogOut className="h-3.5 w-3.5" />
              {loggingOut ? "Chiqilmoqda..." : "Chiqish"}
            </button>
          </div>
        </div>
      </>
    ),
    [me, loggingOut, onLogout],
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-[1600px]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-white/8 bg-void-950/40 p-4 backdrop-blur-xl lg:flex">
          {sidebar}
        </aside>

        {/* Mobile drawer */}
        {menuOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-void-950/80 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute inset-y-0 left-0 flex w-72 flex-col border-r border-white/10 bg-void-900/95 p-4 backdrop-blur-xl">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Menyuni yopish"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/50"
              >
                <X className="h-4 w-4" />
              </button>
              {sidebar}
            </div>
          </div>
        ) : null}

        {/* Content */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-void-950/70 backdrop-blur-xl">
            <div className="flex items-center gap-3 px-4 py-4 sm:px-6">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Menyuni ochish"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-white/10 text-white/60 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="truncate font-display text-lg font-bold tracking-tight text-white sm:text-xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-0.5 truncate text-xs text-white/40">{subtitle}</p>
                ) : null}
              </div>

              {actions ? (
                <div className="flex shrink-0 items-center gap-2">{actions}</div>
              ) : null}
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

/** Small live-status pill used in page headers. */
export function StatusPill({ tone = "ok", children }) {
  const tones = {
    ok: "border-signal-500/30 bg-signal-500/10 text-signal-300",
    warn: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
    danger: "border-plasma/35 bg-plasma/10 text-plasma",
    muted: "border-white/12 bg-white/5 text-white/55",
  };

  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider",
        tones[tone],
      )}
    >
      <Activity className="h-3 w-3" />
      {children}
    </span>
  );
}

export default AdminShell;
