import { isAdminRequest } from "../../../lib/admin-auth";

export default function handler(req, res) {
  return res.status(200).json({ authenticated: isAdminRequest(req) });
}
