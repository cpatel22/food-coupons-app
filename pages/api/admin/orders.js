import { isAdminRequest } from "../../../lib/admin-auth";
import { scannerFromRequest } from "../../../lib/scanner-auth";
import { getAdminOrders } from "../../../lib/admin-reports";

export default async function handler(req, res) {
  const kioskUser = await scannerFromRequest(req);
  if (!(await isAdminRequest(req)) && kioskUser?.type !== "Kiosk") return res.status(401).json({ error: "Unauthorized" });
  if (req.method !== "GET")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(
      Math.max(Number.parseInt(req.query.pageSize, 10) || 25, 1),
      100,
    );
    return res.status(200).json(
      await getAdminOrders({
        query: typeof req.query.search === "string" ? req.query.search : "",
        page,
        pageSize,
      }),
    );
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
