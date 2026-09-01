// src/pages/Messages/MessagesPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import { Archive, Check, Mail, MailOpen, Reply, Trash2 } from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell } from "../../shared/ui/AdminShell.jsx";
import {
  TableShell, Th, Td, Tr, EmptyRow, LoadingBar, Pagination, FilterTabs,
} from "../../shared/ui/DataTable.jsx";
import { Drawer, ConfirmDialog, SearchInput, Banner } from "../../shared/ui/Overlays.jsx";
import { formatDateTime, timeAgo, describeDevice } from "../../shared/lib/format.js";

const STATUSES = [
  { value: "new", label: "Yangi", tone: "plasma" },
  { value: "read", label: "O'qilgan", tone: "cyber" },
  { value: "replied", label: "Javob berilgan", tone: "signal" },
  { value: "archived", label: "Arxiv", tone: "muted" },
];

function StatusBadge({ status }) {
  const meta = STATUSES.find((s) => s.value === status) || STATUSES[0];
  const tones = {
    plasma: "border-plasma/35 bg-plasma/10 text-plasma",
    cyber: "border-cyber-500/30 bg-cyber-500/10 text-cyber-300",
    signal: "border-signal-500/30 bg-signal-500/10 text-signal-300",
    muted: "border-white/12 bg-white/5 text-white/45",
  };

  return (
    <span
      className={classNames(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tones[meta.tone],
      )}
    >
      {meta.label}
    </span>
  );
}

