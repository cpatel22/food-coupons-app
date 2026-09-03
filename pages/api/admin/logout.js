import { clearAdminSession } from "../../../lib/admin-auth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  clearAdminSession(res);
  return res.status(200).json({ success: true });
}
