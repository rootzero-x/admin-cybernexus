const KEY = "cn_admin_auth";

export function saveAuth(partial) {
  const prev = loadAuth();
  const next = { ...prev, ...partial };
  localStorage.setItem(KEY, JSON.stringify(next));
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
  localStorage.removeItem(KEY);
}
