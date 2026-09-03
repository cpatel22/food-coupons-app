import { requireAdmin } from "../../lib/admin-auth";
import { MenuItemRepo } from "../../lib/menu-items";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      if (req.query.admin === "true") {
        if (!requireAdmin(req, res)) {
          return;
        }

        return res.status(200).json({ items: await MenuItemRepo.listAll() });
      }

      return res.status(200).json({ items: await MenuItemRepo.listPublic() });
    }

    if (req.method === "POST") {
      if (!requireAdmin(req, res)) {
        return;
      }

      const item = await MenuItemRepo.create(req.body);
      return res.status(200).json({ item });
    }

    if (req.method === "PUT") {
      if (!requireAdmin(req, res)) {
        return;
      }

      const item = await MenuItemRepo.update(req.body);
      return res.status(200).json({ item });
    }

    if (req.method === "PATCH") {
      if (!requireAdmin(req, res)) {
        return;
      }

      const item = await MenuItemRepo.adjustStock(req.body);
      return res.status(200).json({ item });
    }

    if (req.method === "DELETE") {
      if (!requireAdmin(req, res)) {
        return;
      }

      await MenuItemRepo.remove(req.body.id);
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", "GET,POST,PUT,PATCH,DELETE");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
