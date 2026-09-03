import crypto from "crypto";

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

export function isAdminRequest(req) {
  try {
    const cookies = parseCookies(req);
    return cookies[ADMIN_COOKIE_NAME] === getAdminSessionToken();
  } catch {
    return false;
  }
}

export function requireAdmin(req, res) {
  if (!isAdminRequest(req)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}

export function validateAdminPassword(password) {
  const configuredPassword = getAdminPassword();
  return Boolean(configuredPassword) && password === configuredPassword;
}

export function setAdminSession(res) {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=${getAdminSessionToken()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`,
  );
}

export function clearAdminSession(res) {
  res.setHeader(
    "Set-Cookie",
    `${ADMIN_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
  );
}
