import { CouponRepo } from "../../lib/db";
import { isAdminRequest } from "../../lib/admin-auth";
import { requireScanner } from "../../lib/scanner-auth";

export default async function handler(req, res) {
  if (!isAdminRequest(req) && !(await requireScanner(req, res))) {
    return;
  }

  if (req.method === "POST") {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    const coupon = await CouponRepo.getByCode(code);
    if (!coupon) return res.status(404).json({ error: "Coupon not found" });

    // Check status
    if (coupon.is_used) {
      return res.json({
        status: "VOIDED",
        item: coupon,
        message: `This coupon was already used at ${new Date(coupon.voided_at).toLocaleString()}`,
      });
    }

    return res.json({
      status: "VALID",
      item: coupon,
    });
  }

  if (req.method === "PUT") {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    try {
      const voidedAt = await CouponRepo.markUsed(code);
      return res.json({ success: true, voidedAt });
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: "Failed to redeem" });
    }
  }

  return res.status(405).end();
}
