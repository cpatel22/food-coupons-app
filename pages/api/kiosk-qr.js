import bwipjs from "bwip-js";
import { createKioskQrToken } from "../../lib/kiosk-qr";

export default async function handler(req, res) {
  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: "Missing order_id" });
  }

  try {
    const kioskToken = createKioskQrToken(order_id);
    const png = await bwipjs.toBuffer({
      bcid: "qrcode",
      text: kioskToken,
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
