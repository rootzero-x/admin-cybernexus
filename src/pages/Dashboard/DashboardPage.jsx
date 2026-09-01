// src/pages/Dashboard/DashboardPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import classNames from "classnames";
import {
  Award,
  Eye,
  FileClock,
  Mail,
  Newspaper,
  RefreshCw,
  Send,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell, StatusPill } from "../../shared/ui/AdminShell.jsx";
import { TrendChart, BarList } from "../../shared/ui/Chart.jsx";
import { Banner } from "../../shared/ui/Overlays.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { formatNumber, formatDateTime, timeAgo, hostOf } from "../../shared/lib/format.js";

function KpiCard({ icon: Icon, label, value, delta, to, tone = "signal" }) {
  const body = (
    <Card
      glow={tone}
      className={classNames("h-full p-5", to && "transition-transform hover:-translate-y-0.5")}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={classNames(
            "grid h-10 w-10 place-items-center rounded-xl border",
            tone === "cyber"
              ? "border-cyber-500/30 bg-cyber-500/10"
              : tone === "plasma"
                ? "border-plasma/30 bg-plasma/10"
                : "border-signal-500/30 bg-signal-500/10",
          )}
        >
          <Icon
            className={classNames(
              "h-4.5 w-4.5",
              tone === "cyber"
                ? "text-cyber-400"
                : tone === "plasma"
                  ? "text-plasma"
                  : "text-signal-400",
            )}
          />
        </span>
        {delta ? (
          <span className="rounded-full border border-white/10 bg-white/[.04] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white/45">
            {delta}
          </span>
        ) : null}
      </div>

      <div className="mt-4 font-display text-3xl font-bold tabular-nums text-white">
        {formatNumber(value)}
      </div>
      <div className="mt-1 text-[11px] font-bold uppercase tracking-[.16em] text-white/40">
        {label}
      </div>
    </Card>
  );

  return to ? (
    <Link to={to} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

function ActionRow({ entry }) {
  const meta = entry.meta || {};

  // Audit meta differs per action; show whichever identifying field is there.
  const detail =
    meta.email || meta.cert_id || meta.subject || meta.title ||
    (meta.count !== undefined ? `${meta.count} ta` : "") ||
    (meta.id !== undefined ? `#${meta.id}` : "");

  return (
    <div className="flex items-start gap-3 border-b border-white/5 py-3 last:border-0">
      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-signal-400/70" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-xs text-signal-300">{entry.action}</span>
          <span className="text-xs text-white/35">@{entry.actor}</span>
        </div>
        {detail ? (
          <div className="mt-0.5 truncate text-xs text-white/50">{String(detail)}</div>
        ) : null}
      </div>
      <span className="shrink-0 text-[11px] text-white/25">{timeAgo(entry.created_at)}</span>
    </div>
  );
}

function ModuleCard({ to, icon: Icon, title, primary, note }) {
  return (
    <Link to={to} className="block">
      <Card className="h-full p-5 transition-transform hover:-translate-y-0.5">
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-cyber-400" />
          <span className="text-sm font-semibold text-white">{title}</span>
        </div>
        <div className="mt-3 font-display text-2xl font-bold tabular-nums text-white">
          {formatNumber(primary)}
        </div>
        <div className="mt-1 truncate text-[11px] text-white/35">{note}</div>
      </Card>
    </Link>
  );
}

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    try {
      setData(await adminApi.stats({ signal }));
    } catch (e) {
      if (e.name === "AbortError") return;
      setError(e.message || "Statistikani yuklab bo'lmadi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  const u = data?.users;
  const v = data?.visits;

  return (
    <AdminShell
      title="Boshqaruv paneli"
      subtitle={data ? `Yangilandi: ${formatDateTime(data.generated_at)}` : "Yuklanmoqda..."}
      actions={
        <>
          <StatusPill tone={error ? "danger" : "ok"}>{error ? "Xato" : "Jonli"}</StatusPill>
          <button
            type="button"
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/60 transition-colors hover:border-white/25 hover:text-white disabled:opacity-50"
          >
            <RefreshCw className={classNames("h-3.5 w-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Yangilash</span>
          </button>
        </>
      }
    >
      <Banner tone="error" onDismiss={() => setError("")}>
        {error}
      </Banner>

      {/* ---------------- KPI row ---------------- */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={Users}
          label="Foydalanuvchilar"
          value={u?.total ?? 0}
          delta={u?.new_7d ? `+${u.new_7d} / 7 kun` : null}
          to="/admin/users"
        />
        <KpiCard
          icon={Eye}
          label="Tashriflar (7 kun)"
          value={v?.week ?? 0}
          delta={v?.unique_week ? `${formatNumber(v.unique_week)} tashrifchi` : null}
          to="/admin/visits"
          tone="cyber"
        />
        <KpiCard
          icon={Mail}
          label="Yangi xabarlar"
          value={data?.messages?.new ?? 0}
          delta={data?.messages?.total ? `${data.messages.total} jami` : null}
          to="/admin/messages"
          tone={data?.messages?.new ? "plasma" : "signal"}
        />
        <KpiCard
          icon={ShieldCheck}
          label="Faol sessiyalar"
          value={data?.sessions?.user ?? 0}
          delta={data?.sessions?.admin ? `${data.sessions.admin} admin` : null}
          to="/admin/sessions"
          tone="cyber"
        />
      </div>

      {/* ---------------- Chart ---------------- */}
      <Card className="mt-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-white">So'nggi 30 kun</h2>
            <p className="mt-0.5 text-xs text-white/40">
              Sahifa ko'rishlari, noyob tashrifchilar va ro'yxatdan o'tishlar
            </p>
          </div>
          <TrendingUp className="h-4 w-4 text-white/25" />
        </div>

        <div className="mt-5">
          <TrendChart series={data?.series || []} />
        </div>
      </Card>

      {/* ---------------- Breakdown ---------------- */}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="p-5">
          <h2 className="font-display text-base font-bold text-white">Eng ko'p ochilgan</h2>
          <p className="mt-0.5 text-xs text-white/40">30 kunlik sahifalar</p>
          <div className="mt-4">
            <BarList items={data?.top_pages || []} valueKey="hits" labelKey="path" />
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-display text-base font-bold text-white">Qayerdan kelishgan</h2>
          <p className="mt-0.5 text-xs text-white/40">Tashqi manbalar</p>
          <div className="mt-4">
            <BarList
              items={(data?.top_referrers || []).map((r) => ({
                host: hostOf(r.referrer),
                hits: r.hits,
              }))}
              valueKey="hits"
              labelKey="host"
              empty="Hali tashqi havoladan kirish yo'q"
            />
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-bold text-white">Oxirgi amallar</h2>
              <p className="mt-0.5 text-xs text-white/40">Audit jurnalidan</p>
            </div>
            <Link
              to="/admin/audit"
              className="text-xs font-bold text-signal-300 hover:text-signal-200"
            >
              Barchasi →
            </Link>
          </div>

          <div className="mt-3">
            {(data?.recent_audit || []).length === 0 ? (
              <div className="py-8 text-center text-sm text-white/30">Hali amal yo'q</div>
            ) : (
              data.recent_audit.map((e) => <ActionRow key={e.id} entry={e} />)
            )}
          </div>
        </Card>
      </div>

      {/* ---------------- Modules ---------------- */}
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ModuleCard
          to="/admin/certificates"
          icon={Award}
          title="Sertifikatlar"
          primary={data?.certificates?.valid ?? 0}
          note={
            data?.certificates?.revoked
              ? `${data.certificates.revoked} ta bekor qilingan`
              : "Bekor qilingani yo'q"
          }
        />
        <ModuleCard
          to="/admin/news"
          icon={Newspaper}
          title="Yangiliklar"
          primary={data?.news?.total ?? 0}
          note={
            data?.news?.last_fetch
              ? `Oxirgi yig'ish: ${timeAgo(data.news.last_fetch)}`
              : "Hali yig'ilmagan"
          }
        />
        <ModuleCard
          to="/admin/bot"
          icon={Send}
          title="Telegram bot"
          primary={data?.bot?.available ? data.bot.users : 0}
          note={
            data?.bot?.available
              ? `${data.bot.new_7d} ta yangi / 7 kun`
              : "Bot bazasi ulanmagan"
          }
        />
        <ModuleCard
          to="/admin/audit"
          icon={FileClock}
          title="Audit"
          primary={(data?.recent_audit || []).length}
          note="Oxirgi amallar"
        />
      </div>
    </AdminShell>
  );
}

export default DashboardPage;
