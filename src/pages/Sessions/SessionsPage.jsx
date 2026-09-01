// src/pages/Sessions/SessionsPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import classNames from "classnames";
import { MonitorSmartphone, ShieldCheck, Trash2, X } from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell } from "../../shared/ui/AdminShell.jsx";
import {
  TableShell, Th, Td, Tr, EmptyRow, LoadingBar, Pagination, FilterTabs,
} from "../../shared/ui/DataTable.jsx";
import { ConfirmDialog, SearchInput, Banner } from "../../shared/ui/Overlays.jsx";
import { formatDateTime, timeAgo, describeDevice } from "../../shared/lib/format.js";

function Avatar({ url, name }) {
  const [broken, setBroken] = useState(false);
  const initials = (name || "U").trim().slice(0, 2).toUpperCase();

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className="h-8 w-8 shrink-0 rounded-lg border border-white/12 object-cover"
      />
    );
  }
  return (
    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-signal-500/25 bg-signal-500/10 text-[10px] font-bold text-signal-300">
      {initials}
    </span>
  );
}

/** How long is left on a session, or how long ago it ran out. */
function expiry(ts, active) {
  const diff = Math.abs(Number(ts) * 1000 - Date.now());
  const hours = Math.round(diff / 3600000);
  const label = hours >= 48 ? `${Math.round(hours / 24)} kun` : `${hours} soat`;
  return active ? `${label} qoldi` : `${label} oldin tugagan`;
}

export function SessionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const userId = searchParams.get("user_id") || "";

  const [type, setType] = useState("user");
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [q, setQ] = useState("");
  const [state, setState] = useState("active");
  const [sort, setSort] = useState("created_at");
  const [dir, setDir] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const params = { type, q, state, page, limit, sort, dir };
        if (type === "user" && userId) params.user_id = userId;
        const res = await adminApi.sessionsList(params, { signal });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setLimit(res.limit || limit);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Sessiyalarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // limit is deliberately absent: the server echoes back the clamped value.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [type, q, state, page, sort, dir, userId],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => setPage(1), [type, q, state, userId]);

  // `email` only exists on the site listing; swap so the sort key stays valid
  // when the admin flips between the two tables.
  useEffect(() => {
    if (type === "admin" && sort === "email") setSort("username");
    if (type === "user" && sort === "username") setSort("email");
  }, [type, sort]);

  const onSort = (key) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  };

  const revoke = async () => {
    setBusy(true);
    try {
      await adminApi.sessionRevoke(type, confirm.id);
      setNotice("Sessiya tugatildi — qurilma qaytadan kirishi kerak bo'ladi.");
      setConfirm(null);
      load();
    } catch (e) {
      setError(e.message || "Tugatib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  const clearUserFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("user_id");
    setSearchParams(next, { replace: true });
  };

  const isAdmin = type === "admin";

  return (
    <AdminShell
      title="Sessiyalar"
      subtitle={`${total} ta ${isAdmin ? "admin" : "sayt"} sessiyasi`}
    >
      <Banner tone="error" onDismiss={() => setError("")}>{error}</Banner>
      <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
        <FilterTabs
          value={type}
          onChange={setType}
          options={[
            { value: "user", label: "Sayt" },
            { value: "admin", label: "Admin panel" },
          ]}
        />
        <SearchInput
          value={q}
          onChange={setQ}
          placeholder={isAdmin ? "Login, IP yoki brauzer..." : "Email, ism, IP yoki brauzer..."}
        />
        <FilterTabs
          value={state}
          onChange={setState}
          options={[
            { value: "active", label: "Faol" },
            { value: "expired", label: "Tugagan" },
            { value: "", label: "Barchasi" },
          ]}
        />
      </div>

      {userId && !isAdmin ? (
        <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-cyber-500/25 bg-cyber-500/[.07] px-3 py-2 text-xs text-cyber-200">
          Faqat #{userId} hisobining qurilmalari
          <button
            type="button"
            onClick={clearUserFilter}
            aria-label="Filtrni olib tashlash"
            className="grid h-5 w-5 place-items-center rounded-md hover:bg-white/10"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : null}

      <LoadingBar active={loading} />

      <TableShell className="mt-2">
        <thead>
          <tr>
            {isAdmin ? (
              <Th sortKey="username" sort={sort} dir={dir} onSort={onSort}>Admin</Th>
            ) : (
              <Th sortKey="email" sort={sort} dir={dir} onSort={onSort}>Foydalanuvchi</Th>
            )}
            <Th>Qurilma</Th>
            <Th align="center">Holat</Th>
            <Th sortKey="created_at" sort={sort} dir={dir} onSort={onSort}>Kirgan</Th>
            <Th sortKey="expires_at" sort={sort} dir={dir} onSort={onSort}>Muddat</Th>
            <Th align="right" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <EmptyRow
              colSpan={6}
              icon={MonitorSmartphone}
              title="Sessiya topilmadi"
              body={
                q || userId
                  ? "Filtrni o'zgartirib ko'ring."
                  : state === "active"
                    ? "Hozir hech kim kirmagan."
                    : "Yozuv yo'q."
              }
            />
          ) : (
            items.map((s) => (
              <Tr key={`${type}-${s.id}`}>
                <Td>
                  {isAdmin ? (
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-plasma/25 bg-plasma/10">
                        <ShieldCheck className="h-3.5 w-3.5 text-plasma" />
                      </span>
                      <span className="font-mono text-xs text-white/80">{s.username}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Avatar url={s.avatar_url} name={s.full_name || s.email} />
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white/85">
                          {s.full_name || "Ism yo'q"}
                        </div>
                        <div className="truncate text-xs text-white/35">{s.email}</div>
                      </div>
                    </div>
                  )}
                </Td>
                <Td>
                  <div className="text-xs text-white/60">{describeDevice(s.ua)}</div>
                  <div className="font-mono text-[11px] text-white/25">{s.ip}</div>
                </Td>
                <Td align="center">
                  <span
                    className={classNames(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      s.active
                        ? "border-signal-500/30 bg-signal-500/10 text-signal-300"
                        : "border-white/10 bg-white/5 text-white/35",
                    )}
                  >
                    {s.active ? "Faol" : "Tugagan"}
                  </span>
                </Td>
                <Td>
                  <div className="whitespace-nowrap text-xs text-white/55">
                    {timeAgo(s.created_at)}
                  </div>
                  <div className="whitespace-nowrap text-[11px] text-white/25">
                    {formatDateTime(s.created_at)}
                  </div>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-white/45">
                    {expiry(s.expires_at, s.active)}
                  </span>
                </Td>
                <Td align="right">
                  <button
                    type="button"
                    onClick={() => setConfirm(s)}
                    aria-label="Sessiyani tugatish"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/30 transition-colors hover:border-plasma/40 hover:text-plasma"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableShell>

      <Pagination page={page} limit={limit} total={total} onPage={setPage} />

      <ConfirmDialog
        open={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={revoke}
        busy={busy}
        title="Sessiyani tugatish"
        body={
          confirm
            ? isAdmin
              ? `@${confirm.username} ning ${describeDevice(confirm.ua)} qurilmasidagi sessiyasi tugatiladi. Agar bu sizning joriy sessiyangiz bo'lsa, paneldan chiqib ketasiz.`
              : `${confirm.email} ning ${describeDevice(confirm.ua)} qurilmasidagi sessiyasi tugatiladi va u qaytadan kirishi kerak bo'ladi.`
            : ""
        }
      />
    </AdminShell>
  );
}

export default SessionsPage;
