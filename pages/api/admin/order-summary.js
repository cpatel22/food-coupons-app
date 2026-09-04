import { isAdminRequest } from "../../../lib/admin-auth";
import { scannerFromRequest } from "../../../lib/scanner-auth";
import { getOrderSummary } from "../../../lib/admin-reports";

export default async function handler(req, res) {
  const kioskUser = await scannerFromRequest(req);
  if (!(await isAdminRequest(req)) && kioskUser?.type !== "Kiosk") return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    return res.status(200).json({ items: await getOrderSummary() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
