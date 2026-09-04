import { v4 as uuidv4 } from "uuid";
import { KioskOrderRepo } from "../../lib/kiosk-orders";
import { MenuItemRepo } from "../../lib/menu-items";
import { isAdminRequest } from "../../lib/admin-auth";
import { scannerFromRequest } from "../../lib/scanner-auth";

function normalizeItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error("Cart is empty");
  }

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    price: Number(item.price),
    qty: Number(item.qty),
  }));
}

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const items = normalizeItems(req.body.items);
      const customer_name = String(req.body.customer_name || "").trim();
      const customer_email = String(req.body.customer_email || "")
        .trim()
        .toLowerCase();
      const customer_phone = String(req.body.customer_phone || "").trim();

      if (!customer_name || !customer_email || !customer_phone) {
        return res.status(400).json({
          error:
            "Full name, email, and phone number are required for kiosk payment",
        });
      }

      await MenuItemRepo.assertAvailable(items);
      const order_id = uuidv4();
      const total_qty = items.reduce((sum, item) => sum + item.qty, 0);
      const total_price = items.reduce(
        (sum, item) => sum + item.price * item.qty,
        0,
      );

      await KioskOrderRepo.create({
        id: order_id,
        items,
        total_qty,
        total_price,
        status: "pending",
        customer_name,
        customer_email,
        customer_phone,
      });

      return res.status(200).json({ order_id });
    }

    if (req.method === "GET") {
      const { order_id } = req.query;

      if (!order_id) {
        return res.status(400).json({ error: "Missing order_id" });
      }

      const order = await KioskOrderRepo.getById(order_id);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      return res.status(200).json({ order });
    }

    if (req.method === "PUT") {
      const scanner = await scannerFromRequest(req);
      if (!(await isAdminRequest(req)) && scanner?.type !== "Kiosk") {
        return res.status(401).json({ error: "Kiosk login required" });
      }
      const { order_id, customer_email, customer_phone } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: "Missing order_id" });
      }

      const order = await KioskOrderRepo.getById(order_id);

      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.status === "paid") {
        return res.status(200).json({ order });
      }

      const updatedOrder = await KioskOrderRepo.markPaid({
        id: order_id,
        customer_email,
        customer_phone,
      });

      return res.status(200).json({ order: updatedOrder });
    }

    res.setHeader("Allow", "GET,POST,PUT");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
