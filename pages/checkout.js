import { useEffect, useState } from "react";
import Head from "next/head";
import { APP_CONFIG } from "../config";
import BusinessName from "../components/BusinessName";
import Link from "next/link";
import { useRouter } from "next/router";
import Cart from "../components/Cart";
import { loadCart, saveCart } from "../lib/cart-storage";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState([]);
  const [loadingMode, setLoadingMode] = useState(null);
  const [cartReady, setCartReady] = useState(false);
  const [fullName, setFullName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [contactError, setContactError] = useState("");

  useEffect(() => {
    setCart(loadCart());
    setCartReady(true);
  }, []);

  useEffect(() => {
    if (!cartReady) {
      return;
    }

    saveCart(cart);
  }, [cart, cartReady]);

  const validateContact = () => {
    if (!fullName.trim()) {
      setContactError("Full name is required.");
      return false;
    }

    if (!customerEmail.trim()) {
      setContactError("Email is required.");
      return false;
    }

    if (!customerPhone.trim()) {
      setContactError("Phone number is required.");
      return false;
    }

    setContactError("");
    return true;
  };

  const handlePayNow = async () => {
    if (cart.length === 0) {
      return;
    }

    if (!validateContact()) {
      return;
    }

    setLoadingMode("pay-now");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customer_name: fullName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || data.error || `Server Error: ${response.status}`,
        );
      }

      if (data.url) {
        window.location.href = data.url;
        return;
      }

      throw new Error("No Checkout URL returned from server");
    } catch (e) {
      alert(`Checkout failed: ${e.message}`);
    } finally {
      setLoadingMode(null);
    }
  };

  const handlePayAtKiosk = async () => {
    if (cart.length === 0) {
      return;
    }

    if (!validateContact()) {
      return;
    }

    setLoadingMode("kiosk");

    try {
      const response = await fetch("/api/kiosk-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart,
          customer_name: fullName,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server Error: ${response.status}`);
      }

      await router.push(`/kiosk-order?order_id=${data.order_id}`);
    } catch (e) {
      alert(`Kiosk checkout failed: ${e.message}`);
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="page">
      <Head>
        <title>{`Checkout | ${APP_CONFIG.BUSINESS_NAME}`}</title>
      </Head>

      <div className="container">
        <div className="header">
          <div>
            <BusinessName />
            <h1>Checkout</h1>
            <p>Review your order and choose how you want to pay.</p>
          </div>
          <Link className="back-link" href="/">
            Back to Menu
          </Link>
        </div>

        <div className="cart-shell">
          <Cart
            items={cart}
            loadingMode={loadingMode}
            title=""
            compact={true}
            showActions={false}
          />
        </div>

        <div className="contact-form-card">
          <h2>Your Details</h2>
          <p>
            These details are used for your order and payment confirmation. You
            will not need to enter them again on the next screen.
          </p>
          <div className="contact-form-grid">
            <label>
              Full Name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="John Doe"
              />
            </label>
            <label>
              Email
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label>
              Phone Number
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+1 555 123 4567"
              />
            </label>
          </div>
          {contactError ? (
            <p className="contact-error">{contactError}</p>
          ) : null}
        </div>

        <div className="payment-actions">
          <button
            className="kiosk-btn"
            onClick={handlePayAtKiosk}
            disabled={Boolean(loadingMode) || cart.length === 0}
          >
            {loadingMode === "kiosk" ? "Preparing QR..." : "Pay at Kiosk"}
          </button>
          <button
            className="pay-now-btn"
            onClick={handlePayNow}
            disabled={Boolean(loadingMode) || cart.length === 0}
          >
            {loadingMode === "pay-now" ? "Redirecting..." : "Pay Now"}
          </button>
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #eef3fa;
          padding: 24px;
        }
        .container {
          max-width: 760px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #dfe4ea;
          padding: 22px 20px 32px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 22px;
        }
        h1 {
          margin: 0 0 6px;
          font-size: 2.1rem;
          color: #1f2f46;
        }
        p {
          margin: 0;
          color: #596579;
          max-width: 340px;
          line-height: 1.45;
        }
        .back-link {
          color: #1f2f46;
          padding: 0;
          text-decoration: none;
          font-weight: 500;
          white-space: normal;
          width: 72px;
          line-height: 1.2;
          margin-top: 4px;
        }
        .cart-shell {
          max-width: 620px;
        }
        .contact-form-card {
          max-width: 620px;
          margin-top: 16px;
          padding: 16px;
          border: 1px solid #dfe4ea;
          background: #fff;
        }
        .contact-form-card h2 {
          margin: 0 0 8px;
          font-size: 1.1rem;
          color: #1f2f46;
        }
        .contact-form-card p {
          max-width: none;
        }
        .contact-form-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        .contact-form-card label {
          display: grid;
          gap: 6px;
          font-weight: 600;
          color: #1f2f46;
        }
        .contact-form-card input {
          padding: 12px;
          border: 1px solid #d0d7e2;
          border-radius: 8px;
        }
        .contact-error {
          margin-top: 10px;
          color: #b42318;
          font-weight: 600;
        }
        .payment-actions {
          max-width: 620px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 16px;
        }
        .kiosk-btn,
        .pay-now-btn {
          padding: 14px 16px;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
        }
        .kiosk-btn {
          background: #6f42c1;
        }
        .pay-now-btn {
          background: #2faa43;
        }
        .kiosk-btn:disabled,
        .pay-now-btn:disabled {
          background: #b8b8b8;
          cursor: not-allowed;
        }
        @media (max-width: 640px) {
          .page {
            padding: 12px;
          }
          .container {
            padding: 18px 14px 24px;
          }
          .header {
            gap: 12px;
          }
          h1 {
            font-size: 1.8rem;
          }
          .contact-form-grid,
          .payment-actions {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
