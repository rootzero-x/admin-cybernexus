const BASE =
  import.meta.env.VITE_ADMIN_API_BASE ||
  "https://694fc8f1e1918.myxvest1.ru/cybernexus/api/admin";

async function req(path, { method = "GET", body, signal } = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });

  let data = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok || (data && data.ok === false)) {
    const msg = (data && data.message) || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

function buildQuery(params = {}) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

export const adminApi = {
  step1Login: (username, password) =>
    req("/login_step1.php", { method: "POST", body: { username, password } }),

  step2Verify: (username, challenge, code) =>
    req("/login_step2.php", {
      method: "POST",
      body: { username, challenge, code },
    }),

  me: () => req("/me.php"),
  logout: () => req("/logout.php", { method: "POST" }),

  // ✅ Users
  usersList: (params) => req(`/users_list.php${buildQuery(params)}`),
  userGet: (id) => req(`/users_get.php${buildQuery({ id })}`),
  userCreate: (payload) =>
    req("/users_create.php", { method: "POST", body: payload }),
  userUpdate: (payload) =>
    req("/users_update.php", { method: "POST", body: payload }),
  userDelete: (id) =>
    req("/users_delete.php", { method: "POST", body: { id } }),

  // ✅ Sessions
  sessionsList: (params) => req(`/sessions_list.php${buildQuery(params)}`),
  sessionRevoke: (type, id) =>
    req("/sessions_revoke.php", { method: "POST", body: { type, id } }),
};
