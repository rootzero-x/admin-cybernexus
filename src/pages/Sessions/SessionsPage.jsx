import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { RefreshCw, Ban } from "lucide-react";
import { Card } from "../../components/ui/Card.jsx";
import { Button } from "../../components/ui/Button.jsx";
import { Toast } from "../../components/ui/Toast.jsx";
import { adminApi } from "../../shared/api/adminApi.js";

function fmt(ts) {
  if (!ts) return "—";
  try {
    return new Date(Number(ts) * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

export function SessionsPage() {
  const [type, setType] = useState("user"); // user | admin
  const [page, setPage] = useState(1);
  const limit = 30;

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [toast, setToast] = useState(null);

  async function load() {
    setLoading(true);
    setToast(null);
    try {
      const res = await adminApi.sessionsList({ type, page, limit });
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      setToast({ type: "error", title: "Load failed", message: e.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, page]);

  const pages = Math.max(1, Math.ceil(total / limit));

  async function revoke(id) {
    const yes = confirm(`Revoke ${type} session #${id}?`);
    if (!yes) return;
    try {
      await adminApi.sessionRevoke(type, id);
      await load();
      setToast({
        type: "success",
        title: "Revoked",
        message: "Session removed.",
      });
    } catch (e) {
      setToast({ type: "error", title: "Revoke failed", message: e.message });
    }
  }

  return (
    <div className="min-h-screen bg-[#05070b] bg-grid">
      <div className="max-w-7xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-white font-extrabold text-2xl">Sessions</div>
            <div className="text-white/60 text-sm mt-1">
              User sessions (platform) • Admin sessions (admin panel)
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={load} loading={loading}>
              <RefreshCw size={18} /> Refresh
            </Button>
            <Link
              to="/admin"
              className="text-emerald-300 hover:text-emerald-200 text-sm font-semibold"
            >
              ← Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button
            variant={type === "user" ? "primary" : "ghost"}
            onClick={() => {
              setType("user");
              setPage(1);
            }}
          >
            User sessions
          </Button>
          <Button
            variant={type === "admin" ? "primary" : "ghost"}
            onClick={() => {
              setType("admin");
              setPage(1);
            }}
          >
            Admin sessions
          </Button>
          <div className="text-white/60 text-sm ml-auto">
            Total: <span className="text-white">{total}</span> • Page {page}/
            {pages}
          </div>
        </div>

        <div className="mt-4">
          <Card className="p-0 overflow-hidden">
            <div className="overflow-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5 text-white/70">
                  {type === "user" ? (
                    <tr>
                      <th className="text-left p-3">ID</th>
                      <th className="text-left p-3">User</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">IP</th>
                      <th className="text-left p-3">Created</th>
                      <th className="text-left p-3">Expires</th>
                      <th className="text-right p-3">Action</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="text-left p-3">ID</th>
                      <th className="text-left p-3">Admin</th>
                      <th className="text-left p-3">IP</th>
                      <th className="text-left p-3">Created</th>
                      <th className="text-left p-3">Expires</th>
                      <th className="text-right p-3">Action</th>
                    </tr>
                  )}
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        className="p-4 text-white/60"
                        colSpan={type === "user" ? 7 : 6}
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : items.length ? (
                    items.map((s) =>
                      type === "user" ? (
                        <tr
                          key={s.id}
                          className="border-t border-white/10 hover:bg-white/5"
                        >
                          <td className="p-3 text-white/70">{s.id}</td>
                          <td className="p-3 text-white">
                            {s.email}
                            <div className="text-xs text-white/50">
                              {s.full_name || "—"}
                            </div>
                          </td>
                          <td className="p-3 text-white/70">{s.role}</td>
                          <td className="p-3 text-white/70">{s.created_ip}</td>
                          <td className="p-3 text-white/70">
                            {fmt(s.created_at)}
                          </td>
                          <td className="p-3 text-white/70">
                            {fmt(s.expires_at)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                onClick={() => revoke(s.id)}
                              >
                                <Ban size={18} /> Revoke
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        <tr
                          key={s.id}
                          className="border-t border-white/10 hover:bg-white/5"
                        >
                          <td className="p-3 text-white/70">{s.id}</td>
                          <td className="p-3 text-white">{s.username}</td>
                          <td className="p-3 text-white/70">{s.ip}</td>
                          <td className="p-3 text-white/70">
                            {fmt(s.created_at)}
                          </td>
                          <td className="p-3 text-white/70">
                            {fmt(s.expires_at)}
                          </td>
                          <td className="p-3">
                            <div className="flex items-center justify-end">
                              <Button
                                variant="ghost"
                                onClick={() => revoke(s.id)}
                              >
                                <Ban size={18} /> Revoke
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ),
                    )
                  ) : (
                    <tr>
                      <td
                        className="p-4 text-white/60"
                        colSpan={type === "user" ? 7 : 6}
                      >
                        No sessions found.
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
        </div>

        {toast ? (
          <div className="mt-4">
            <Toast {...toast} onClose={() => setToast(null)} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
