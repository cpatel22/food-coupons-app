import { requireAdmin } from "../../../lib/admin-auth";
import { getOrderSummary } from "../../../lib/admin-reports";

export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    return res.status(200).json({ items: await getOrderSummary() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
