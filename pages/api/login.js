import { setAdminSession } from "../../lib/admin-auth";
import { setScannerSession } from "../../lib/scanner-auth";
import { ScannerUserRepo } from "../../lib/scanner-users";
import { isAdminType, loginDestination } from "../../lib/user-roles";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });
  try {
    const user = await ScannerUserRepo.authenticate(req.body);
    if (!user)
      return res.status(401).json({ error: "Invalid username or password" });
    setScannerSession(res, user);
    if (isAdminType(user.user_type)) setAdminSession(res, user);
    return res.status(200).json({
      type: user.user_type,
      destination: loginDestination(user.user_type),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
