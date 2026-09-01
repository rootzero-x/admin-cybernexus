// src/pages/Users/UsersPage.jsx
import React, { useCallback, useEffect, useState } from "react";
import classNames from "classnames";
import {
  Award, Eye, Mail, MonitorSmartphone, Pencil, Plus, ShieldOff, Trash2, UserCheck, Users,
} from "lucide-react";

import { adminApi } from "../../shared/api/adminApi.js";
import { AdminShell } from "../../shared/ui/AdminShell.jsx";
import {
  TableShell, Th, Td, Tr, EmptyRow, LoadingBar, Pagination, FilterTabs,
} from "../../shared/ui/DataTable.jsx";
import { Drawer, ConfirmDialog, SearchInput, Banner } from "../../shared/ui/Overlays.jsx";
import { formatDate, formatDateTime, timeAgo, describeDevice } from "../../shared/lib/format.js";

const ROLES = ["user", "moderator", "admin"];

const BLANK = {
  id: 0, email: "", full_name: "", avatar_url: "",
  role: "user", is_active: true, password: "",
};

function Avatar({ url, name, size = "h-8 w-8" }) {
  const [broken, setBroken] = useState(false);
  const initials = (name || "U").trim().slice(0, 2).toUpperCase();

  if (url && !broken) {
    return (
      <img
        src={url}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setBroken(true)}
        className={classNames(size, "shrink-0 rounded-lg border border-white/12 object-cover")}
      />
    );
  }

  return (
    <span
      className={classNames(
        size,
        "grid shrink-0 place-items-center rounded-lg border border-signal-500/25 bg-signal-500/10 text-[10px] font-bold text-signal-300",
      )}
    >
      {initials}
    </span>
  );
}

