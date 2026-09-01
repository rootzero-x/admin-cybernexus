// src/shared/lib/format.js
//
// Formatting shared by every admin listing.
//
// Intl does not carry a complete uz-UZ calendar in most browsers — asking for
// { month: "long" } renders "2026 M09 1" instead of a month name — so the month
// names are spelled out here, matching the main site.

const MONTHS = [
  "yanvar", "fevral", "mart", "aprel", "may", "iyun",
  "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr",
];

function toDate(value) {
  if (value instanceof Date) return value;
  // Unix seconds are what the API returns everywhere.
  if (typeof value === "number") return new Date(value * 1000);
  if (typeof value === "string" && /^\d+$/.test(value)) return new Date(Number(value) * 1000);
  return new Date(value);
}

/** "1-sentabr, 2026" */
export function formatDate(value) {
  if (!value) return "—";
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.getDate()}-${MONTHS[d.getMonth()]}, ${d.getFullYear()}`;
}

/** "1-sentabr, 2026 · 14:30" */
export function formatDateTime(value) {
  if (!value) return "—";
  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} · ${hh}:${mm}`;
}

/** "3 daqiqa oldin" — for anything the admin reads as "how recent is this". */
export function timeAgo(value) {
  if (!value) return "—";

  const d = toDate(value);
  if (Number.isNaN(d.getTime())) return "—";

  const diff = Math.floor((Date.now() - d.getTime()) / 1000);
  if (diff < 0) return "hozir";
  if (diff < 60) return "hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)} kun oldin`;

  return formatDate(d);
}

/** Thousands separated with a thin space, which reads better than a comma here. */
export function formatNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return "0";
  return num.toLocaleString("en-US").replace(/,/g, " ");
}

/**
 * A readable device name out of a user agent string.
 *
 * Coarse on purpose — enough to tell one device from another in a list, not a
 * fingerprint.
 */
export function describeDevice(ua = "") {
  if (!ua) return "Noma'lum";

  const browser =
    /\bEdg\//.test(ua) ? "Edge" :
    /\bOPR\/|\bOpera/.test(ua) ? "Opera" :
    /\bChrome\//.test(ua) && !/\bChromium/.test(ua) ? "Chrome" :
    /\bFirefox\//.test(ua) ? "Firefox" :
    /\bSafari\//.test(ua) ? "Safari" :
    /curl|wget|python|bot|crawler|spider/i.test(ua) ? "Bot/skript" :
    "Brauzer";

  const os =
    /Windows NT/.test(ua) ? "Windows" :
    /Android/.test(ua) ? "Android" :
    /iPhone|iPad|iPod/.test(ua) ? "iOS" :
    /Mac OS X/.test(ua) ? "macOS" :
    /Linux/.test(ua) ? "Linux" :
    "";

  return os ? `${browser} · ${os}` : browser;
}

/** Host only, for showing a referrer without the rest of the URL. */
export function hostOf(url) {
  if (!url) return "";
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}
