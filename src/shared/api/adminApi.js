import { getAdminToken, setAdminToken, clearAdminToken } from "../auth/authStore.js";

const BASE = (
  import.meta.env.VITE_ADMIN_API_BASE ||
  "https://694fc8f1e1918.myxvest1.ru/cybernexus/api/admin"
).replace(/\/+$/, "");

const TIMEOUT_MS = 20000;

async function req(path, { method = "GET", body, signal, skipAuth = false, timeoutMs } = {}) {
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
  const timer = setTimeout(() => controller.abort(), timeoutMs || TIMEOUT_MS);
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

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

    // A cancellation the caller asked for is not a failure — let it stay an
    // AbortError so a superseded request can be ignored rather than shown.
    if (e.name === "AbortError" && signal?.aborted) throw e;

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
  /* ------------------------------ Auth ------------------------------ */

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

  me: (opts) => req("/me.php", opts),

  logout: async () => {
    try {
      return await req("/logout.php", { method: "POST" });
    } finally {
      clearAdminToken();
    }
  },

  /* --------------------------- Dashboard ---------------------------- */

  stats: (opts) => req("/stats.php", opts),

  /* ----------------------------- Users ------------------------------ */

  usersList: (params, opts) => req(`/users_list.php${buildQuery(params)}`, opts),
  userGet: (id, opts) => req(`/users_get.php${buildQuery({ id })}`, opts),
  userCreate: (payload) => req("/users_create.php", { method: "POST", body: payload }),
  userUpdate: (payload) => req("/users_update.php", { method: "POST", body: payload }),
  userDelete: (id, keepCertificates = true) =>
    req("/users_delete.php", {
      method: "POST",
      body: { id, keep_certificates: keepCertificates },
    }),

  /* ---------------------------- Sessions ---------------------------- */

  sessionsList: (params, opts) => req(`/sessions_list.php${buildQuery(params)}`, opts),
  sessionRevoke: (type, id) =>
    req("/sessions_revoke.php", { method: "POST", body: { type, id } }),

  /* ---------------------------- Messages ---------------------------- */

  messagesList: (params, opts) => req(`/messages_list.php${buildQuery(params)}`, opts),
  messageUpdate: (payload) => req("/messages_update.php", { method: "POST", body: payload }),
  messageDelete: (id) => req("/messages_delete.php", { method: "POST", body: { id } }),

  /* -------------------------- Certificates -------------------------- */

  certsList: (params, opts) => req(`/certs_list.php${buildQuery(params)}`, opts),
  certCreate: (payload) => req("/certs_create.php", { method: "POST", body: payload }),
  certUpdate: (payload) => req("/certs_update.php", { method: "POST", body: payload }),
  certDelete: (id) => req("/certs_delete.php", { method: "POST", body: { id } }),

  /* ------------------------------ News ------------------------------ */

  newsList: (params, opts) => req(`/news_list.php${buildQuery(params)}`, opts),
  newsSave: (payload) => req("/news_save.php", { method: "POST", body: payload }),
  newsDelete: (idOrIds) =>
    req("/news_delete.php", {
      method: "POST",
      body: Array.isArray(idOrIds) ? { ids: idOrIds } : { id: idOrIds },
    }),
  // Eleven feeds fetched back to back routinely outruns the default timeout.
  newsRefresh: () => req("/news_refresh.php", { method: "POST", timeoutMs: 180000 }),

  /* ----------------------------- Visits ----------------------------- */

  visitsList: (params, opts) => req(`/visits_list.php${buildQuery(params)}`, opts),
  visitDelete: (payload) => req("/visits_delete.php", { method: "POST", body: payload }),

  /* ------------------------------ Audit ----------------------------- */

  auditList: (params, opts) => req(`/audit_list.php${buildQuery(params)}`, opts),

  /* ----------------------- Telegram bot (read-only) ----------------- */

  botOverview: (opts) => req("/bot_overview.php", opts),
  botUsers: (params, opts) => req(`/bot_users.php${buildQuery(params)}`, opts),
};

export default adminApi;
