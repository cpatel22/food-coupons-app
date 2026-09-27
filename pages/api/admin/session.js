import { getAdminSessionInfo } from "../../../lib/admin-auth";

export default async function handler(req, res) {
  const session = await getAdminSessionInfo(req);
  return res.status(200).json(session);
}
