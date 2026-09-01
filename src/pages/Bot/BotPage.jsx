// src/pages/Bot/BotPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { Eye, Send, Shield, Star, Users } from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell } from "../../shared/ui/AdminShell.jsx";
import {
  TableShell, Th, Td, Tr, EmptyRow, LoadingBar, Pagination,
} from "../../shared/ui/DataTable.jsx";
import { SearchInput, Banner } from "../../shared/ui/Overlays.jsx";
import { TrendChart, BarList } from "../../shared/ui/Chart.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { formatDateTime, formatNumber, timeAgo } from "../../shared/lib/format.js";

/** The bot stores the last-opened tool as `step`; these are its labels. */
const STEP_LABELS = {
  home: "Asosiy menyu",
  tools_id: "ID Skaner",
  tools_hash: "Xesh va Kodlash",
  tools_embed: "Video Embedder",
};

export function BotPage() {
  const [overview, setOverview] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [q, setQ] = useState("");
  const [step, setStep] = useState("");
  const [sort, setSort] = useState("created_at");
  const [dir, setDir] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctrl = new AbortController();
    adminApi
      .botOverview({ signal: ctrl.signal })
      .then(setOverview)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message || "Bot ma'lumotini olib bo'lmadi");
      });
    return () => ctrl.abort();
  }, []);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      try {
        const res = await adminApi.botUsers({ q, step, page, limit, sort, dir }, { signal });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setLimit(res.limit || limit);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Bot foydalanuvchilarini yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, step, page, sort, dir],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => setPage(1), [q, step]);

  const onSort = (key) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  };

  const unavailable = overview && !overview.available;

  return (
    <AdminShell
      title="Telegram bot"
      subtitle={
        overview?.available
          ? `@${overview.bot_username} · ${formatNumber(overview.totals.users)} foydalanuvchi`
          : "Faqat ko'rish uchun"
      }
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white/50">
          <Eye className="h-3 w-3" />
          Faqat o'qish
        </span>
      }
    >
      <Banner tone="error" onDismiss={() => setError("")}>{error}</Banner>

      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-cyber-500/20 bg-cyber-500/[.05] px-4 py-3">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyber-400" />
        <p className="text-xs leading-relaxed text-white/55">
          Bot alohida ilova va alohida ma'lumotlar bazasida ishlaydi. Bu bo'lim
          undan faqat o'qiydi — bu yerda tahrirlash, qo'shish yoki o'chirish
          amallari ataylab yo'q. Botning o'z ishlashiga hech qanday ta'sir
          ko'rsatilmaydi.
        </p>
      </div>

      {unavailable ? (
        <Card className="p-8">
          <div className="flex flex-col items-center text-center">
            <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/[.03]">
              <Send className="h-5 w-5 text-white/25" />
            </span>
            <h2 className="mt-4 font-display text-base font-bold text-white/70">
              Bot bazasi ulanmagan
            </h2>
            <p className="mt-2 max-w-md text-sm text-white/40">
              {overview.reason ||
                "Serverdagi .env faylida BOT_DB_NAME va BOT_DB_USER sozlanishi kerak."}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* ---------------- Overview ---------------- */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniStat icon={Users} label="Jami foydalanuvchi" value={overview?.totals?.users} />
            <MiniStat icon={Users} label="24 soatda" value={overview?.totals?.["24h"]} tone="cyber" />
            <MiniStat icon={Users} label="7 kunda" value={overview?.totals?.["7d"]} tone="cyber" />
            <MiniStat icon={Users} label="30 kunda" value={overview?.totals?.["30d"]} />
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <Card className="p-5">
              <h2 className="font-display text-base font-bold text-white">
                Yangi foydalanuvchilar
              </h2>
              <p className="mt-0.5 text-xs text-white/40">So'nggi 30 kun</p>
              <div className="mt-5">
                <TrendChart
                  series={(overview?.series || []).map((r) => ({
                    date: r.date,
                    signups: r.users,
                  }))}
                  keys={["signups"]}
                  height={180}
                />
              </div>
            </Card>

            <div className="space-y-4">
              <Card className="p-5">
                <h2 className="font-display text-base font-bold text-white">
                  Qaysi asbob ochilgan
                </h2>
                <p className="mt-0.5 text-xs text-white/40">Oxirgi holat bo'yicha</p>
                <div className="mt-4">
                  <BarList
                    items={(overview?.steps || []).map((s) => ({
                      label: STEP_LABELS[s.step] || s.step,
                      count: s.count,
                    }))}
                    valueKey="count"
                    labelKey="label"
                  />
                </div>
              </Card>

              <Card className="p-5">
                <h2 className="font-display text-base font-bold text-white">Bot haqida</h2>
                <div className="mt-3 space-y-2">
                  <Row label="Bot" value={overview ? `@${overview.bot_username}` : "—"} />
                  <Row label="Admin chat ID" value={overview?.admin_chat_id || "—"} mono />
                  <Row label="Ma'lumotlar bazasi" value={overview?.database || "—"} mono />
                </div>

                <div className="mt-4 border-t border-white/8 pt-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-white/35">
                    Asboblar
                  </div>
                  <div className="mt-2 space-y-2">
                    {(overview?.features || []).map((f) => (
                      <div key={f.key} className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                        <div className="text-xs font-medium text-white/75">{f.label}</div>
                        <div className="mt-0.5 text-[11px] text-white/35">{f.note}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* ---------------- Users ---------------- */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput value={q} onChange={setQ} placeholder="Ism, username yoki ID..." />
            <select
              value={step}
              onChange={(e) => setStep(e.target.value)}
              className="rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
            >
              <option value="">Barcha holat</option>
              {(overview?.steps || []).map((s) => (
                <option key={s.step} value={s.step}>
                  {STEP_LABELS[s.step] || s.step}
                </option>
              ))}
            </select>
          </div>

          <LoadingBar active={loading} />

          <TableShell className="mt-2">
            <thead>
              <tr>
                <Th>Foydalanuvchi</Th>
                <Th sortKey="username" sort={sort} dir={dir} onSort={onSort}>Username</Th>
                <Th>Oxirgi asbob</Th>
                <Th sortKey="created_at" sort={sort} dir={dir} onSort={onSort}>Qo'shilgan</Th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 && !loading ? (
                <EmptyRow
                  colSpan={4}
                  icon={Send}
                  title="Foydalanuvchi topilmadi"
                  body={q || step ? "Filtrni o'zgartirib ko'ring." : "Botga hali hech kim yozmagan."}
                />
              ) : (
                items.map((u) => (
                  <Tr key={u.user_id}>
                    <Td>
                      <div className="flex items-center gap-2">
                        <span className="text-white/80">{u.first_name || "—"}</span>
                        {u.is_admin ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-signal-500/30 bg-signal-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-signal-300">
                            <Star className="h-2.5 w-2.5" />
                            Admin
                          </span>
                        ) : null}
                      </div>
                      <div className="font-mono text-[11px] text-white/25">{u.user_id}</div>
                    </Td>
                    <Td>
                      {u.username ? (
                        <a
                          href={`https://t.me/${u.username}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-cyber-300 hover:text-cyber-200"
                        >
                          @{u.username}
                        </a>
                      ) : (
                        <span className="text-xs text-white/25">yo'q</span>
                      )}
                    </Td>
                    <Td>
                      <span className="text-xs text-white/55">
                        {STEP_LABELS[u.step] || u.step}
                      </span>
                    </Td>
                    <Td>
                      <div className="whitespace-nowrap text-xs text-white/55">
                        {timeAgo(u.created_at)}
                      </div>
                      <div className="whitespace-nowrap text-[11px] text-white/25">
                        {formatDateTime(u.created_at)}
                      </div>
                    </Td>
                  </Tr>
                ))
              )}
            </tbody>
          </TableShell>

          <Pagination page={page} limit={limit} total={total} onPage={setPage} />
        </>
      )}
    </AdminShell>
  );
}

function MiniStat({ icon: Icon, label, value, tone = "signal" }) {
  return (
    <Card glow={tone} className="p-5">
      <div className="flex items-center gap-2.5">
        <Icon
          className={classNames(
            "h-4 w-4",
            tone === "cyber" ? "text-cyber-400" : "text-signal-400",
          )}
        />
        <span className="text-[11px] font-bold uppercase tracking-[.16em] text-white/40">
          {label}
        </span>
      </div>
      <div className="mt-3 font-display text-2xl font-bold tabular-nums text-white">
        {formatNumber(value ?? 0)}
      </div>
    </Card>
  );
}

function Row({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0">
      <span className="text-xs text-white/40">{label}</span>
      <span className={mono ? "font-mono text-xs text-white/70" : "text-xs text-white/70"}>
        {value}
      </span>
    </div>
  );
}

export default BotPage;
