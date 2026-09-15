import crypto from "crypto";

function getQrSecret() {
  const secret =
    process.env.KIOSK_QR_SECRET ||
    process.env.STRIPE_SECRET_KEY ||
    process.env.NEXT_SUPABASE_SERVICE_ROLE_KEY;

  if (!secret) {
    throw new Error("KIOSK_QR_SECRET is not configured");
  }

  return secret;
}

function sign(payload) {
  return crypto
    .createHmac("sha256", getQrSecret())
    .update(payload)
    .digest("base64url");
}

export function createKioskQrToken(orderId) {
  const payload = Buffer.from(
    JSON.stringify({
      order_id: orderId,
      exp: Date.now() + 24 * 60 * 60 * 1000,
    }),
  ).toString("base64url");

  return `KIOSK1.${payload}.${sign(payload)}`;
}

export function readKioskQrToken(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3 || parts[0] !== "KIOSK1") return null;

  const [, payload, signature] = parts;
  const expected = sign(payload);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (!data.order_id || Number(data.exp) < Date.now()) return null;
    return data.order_id;
  } catch {
    return null;
  }
}
