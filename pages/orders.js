import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

function formatMoney(value) {
  return `$${Number(value || 0).toFixed(2)}`;
}

function summarizeOrderItems(items) {
  const groups = new Map();

  for (const item of items) {
    const name = item.name || "Item";
    const qty = Number(item.qty) || 1;
    const price = Number(item.price) || 0;
    const current = groups.get(name) || {
      name,
      qty: 0,
      amount: 0,
      usedQty: 0,
    };

    current.qty += qty;
    current.amount += qty * price;
    if (item.is_used) {
      current.usedQty += qty;
    }

    groups.set(name, current);
  }

  return [...groups.values()].map((group) => ({
    ...group,
    status:
      group.usedQty >= group.qty
        ? "redeemed"
        : group.usedQty > 0
          ? "partial"
          : "available",
  }));
}

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
        <div className="header">
          <h1>Find My Orders</h1>
          <Link href="/" className="back-link">
            Back to Menu
          </Link>
        </div>
        <p className="intro">
          Enter the email used at checkout and the last 4 digits of the payment
          card to reopen your coupon QR codes.
        </p>

        <form onSubmit={handleSubmit} className="lookup-form">
          <label>
            Email Address
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
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
              placeholder="1234"
              required
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Find Orders"}
          </button>
        </form>

        {error ? <p className="error">{error}</p> : null}
        {!loading && !error && orders.length === 0 ? (
          <p className="empty">No orders loaded yet.</p>
        ) : null}

        <div className="orders-list">
          {orders.map((order) => {
            const lines = summarizeOrderItems(order.items);
            const total = lines.reduce((sum, line) => sum + line.amount, 0);

            return (
              <section key={order.order_id} className="order-card">
                <div className="order-header">
                  <p>{new Date(order.created_at).toLocaleString()}</p>
                  <Link
                    className="view-link"
                    href={`/success?order_id=${order.order_id}`}
                  >
                    View Coupons
                  </Link>
                </div>

                <ul className="item-list">
                  {lines.map((line) => (
                    <li
                      key={line.name}
                      className={`item-row ${line.status}`}
                    >
                      <span className="item-name">
                        {line.name} * {line.qty}
                        {line.status === "partial" ? (
                          <small>
                            {line.usedQty} of {line.qty} redeemed
                          </small>
                        ) : null}
                      </span>
                      <span className="item-amount">
                        {formatMoney(line.amount)}
                      </span>
                    </li>
                  ))}
                  <li className="item-row total">
                    <span>Total</span>
                    <span>{formatMoney(total)}</span>
                  </li>
                </ul>
              </section>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f4f4f4;
          padding: 24px;
        }
        .container {
          max-width: 900px;
          margin: 0 auto;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        h1 {
          margin: 0;
          font-size: 1.75rem;
          line-height: 1.2;
          color: #111827;
        }
        .intro {
          margin: 10px 0 20px;
          max-width: 640px;
          color: #4b5563;
          line-height: 1.5;
          font-size: 1rem;
        }
        .lookup-form {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          margin-bottom: 20px;
        }
        label {
          display: grid;
          gap: 6px;
          font-weight: 600;
          color: #111827;
        }
        input {
          width: 100%;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font: inherit;
        }
        button {
          padding: 12px 16px;
          border: none;
          border-radius: 8px;
          background: #0070f3;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.65;
          cursor: wait;
        }
        .error {
          color: #b42318;
          font-weight: 600;
        }
        .empty {
          color: #6b7280;
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
          flex-direction: column;
          align-items: flex-start;
          gap: 12px;
          margin-bottom: 16px;
        }
        .order-header p {
          margin: 0;
          color: #6b7280;
        }
        .item-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: grid;
          gap: 10px;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 16px;
          font-size: 1.05rem;
          font-weight: 700;
        }
        .item-name {
          display: grid;
          gap: 2px;
        }
        .item-name small {
          font-size: 0.75rem;
          font-weight: 600;
          color: #b91c1c;
        }
        .item-row.available {
          color: #15803d;
        }
        .item-row.partial {
          color: #15803d;
        }
        .item-row.redeemed {
          color: #dc2626;
        }
        .item-row.total {
          margin-top: 6px;
          padding-top: 10px;
          border-top: 1px solid #e5e7eb;
          color: #111827;
          font-size: 1.15rem;
        }
        @media (min-width: 720px) {
          .lookup-form {
            grid-template-columns: 1.4fr 0.8fr auto;
            align-items: end;
          }
        }
        @media (max-width: 640px) {
          .header {
            flex-direction: column;
            align-items: flex-start;
          }
        }
      `}</style>
      <style jsx global>{`
        .back-link,
        .view-link {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #111827;
          color: #fff;
          padding: 10px 14px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
          white-space: nowrap;
        }
        .view-link {
          background: #0f766e;
        }
      `}</style>
    </div>
  );
}
