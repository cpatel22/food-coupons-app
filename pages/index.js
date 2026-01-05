import { useState } from "react";
import Head from "next/head";
import { menu } from "../data/menu";
import MenuItem from "../components/MenuItem";
import Cart from "../components/Cart";
import InvoiceReceipt from "../components/InvoiceReceipt";
import CouponReceipt from "../components/CouponReceipt";
import { APP_CONFIG } from "../config";

import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe only if the key is available
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export default function Home() {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  // Use global config for print mode instead of local state
  const printMode = APP_CONFIG.PRINT_MODE;

  const updateQty = (item, delta) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (!existing && delta > 0) {
        // Add new item
        return [...prev, { ...item, qty: 1 }];
      }
      if (existing) {
        const newQty = existing.qty + delta;
        if (newQty <= 0) {
          // Remove item
          return prev.filter((i) => i.id !== item.id);
        }
        // Update quantity
        return prev.map((i) => (i.id === item.id ? { ...i, qty: newQty } : i));
      }
      return prev;
    });
  };

  const getItemQty = (id) => {
    return cart.find((i) => i.id === id)?.qty || 0;
  };


  const handleCheckout = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || `Server Error: ${response.status}`);
      }

      // Simplified redirection using the server-provided URL
      const { url } = data;

      if (url) {
        window.location.href = url;
      } else {
        throw new Error("No Checkout URL returned from server");
      }

      if (result.error) {
        alert(result.error.message);
      }
    } catch (e) {
      console.error("Checkout Error:", e);
      alert(`Checkout failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Food Menu & Coupons</title>
        <meta name="description" content="Order food and print coupons" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="screen-only">
        <header className="header">
          <h1>Delicious Eats</h1>
          <p>Select your favorite meals below.</p>
        </header>

        <main className="menu-list">
          {menu.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              qty={getItemQty(item.id)}
              onUpdate={(delta) => updateQty(item, delta)}
            />
          ))}
        </main>

        <Cart items={cart} onCheckout={handleCheckout} />
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background: #f4f4f4;
          color: #333;
        }
        @media print {
          .screen-only {
            display: none !important;
          }
          body {
            background: white;
          }
          .container {
            margin: 0;
            padding: 0;
            max-width: 100%;
          }
        }
      `}</style>

      <style jsx>{`
        .container {
          max-width: ${APP_CONFIG.MENU_COLUMNS > 1 ? '800px' : '600px'};
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        h1 {
          color: #d32f2f;
          margin-bottom: 5px;
        }
        .menu-list {
          display: grid;
          grid-template-columns: ${Array(APP_CONFIG.MENU_COLUMNS).fill('1fr').join(' ')};
          gap: 15px;
        }
        .receipt-section {
          margin-top: 30px;
          border-top: 2px solid #ddd;
          padding-top: 20px;
        }

        /* Mode selection is now handled by APP_CONFIG in config.js */
        .receipt-controls {
          text-align: center;
          background: #e8f5e9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .print-btn {
          padding: 12px 24px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          margin-right: 10px;
        }
        .close-btn {
          padding: 12px 24px;
          background: #ccc;
          color: #333;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
        }
        .print-area {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      `}</style>
    </div>
  );
}
