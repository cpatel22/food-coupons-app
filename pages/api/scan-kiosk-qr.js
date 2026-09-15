import { scannerFromRequest } from "../../lib/scanner-auth";
import { createScanLog } from "../../lib/scan-logs";
import { KioskOrderRepo } from "../../lib/kiosk-orders";
import { readKioskQrToken } from "../../lib/kiosk-qr";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });
  const user = await scannerFromRequest(req);
  if (
    !user ||
    !["kiosk", "premvati", "admin"].includes(
      String(user.type || "").toLowerCase(),
    )
  )
    return res.status(401).json({ error: "Scanner login required" });
  const value = String(req.body.value || "").trim();
  const orderId = readKioskQrToken(value);
  if (!orderId) {
    return res.status(400).json({ error: "Invalid kiosk QR code" });
  }
  const order = await KioskOrderRepo.getById(orderId);
  await createScanLog({
    user,
    scanType: "kiosk_payment",
    value,
    result: order ? "VALID" : "INVALID",
  });
  if (!order) return res.status(404).json({ error: "Kiosk order not found" });
  return res.status(200).json({ order_id: orderId });
}
