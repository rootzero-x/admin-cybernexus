import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import classNames from "classnames";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Fingerprint,
  LogOut,
  ShieldCheck,
  Activity,
  Clock,
  Settings,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { adminApi } from "../../shared/api/adminApi.js";
import { clearAuth, saveAuth, loadAuth } from "../../shared/auth/authStore.js";
import { StatCards } from "./sections/StatCards.jsx";

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/sessions", label: "Sessions", icon: Fingerprint },
];

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
};

function fmt(ts) {
  if (!ts) return "—";
  try {
    return new Date(Number(ts) * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

function Chip({ children, tone = "default" }) {
  const cls =
    tone === "ok"
      ? "border-emerald-400/25 bg-emerald-500/10 text-emerald-200"
      : tone === "warn"
        ? "border-yellow-400/25 bg-yellow-500/10 text-yellow-200"
        : tone === "danger"
          ? "border-red-400/25 bg-red-500/10 text-red-200"
          : "border-white/10 bg-white/5 text-white/70";

  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
        cls,
      )}
    >
      {children}
    </span>
  );
}

export function DashboardPage() {
  const nav = useNavigate();
  const loc = useLocation();

  const [me, setMe] = useState(loadAuth().me || null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const activePath = useMemo(() => loc.pathname, [loc.pathname]);

  useEffect(() => {
    // initial me refresh
    adminApi
      .me()
      .then((d) => {
        setMe(d);
        saveAuth({ me: d });
      })
      .catch(() => {});
  }, []);

  async function onLogout() {
    setLoggingOut(true);
    try {
      await adminApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      nav("/", { replace: true });
      setLoggingOut(false);
    }
  }

  async function onRefresh() {
    setRefreshing(true);
    try {
      const d = await adminApi.me();
      setMe(d);
      saveAuth({ me: d });
    } finally {
      setRefreshing(false);
    }
  }

  const sessionStatus = useMemo(() => {
    if (!me?.expires_at) return { label: "Unknown", tone: "warn" };
    const left = me.expires_at - Math.floor(Date.now() / 1000);
    if (left <= 0) return { label: "Expired", tone: "danger" };
    if (left < 60 * 10) return { label: "Expiring soon", tone: "warn" };
    return { label: "Active", tone: "ok" };
  }, [me]);

  // Mock activity (keyin audit_list.php bilan bog'laymiz)
  const recent = useMemo(
    () => [
      {
        title: "Admin session verified",
        meta: `@${me?.username || "root"} • ${fmt(Math.floor(Date.now() / 1000))}`,
        icon: ShieldCheck,
      },
      {
        title: "Users module ready",
        meta: "Create / Edit / Delete • filters • reset password",
        icon: Users,
      },
      {
        title: "Sessions control ready",
        meta: "List + revoke (user/admin)",
        icon: Fingerprint,
      },
    ],
    [me?.username],
  );

  return (
    <div className="min-h-screen bg-[#05070b] bg-grid relative overflow-hidden">
      {/* soft blobs */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        <div className="absolute -top-48 -left-48 h-[560px] w-[560px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full bg-emerald-400/10 blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-4 md:p-6">
        {/* Top bar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 text-emerald-200/90">
              <Sparkles size={16} />
              <span className="text-xs font-semibold tracking-wide">
                CyberNexus • Root Admin
              </span>
            </div>
            <div className="text-white font-extrabold text-2xl md:text-3xl mt-2">
              Premium Control Center
            </div>
            <div className="text-white/60 text-sm mt-1">
              Root access •{" "}
              <span className="text-white/80">
                {me?.username ? `@${me.username}` : "session"}
              </span>{" "}
              • secure cookie session
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Chip tone={sessionStatus.tone}>
              <Activity size={14} className="mr-1" /> {sessionStatus.label}
            </Chip>

            <Button variant="ghost" loading={refreshing} onClick={onRefresh}>
              <RefreshCw size={18} /> Refresh
            </Button>

            <Button loading={loggingOut} variant="ghost" onClick={onLogout}>
              <LogOut size={18} /> Logout
            </Button>
          </div>
        </motion.div>

        {/* Layout */}
        <div className="mt-6 grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Sidebar */}
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <div className="text-white/80 text-sm font-semibold">
                  Navigation
                </div>
                <Settings size={16} className="text-white/40" />
              </div>

              <div className="mt-3 space-y-2">
                {navItems.map((it) => {
                  const Icon = it.icon;
                  const active = activePath === it.to;
                  return (
                    <Link
                      key={it.to}
                      to={it.to}
                      className={classNames(
                        "group flex items-center justify-between gap-3 rounded-xl px-3 py-2 border transition",
                        active
                          ? "bg-emerald-500/10 border-emerald-400/30 text-white"
                          : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon
                          size={18}
                          className={
                            active
                              ? "text-emerald-300"
                              : "text-white/50 group-hover:text-white/70"
                          }
                        />
                        <span className="font-semibold text-sm">
                          {it.label}
                        </span>
                      </div>
                      <ChevronRight
                        size={16}
                        className={
                          active
                            ? "text-emerald-300"
                            : "text-white/20 group-hover:text-white/40"
                        }
                      />
                    </Link>
                  );
                })}
              </div>

              <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-white/50">Session expires</div>
                <div className="text-sm text-white mt-1 flex items-center gap-2">
                  <Clock size={16} className="text-emerald-300" />
                  <span>{me?.expires_at ? fmt(me.expires_at) : "—"}</span>
                </div>
              </div>

              <div className="mt-4 text-xs text-white/40">
                Tip: Users va Sessions sahifalari endi real ishlayapti. Audit
                log keyingi modulda ulanadi.
              </div>
            </Card>
          </motion.div>

          {/* Main */}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Stat cards */}
            <StatCards />

            {/* Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-5">
                <div className="text-white font-bold text-lg">
                  Quick Overview
                </div>
                <div className="text-white/60 text-sm mt-1">
                  Root panel orqali userlarni boshqarish, sessionlarni revoke
                  qilish va xavfsizlik monitoringi.
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold">
                        Users Control
                      </div>
                      <Chip tone="ok">Ready</Chip>
                    </div>
                    <div className="text-white/60 text-sm mt-1">
                      Create / Edit / Delete • filters • password reset • active
                      toggle
                    </div>
                    <div className="mt-3">
                      <Link
                        to="/admin/users"
                        className="text-emerald-300 hover:text-emerald-200 text-sm font-semibold"
                      >
                        Open Users →
                      </Link>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-white font-semibold">
                        Sessions Control
                      </div>
                      <Chip tone="ok">Ready</Chip>
                    </div>
                    <div className="text-white/60 text-sm mt-1">
                      User sessions + Admin sessions • list + revoke
                    </div>
                    <div className="mt-3">
                      <Link
                        to="/admin/sessions"
                        className="text-emerald-300 hover:text-emerald-200 text-sm font-semibold"
                      >
                        Open Sessions →
                      </Link>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-5">
                <div className="text-white font-bold text-lg">
                  System Status
                </div>
                <div className="text-white/60 text-sm mt-1">
                  Hozircha minimal health (cookie session). Keyin: audit log,
                  lockouts monitor, admin RBAC.
                </div>

                <div className="mt-4 grid gap-3">
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div>
                      <div className="text-white font-semibold">Admin Auth</div>
                      <div className="text-white/50 text-xs mt-1">
                        Step1 + 2FA + secure cookie
                      </div>
                    </div>
                    <Chip tone={sessionStatus.tone}>{sessionStatus.label}</Chip>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div>
                      <div className="text-white font-semibold">
                        Bruteforce Protection
                      </div>
                      <div className="text-white/50 text-xs mt-1">
                        3 fails → 5m, repeat → 10m, 20m...
                      </div>
                    </div>
                    <Chip tone="ok">Enabled</Chip>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4">
                    <div>
                      <div className="text-white font-semibold">
                        Audit Logging
                      </div>
                      <div className="text-white/50 text-xs mt-1">
                        Create/Update/Delete actions stored
                      </div>
                    </div>
                    <Chip tone="warn">UI next</Chip>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recent activity */}
            <Card className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <div className="text-white font-bold text-lg">
                    Recent Activity
                  </div>
                  <div className="text-white/60 text-sm mt-1">
                    Bu joy keyin real audit log bilan avtomatik to‘lib boradi.
                  </div>
                </div>
                <Chip>Mock</Chip>
              </div>

              <div className="mt-4 grid gap-3">
                {recent.map((it, idx) => {
                  const Icon = it.icon;
                  return (
                    <div
                      key={idx}
                      className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4"
                    >
                      <div className="h-9 w-9 rounded-xl border border-white/10 bg-black/40 flex items-center justify-center">
                        <Icon size={18} className="text-emerald-300" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-white font-semibold">
                          {it.title}
                        </div>
                        <div className="text-white/55 text-xs mt-1">
                          {it.meta}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
