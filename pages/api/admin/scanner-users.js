import { getAdminSessionInfo, requireAdmin } from "../../../lib/admin-auth";
import { MenuItemRepo } from "../../../lib/menu-items";
import { ScannerUserRepo } from "../../../lib/scanner-users";
import { premvatiRoleFromItemName } from "../../../lib/user-roles";

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) return;

  try {
    const session = await getAdminSessionInfo(req);
    if (req.method === "GET") {
      const items = await MenuItemRepo.listAll();
      const premvatiRoles = [
        ...new Set(
          items
            .map(
              (item) =>
                item.scanner_role || premvatiRoleFromItemName(item.name),
            )
            .filter(Boolean),
        ),
      ];
      return res.status(200).json({
        users: await ScannerUserRepo.list(),
        premvatiRoles,
        sessionType: session.type,
      });
    }
    if (req.method === "POST")
      return res
        .status(200)
        .json({ user: await ScannerUserRepo.create(req.body) });
    if (req.method === "PUT")
      return res
        .status(200)
        .json({ user: await ScannerUserRepo.update(req.body) });
    if (req.method === "DELETE") {
      await ScannerUserRepo.remove(req.body.id);
      return res.status(200).json({ success: true });
    }
    res.setHeader("Allow", "GET,POST,PUT,DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
