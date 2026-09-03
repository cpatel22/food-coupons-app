import Stripe from "stripe";

import { v4 as uuidv4 } from "uuid";
import { CouponRepo } from "../../lib/db";
import { KioskOrderRepo } from "../../lib/kiosk-orders";
import { MenuItemRepo } from "../../lib/menu-items";
import { OrderRecordRepo } from "../../lib/order-records";
import { sendNotifications } from "../../lib/notifications";

async function buildCouponResponse(order_id) {
  const existingCoupons = await CouponRepo.getBySession(order_id);

  return existingCoupons.map((c) => ({
    id: c.code,
    name: c.menu_item_name,
    price: c.price,
    qty: c.qty,
    code: c.code,
    is_used: c.is_used,
    voided_at: c.voided_at,
  }));
}

async function createCouponsForItems({ order_id, items, customerInfo }) {
  for (const item of items) {
    const qty = item.qty || item.quantity || 0;
    for (let i = 0; i < qty; i++) {
      const code = uuidv4().slice(0, 8).toUpperCase();
      await CouponRepo.create({
        code,
        session_id: order_id,
        menu_item_name: item.name || item.description,
        qty: 1,
        price: item.price.unit_amount
          ? item.price.unit_amount / 100
          : item.price,
        customer_info: customerInfo,
      });
    }
  }
}

function normalizeStockItems(items) {
  return items.map((item) => ({
    id: item.id,
    name: item.name || item.description,
    qty: Number(item.qty || item.quantity || 0),
  }));
}

function parseStripeCartItems(session, lineItems) {
  try {
    const rawCartItems = session.metadata?.cart_items;
    if (!rawCartItems) {
      return lineItems.data.map((item) => ({
        id: item.description,
        name: item.description,
        qty: item.quantity,
      }));
    }

    return normalizeStockItems(JSON.parse(rawCartItems));
  } catch {
    return lineItems.data.map((item) => ({
      id: item.description,
      name: item.description,
      qty: item.quantity,
    }));
  }
}

async function getStripeCardLast4(stripe, session) {
  if (!session.payment_intent) {
    return null;
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent,
    {
      expand: ["payment_method"],
    },
  );

  return paymentIntent.payment_method?.card?.last4 || null;
}

export default async function handler(req, res) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is missing");
    return res.status(500).json({ error: "STRIPE_SECRET_KEY is missing" });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  const { order_id } = req.query;

  if (!order_id) {
    return res.status(400).json({ error: "Missing order_id" });
  }

  try {
    const kioskOrder = await KioskOrderRepo.getById(order_id);

    if (kioskOrder) {
      if (kioskOrder.status !== "paid") {
        return res.status(409).json({
          error: "Order has not been marked paid yet",
          status: kioskOrder.status,
        });
      }

      let existingCoupons = await CouponRepo.getBySession(order_id);

      if (existingCoupons.length === 0) {
        const customerInfo =
          kioskOrder.customer_email || kioskOrder.customer_phone || "Guest";
        await MenuItemRepo.decrementStock(
          normalizeStockItems(kioskOrder.items),
        );

        await createCouponsForItems({
          order_id,
          items: kioskOrder.items,
          customerInfo,
        });

        existingCoupons = await CouponRepo.getBySession(order_id);

        const coupons = existingCoupons.map((c) => ({
          id: c.code,
          name: c.menu_item_name,
          price: c.price,
          qty: c.qty,
          code: c.code,
        }));

        const successUrl = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}/success?order_id=${order_id}`;

        sendNotifications({
          email: kioskOrder.customer_email,
          phone: kioskOrder.customer_phone,
          items: coupons,
          successUrl,
        }).catch((err) => console.error("Notification trigger error:", err));
      }

      return res
        .status(200)
        .json({ items: await buildCouponResponse(order_id) });
    }

    const session = await stripe.checkout.sessions.retrieve(order_id);
    const lineItems = await stripe.checkout.sessions.listLineItems(order_id);
    const customerEmail = session.customer_details?.email;
    const customerPhone = session.customer_details?.phone;
    const paymentLast4 = await getStripeCardLast4(stripe, session);

    if (customerEmail && paymentLast4) {
      await OrderRecordRepo.upsert({
        order_id,
        customer_email: customerEmail.toLowerCase(),
        payment_last4: paymentLast4,
        payment_method: "stripe-card",
        created_at: session.created
          ? new Date(session.created * 1000).toISOString()
          : new Date().toISOString(),
      });
    }

    // Generate or Retrieve Coupons from DB
    let existingCoupons = await CouponRepo.getBySession(order_id);

    if (existingCoupons.length === 0) {
      // Extract customer info
      // session.customer_details is usually populated after payment with email/name
      const customerInfo =
        session.customer_details?.email ||
        session.customer_details?.name ||
        "Guest";
      await MenuItemRepo.decrementStock(
        parseStripeCartItems(session, lineItems),
      );

      // Generate new coupons: 1 per UNIT of quantity (e.g. 3 Pizzas = 3 Coupon Codes)
      await createCouponsForItems({
        order_id,
        items: lineItems.data,
        customerInfo,
      });
      existingCoupons = await CouponRepo.getBySession(order_id);

      // Send Notifications
      const coupons = existingCoupons.map((c) => ({
        id: c.code,
        name: c.menu_item_name,
        price: c.price,
        qty: c.qty,
        code: c.code,
      }));

      console.log("Stripe Session Customer Details:", {
        email: customerEmail,
        phone: customerPhone,
        customer_name: session.customer_details?.name,
      });

      const successUrl = `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host}/success?order_id=${order_id}`;

      // We don't await this to avoid blocking the response,
      // but for reliability in some serverless envs you might want to.
      sendNotifications({
        email: session.customer_details?.email,
        phone: session.customer_details?.phone,
        items: coupons,
        successUrl,
      }).catch((err) => console.error("Notification trigger error:", err));
    }

    res.status(200).json({ items: await buildCouponResponse(order_id) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
