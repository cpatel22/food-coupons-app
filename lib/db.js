
import { getSupabaseAdmin } from './supabase';

export const CouponRepo = {

  create: async (coupon) => {
    const { error } = await getSupabaseAdmin()
      .from('coupons')
      .insert([
        {
          code: coupon.code,
          session_id: coupon.session_id,
          menu_item_name: coupon.menu_item_name,
          qty: coupon.qty,
          price: coupon.price,
          customer_info: coupon.customer_info,
          is_used: false
        }
      ]);

    if (error) {
      console.error("Supabase Create Error:", error);
      throw error;
    }
  },

  getBySession: async (session_id) => {
    const { data, error } = await getSupabaseAdmin()
      .from('coupons')
      .select('*')
      .eq('session_id', session_id);

    if (error) {
      console.error("Supabase Get Error:", error);
      return [];
    }
    return data;
  },

  getByCode: async (code) => {
    const { data, error } = await getSupabaseAdmin()
      .from('coupons')
      .select('*')
      .eq('code', code)
      .single();

    if (error) return null;
    return data;
  },

  markUsed: async (code) => {
    const now = new Date().toISOString();
    const { error } = await getSupabaseAdmin()
      .from('coupons')
      .update({ is_used: true, voided_at: now })
      .eq('code', code);

    if (error) throw error;
    return new Date(now).toLocaleString();
  }
};
