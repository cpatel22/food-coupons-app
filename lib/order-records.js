import { getSupabaseAdmin } from "./supabase";
import { CouponRepo } from "./db";

function normalizeCoupon(coupon) {
  return {
    id: coupon.code,
    name: coupon.menu_item_name,
    price: coupon.price,
    qty: coupon.qty,
    code: coupon.code,
    is_used: coupon.is_used,
    voided_at: coupon.voided_at,
  };
}

export const OrderRecordRepo = {
  upsert: async (record) => {
    const { error } = await getSupabaseAdmin()
      .from("order_records")
      .upsert(
        [
          {
            order_id: record.order_id,
            customer_email: record.customer_email,
            payment_last4: record.payment_last4,
            payment_method: record.payment_method,
            created_at: record.created_at || new Date().toISOString(),
          },
        ],
        { onConflict: "order_id" },
      );

    if (error) {
      throw error;
    }
  },

  findByEmailAndLast4: async ({ email, last4 }) => {
    const { data, error } = await getSupabaseAdmin()
      .from("order_records")
      .select("*")
      .eq("customer_email", email)
      .eq("payment_last4", last4)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const orders = [];
    for (const record of data) {
      const coupons = await CouponRepo.getBySession(record.order_id);
      orders.push({
        order_id: record.order_id,
        customer_email: record.customer_email,
        payment_last4: record.payment_last4,
        payment_method: record.payment_method,
        created_at: record.created_at,
        items: coupons.map(normalizeCoupon),
      });
    }

    return orders.filter((order) => order.items.length > 0);
  },
};
