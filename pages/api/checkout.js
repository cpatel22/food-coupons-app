import Stripe from 'stripe';

function getBaseUrl(req) {
    const origin = req.headers.origin;
    if (origin && /^https?:\/\//.test(origin)) {
        return origin;
    }

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers['x-forwarded-host'] || req.headers.host;

    if (!host) {
        throw new Error('Unable to determine request host for Stripe redirect URLs');
    }

    return `${protocol}://${host}`;
}


export default async function handler(req, res) {
    if (req.method === 'POST') {
        try {
            if (!process.env.STRIPE_SECRET_KEY) {
                console.error("STRIPE_SECRET_KEY is not defined");
                return res.status(500).json({ statusCode: 500, message: "Server Error: Stripe key missing" });
            }
            // Initialize Stripe inside handler to ensure env is loaded
            const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
            const baseUrl = getBaseUrl(req);

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
                success_url: `${baseUrl}/success?order_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${baseUrl}/`,
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
