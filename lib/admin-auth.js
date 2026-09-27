import crypto from "crypto";
import { ScannerUserRepo, scannerSessionToken } from "./scanner-users";
import { isAdminType } from "./user-roles";

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

function appendCookie(res, cookie) {
  const current = res.getHeader("Set-Cookie");
  if (!current) {
    res.setHeader("Set-Cookie", cookie);
    return;
  }
  const list = Array.isArray(current) ? current : [current];
  res.setHeader("Set-Cookie", [...list, cookie]);
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

export async function getAdminSessionInfo(req) {
  try {
    const cookies = parseCookies(req);
    const session = cookies[ADMIN_COOKIE_NAME];
    let envToken = null;
    try {
      envToken = getAdminSessionToken();
    } catch {
      envToken = null;
    }
    if (envToken && session === envToken) {
      return { authenticated: true, type: "Superadmin", user: null };
    }

    const [id, token] = String(session || "").split(".");
    if (!id || !token) {
      return { authenticated: false, type: null, user: null };
    }

    const user = await ScannerUserRepo.findById(id);
    if (
      !user ||
      !user.active ||
      !isAdminType(user.user_type) ||
      scannerSessionToken(user) !== token
    ) {
      return { authenticated: false, type: null, user: null };
    }

    return {
      authenticated: true,
      type: user.user_type,
      user: {
        id: user.id,
        name: user.name,
        username: user.username,
        type: user.user_type,
      },
    };
  } catch {
    return { authenticated: false, type: null, user: null };
  }
}

export async function isAdminRequest(req) {
  return (await getAdminSessionInfo(req)).authenticated;
}

export async function isSuperAdminRequest(req) {
  return (await getAdminSessionInfo(req)).type === "Superadmin";
}

export async function requireAdmin(req, res) {
  if (!(await isAdminRequest(req))) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}

export async function requireSuperAdmin(req, res) {
  const session = await getAdminSessionInfo(req);
  if (!session.authenticated) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }
  if (session.type !== "Superadmin") {
    res.status(403).json({ error: "Superadmin access required" });
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
  return isAdminType(user?.user_type) ? user : false;
}

export function setAdminSession(res, user = null) {
  const value = user
    ? `${user.id}.${scannerSessionToken(user)}`
    : getAdminSessionToken();
  appendCookie(
    res,
    `${ADMIN_COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );
}

export function clearAdminSession(res) {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}
