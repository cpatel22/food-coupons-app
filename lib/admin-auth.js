import crypto from "crypto";
import { ScannerUserRepo, scannerSessionToken } from "./scanner-users";

const ADMIN_COOKIE_NAME = "admin_session";

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || process.env.NEXT_ADMIN_PASSWORD;
}

function getAdminSessionToken() {
  const password = getAdminPassword();

  if (!password) {
    throw new Error("ADMIN_PASSWORD or NEXT_ADMIN_PASSWORD must be configured");
  }

  return crypto.createHash("sha256").update(password).digest("hex");
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || "";

  return cookieHeader.split(";").reduce((cookies, part) => {
    const [key, ...valueParts] = part.trim().split("=");
    if (!key) {
      return cookies;
    }

    cookies[key] = decodeURIComponent(valueParts.join("="));
    return cookies;
  }, {});
}

export async function isAdminRequest(req) {
  try {
    const cookies = parseCookies(req);
    const session = cookies[ADMIN_COOKIE_NAME];
    if (session === getAdminSessionToken()) return true;

    const [id, token] = String(session || "").split(".");
    if (!id || !token) return false;
    const user = await ScannerUserRepo.findById(id);
    return Boolean(
      user &&
        user.active &&
        user.user_type === "Admin" &&
        scannerSessionToken(user) === token,
    );
  } catch {
    return false;
  }
}

export async function requireAdmin(req, res) {
  if (!(await isAdminRequest(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}

export function validateAdminPassword(password) {
  const configuredPassword = getAdminPassword();
  return Boolean(configuredPassword) && password === configuredPassword;
}

export async function validateAdminLogin({ username, password }) {
  if (!username) return validateAdminPassword(password) ? null : false;

  const user = await ScannerUserRepo.authenticate({ username, password });
  return user?.user_type === "Admin" ? user : false;
}

export function setAdminSession(res, user = null) {
  const value = user
    ? `${user.id}.${scannerSessionToken(user)}`
    : getAdminSessionToken();
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );
}

export function clearAdminSession(res) {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}
