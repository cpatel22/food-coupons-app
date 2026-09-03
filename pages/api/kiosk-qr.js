import bwipjs from "bwip-js";

function getBaseUrl(req) {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\//.test(origin)) {
    return origin;
  }

  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;

  if (!host) {
    throw new Error("Unable to determine request host for kiosk QR");
  }

  return `${protocol}://${host}`;
}

export default async function handler(req, res) {
  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: "Missing order_id" });
  }

  try {
    const kioskUrl = `${getBaseUrl(req)}/kiosk-pay?order_id=${order_id}`;
    const png = await bwipjs.toBuffer({
      bcid: "qrcode",
      text: kioskUrl,
      scale: 6,
      includetext: false,
      backgroundcolor: "FFFFFF",
    });

    res.setHeader("Content-Type", "image/png");
    return res.status(200).send(png);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
