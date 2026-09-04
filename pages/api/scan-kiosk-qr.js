import { scannerFromRequest } from "../../lib/scanner-auth";
import { createScanLog } from "../../lib/scan-logs";
import { KioskOrderRepo } from "../../lib/kiosk-orders";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
  const user = await scannerFromRequest(req);
  if (!user || !["Kiosk", "Admin"].includes(user.type)) return res.status(401).json({ error: "Kiosk scanner login required" });
  const value = String(req.body.value || "").trim();
  const match = value.match(/[?&]order_id=([^&]+)/);
  const orderId = match ? decodeURIComponent(match[1]) : value;
  const order = await KioskOrderRepo.getById(orderId);
  await createScanLog({ user, scanType: "kiosk_payment", value, result: order ? "VALID" : "INVALID" });
  if (!order) return res.status(404).json({ error: "Kiosk order not found" });
  return res.status(200).json({ order_id: orderId });
}
