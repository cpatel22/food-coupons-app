import { getSupabaseAdmin } from "./supabase";

export const KioskOrderRepo = {
  create: async (order) => {
    const { error } = await getSupabaseAdmin()
      .from("kiosk_orders")
      .insert([
        {
          id: order.id,
          items: order.items,
          total_qty: order.total_qty,
          total_price: order.total_price,
          status: order.status || "pending",
          customer_name: order.customer_name || null,
          customer_email: order.customer_email || null,
          customer_phone: order.customer_phone || null,
        },
      ]);

    if (error) {
      console.error("Supabase Kiosk Order Create Error:", error);
      throw error;
    }
  },

  getById: async (id) => {
    const { data, error } = await getSupabaseAdmin()
      .from("kiosk_orders")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("Supabase Kiosk Order Get Error:", error);
      throw error;
    }

    return data;
  },

  markPaid: async ({ id, customer_email, customer_phone }) => {
    const paid_at = new Date().toISOString();
    const updates = {
      status: "paid",
      paid_at,
      customer_email: customer_email || null,
      customer_phone: customer_phone || null,
    };

    const { data, error } = await getSupabaseAdmin()
      .from("kiosk_orders")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("Supabase Kiosk Order Update Error:", error);
      throw error;
    }

    return data;
  },
};
