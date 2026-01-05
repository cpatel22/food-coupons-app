import { CouponRepo } from '../../lib/db';
import { sendNotifications } from '../../lib/notifications';
import Stripe from 'stripe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { order_id } = req.body;

    if (!order_id) {
        return res.status(400).json({ error: 'Missing order_id' });
    }

    try {
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
        const session = await stripe.checkout.sessions.retrieve(order_id);
        const existingCoupons = await CouponRepo.getBySession(order_id);

        if (existingCoupons.length === 0) {
            return res.status(404).json({ error: 'No coupons found for this order. Please load the success page first.' });
        }

        const coupons = existingCoupons.map(c => ({
            id: c.code,
            name: c.menu_item_name,
            price: c.price,
            qty: c.qty,
            code: c.code
        }));

        const successUrl = `${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}/success?order_id=${order_id}`;

        await sendNotifications({
            email: session.customer_details?.email,
            phone: session.customer_details?.phone,
            items: coupons,
            successUrl
        });

        res.status(200).json({ message: 'Email resent successfully' });
    } catch (err) {
        console.error("Resend Error:", err);
        res.status(500).json({ error: err.message });
    }
}
