import { CouponRepo } from "../../lib/db";
import { isAdminRequest } from "../../lib/admin-auth";
import { scannerFromRequest } from "../../lib/scanner-auth";
import { createScanLog } from "../../lib/scan-logs";

export default async function handler(req, res) {
  const scanner = await scannerFromRequest(req);
  if (!(await isAdminRequest(req)) && scanner?.type !== "Premvati") return res.status(401).json({ error: "Premvati scanner login required" });

  if (req.method === "POST") {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: "No code provided" });

    const coupon = await CouponRepo.getByCode(code);
    if (!coupon) {
      if (scanner) await createScanLog({ user: scanner, scanType: "coupon", value: code, result: "INVALID" });
      return res.status(404).json({ error: "Coupon not found" });
    }

    // Check status
    if (coupon.is_used) {
      if (scanner) await createScanLog({ user: scanner, scanType: "coupon", value: code, result: "VOIDED" });
      return res.json({
        status: "VOIDED",
        item: coupon,
        message: `This coupon was already used at ${new Date(coupon.voided_at).toLocaleString()}`,
      });
    }

    if (scanner) await createScanLog({ user: scanner, scanType: "coupon", value: code, result: "VALID" });
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
