// src/pages/News/NewsPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import {
  AlertTriangle, CheckCircle2, ExternalLink, Newspaper, Pencil, Plus,
  RefreshCw, Trash2,
} from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell } from "../../shared/ui/AdminShell.jsx";
import {
  TableShell, Th, Td, Tr, EmptyRow, LoadingBar, Pagination,
} from "../../shared/ui/DataTable.jsx";
import { Drawer, ConfirmDialog, SearchInput, Banner } from "../../shared/ui/Overlays.jsx";
import { Card } from "../../components/ui/Card.jsx";
import { formatDate, timeAgo, hostOf } from "../../shared/lib/format.js";

const EMPTY = {
  id: 0, url: "", title: "", summary: "", image_url: "",
  category: "local", lang: "uz", published_at: 0,
};

/** A feed with nothing newer than this is almost certainly broken. */
const STALE_AFTER_DAYS = 7;

export function NewsPage() {
  const [items, setItems] = useState([]);
  const [health, setHealth] = useState([]);
  const [categories, setCategories] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [source, setSource] = useState("");
  const [sort, setSort] = useState("published_at");
  const [dir, setDir] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [editing, setEditing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [selection, setSelection] = useState(() => new Set());

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const res = await adminApi.newsList({ q, category, source, page, limit, sort, dir }, { signal });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setHealth(res.health || []);
        setCategories(res.categories || {});
        setLimit(res.limit || limit);
        setSelection(new Set());
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Yangiliklarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, category, source, page, sort, dir],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => setPage(1), [q, category, source]);

  const onSort = (key) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  };

  const refreshFeeds = async () => {
    setRefreshing(true);
    setError("");
    setNotice("");
    try {
      const res = await adminApi.newsRefresh();
      const failed = (res.sources || []).filter((s) => !s.ok);
      setNotice(
        `${res.items_new} ta yangi yangilik qo'shildi (jami ${res.items_total}).` +
          (failed.length ? ` ${failed.length} ta manba javob bermadi: ${failed.map((f) => f.source).join(", ")}.` : ""),
      );
      load();
    } catch (e) {
      setError(e.message || "Yangilashda xato");
    } finally {
      setRefreshing(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adminApi.newsSave({
        id: editing.id || undefined,
        url: editing.url,
        title: editing.title,
        summary: editing.summary,
        image_url: editing.image_url,
        category: editing.category,
        lang: editing.lang,
        published_at: editing.published_at || undefined,
      });
      setNotice(editing.id ? "Yangilik tahrirlandi" : "Yangilik qo'shildi");
      setEditing(null);
      load();
    } catch (e2) {
      setError(e2.message || "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      // A bulk delete is one request; a row delete carries the single id.
      await adminApi.newsDelete(
        confirmDelete === "bulk" ? Array.from(selection) : confirmDelete.id,
      );
      setNotice(confirmDelete === "bulk" ? `${selection.size} ta yangilik o'chirildi` : "Yangilik o'chirildi");
      setConfirmDelete(null);
      load();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id) => {
    setSelection((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const staleCutoff = Math.floor(Date.now() / 1000) - STALE_AFTER_DAYS * 86400;

  return (
    <AdminShell
      title="Yangiliklar"
      subtitle={`${total} ta maqola · ${health.filter((h) => h.configured).length} ta manba`}
      actions={
        <>
          <button
            type="button"
            onClick={refreshFeeds}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-cyber-500/35 bg-cyber-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-cyber-300 transition-colors hover:bg-cyber-500/20 disabled:opacity-50"
          >
            <RefreshCw className={classNames("h-3.5 w-3.5", refreshing && "animate-spin")} />
            <span className="hidden sm:inline">{refreshing ? "Yig'ilmoqda..." : "Manbalarni yig'ish"}</span>
          </button>
          <button
            type="button"
            onClick={() => setEditing({ ...EMPTY })}
            className="inline-flex items-center gap-2 rounded-xl border border-signal-500/35 bg-signal-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-signal-300 transition-colors hover:bg-signal-500/20"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Qo'shish</span>
          </button>
        </>
      }
    >
      <Banner tone="error" onDismiss={() => setError("")}>{error}</Banner>
      <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner>

      {/* ---------------- Source health ---------------- */}
      <Card className="mb-4 p-5">
        <h2 className="font-display text-base font-bold text-white">Manbalar holati</h2>
        <p className="mt-0.5 text-xs text-white/40">
          Yangi maqola kelmayotgan manba shu yerda ko'rinadi — aks holda faqat
          maqolalar soni kamayadi va buni sezish qiyin.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {health.map((h) => {
            const stale = !h.newest_at || h.newest_at < staleCutoff;
            const broken = h.items === 0;

            return (
              <button
                key={h.key}
                type="button"
                onClick={() => setSource(source === h.key ? "" : h.key)}
                className={classNames(
                  "flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors",
                  source === h.key
                    ? "border-signal-500/40 bg-signal-500/10"
                    : "border-white/8 bg-black/20 hover:border-white/20",
                )}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-white">{h.name}</div>
                  <div className="mt-0.5 text-[11px] text-white/35">
                    {h.items} ta · {h.newest_at ? timeAgo(h.newest_at) : "hech qachon"}
                  </div>
                </div>
                {broken ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-plasma" />
                ) : stale ? (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-400" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-signal-400" />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ---------------- Filters ---------------- */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Sarlavha, matn yoki havola..." />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
        >
          <option value="">Barcha kategoriya</option>
          {Object.entries(categories).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </select>

        {source ? (
          <button
            type="button"
            onClick={() => setSource("")}
            className="whitespace-nowrap rounded-xl border border-signal-500/35 bg-signal-500/10 px-3.5 py-2.5 text-xs font-bold text-signal-300"
          >
            {source} ✕
          </button>
        ) : null}
      </div>

      {selection.size > 0 ? (
        <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-plasma/25 bg-plasma/[.06] px-4 py-2.5">
          <span className="text-sm text-white/70">{selection.size} ta tanlandi</span>
          <button
            type="button"
            onClick={() => setConfirmDelete("bulk")}
            className="inline-flex items-center gap-1.5 rounded-lg border border-plasma/35 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-plasma hover:bg-plasma/15"
          >
            <Trash2 className="h-3.5 w-3.5" />
            O'chirish
          </button>
        </div>
      ) : null}

      <LoadingBar active={loading} />

      <TableShell className="mt-2">
        <thead>
          <tr>
            <Th className="w-10">
              <input
                type="checkbox"
                aria-label="Barchasini tanlash"
                checked={items.length > 0 && selection.size === items.length}
                onChange={(e) =>
                  setSelection(e.target.checked ? new Set(items.map((i) => i.id)) : new Set())
                }
                className="h-3.5 w-3.5 accent-emerald-400"
              />
            </Th>
            <Th sortKey="title" sort={sort} dir={dir} onSort={onSort}>Sarlavha</Th>
            <Th sortKey="source" sort={sort} dir={dir} onSort={onSort}>Manba</Th>
            <Th align="center">Til</Th>
            <Th sortKey="published_at" sort={sort} dir={dir} onSort={onSort}>Chop etilgan</Th>
            <Th align="right">Amallar</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <EmptyRow
              colSpan={6}
              icon={Newspaper}
              title="Yangilik topilmadi"
              body={q || category || source ? "Filtrni o'zgartirib ko'ring." : "Manbalarni yig'ish tugmasini bosing."}
            />
          ) : (
            items.map((n) => (
              <Tr key={n.id}>
                <Td>
                  <input
                    type="checkbox"
                    aria-label={`${n.title} tanlash`}
                    checked={selection.has(n.id)}
                    onChange={() => toggleSelect(n.id)}
                    className="h-3.5 w-3.5 accent-emerald-400"
                  />
                </Td>
                <Td>
                  <div className="flex items-start gap-3">
                    {n.image_url ? (
                      <img
                        src={n.image_url}
                        alt=""
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        // A dead remote image should leave a gap, not a broken icon.
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                        className="h-10 w-14 shrink-0 rounded border border-white/10 object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div className="line-clamp-2 max-w-lg text-white/80">{n.title}</div>
                      <div className="mt-0.5 truncate text-[11px] text-white/25">{hostOf(n.url)}</div>
                    </div>
                  </div>
                </Td>
                <Td>
                  <div className="text-xs text-white/60">{n.source_name}</div>
                  <div className="text-[11px] text-white/25">{categories[n.category] || n.category}</div>
                </Td>
                <Td align="center">
                  <span className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white/50">
                    {n.lang}
                  </span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-white/55">
                    {formatDate(n.published_at)}
                  </span>
                </Td>
                <Td align="right">
                  <div className="inline-flex items-center gap-1.5">
                    <a
                      href={n.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Manbani ochish"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-cyber-500/40 hover:text-cyber-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setEditing({ ...n, image_url: n.image_url || "" })}
                      aria-label="Tahrirlash"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(n)}
                      aria-label="O'chirish"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-plasma/40 hover:text-plasma"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </Td>
              </Tr>
            ))
          )}
        </tbody>
      </TableShell>

      <Pagination page={page} limit={limit} total={total} onPage={setPage} />

      {/* ---------------- Editor ---------------- */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Yangilikni tahrirlash" : "Yangilik qo'shish"}
        subtitle={editing?.id ? editing.source_name : "Qo'lda qo'shilgan yangilik 'manual' manbasi bilan saqlanadi"}
      >
        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <Field label="Havola *">
              <input
                required
                type="url"
                value={editing.url}
                onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
              />
            </Field>

            <Field label="Sarlavha *">
              <input
                required
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                maxLength={400}
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
              />
            </Field>

            <Field label="Qisqacha">
              <textarea
                rows={4}
                value={editing.summary}
                onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
                maxLength={2000}
                className="w-full resize-y rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
              />
            </Field>

            <Field label="Rasm havolasi">
              <input
                type="url"
                value={editing.image_url}
                onChange={(e) => setEditing({ ...editing, image_url: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-signal-400/70"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategoriya *">
                <select
                  value={editing.category}
                  onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
                >
                  {Object.entries(categories).map(([k, label]) => (
                    <option key={k} value={k}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Til *">
                <select
                  value={editing.lang}
                  onChange={(e) => setEditing({ ...editing, lang: e.target.value })}
                  className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
                >
                  <option value="uz">O'zbekcha</option>
                  <option value="en">English</option>
                </select>
              </Field>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl border border-signal-500/40 bg-signal-500/15 px-4 py-3 text-sm font-bold uppercase tracking-wider text-signal-300 transition-colors hover:bg-signal-500/25 disabled:opacity-50"
            >
              {busy ? "Saqlanmoqda..." : "Saqlash"}
            </button>
          </form>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={!!confirmDelete}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={doDelete}
        busy={busy}
        title={confirmDelete === "bulk" ? "Tanlanganlarni o'chirish" : "Yangilikni o'chirish"}
        body={
          confirmDelete === "bulk"
            ? `${selection.size} ta yangilik o'chiriladi. Manba hali ham bu maqolalarni tarqatayotgan bo'lsa, keyingi yig'ishda ular qaytadi.`
            : confirmDelete
              ? `"${confirmDelete.title}" o'chiriladi. Manbadan kelgan maqola bo'lsa, keyingi yig'ishda qayta qo'shilishi mumkin.`
              : ""
        }
      />
    </AdminShell>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default NewsPage;
