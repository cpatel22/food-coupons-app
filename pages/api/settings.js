import { requireAdmin } from "../../lib/admin-auth";
import { getSettings, updateSettings } from "../../lib/settings";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const isAdmin = req.query.admin === "true";
      if (isAdmin && !(await requireAdmin(req, res))) return;
      return res.status(200).json({
        settings: await getSettings({ includeSecrets: isAdmin }),
      });
    }

    if (req.method === "PUT") {
      if (!(await requireAdmin(req, res))) return;
      return res.status(200).json({ settings: await updateSettings(req.body) });
    }

    res.setHeader("Allow", "GET,PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
