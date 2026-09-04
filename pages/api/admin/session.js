import { isAdminRequest } from "../../../lib/admin-auth";

export default async function handler(req, res) {
  return res.status(200).json({ authenticated: await isAdminRequest(req) });
}
