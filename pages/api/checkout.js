import Stripe from 'stripe';


export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            if (!process.env.STRIPE_SECRET_KEY) {
                console.error("STRIPE_SECRET_KEY is not defined");
                return res.status(500).json({ statusCode: 500, message: "Server Error: Stripe key missing" });
            }
            // Initialize Stripe inside handler to ensure env is loaded
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

            const { items } = req.body;

            const lineItems = items.map((item) => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        images: item.image ? [item.image.startsWith('http') ? item.image : `http://localhost:3000${item.image}`] : [],
                    },
                    unit_amount: Math.round(item.price * 100), // Stripe expects cents
                },
                quantity: item.qty,
            }));


            // Create Checkout Session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                // To remove Link, you must disable it in the Stripe Dashboard > Settings > Payment Methods
                // 'card' includes Apple Pay and Google Pay automatically
                line_items: lineItems,
                mode: 'payment',
                success_url: `${req.headers.origin}/success?order_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${req.headers.origin}/`,
                phone_number_collection: { enabled: true },
            });

            res.status(200).json({ id: session.id, url: session.url });
        } catch (err) {
            console.error(err);
            res.status(500).json({ statusCode: 500, message: err.message });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}
