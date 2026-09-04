import {
  setAdminSession,
  validateAdminLogin,
} from "../../../lib/admin-auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { username, password } = req.body;
  const user = await validateAdminLogin({ username, password });

  if (user === false) {
    return res.status(401).json({ error: "Invalid admin credentials" });
  }

  setAdminSession(res, user);
  return res.status(200).json({ success: true });
}
