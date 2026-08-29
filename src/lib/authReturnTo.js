// Shared by the auth pages. Keep the redirect validation in one place because
// it is security-sensitive and easy to drift.

// Resolve ?returnTo= to a safe same-origin path, else "/".
//
// The same-origin check alone is not enough: a value like /.//evil.com or
// /\evil.com parses same-origin but normalizes to a protocol-relative
// //evil.com when assigned to location.href — an open redirect. So require the
// resolved path to be exactly one leading slash (no "//" prefix, no backslash).
export function safeReturnTo() {
  const raw = new URLSearchParams(window.location.search).get("returnTo");
  if (!raw) return "/";
  try {
    const appOrigin = getAppOrigin();
    const canonicalOrigin = appOrigin || window.location.origin;
    const url = new URL(raw, canonicalOrigin);
    if (url.origin !== canonicalOrigin) return "/";
    for (const p of ["access_token", "clear_access_token", "app_id", "app_base_url", "functions_version", "from_url"]) {
      url.searchParams.delete(p);
    }
    const path = url.pathname + url.search;
    if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\")) return "/";
    if (isAuthPath(url.pathname)) return "/";
    return path;
  } catch {
    return "/";
  }
}

export function isAuthPath(pathname) {
  return ["/login", "/register", "/forgot-password", "/reset-password"].includes(pathname);
}

export function getAppOrigin() {
  const appUrl = import.meta.env.VITE_APP_URL;
  if (!appUrl) return "";
  try {
    return new URL(appUrl).origin;
  } catch {
    return "";
  }
}

export function getCanonicalLoginUrl(returnTo = "/") {
  const appOrigin = getAppOrigin();
  const loginPath = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  return appOrigin ? `${appOrigin}${loginPath}` : loginPath;
}

export function recoverAuthCallbackErrorUrl() {
  const params = new URLSearchParams(window.location.search);
  const errorCode = params.get("error_code");
  if (errorCode !== "bad_oauth_state") return false;

  const appOrigin = getAppOrigin();
  const loginPath = "/login?authError=oauth_expired";
  window.location.replace(appOrigin ? `${appOrigin}${loginPath}` : loginPath);
  return true;
}

export function recoverMisroutedProductionUrl() {
  const appOrigin = getAppOrigin();
  if (!appOrigin || window.location.origin === appOrigin) return false;

  const current = window.location.href;
  const decoded = safeDecode(current);
  if (!decoded.includes(appOrigin)) return false;

  const recovered = extractAppUrl(decoded, appOrigin);
  if (!recovered) return false;

  window.location.replace(recovered);
  return true;
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function extractAppUrl(value, appOrigin) {
  const start = value.indexOf(appOrigin);
  if (start < 0) return "";
  let rest = value.slice(start + appOrigin.length);
  rest = rest.replace(/^\/\*\*/, "").replace(/^\s+/, "");
  rest = rest.replace(/\/\*\*#?$/, "");
  rest = rest.replace(/\*\*#?$/, "");
  if (!rest || rest === "#") return appOrigin + "/";
  if (!rest.startsWith("/")) rest = "/" + rest;
  return appOrigin + rest;
}
