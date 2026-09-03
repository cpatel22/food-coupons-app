import { ScannerUserRepo, scannerSessionToken } from "./scanner-users";
import { getSupabaseAdmin } from "./supabase";

const SCANNER_COOKIE = "scanner_session";

function getCookies(req) {
  return (req.headers.cookie || "").split(";").reduce((cookies, entry) => {
    const [key, ...values] = entry.trim().split("=");
    if (key) cookies[key] = decodeURIComponent(values.join("="));
    return cookies;
  }, {});
}

export async function scannerFromRequest(req) {
  const value = getCookies(req)[SCANNER_COOKIE];
  if (!value) return null;

  const [id, token] = value.split(".");
  if (!id || !token) return null;

  const { data, error } = await getSupabaseAdmin()
    .from("scanner_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data || !data.active || scannerSessionToken(data) !== token)
    return null;
  return {
    id: data.id,
    name: data.name,
    username: data.username,
    active: data.active,
  };
}

export async function requireScanner(req, res) {
  const user = await scannerFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Scanner login required" });
    return null;
  }
  return user;
}

export function setScannerSession(res, user) {
  res.setHeader(
    "Set-Cookie",
    `${SCANNER_COOKIE}=${user.id}.${scannerSessionToken(user)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800`,
  );
}

export function clearScannerSession(res) {
  res.setHeader(
    "Set-Cookie",
    `${SCANNER_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}
