import { requireAdmin } from "../../../lib/admin-auth";
import { getDashboardItems } from "../../../lib/admin-reports";

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    return res.status(200).json({ items: await getDashboardItems() });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
