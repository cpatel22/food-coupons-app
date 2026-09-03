import { useState } from "react";
import Head from "next/head";
import Link from "next/link";
import CouponReceipt from "../components/CouponReceipt";

export default function OrdersPage() {
  const [email, setEmail] = useState("");
  const [last4, setLast4] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/order-lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, last4 }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to lookup orders");
      }

      setOrders(data.orders);
    } catch (err) {
      setError(err.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Head>
        <title>Find My Orders</title>
      </Head>

      <div className="container">
        <div className="hero">
          <div>
            <h1>Find My Orders</h1>
            <p>
              Enter the email used at checkout and the last 4 digits of the
              payment card to reopen your coupon QR codes.
            </p>
          </div>
          <Link className="back-link" href="/">
            Back to Menu
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="lookup-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Card Last 4 Digits
            <input
              type="text"
              inputMode="numeric"
              maxLength="4"
              value={last4}
              onChange={(e) => setLast4(e.target.value.replace(/\D/g, ""))}
              required
            />
          </label>
          <button disabled={loading}>
            {loading ? "Searching..." : "Find Orders"}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && orders.length === 0 ? (
          <p className="empty">No orders loaded yet.</p>
        ) : null}

        <div className="orders-list">
          {orders.map((order) => (
            <section key={order.order_id} className="order-card">
              <div className="order-header">
                <div>
                  <h2>Order {order.order_id}</h2>
                  <p>{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <Link
                  className="view-link"
                  href={`/success?order_id=${order.order_id}`}
                >
                  Open Receipt
                </Link>
              </div>

              <div className="coupon-grid">
                {order.items.map((item) => (
                  <CouponReceipt
                    key={item.code}
                    item={item}
                    showScissors={false}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f4f4f4;
          padding: 24px;
        }
        .container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .hero {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .back-link,
        .view-link {
          background: #111;
          color: #fff;
          padding: 10px 14px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          white-space: nowrap;
        }
        .lookup-form {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
        }
        label {
          display: grid;
          gap: 6px;
          font-weight: 600;
        }
        input {
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
        }
        button {
          align-self: end;
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          background: #0070f3;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        .error {
          color: #b42318;
          font-weight: 600;
        }
        .empty {
          color: #666;
        }
        .orders-list {
          display: grid;
          gap: 20px;
        }
        .order-card {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
        }
        .order-header {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 16px;
        }
        .order-header h2 {
          margin: 0 0 6px;
          font-size: 1.1rem;
        }
        .order-header p {
          margin: 0;
          color: #666;
        }
        .coupon-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
          justify-items: center;
        }
      `}</style>
    </div>
  );
}
