import { OrderRecordRepo } from "../../lib/order-records";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const email = String(req.body.email || "")
      .trim()
      .toLowerCase();
    const last4 = String(req.body.last4 || "").trim();

    if (!email || !last4) {
      return res
        .status(400)
        .json({ error: "Email and last 4 digits are required" });
    }

    if (!/^\d{4}$/.test(last4)) {
      return res
        .status(400)
        .json({ error: "Card last 4 digits must be exactly 4 numbers" });
    }

    const orders = await OrderRecordRepo.findByEmailAndLast4({ email, last4 });
    return res.status(200).json({ orders });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