export function UsersPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const [detail, setDetail] = useState(null);      // full record from users_get
  const [detailLoading, setDetailLoading] = useState(false);
  const [editing, setEditing] = useState(null);    // form state
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [keepCerts, setKeepCerts] = useState(true);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError("");
      try {
        const res = await adminApi.usersList({ q, role, active, page, limit }, { signal });
        setItems(res.items || []);
        setTotal(res.total || 0);
        setLimit(res.limit || limit);
      } catch (e) {
        if (e.name === "AbortError") return;
        setError(e.message || "Foydalanuvchilarni yuklab bo'lmadi");
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [q, role, active, page],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [load]);

  useEffect(() => setPage(1), [q, role, active]);

  const openDetail = async (u) => {
    setDetail({ user: u });   // show what the row already has, fill in the rest
    setDetailLoading(true);
    try {
      setDetail(await adminApi.userGet(u.id));
    } catch (e) {
      setError(e.message || "Ma'lumotni olib bo'lmadi");
    } finally {
      setDetailLoading(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const payload = {
        email: editing.email,
        full_name: editing.full_name,
        avatar_url: editing.avatar_url,
        role: editing.role,
        is_active: editing.is_active,
      };
      // An empty password field means "leave it alone", not "clear it".
      if (editing.password) payload.password = editing.password;

      if (editing.id) {
        await adminApi.userUpdate({ id: editing.id, ...payload });
        setNotice("Foydalanuvchi yangilandi");
      } else {
        await adminApi.userCreate(payload);
        setNotice("Foydalanuvchi qo'shildi");
      }

      setEditing(null);
      setDetail(null);
      load();
    } catch (e2) {
      setError(e2.message || "Saqlab bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await adminApi.userUpdate({ id: u.id, is_active: !Number(u.is_active) });
      setItems((prev) =>
        prev.map((x) => (x.id === u.id ? { ...x, is_active: Number(u.is_active) ? 0 : 1 } : x)),
      );
      setNotice(Number(u.is_active) ? "Hisob o'chirildi" : "Hisob yoqildi");
    } catch (e) {
      setError(e.message || "O'zgartirib bo'lmadi");
    }
  };

  const doDelete = async () => {
    setBusy(true);
    try {
      const res = await adminApi.userDelete(confirmDelete.id, keepCerts);
      setNotice(
        `Hisob o'chirildi. ${res.cleanup?.sessions || 0} ta sessiya tugatildi.` +
          (keepCerts ? " Sertifikatlar saqlanib qoldi." : ""),
      );
      setConfirmDelete(null);
      setDetail(null);
      load();
    } catch (e) {
      setError(e.message || "O'chirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminShell
      title="Foydalanuvchilar"
      subtitle={`${total} ta hisob`}
      actions={
        <button
          type="button"
          onClick={() => setEditing({ ...BLANK })}
          className="inline-flex items-center gap-2 rounded-xl border border-signal-500/35 bg-signal-500/10 px-3 py-2 text-xs font-bold uppercase tracking-wider text-signal-300 transition-colors hover:bg-signal-500/20"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Qo'shish</span>
        </button>
      }
    >
      <Banner tone="error" onDismiss={() => setError("")}>{error}</Banner>
      <Banner tone="ok" onDismiss={() => setNotice("")}>{notice}</Banner>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={q} onChange={setQ} placeholder="Email, ism yoki GitHub..." />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
        >
          <option value="">Barcha rol</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <FilterTabs
          value={active}
          onChange={setActive}
          options={[
            { value: "", label: "Barchasi" },
            { value: "1", label: "Faol" },
            { value: "0", label: "O'chirilgan" },
          ]}
        />
      </div>

      <LoadingBar active={loading} />

      <TableShell className="mt-2">
        <thead>
          <tr>
            <Th>Foydalanuvchi</Th>
            <Th align="center">Rol</Th>
            <Th align="center">Holat</Th>
            <Th>Oxirgi kirish</Th>
            <Th>Ro'yxatdan</Th>
            <Th align="right">Amallar</Th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && !loading ? (
            <EmptyRow
              colSpan={6}
              icon={Users}
              title="Foydalanuvchi topilmadi"
              body={q || role || active ? "Filtrni o'zgartirib ko'ring." : "Hali hech kim ro'yxatdan o'tmagan."}
            />
          ) : (
            items.map((u) => (
              <Tr key={u.id} onClick={() => openDetail(u)}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar url={u.avatar_url} name={u.full_name || u.email} />
                    <div className="min-w-0">
                      <div className="truncate font-medium text-white">
                        {u.full_name || "Ism yo'q"}
                      </div>
                      <div className="truncate text-xs text-white/35">{u.email}</div>
                    </div>
                  </div>
                </Td>
                <Td align="center">
                  <span
                    className={classNames(
                      "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      u.role === "admin"
                        ? "border-plasma/35 bg-plasma/10 text-plasma"
                        : u.role === "moderator"
                          ? "border-cyber-500/30 bg-cyber-500/10 text-cyber-300"
                          : "border-white/12 bg-white/5 text-white/45",
                    )}
                  >
                    {u.role}
                  </span>
                </Td>
                <Td align="center">
                  {Number(u.is_active) ? (
                    <span className="text-xs text-signal-300">Faol</span>
                  ) : (
                    <span className="text-xs text-white/30">O'chirilgan</span>
                  )}
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-white/50">
                    {u.last_login_at ? timeAgo(u.last_login_at) : "—"}
                  </span>
                </Td>
                <Td>
                  <span className="whitespace-nowrap text-xs text-white/50">
                    {formatDate(u.created_at)}
                  </span>
                </Td>
                <Td align="right">
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleActive(u);
                      }}
                      aria-label={Number(u.is_active) ? "O'chirish" : "Yoqish"}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-yellow-400/40 hover:text-yellow-300"
                    >
                      {Number(u.is_active) ? <ShieldOff className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing({
                          id: u.id,
                          email: u.email,
                          full_name: u.full_name || "",
                          avatar_url: u.avatar_url || "",
                          role: u.role,
                          is_active: !!Number(u.is_active),
                          password: "",
                        });
                      }}
                      aria-label="Tahrirlash"
                      className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/35 transition-colors hover:border-white/30 hover:text-white"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setKeepCerts(true);
                        setConfirmDelete(u);
                      }}
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

      {/* ---------------- Detail ---------------- */}
      <Drawer
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail?.user?.full_name || detail?.user?.email || "Foydalanuvchi"}
        subtitle={detail?.user?.email}
        width="max-w-3xl"
      >
        {detail ? (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Avatar url={detail.user.avatar_url} name={detail.user.full_name} size="h-14 w-14" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-2">
                  <Tag>{detail.user.role}</Tag>
                  {detail.user.provider ? <Tag>{detail.user.provider}</Tag> : null}
                  <Tag tone={detail.user.is_active ? "ok" : "muted"}>
                    {detail.user.is_active ? "Faol" : "O'chirilgan"}
                  </Tag>
                  {detail.user.has_password ? <Tag>parol o'rnatilgan</Tag> : null}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditing({
                    id: detail.user.id,
                    email: detail.user.email,
                    full_name: detail.user.full_name || "",
                    avatar_url: detail.user.avatar_url || "",
                    role: detail.user.role,
                    is_active: !!detail.user.is_active,
                    password: "",
                  })
                }
                className="rounded-xl border border-white/12 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:border-white/25 hover:text-white"
              >
                Tahrirlash
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Info label="Ro'yxatdan" value={formatDate(detail.user.created_at)} />
              <Info label="Oxirgi kirish" value={detail.user.last_login_at ? timeAgo(detail.user.last_login_at) : "—"} />
              <Info label="ID" value={`#${detail.user.id}`} mono />
            </div>

            {detailLoading ? (
              <div className="text-sm text-white/35">Tafsilotlar yuklanmoqda...</div>
            ) : null}

            <Panel icon={MonitorSmartphone} title="Qurilmalar" count={detail.sessions?.length}>
              {(detail.sessions || []).length === 0 ? (
                <Muted>Faol sessiya yo'q</Muted>
              ) : (
                detail.sessions.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 last:border-0">
                    <div className="min-w-0">
                      <div className="text-xs text-white/70">{describeDevice(s.ua)}</div>
                      <div className="font-mono text-[11px] text-white/25">{s.ip}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="text-[11px] text-white/45">{timeAgo(s.created_at)}</div>
                      <div className="text-[10px] text-white/25">{s.active ? "faol" : "tugagan"}</div>
                    </div>
                  </div>
                ))
              )}
            </Panel>

            <Panel icon={Award} title="Sertifikatlar" count={detail.certificates?.length}>
              {(detail.certificates || []).length === 0 ? (
                <Muted>Sertifikat yo'q</Muted>
              ) : (
                detail.certificates.map((c) => (
                  <div key={c.cert_id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2.5 last:border-0">
                    <div className="min-w-0">
                      <code className="font-mono text-xs text-white/75">{c.cert_id}</code>
                      <div className="text-[11px] text-white/30">
                        {c.percent}% · {c.grade} {c.revoked ? "· bekor qilingan" : ""}
                      </div>
                    </div>
                    <a
                      href={`https://cybernexus.uz/verify/${c.cert_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 text-[11px] font-bold text-cyber-300 hover:text-cyber-200"
                    >
                      Tekshirish →
                    </a>
                  </div>
                ))
              )}
            </Panel>

            <Panel icon={Mail} title="Murojaatlar" count={detail.messages?.length}>
              {(detail.messages || []).length === 0 ? (
                <Muted>Xabar yubormagan</Muted>
              ) : (
                detail.messages.map((m) => (
                  <div key={m.id} className="border-b border-white/5 py-2.5 last:border-0">
                    <div className="text-xs font-medium text-white/75">{m.subject}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11px] text-white/35">{m.excerpt}</div>
                    <div className="mt-1 text-[10px] text-white/25">{formatDateTime(m.created_at)}</div>
                  </div>
                ))
              )}
            </Panel>

            <Panel
              icon={Eye}
              title="Faoliyat"
              count={detail.visit_stats?.total}
              note={detail.visit_stats ? `30 kunda ${detail.visit_stats.days_30} ta` : ""}
            >
              {(detail.visits || []).length === 0 ? (
                <Muted>Tashrif yozilmagan</Muted>
              ) : (
                detail.visits.slice(0, 12).map((v, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 last:border-0">
                    <span className="truncate font-mono text-[11px] text-white/60">{v.path}</span>
                    <span className="shrink-0 text-[11px] text-white/25">{timeAgo(v.created_at)}</span>
                  </div>
                ))
              )}
            </Panel>
          </div>
        ) : null}
      </Drawer>

      {/* ---------------- Editor ---------------- */}
      <Drawer
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.id ? "Foydalanuvchini tahrirlash" : "Yangi foydalanuvchi"}
        subtitle={editing?.id ? `#${editing.id}` : "Qo'lda yaratilgan hisob"}
        width="max-w-lg"
      >
        {editing ? (
          <form onSubmit={save} className="space-y-4">
            <FormField label="Email *">
              <input
                required
                type="email"
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
              />
            </FormField>

            <FormField label="To'liq ism">
              <input
                value={editing.full_name}
                onChange={(e) => setEditing({ ...editing, full_name: e.target.value })}
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
              />
            </FormField>

            <FormField label="Avatar havolasi">
              <input
                type="url"
                value={editing.avatar_url}
                onChange={(e) => setEditing({ ...editing, avatar_url: e.target.value })}
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Rol">
                <select
                  value={editing.role}
                  onChange={(e) => setEditing({ ...editing, role: e.target.value })}
                  className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </FormField>

              <FormField label="Holat">
                <select
                  value={editing.is_active ? "1" : "0"}
                  onChange={(e) => setEditing({ ...editing, is_active: e.target.value === "1" })}
                  className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white outline-none focus:border-signal-400/70"
                >
                  <option value="1">Faol</option>
                  <option value="0">O'chirilgan</option>
                </select>
              </FormField>
            </div>

            <FormField label={editing.id ? "Yangi parol (ixtiyoriy)" : "Parol (ixtiyoriy)"}>
              <input
                type="password"
                value={editing.password}
                onChange={(e) => setEditing({ ...editing, password: e.target.value })}
                autoComplete="new-password"
                placeholder={editing.id ? "Bo'sh qoldirilsa o'zgarmaydi" : "Kamida 6 belgi"}
                className="w-full rounded-xl border border-white/12 bg-black/40 px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-signal-400/70"
              />
              <p className="mt-1.5 text-[11px] text-white/30">
                Sayt Google orqali kiradi; parol faqat zaxira usul sifatida kerak bo'ladi.
              </p>
            </FormField>

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
        title="Hisobni o'chirish"
        confirmWord={confirmDelete?.email}
        body={
          confirmDelete
            ? `${confirmDelete.email} hisobi o'chiriladi. Barcha sessiyalari tugatiladi, tashrif tarixi esa hisobdan uzilib, statistikada anonim bo'lib qoladi.`
            : ""
        }
        extra={
          <label className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-white/[.03] px-3.5 py-3">
            <input
              type="checkbox"
              checked={keepCerts}
              onChange={(e) => setKeepCerts(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-emerald-400"
            />
            <span className="text-xs leading-relaxed text-white/55">
              Sertifikatlarni saqlab qolish. Haqiqatan olingan sertifikat hisob
              yopilgandan keyin ham tekshirilishi kerak — ism sertifikatning
              o'zida yozilgan.
            </span>
          </label>
        }
      />
    </AdminShell>
  );
}

/* ------------------------------ bits ------------------------------ */

function Tag({ children, tone = "muted" }) {
  return (
    <span
      className={classNames(
        "rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider",
        tone === "ok"
          ? "border-signal-500/30 bg-signal-500/10 text-signal-300"
          : "border-white/12 bg-white/5 text-white/50",
      )}
    >
      {children}
    </span>
  );
}

function Info({ label, value, mono }) {
  return (
    <div className="rounded-xl border border-white/8 bg-black/20 px-3.5 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-white/30">{label}</div>
      <div className={mono ? "mt-1 font-mono text-xs text-white/70" : "mt-1 text-sm text-white/70"}>
        {value}
      </div>
    </div>
  );
}

function Panel({ icon: Icon, title, count, note, children }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-cyber-400" />
          <span className="text-sm font-semibold text-white">{title}</span>
          {typeof count === "number" ? (
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-white/55">
              {count}
            </span>
          ) : null}
        </div>
        {note ? <span className="text-[11px] text-white/30">{note}</span> : null}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Muted({ children }) {
  return <div className="py-4 text-center text-xs text-white/25">{children}</div>;
}

function FormField({ label, children }) {
  return (
    <div>
      <label className="block text-[11px] font-bold uppercase tracking-wider text-white/40">
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  );
}

export default UsersPage;
