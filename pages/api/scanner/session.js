import { scannerFromRequest } from "../../../lib/scanner-auth";

export default async function handler(req, res) {
  const user = await scannerFromRequest(req);
  return res.status(200).json({ authenticated: Boolean(user), user });
}
