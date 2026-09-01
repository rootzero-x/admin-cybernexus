// src/pages/Audit/AuditPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import { FileClock, Lock } from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell } from "../../shared/ui/AdminShell.jsx";
import {
  TableShell, Th, Td, Tr, EmptyRow, LoadingBar, Pagination,
} from "../../shared/ui/DataTable.jsx";
import { Drawer, SearchInput, Banner } from "../../shared/ui/Overlays.jsx";
import { formatDateTime, timeAgo, describeDevice } from "../../shared/lib/format.js";

function Detail({ label, value, mono }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</div>
      <div className={mono ? "mt-1 font-mono text-xs text-white/70" : "mt-1 text-sm text-white/70"}>
        {value || "—"}
      </div>
    </div>
  );
}

export function AuditPage() {
  const [items, setItems] = useState([]);
  const [actions, setActions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(30);
  const [q, setQ] = useState("");
  const [action, setAction] = useState("");
  const [sort, setSort] = useState("created_at");
  const [dir, setDir] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const res = await adminApi.auditList({ q, action, page, limit, sort, dir }, { signal });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setActions(res.actions || []);
        setLimit(res.limit || limit);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Audit jurnalini yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // limit is left out on purpose: the server echoes the clamped value back,
    // and depending on it here would re-fire the request that just set it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, action, page, sort, dir],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => setPage(1), [q, action]);

  const onSort = (key) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  };

  return (
    <AdminShell title="Audit jurnali" subtitle={`${total} ta yozuv · kim, nima, qachon`}>
      <Banner tone="error" onDismiss={() => setError("")}>{error}</Banner>

      <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[.03] px-4 py-3">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-white/35" />
        <p className="text-xs leading-relaxed text-white/50">
          Bu jurnal faqat o'qish uchun. Uni tahrirlash yoki o'chirish imkoni
          ataylab qo'yilmagan — admin o'zgartira oladigan audit jurnali audit
          jurnali emas.
        </p>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Admin, amal, IP yoki tafsilot..." />
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
        >
          <option value="">Barcha amallar</option>
          {actions.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      <LoadingBar active={loading} />

      <TableShell className="mt-2">
        <thead>
          <tr>
            <Th sortKey="action" sort={sort} dir={dir} onSort={onSort}>Amal</Th>
            <Th sortKey="actor" sort={sort} dir={dir} onSort={onSort}>Kim</Th>
            <Th>Tafsilot</Th>
            <Th>IP / qurilma</Th>
            <Th sortKey="created_at" sort={sort} dir={dir} onSort={onSort}>Vaqt</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <EmptyRow
              colSpan={5}
              icon={FileClock}
              title="Yozuv topilmadi"
              body={q || action ? "Filtrni o'zgartirib ko'ring." : "Admin amallari shu yerda qayd etiladi."}
            />
          ) : (
            items.map((e) => (
              <Tr key={e.id} onClick={() => setSelected(e)}>
                <Td>
                  <code className="font-mono text-xs text-signal-300">{e.action}</code>
                </Td>
                <Td>
                  <span className="text-xs text-white/70">@{e.actor}</span>
                </Td>
                <Td>
                  <span className="line-clamp-1 block max-w-md font-mono text-[11px] text-white/40">
                    {e.meta ? JSON.stringify(e.meta) : "—"}
                  </span>
                </Td>
                <Td>
                  <div className="font-mono text-[11px] text-white/45">{e.ip}</div>
                  <div className="text-[11px] text-white/25">{describeDevice(e.ua)}</div>
                </Td>
                <Td>
                  <div className="whitespace-nowrap text-xs text-white/55">{timeAgo(e.created_at)}</div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableShell>

      <Pagination page={page} limit={limit} total={total} onPage={setPage} />

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.action}
        subtitle={selected ? `@${selected.actor} · ${formatDateTime(selected.created_at)}` : ""}
        width="max-w-xl"
      >
        {selected ? (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Detail label="IP manzil" value={selected.ip} mono />
              <Detail label="Qurilma" value={describeDevice(selected.ua)} />
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                Tafsilotlar
              </div>
              <pre className="mt-2 overflow-x-auto rounded-xl border border-white/8 bg-black/40 p-4 font-mono text-xs leading-relaxed text-white/65">
                {JSON.stringify(selected.meta ?? {}, null, 2)}
              </pre>
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-white/40">
                To'liq User-Agent
              </div>
              <p className="mt-2 break-all rounded-xl border border-white/8 bg-black/25 p-3 font-mono text-[11px] text-white/45">
                {selected.ua || "—"}
              </p>
            </div>
          </div>
        ) : null}
      </Drawer>
    </AdminShell>
  );
}

export default AuditPage;
