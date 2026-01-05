import Stripe from 'stripe';


import { v4 as uuidv4 } from 'uuid';
import { CouponRepo } from '../../lib/db';
import { sendNotifications } from '../../lib/notifications';

export default async function handler(req, res) {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY is missing");
        return res.status(500).json({ error: "STRIPE_SECRET_KEY is missing" });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { order_id } = req.query;

    if (!order_id) {
        return res.status(400).json({ error: 'Missing order_id' });
    }

    try {
        const session = await stripe.checkout.sessions.retrieve(order_id);
        const lineItems = await stripe.checkout.sessions.listLineItems(order_id);



        // Generate or Retrieve Coupons from DB
        let existingCoupons = await CouponRepo.getBySession(order_id);


        if (existingCoupons.length === 0) {
            // Extract customer info
            // session.customer_details is usually populated after payment with email/name
            const customerInfo = session.customer_details?.email || session.customer_details?.name || "Guest";

            // Generate new coupons: 1 per UNIT of quantity (e.g. 3 Pizzas = 3 Coupon Codes)
            for (const item of lineItems.data) {
                const qty = item.quantity;
                for (let i = 0; i < qty; i++) {
                    const code = uuidv4().slice(0, 8).toUpperCase();
                    await CouponRepo.create({
                        code,
                        session_id: order_id,
                        menu_item_name: item.description,
                        qty: 1, // Each barcode represents 1 unit
                        price: item.price.unit_amount / 100,
                        customer_info: customerInfo
                    });
                }
            }
            existingCoupons = await CouponRepo.getBySession(order_id);

            // Send Notifications
            const coupons = existingCoupons.map(c => ({
                id: c.code,
                name: c.menu_item_name,
                price: c.price,
                qty: c.qty,
                code: c.code
            }));

            const customerEmail = session.customer_details?.email;
            const customerPhone = session.customer_details?.phone;

            console.log("Stripe Session Customer Details:", {
                email: customerEmail,
                phone: customerPhone,
                customer_name: session.customer_details?.name
            });

            const successUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/success?order_id=${order_id}`;

            // We don't await this to avoid blocking the response, 
            // but for reliability in some serverless envs you might want to.
            sendNotifications({
                email: session.customer_details?.email,
                phone: session.customer_details?.phone,
                items: coupons,
                successUrl
            }).catch(err => console.error("Notification trigger error:", err));
        }

        const coupons = existingCoupons.map(c => ({
            id: c.code,
            name: c.menu_item_name,
            price: c.price,
            qty: c.qty,
            code: c.code,
            is_used: c.is_used,
            voided_at: c.voided_at
        }));

        res.status(200).json({ items: coupons });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
