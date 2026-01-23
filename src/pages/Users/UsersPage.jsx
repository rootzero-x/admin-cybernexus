import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Search, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Input } from "../../components/ui/Input.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { Modal } from "../../components/ui/Modal.jsx";
import { adminApi } from "../../shared/api/adminApi.js";

function Badge({ children }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-xs text-white/70">
      {children}
    </span>
  );
}

export function UsersPage() {
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [active, setActive] = useState("");
  const [provider, setProvider] = useState("");

  const [page, setPage] = useState(1);
  const limit = 20;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);

  const [editOpen, setEditOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [current, setCurrent] = useState(null);

  const [saving, setSaving] = useState(false);

  const query = useMemo(
    () => ({ q, role, active, provider, page, limit }),
    [q, role, active, provider, page],
  );

  async function load() {
    setLoading(true);
    setToast(null);
    try {
      const res = await adminApi.usersList(query);
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setToast({ type: "error", title: "Load failed", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.q, query.role, query.active, query.provider, query.page]);

  const pages = Math.max(1, Math.ceil(total / limit));

  function openEdit(u) {
    setCurrent({
      id: u.id,
      email: u.email || "",
      full_name: u.full_name || "",
      avatar_url: u.avatar_url || "",
      role: u.role || "user",
      is_active: !!u.is_active,
      password: "",
    });
    setEditOpen(true);
  }

  function openCreate() {
    setCurrent({
      email: "",
      full_name: "",
      avatar_url: "",
      role: "user",
      is_active: true,
      password: "",
    });
    setCreateOpen(true);
  }

  async function saveEdit() {
    if (!current?.id) return;
    setSaving(true);
    setToast(null);
    try {
      await adminApi.userUpdate({
        id: current.id,
        email: current.email,
        full_name: current.full_name,
        avatar_url: current.avatar_url,
        role: current.role,
        is_active: current.is_active,
        password: current.password || "",
      });
      setEditOpen(false);
      await load();
      setToast({
        type: "success",
        title: "Saved",
        message: "User updated successfully.",
      });
    } catch (e) {
      setToast({ type: "error", title: "Save failed", message: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function saveCreate() {
    setSaving(true);
    setToast(null);
    try {
      const res = await adminApi.userCreate({
        email: current.email,
        full_name: current.full_name,
        avatar_url: current.avatar_url,
        role: current.role,
        is_active: current.is_active,
        password: current.password || "",
      });
      setCreateOpen(false);
      setPage(1);
      await load();
      setToast({
        type: "success",
        title: "Created",
        message: `New user id: ${res.id}`,
      });
    } catch (e) {
      setToast({ type: "error", title: "Create failed", message: e.message });
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(u) {
    const yes = confirm(`Delete user #${u.id} (${u.email}) ?`);
    if (!yes) return;
    setToast(null);
    try {
      await adminApi.userDelete(u.id);
      await load();
      setToast({ type: "success", title: "Deleted", message: "User removed." });
    } catch (e) {
      setToast({ type: "error", title: "Delete failed", message: e.message });
    }
  }

  return (
    <div className="min-h-screen bg-[#05070b] bg-grid">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-extrabold text-2xl">Users</div>
            <div className="text-white/60 text-sm mt-1">
              Full CRUD • search • filters • password reset
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={load} loading={loading}>
              <RefreshCw size={18} /> Refresh
            </Button>
            <Button onClick={openCreate}>
              <Plus size={18} /> New User
            </Button>
            <Link
              to="/admin"
              className="text-emerald-300 hover:text-emerald-200 text-sm font-semibold"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-5 grid lg:grid-cols-[1fr_260px] gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2">
              <Search size={18} className="text-white/50" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search email/name/github..."
              />
            </div>

            <div className="mt-3 grid md:grid-cols-3 gap-3">
              <select
                className="rounded-xl bg-black/40 border border-white/10 px-3 py-3 text-white/80 outline-none"
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All roles</option>
                <option value="user">user</option>
                <option value="admin">admin</option>
                <option value="moderator">moderator</option>
              </select>

              <select
                className="rounded-xl bg-black/40 border border-white/10 px-3 py-3 text-white/80 outline-none"
                value={active}
                onChange={(e) => {
                  setActive(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All status</option>
                <option value="1">Active</option>
                <option value="0">Disabled</option>
              </select>

              <select
                className="rounded-xl bg-black/40 border border-white/10 px-3 py-3 text-white/80 outline-none"
                value={provider}
                onChange={(e) => {
                  setProvider(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All providers</option>
                <option value="google">google</option>
                <option value="github">github</option>
              </select>
            </div>

            <div className="mt-4 text-sm text-white/60">
              Total: <span className="text-white">{total}</span> • Page {page}/
              {pages}
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-white font-bold">Quick actions</div>
            <div className="text-white/60 text-sm mt-1">
              Create / Edit / Disable users. Password field = reset password.
            </div>
          </Card>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
        >
          <Card className="p-0 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/70">
                  <tr>
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Name</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Provider</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="p-4 text-white/60" colSpan={7}>
                        Loading...
                      </td>
                    </tr>
                  ) : items.length ? (
                    items.map((u) => (
                      <tr
                        key={u.id}
                        className="border-t border-white/10 hover:bg-white/5"
                      >
                        <td className="p-3 text-white/70">{u.id}</td>
                        <td className="p-3 text-white">{u.email}</td>
                        <td className="p-3 text-white/80">
                          {u.full_name || "—"}
                        </td>
                        <td className="p-3">
                          <Badge>{u.role}</Badge>
                        </td>
                        <td className="p-3 text-white/70">
                          {u.provider || "—"}
                        </td>
                        <td className="p-3">
                          {u.is_active ? (
                            <span className="text-emerald-300 font-semibold">
                              Active
                            </span>
                          ) : (
                            <span className="text-red-300 font-semibold">
                              Disabled
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" onClick={() => openEdit(u)}>
                              <Pencil size={18} /> Edit
                            </Button>
                            <Button variant="ghost" onClick={() => onDelete(u)}>
                              <Trash2 size={18} /> Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="p-4 text-white/60" colSpan={7}>
                        No users found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between p-3 border-t border-white/10">
              <Button
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <div className="text-white/60 text-sm">
                Page <span className="text-white">{page}</span> / {pages}
              </div>
              <Button
                variant="ghost"
                disabled={page >= pages}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </Card>
        </motion.div>

        {toast ? (
          <div className="mt-4">
            <Toast {...toast} onClose={() => setToast(null)} />
          </div>
        ) : null}

        {/* Edit modal */}
        <Modal
          open={editOpen}
          title={`Edit User #${current?.id || ""}`}
          onClose={() => setEditOpen(false)}
        >
          <div className="grid gap-3">
            <div>
              <div className="text-white/70 text-sm mb-1">Email</div>
              <Input
                value={current?.email || ""}
                onChange={(e) =>
                  setCurrent((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">Full name</div>
              <Input
                value={current?.full_name || ""}
                onChange={(e) =>
                  setCurrent((s) => ({ ...s, full_name: e.target.value }))
                }
              />
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">Avatar URL</div>
              <Input
                value={current?.avatar_url || ""}
                onChange={(e) =>
                  setCurrent((s) => ({ ...s, avatar_url: e.target.value }))
                }
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-white/70 text-sm mb-1">Role</div>
                <select
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-3 text-white/80 outline-none"
                  value={current?.role || "user"}
                  onChange={(e) =>
                    setCurrent((s) => ({ ...s, role: e.target.value }))
                  }
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="moderator">moderator</option>
                </select>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <input
                  type="checkbox"
                  checked={!!current?.is_active}
                  onChange={(e) =>
                    setCurrent((s) => ({ ...s, is_active: e.target.checked }))
                  }
                />
                <span className="text-white/80 text-sm">Active</span>
              </div>
            </div>

            <div>
              <div className="text-white/70 text-sm mb-1">
                Reset password (optional)
              </div>
              <Input
                value={current?.password || ""}
                onChange={(e) =>
                  setCurrent((s) => ({ ...s, password: e.target.value }))
                }
                type="password"
                placeholder="Leave empty to keep current password"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button loading={saving} onClick={saveEdit}>
                Save
              </Button>
            </div>
          </div>
        </Modal>

        {/* Create modal */}
        <Modal
          open={createOpen}
          title="Create New User"
          onClose={() => setCreateOpen(false)}
        >
          <div className="grid gap-3">
            <div>
              <div className="text-white/70 text-sm mb-1">Email</div>
              <Input
                value={current?.email || ""}
                onChange={(e) =>
                  setCurrent((s) => ({ ...s, email: e.target.value }))
                }
              />
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">Full name</div>
              <Input
                value={current?.full_name || ""}
                onChange={(e) =>
                  setCurrent((s) => ({ ...s, full_name: e.target.value }))
                }
              />
            </div>
            <div>
              <div className="text-white/70 text-sm mb-1">Avatar URL</div>
              <Input
                value={current?.avatar_url || ""}
                onChange={(e) =>
                  setCurrent((s) => ({ ...s, avatar_url: e.target.value }))
                }
              />
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <div className="text-white/70 text-sm mb-1">Role</div>
                <select
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-3 text-white/80 outline-none"
                  value={current?.role || "user"}
                  onChange={(e) =>
                    setCurrent((s) => ({ ...s, role: e.target.value }))
                  }
                >
                  <option value="user">user</option>
                  <option value="admin">admin</option>
                  <option value="moderator">moderator</option>
                </select>
              </div>
              <div className="flex items-center gap-3 mt-6">
                <input
                  type="checkbox"
                  checked={!!current?.is_active}
                  onChange={(e) =>
                    setCurrent((s) => ({ ...s, is_active: e.target.checked }))
                  }
                />
                <span className="text-white/80 text-sm">Active</span>
              </div>
            </div>

            <div>
              <div className="text-white/70 text-sm mb-1">
                Password (optional)
              </div>
              <Input
                value={current?.password || ""}
                onChange={(e) =>
                  setCurrent((s) => ({ ...s, password: e.target.value }))
                }
                type="password"
                placeholder="Min 6 chars (or leave empty)"
              />
            </div>

            <div className="flex items-center justify-end gap-2 mt-2">
              <Button variant="ghost" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button loading={saving} onClick={saveCreate}>
                Create
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}
