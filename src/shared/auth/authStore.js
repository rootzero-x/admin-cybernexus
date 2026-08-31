const KEY = "cn_admin_auth";
const TOKEN_KEY = "cn_admin_token";
const TOKEN_EXP_KEY = "cn_admin_token_expires";

/* ------------------------------------------------------------------ *
 *  Cached profile blob
 * ------------------------------------------------------------------ */

export function saveAuth(partial) {
  const prev = loadAuth();
  const next = { ...prev, ...partial };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable (private mode) — the in-memory copy still works */
  }
  return next;
}

export function loadAuth() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function clearAuth() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* nothing to do */
  }
  clearAdminToken();
}

/* ------------------------------------------------------------------ *
 *  Session token
 *
 *  The admin session cookie is third-party from admin.cybernexus.uz, so
 *  browsers that block third-party cookies drop it and every request comes
 *  back 401. The backend now also returns the token in the login response and
 *  accepts it as a bearer token; this is where that token lives.
 * ------------------------------------------------------------------ */

let memoryToken = "";
let memoryExpires = 0;

export function getAdminToken() {
  let token = memoryToken;
  let expires = memoryExpires;

  try {
    token = localStorage.getItem(TOKEN_KEY) || memoryToken;
    expires = Number(localStorage.getItem(TOKEN_EXP_KEY) || memoryExpires || 0);
  } catch {
    /* fall back to the in-memory copy */
  }

  if (!token) return "";

  // Drop a token we already know is stale rather than spending a request on it.
  if (expires && Date.now() / 1000 > expires) {
    clearAdminToken();
    return "";
  }

  return token;
}

export function setAdminToken(token, expiresAt) {
  if (!token) return;
  memoryToken = token;
  memoryExpires = Number(expiresAt) || 0;
  try {
    localStorage.setItem(TOKEN_KEY, token);
    if (expiresAt) localStorage.setItem(TOKEN_EXP_KEY, String(expiresAt));
  } catch {
    /* in-memory only for this tab */
  }
}

export function clearAdminToken() {
  memoryToken = "";
  memoryExpires = 0;
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXP_KEY);
  } catch {
    /* nothing to do */
  }
}

export function hasAdminToken() {
  return getAdminToken() !== "";
}
