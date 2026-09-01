// src/pages/Visits/VisitsPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { Eye, Trash2, UserCheck, UserX } from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell } from "../../shared/ui/AdminShell.jsx";
import {
  TableShell, Th, Td, Tr, EmptyRow, LoadingBar, Pagination, FilterTabs,
} from "../../shared/ui/DataTable.jsx";
import { ConfirmDialog, SearchInput, Banner } from "../../shared/ui/Overlays.jsx";
import { formatDateTime, timeAgo, describeDevice, hostOf } from "../../shared/lib/format.js";

/**
 * Colour a visitor key so repeat visits from one person are recognisable at a
 * glance without the key itself meaning anything. Derived from the characters,
 * so the same visitor keeps the same colour within a listing.
 */
function visitorHue(key = "") {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % 360;
  return h;
}

export function VisitsPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [q, setQ] = useState("");
  const [signed, setSigned] = useState("");
  const [sort, setSort] = useState("created_at");
  const [dir, setDir] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  const [confirm, setConfirm] = useState(null); // { kind, row? }
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const res = await adminApi.visitsList({ q, signed, page, limit, sort, dir }, { signal });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setLimit(res.limit || limit);
        setPending(!!res.pending_migration);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Tashriflarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, signed, page, sort, dir],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => setPage(1), [q, signed]);

  const onSort = (key) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  };

  const run = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === "row") {
        await adminApi.visitDelete({ id: confirm.row.id });
        setNotice("Yozuv o'chirildi");
      } else if (confirm.kind === "trim") {
        // Everything older than 30 days.
        const before = Math.floor(Date.now() / 1000) - 30 * 86400;
        const res = await adminApi.visitDelete({ before });
        setNotice(`${res.deleted} ta eski yozuv o'chirildi`);
      } else {
        const res = await adminApi.visitDelete({ all: true });
        setNotice(`${res.deleted} ta yozuv o'chirildi`);
      }
      setConfirm(null);
      load();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Tashriflar"
      subtitle={`${total} ta yozuv · birinchi tomon hisoblagichi`}
      actions={
        <>
          <button
            type="button"
            onClick={() => setConfirm({ kind: "trim" })}
            className="rounded-xl border border-white/12 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/55 transition-colors hover:border-white/25 hover:text-white"
          >
            <span className="hidden sm:inline">30 kundan eskisi</span>
            <span className="sm:hidden">Tozalash</span>
          </button>
          <button
            type="button"
            onClick={() => setConfirm({ kind: "all" })}
            className="rounded-xl border border-plasma/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-plasma transition-colors hover:bg-plasma/10"
          >
            Hammasi
          </button>
        </>
      }
    >
      <Banner tone="error" onDismiss={() => setError("")}>{error}</Banner>
      <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner>

      {pending ? (
        <Banner tone="warn">
          Tashriflar jadvali hali yaratilmagan — migratsiyani ishga tushiring.
        </Banner>
      ) : null}

      <div className="mb-3 rounded-xl border border-cyber-500/20 bg-cyber-500/[.05] px-4 py-3 text-xs leading-relaxed text-white/50">
        Tashrifchi kaliti har kuni yangilanadi va IP, brauzer hamda server siridan
        hosil qilinadi. Shu sababli bir kun ichida takroriy tashriflarni ajratish
        mumkin, lekin uni odamning uzoq muddatli izini kuzatish uchun ishlatib
        bo'lmaydi.
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Sahifa, IP, email yoki brauzer..." />
        <FilterTabs
          value={signed}
          onChange={setSigned}
          options={[
            { value: "", label: "Barchasi" },
            { value: "1", label: "Kirganlar" },
            { value: "0", label: "Mehmonlar" },
          ]}
        />
      </div>

      <LoadingBar active={loading} />

      <TableShell className="mt-2">
        <thead>
          <tr>
            <Th sortKey="path" sort={sort} dir={dir} onSort={onSort}>Sahifa</Th>
            <Th>Kim</Th>
            <Th>Manba</Th>
            <Th>Qurilma</Th>
            <Th sortKey="created_at" sort={sort} dir={dir} onSort={onSort}>Vaqt</Th>
            <Th align="right" />
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <EmptyRow
              colSpan={6}
              icon={Eye}
              title="Tashrif yozilmagan"
              body={
                q || signed
                  ? "Filtrni o'zgartirib ko'ring."
                  : "Saytga kirilganda yozuvlar shu yerda paydo bo'ladi."
              }
            />
          ) : (
            items.map((v) => (
              <Tr key={v.id}>
                <Td>
                  <span className="font-mono text-xs text-white/75">{v.path}</span>
                </Td>
                <Td>
                  {v.user_id ? (
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-3.5 w-3.5 shrink-0 text-signal-400" />
                      <div className="min-w-0">
                        <div className="truncate text-xs text-white/75">{v.user_name || "—"}</div>
                        <div className="truncate text-[11px] text-white/30">{v.user_email}</div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <UserX className="h-3.5 w-3.5 shrink-0 text-white/25" />
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          background: `hsl(${visitorHue(v.visitor)} 70% 50% / .15)`,
                          color: `hsl(${visitorHue(v.visitor)} 70% 70%)`,
                        }}
                        title="Kunlik tashrifchi kaliti"
                      >
                        {v.visitor}
                      </span>
                    </div>
                  )}
                </Td>
                <Td>
                  <span className="text-xs text-white/45">
                    {v.referrer ? hostOf(v.referrer) : "to'g'ridan-to'g'ri"}
                  </span>
                </Td>
                <Td>
                  <div className="text-xs text-white/55">{describeDevice(v.ua)}</div>
                  <div className="font-mono text-[11px] text-white/25">{v.ip}</div>
                </Td>
                <Td>
                  <div className="whitespace-nowrap text-xs text-white/55">{timeAgo(v.created_at)}</div>
                  <div className="whitespace-nowrap text-[11px] text-white/25">
                    {formatDateTime(v.created_at)}
                  </div>
                </Td>
                <Td align="right">
                  <button
                    type="button"
                    onClick={() => setConfirm({ kind: "row", row: v })}
                    aria-label="O'chirish"
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
        onConfirm={run}
        busy={busy}
        title={
          confirm?.kind === "all"
            ? "Butun tashrif tarixini o'chirish"
            : confirm?.kind === "trim"
              ? "Eski yozuvlarni o'chirish"
              : "Yozuvni o'chirish"
        }
        confirmWord={confirm?.kind === "all" ? "OCHIRISH" : undefined}
        body={
          confirm?.kind === "all"
            ? "Barcha tashrif yozuvlari o'chiriladi va boshqaruv panelidagi grafik nolga tushadi. Buni qaytarib bo'lmaydi."
            : confirm?.kind === "trim"
              ? "30 kundan eski barcha tashrif yozuvlari o'chiriladi. Grafik oxirgi 30 kunni ko'rsatgani uchun u o'zgarmaydi."
              : `${confirm?.row.path} sahifasiga bo'lgan bitta tashrif yozuvi o'chiriladi.`
        }
      />
    </AdminShell>
  );
}

export default VisitsPage;
