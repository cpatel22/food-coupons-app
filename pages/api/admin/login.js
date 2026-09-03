import {
  setAdminSession,
  validateAdminPassword,
} from "../../../lib/admin-auth";

export default function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { password } = req.body;

  if (!validateAdminPassword(password)) {
    return res.status(401).json({ error: "Invalid password" });
  }

  setAdminSession(res);
  return res.status(200).json({ success: true });
}
