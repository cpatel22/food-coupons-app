import { getSupabaseAdmin } from "./supabase";

export async function createScanLog({ user, scanType, value, result }) {
  const { error } = await getSupabaseAdmin().from("scan_logs").insert([{
    scanner_user_id: user.id,
    scanner_user_type: user.type,
    scan_type: scanType,
    scanned_value: value,
    result,
  }]);
  if (error) throw error;
}
