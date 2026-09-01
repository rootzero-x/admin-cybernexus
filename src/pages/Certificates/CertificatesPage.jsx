// src/pages/Certificates/CertificatesPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import {
  Award, BadgeCheck, ExternalLink, Plus, RotateCcw, ShieldX, Trash2,
} from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell } from "../../shared/ui/AdminShell.jsx";
import {
  TableShell, Th, Td, Tr, EmptyRow, LoadingBar, Pagination, FilterTabs,
} from "../../shared/ui/DataTable.jsx";
import { Drawer, ConfirmDialog, SearchInput, Banner } from "../../shared/ui/Overlays.jsx";
import { formatDate } from "../../shared/lib/format.js";

const SITE = "https://cybernexus.uz";

export function CertificatesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [sort, setSort] = useState("issued_at");
  const [dir, setDir] = useState("desc");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ full_name: "", user_id: "", score: "", total: "20" });
  const [busy, setBusy] = useState(false);

  const [confirm, setConfirm] = useState(null); // { kind: "revoke"|"restore"|"delete", cert }

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const res = await adminApi.certsList({ q, state, page, limit, sort, dir }, { signal });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setLimit(res.limit || limit);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Sertifikatlarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, state, page, sort, dir],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => setPage(1), [q, state]);

  const onSort = (key) => {
    if (sort === key) setDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSort(key);
      setDir("desc");
    }
  };

  const submitCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await adminApi.certCreate({
        full_name: form.full_name,
        user_id: form.user_id === "" ? null : Number(form.user_id),
        score: Number(form.score),
        total: Number(form.total),
      });
      setCreating(false);
      setForm({ full_name: "", user_id: "", score: "", total: "20" });
      setNotice(`Sertifikat berildi: ${res.cert_id}`);
      load();
    } catch (e2) {
      setError(e2.message || "Sertifikat yaratib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  const runConfirm = async () => {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === "delete") {
        await adminApi.certDelete(confirm.cert.id);
        setNotice("Sertifikat o'chirildi");
      } else {
        await adminApi.certUpdate({
          id: confirm.cert.id,
          revoked: confirm.kind === "revoke",
        });
        setNotice(confirm.kind === "revoke" ? "Sertifikat bekor qilindi" : "Sertifikat tiklandi");
      }
      setConfirm(null);
      load();
    } catch (e) {
      setError(e.message || "Amalni bajarib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Sertifikatlar"
      subtitle={`${total} ta berilgan sertifikat`}
      actions={
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-signal-500/35 bg-signal-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-signal-300 transition-colors hover:bg-signal-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Qo'lda berish</span>
        </button>
      }
    >
      <Banner tone="error" onDismiss={() => setError("")}>{error}</Banner>
      <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="ID, ism yoki email..." />
        <FilterTabs
          value={state}
          onChange={setState}
          options={[
            { value: "", label: "Barchasi" },
            { value: "valid", label: "Amalda" },
            { value: "revoked", label: "Bekor qilingan" },
          ]}
        />
      </div>

      <LoadingBar active={loading} />

      <TableShell className="mt-2">
        <thead>
          <tr>
            <Th sortKey="cert_id" sort={sort} dir={dir} onSort={onSort}>Sertifikat</Th>
            <Th sortKey="full_name" sort={sort} dir={dir} onSort={onSort}>Egasi</Th>
            <Th sortKey="percent" sort={sort} dir={dir} onSort={onSort} align="center">Natija</Th>
            <Th align="center">Holat</Th>
            <Th sortKey="issued_at" sort={sort} dir={dir} onSort={onSort}>Berilgan</Th>
            <Th align="right">Amallar</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <EmptyRow
              colSpan={6}
              icon={Award}
              title="Sertifikat topilmadi"
              body={
                q || state
                  ? "Filtrni o'zgartirib ko'ring."
                  : "Hali hech kim imtihondan o'tmagan. Qo'lda ham berish mumkin."
              }
            />
          ) : (
            items.map((c) => (
              <Tr key={c.id}>
                <Td>
                  <code className="font-mono text-xs tracking-wider text-white">{c.cert_id}</code>
                  <div className="mt-0.5 text-[11px] text-white/30">{c.grade}</div>
                </Td>
                <Td>
                  <div className="font-medium text-white">{c.full_name}</div>
                  <div className="text-xs text-white/35">
                    {c.user_email || (c.user_id ? `#${c.user_id}` : "hisobsiz")}
                  </div>
                </Td>
                <Td align="center">
                  <div className="font-display text-sm font-bold tabular-nums text-signal-300">
                    {c.percent}%
                  </div>
                  <div className="text-[11px] text-white/30">{c.score}/{c.total}</div>
                </Td>
                <Td align="center">
                  {c.revoked ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-plasma/35 bg-plasma/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-plasma">
                      <ShieldX className="h-3 w-3" />
                      Bekor
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full border border-signal-500/30 bg-signal-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-signal-300">
                      <BadgeCheck className="h-3 w-3" />
                      Amalda
                    </span>
                  )}
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-white/55">
                    {formatDate(c.issued_at)}
                  </span>
                </Td>
                <Td align="right">
                  <div className="inline-flex items-center gap-1.5">
                    <a
                      href={`${SITE}/verify/${c.cert_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Tekshirish sahifasi"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-cyber-500/40 hover:text-cyber-300"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: c.revoked ? "restore" : "revoke", cert: c })}
                      aria-label={c.revoked ? "Tiklash" : "Bekor qilish"}
                      className={classNames(
                        "grid h-8 w-8 place-items-center rounded-lg border border-white/10 transition-colors",
                        c.revoked
                          ? "text-white/35 hover:border-signal-500/40 hover:text-signal-300"
                          : "text-white/35 hover:border-yellow-400/40 hover:text-yellow-300",
                      )}
                    >
                      {c.revoked ? <RotateCcw className="h-3.5 w-3.5" /> : <ShieldX className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirm({ kind: "delete", cert: c })}
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

      {/* ---------------- Manual issue ---------------- */}
      <Drawer
        open={creating}
        onClose={() => setCreating(false)}
        title="Qo'lda sertifikat berish"
        subtitle="Imtihondan tashqari berilgan sertifikat audit jurnaliga yoziladi"
        width="max-w-lg"
      >
        <form onSubmit={submitCreate} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
              To'liq ism *
            </label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              maxLength={190}
              className="mt-2 w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
            />
            <p className="mt-1.5 text-[11px] text-white/30">
              Sertifikatga shu ism chop etiladi.
            </p>
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
              Foydalanuvchi ID (ixtiyoriy)
            </label>
            <input
              type="number"
              min="1"
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              placeholder="Bo'sh qoldirsangiz hisobga bog'lanmaydi"
              className="mt-2 w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-signal-400/70"
            />
            <p className="mt-1.5 text-[11px] text-white/30">
              Bog'langan sertifikat egasining profilida ko'rinadi.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
                To'g'ri javob *
              </label>
              <input
                required
                type="number"
                min="0"
                value={form.score}
                onChange={(e) => setForm({ ...form, score: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
                Jami savol *
              </label>
              <input
                required
                type="number"
                min="1"
                max="200"
                value={form.total}
                onChange={(e) => setForm({ ...form, total: e.target.value })}
                className="mt-2 w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
              />
            </div>
          </div>

          <div className="rounded-xl border border-cyber-500/25 bg-cyber-500/[.06] px-4 py-3 text-xs leading-relaxed text-white/55">
            Daraja foizdan avtomatik hisoblanadi: 90%+ Distinction, 80%+ Merit,
            qolgani Pass. ID server tomonidan beriladi va darhol tekshirilishi mumkin.
          </div>

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-xl border border-signal-500/40 bg-signal-500/15 px-4 py-3 text-sm font-bold uppercase tracking-wider text-signal-300 transition-colors hover:bg-signal-500/25 disabled:opacity-50"
          >
            {busy ? "Berilmoqda..." : "Sertifikat berish"}
          </button>
        </form>
      </Drawer>

      <ConfirmDialog
        open={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirm}
        busy={busy}
        title={
          confirm?.kind === "delete"
            ? "Sertifikatni o'chirish"
            : confirm?.kind === "revoke"
              ? "Sertifikatni bekor qilish"
              : "Sertifikatni tiklash"
        }
        confirmLabel={
          confirm?.kind === "delete" ? "O'chirish" : confirm?.kind === "revoke" ? "Bekor qilish" : "Tiklash"
        }
        confirmWord={confirm?.kind === "delete" ? confirm.cert.cert_id : undefined}
        body={
          confirm?.kind === "delete"
            ? `${confirm.cert.cert_id} butunlay o'chiriladi va tekshiruvda "topilmadi" deb chiqadi — ya'ni umuman berilmagandek ko'rinadi. Odatda bekor qilish to'g'riroq: u sertifikat bor edi-yu, endi amal qilmasligini ko'rsatadi.`
            : confirm?.kind === "revoke"
              ? `${confirm?.cert.cert_id} tekshiruvdan o'tmaydigan bo'ladi. Yozuv saqlanadi va keyin tiklash mumkin.`
              : `${confirm?.cert.cert_id} yana amal qila boshlaydi.`
        }
      />
    </AdminShell>
  );
}

export default CertificatesPage;
