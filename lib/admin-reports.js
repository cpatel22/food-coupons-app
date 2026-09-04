import { getSupabaseAdmin } from "./supabase";

export async function getAdminOrders({
  query = "",
  status = "confirmed",
  page = 1,
  pageSize = 25,
} = {}) {
  const [couponsResult, kioskResult, recordsResult] = await Promise.all([
    getSupabaseAdmin().from("coupons").select("*"),
    getSupabaseAdmin().from("kiosk_orders").select("*"),
    getSupabaseAdmin().from("order_records").select("*"),
  ]);

  if (couponsResult.error) throw couponsResult.error;
  if (kioskResult.error) throw kioskResult.error;
  if (recordsResult.error) throw recordsResult.error;

  const kiosks = new Map(kioskResult.data.map((order) => [order.id, order]));
  const records = new Map(
    recordsResult.data.map((record) => [record.order_id, record]),
  );
  const groups = new Map();

  for (const coupon of couponsResult.data) {
    const current = groups.get(coupon.session_id) || [];
    current.push(coupon);
    groups.set(coupon.session_id, current);
  }

  const orderIds = new Set([...groups.keys(), ...kiosks.keys()]);
  const orders = [...orderIds]
    .map((order_id) => {
      const coupons = groups.get(order_id) || [];
      const kiosk = kiosks.get(order_id);
      const record = records.get(order_id);
      const items = coupons.length
        ? coupons.map((coupon) => ({ name: coupon.menu_item_name, qty: Number(coupon.qty), price: Number(coupon.price) }))
        : (kiosk?.items || []).map((item) => ({ name: item.name, qty: Number(item.qty), price: Number(item.price) }));

      return {
        order_id,
        customer:
          kiosk?.customer_name ||
          kiosk?.customer_email ||
          record?.customer_email ||
          coupons[0]?.customer_info ||
          "Guest",
        email: kiosk?.customer_email || record?.customer_email || "",
        phone: kiosk?.customer_phone || "",
        payment_method: kiosk ? "Kiosk" : "Stripe",
        status: kiosk?.status || "paid",
        created_at: kiosk?.created_at || record?.created_at || null,
        total_qty: items.reduce((sum, item) => sum + item.qty, 0),
        total_price: items.reduce(
          (sum, item) => sum + item.qty * item.price,
          0,
        ),
        items,
      };
    })
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));

  const search = query.trim().toLowerCase();
  const statusFilteredOrders = status === "pending"
    ? orders.filter((order) => order.status === "pending")
    : orders.filter((order) => order.status !== "pending");
  const filteredOrders = search
    ? statusFilteredOrders.filter((order) =>
        [
          order.order_id,
          order.customer,
          order.email,
          order.phone,
          order.payment_method,
          order.status,
          order.total_qty,
          order.total_price,
          order.created_at,
          ...order.items.flatMap((item) => [item.name, item.qty, item.price]),
        ]
          .join(" ")
          .toLowerCase()
          .includes(search),
      )
    : statusFilteredOrders;
  const start = (page - 1) * pageSize;

  return {
    orders: filteredOrders.slice(start, start + pageSize),
    total: filteredOrders.length,
  };
}

export async function getOrderSummary() {
  const [couponsResult, kioskResult] = await Promise.all([
    getSupabaseAdmin().from("coupons").select("session_id,menu_item_name,qty,price"),
    getSupabaseAdmin().from("kiosk_orders").select("id"),
  ]);
  if (couponsResult.error) throw couponsResult.error;
  if (kioskResult.error) throw kioskResult.error;

  const kioskOrderIds = new Set(kioskResult.data.map((order) => order.id));
  const summary = new Map();
  for (const coupon of couponsResult.data) {
    const current = summary.get(coupon.menu_item_name) || {
      name: coupon.menu_item_name,
      sold_qty: 0,
      revenue: 0,
      kiosk_qty: 0,
      kiosk_revenue: 0,
      pay_now_qty: 0,
      pay_now_revenue: 0,
    };
    const qty = Number(coupon.qty);
    const revenue = qty * Number(coupon.price);
    current.sold_qty += qty;
    current.revenue += revenue;
    if (kioskOrderIds.has(coupon.session_id)) {
      current.kiosk_qty += qty;
      current.kiosk_revenue += revenue;
    } else {
      current.pay_now_qty += qty;
      current.pay_now_revenue += revenue;
    }
    summary.set(coupon.menu_item_name, current);
  }

  return [...summary.values()].sort((a, b) => b.sold_qty - a.sold_qty);
}
