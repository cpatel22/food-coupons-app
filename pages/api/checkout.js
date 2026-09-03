import Stripe from "stripe";
import { MenuItemRepo } from "../../lib/menu-items";

function getBaseUrl(req) {
  const origin = req.headers.origin;
  if (origin && /^https?:\/\//.test(origin)) {
    return origin;
  }

  const protocol = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers["x-forwarded-host"] || req.headers.host;

  if (!host) {
    throw new Error(
      "Unable to determine request host for Stripe redirect URLs",
    );
  }

  return `${protocol}://${host}`;
}

function normalizeContact({ customer_name, customer_email, customer_phone }) {
  const name = String(customer_name || "").trim();
  const email = String(customer_email || "")
    .trim()
    .toLowerCase();
  const phone = String(customer_phone || "").trim();

  if (!name) {
    throw new Error("Full name is required");
  }

  if (!email) {
    throw new Error("Email is required");
  }

  if (!phone) {
    throw new Error("Phone number is required");
  }

  return { name, email, phone };
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error("STRIPE_SECRET_KEY is not defined");
        return res.status(500).json({
          statusCode: 500,
          message: "Server Error: Stripe key missing",
        });
      }
      // Initialize Stripe inside handler to ensure env is loaded
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      const baseUrl = getBaseUrl(req);

      const { items } = req.body;
      const contact = normalizeContact(req.body);

      await MenuItemRepo.assertAvailable(items);

      // Create a Stripe Customer so Checkout pre-fills name, email, and phone
      const customer = await stripe.customers.create({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
      });

      const lineItems = items.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.name,
            images: item.image
              ? [
                  item.image.startsWith("http")
                    ? item.image
                    : `http://localhost:3000${item.image}`,
                ]
              : [],
          },
          unit_amount: Math.round(item.price * 100), // Stripe expects cents
        },
        quantity: item.qty,
      }));

      // Create Checkout Session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        // To remove Link, you must disable it in the Stripe Dashboard > Settings > Payment Methods
        // 'card' includes Apple Pay and Google Pay automatically
        customer: customer.id,
        line_items: lineItems,
        mode: "payment",
        success_url: `${baseUrl}/success?order_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/`,
        // Phone is mandatory on Checkout; it is pre-filled and locked
        // because the attached Customer already has a phone number
        phone_number_collection: { enabled: true },
        metadata: {
          cart_items: JSON.stringify(
            items.map((item) => ({
              id: item.id,
              name: item.name,
              qty: item.qty,
              price: item.price,
            })),
          ),
        },
      });

      res.status(200).json({ id: session.id, url: session.url });
    } catch (err) {
      console.error(err);
      res.status(500).json({ statusCode: 500, message: err.message });
    }
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
}