export function MessagesPage() {
  const [items, setItems] = useState([]);
  const [counts, setCounts] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("created_at");
  const [dir, setDir] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const res = await adminApi.messagesList({ q, status, page, limit, sort, dir }, { signal });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setCounts(res.counts || {});
        setLimit(res.limit || limit);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Xabarlarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // limit is intentionally left out: the server echoes back the clamped
    // value, and depending on it here would re-fire the request it just set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, status, page, sort, dir],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  // Any filter change starts over at page one, or an empty page 4 is shown.
  useEffect(() => setPage(1), [q, status]);

  const onSort = (key) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  };

  const open = async (m) => {
    setSelected(m);
    setNote(m.admin_note || "");

    // Opening an unread message marks it read — that is what "opened" means,
    // and making the admin click a second button for it is busywork.
    if (m.status === "new") {
      try {
        await adminApi.messageUpdate({ id: m.id, status: "read" });
        setItems((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: "read" } : x)));
        setSelected((prev) => (prev ? { ...prev, status: "read" } : prev));
        setCounts((c) => ({
          ...c,
          new: Math.max(0, (c.new || 1) - 1),
          read: (c.read || 0) + 1,
        }));
      } catch {
        /* not worth surfacing — the message is open either way */
      }
    }
  };

  const setStatusOf = async (id, next) => {
    setSaving(true);
    try {
      await adminApi.messageUpdate({ id, status: next, admin_note: note });
      setItems((prev) => prev.map((x) => (x.id === id ? { ...x, status: next, admin_note: note } : x)));
      setSelected((prev) => (prev ? { ...prev, status: next, admin_note: note } : prev));
      setNotice("Saqlandi");
      load();
    } catch (e) {
      setError(e.message || "Saqlab bo'lmadi");
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await adminApi.messageDelete(confirmDelete.id);
      setConfirmDelete(null);
      setSelected(null);
      setNotice("Xabar o'chirildi");
      load();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AdminShell
      title="Xabarlar"
      subtitle={`${total} ta murojaat · aloqa formasidan`}
    >
      <Banner tone="error" onDismiss={() => setError("")}>{error}</Banner>
      <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Ism, email, mavzu yoki matn..." />
      </div>

      <div className="mb-4">
        <FilterTabs
          value={status}
          onChange={setStatus}
          options={[
            { value: "", label: "Barchasi", count: total && !status ? total : undefined },
            ...STATUSES.map((s) => ({ value: s.value, label: s.label, count: counts[s.value] || 0 })),
          ]}
        />
      </div>

      <LoadingBar active={loading} />

      <TableShell className="mt-2">
        <thead>
          <tr>
            <Th sortKey="name" sort={sort} dir={dir} onSort={onSort}>Kimdan</Th>
            <Th sortKey="subject" sort={sort} dir={dir} onSort={onSort}>Mavzu</Th>
            <Th>Holat</Th>
            <Th sortKey="created_at" sort={sort} dir={dir} onSort={onSort}>Sana</Th>
            <Th align="right">Amal</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <EmptyRow
              colSpan={5}
              icon={Mail}
              title="Xabar topilmadi"
              body={q || status ? "Filtrni o'zgartirib ko'ring." : "Hali hech kim aloqa formasidan yozmagan."}
            />
          ) : (
            items.map((m) => (
              <Tr key={m.id} onClick={() => open(m)}>
                <Td>
                  <div className="font-medium text-white">{m.name}</div>
                  <div className="text-xs text-white/35">{m.email}</div>
                </Td>
                <Td>
                  <div className={classNames("truncate", m.status === "new" ? "font-semibold text-white" : "text-white/65")}>
                    {m.subject}
                  </div>
                  <div className="mt-0.5 max-w-md truncate text-xs text-white/30">{m.message}</div>
                </Td>
                <Td><StatusBadge status={m.status} /></Td>
                <Td>
                  <div className="whitespace-nowrap text-xs text-white/55">{timeAgo(m.created_at)}</div>
                </Td>
                <Td align="right">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(m);
                    }}
                    aria-label="O'chirish"
                    className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-plasma/40 hover:text-plasma"
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

      {/* ---------------- Detail ---------------- */}
      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.subject}
        subtitle={selected ? `${selected.name} · ${selected.email}` : ""}
        footer={
          selected ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStatusOf(selected.id, "replied")}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-signal-500/35 bg-signal-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-signal-300 transition-colors hover:bg-signal-500/20 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  Javob berildi
                </button>
                <button
                  type="button"
                  onClick={() => setStatusOf(selected.id, "archived")}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/55 transition-colors hover:text-white disabled:opacity-50"
                >
                  <Archive className="h-3.5 w-3.5" />
                  Arxivlash
                </button>
                <button
                  type="button"
                  onClick={() => setStatusOf(selected.id, "new")}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/55 transition-colors hover:text-white disabled:opacity-50"
                >
                  <MailOpen className="h-3.5 w-3.5" />
                  Yangi deb belgilash
                </button>
              </div>

              <button
                type="button"
                onClick={() => setConfirmDelete(selected)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-plasma/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-plasma transition-colors hover:bg-plasma/10"
              >
                <Trash2 className="h-3.5 w-3.5" />
                O'chirish
              </button>
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={selected.status} />
              <span className="text-xs text-white/35">{formatDateTime(selected.created_at)}</span>
            </div>

            <div className="rounded-xl border border-white/8 bg-black/25 p-4">
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/75">
                {selected.message}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
                Ichki izoh
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Faqat adminlar ko'radi..."
                className="mt-2 w-full resize-y rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none transition-colors focus:border-signal-400/70"
              />
              <button
                type="button"
                onClick={() => setStatusOf(selected.id, selected.status)}
                disabled={saving}
                className="mt-2 rounded-lg border border-white/12 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white/55 transition-colors hover:text-white disabled:opacity-50"
              >
                Izohni saqlash
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="IP manzil" value={selected.ip} mono />
              <Field label="Qurilma" value={describeDevice(selected.ua)} />
              {selected.handled_by ? (
                <Field label="Ko'rgan admin" value={`@${selected.handled_by}`} />
              ) : null}
              {selected.handled_at ? (
                <Field label="Oxirgi o'zgarish" value={formatDateTime(selected.handled_at)} />
              ) : null}
            </div>

            <a
              href={`mailto:${selected.email}?subject=${encodeURIComponent("Re: " + selected.subject)}`}
              className="inline-flex items-center gap-2 rounded-xl border border-cyber-500/35 bg-cyber-500/10 px-4 py-2.5 text-sm font-bold text-cyber-300 transition-colors hover:border-cyber-400"
            >
              <Reply className="h-4 w-4" />
              Pochta orqali javob berish
            </a>
          </div>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        busy={deleting}
        title="Xabarni o'chirish"
        body={
          confirmDelete
            ? `"${confirmDelete.subject}" xabari butunlay o'chiriladi. Bu amalni qaytarib bo'lmaydi — audit jurnalida faqat kim va qachon o'chirgani qoladi.`
            : ""
        }
      />
    </AdminShell>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</div>
      <div className={classNames("mt-1 truncate text-sm text-white/70", mono && "font-mono text-xs")}>
        {value || "—"}
      </div>
    </div>
  );
}

export default MessagesPage;
