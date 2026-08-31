import { getAdminToken, setAdminToken, clearAdminToken } from "../auth/authStore.js";

const BASE = (
  import.meta.env.VITE_ADMIN_API_BASE ||
  "https://694fc8f1e1918.myxvest1.ru/cybernexus/api/admin"
).replace(/\/+$/, "");

const TIMEOUT_MS = 20000;

async function req(path, { method = "GET", body, signal, skipAuth = false } = {}) {
  const headers = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";

  // admin.cybernexus.uz and the API are different sites, so the session cookie
  // is third-party and Chrome/Safari drop it. The bearer token is what actually
  // keeps the admin signed in; the cookie still rides along where it works.
  const token = getAdminToken();
  if (token && !skipAuth) {
    headers.Authorization = `Bearer ${token}`;
    headers["X-Auth-Token"] = token; // some proxies strip Authorization
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (signal) signal.addEventListener("abort", () => controller.abort());

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
  } catch (e) {
    clearTimeout(timer);
    const err = new Error(
      e.name === "AbortError" ? "So'rov vaqti tugadi." : "Serverga ulanib bo'lmadi.",
    );
    err.status = 0;
    throw err;
  }
  clearTimeout(timer);

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON body: the status check below handles it */
  }

  if (!res.ok || (data && data.ok === false)) {
    // A dead admin session should not be replayed on every later request.
    if (res.status === 401) clearAdminToken();

    const err = new Error((data && data.message) || `Request failed (${res.status})`);
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
    req("/login_step1.php", {
      method: "POST",
      body: { username, password },
      skipAuth: true,
    }),

  step2Verify: async (username, challenge, code) => {
    const data = await req("/login_step2.php", {
      method: "POST",
      body: { username, challenge, code },
      skipAuth: true,
    });
    if (data?.token) setAdminToken(data.token, data.expires_at);
    return data;
  },

  me: () => req("/me.php"),

  logout: async () => {
    try {
      return await req("/logout.php", { method: "POST" });
    } finally {
      clearAdminToken();
    }
  },

  // Users
  usersList: (params) => req(`/users_list.php${buildQuery(params)}`),
  userGet: (id) => req(`/users_get.php${buildQuery({ id })}`),
  userCreate: (payload) => req("/users_create.php", { method: "POST", body: payload }),
  userUpdate: (payload) => req("/users_update.php", { method: "POST", body: payload }),
  userDelete: (id) => req("/users_delete.php", { method: "POST", body: { id } }),

  // Sessions
  sessionsList: (params) => req(`/sessions_list.php${buildQuery(params)}`),
  sessionRevoke: (type, id) =>
    req("/sessions_revoke.php", { method: "POST", body: { type, id } }),
};
