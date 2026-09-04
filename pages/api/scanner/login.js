import { setScannerSession } from "../../../lib/scanner-auth";
import { ScannerUserRepo } from "../../../lib/scanner-users";

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });

  try {
    const user = await ScannerUserRepo.authenticate(req.body);
    if (!user)
      return res.status(401).json({ error: "Invalid scanner credentials" });
    setScannerSession(res, user);
    return res.status(200).json({
      user: { id: user.id, name: user.name, username: user.username },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
