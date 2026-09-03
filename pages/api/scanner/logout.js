import { clearScannerSession } from "../../../lib/scanner-auth";

export default function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method Not Allowed" });
  clearScannerSession(res);
  return res.status(200).json({ success: true });
}
