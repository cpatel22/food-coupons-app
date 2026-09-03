import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function KioskPayPage() {
  const router = useRouter();
  const { order_id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  useEffect(() => {
    if (!order_id) {
      return;
    }

    const loadOrder = async () => {
      try {
        const res = await fetch(`/api/kiosk-order?order_id=${order_id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load order");
        }

        setOrder(data.order);
        setCustomerEmail(data.order.customer_email || "");
        setCustomerPhone(data.order.customer_phone || "");
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [order_id]);

  const markPaid = async () => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/kiosk-order", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id,
          customer_email: customerEmail,
          customer_phone: customerPhone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to mark order paid");
      }

      router.replace(`/success?order_id=${order_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 20 }}>Loading kiosk payment screen...</div>;
  }

  if (error && !order) {
    return <div style={{ padding: 20, color: "red" }}>{error}</div>;
  }

  return (
    <div className="container">
      <Head>
        <title>Kiosk Payment</title>
      </Head>

      <div className="panel">
        <h1>Kiosk Payment</h1>
        <p>Review the order, collect payment, then mark it paid.</p>

        <div className="order-id">Order: {order.id}</div>

        <ul className="items">
          {order.items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <span>
                {item.qty} x ${Number(item.price).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>

        <div className="summary-row">
          <span>Total Items</span>
          <strong>{order.total_qty}</strong>
        </div>
        <div className="summary-row total">
          <span>Total Due</span>
          <strong>${Number(order.total_price).toFixed(2)}</strong>
        </div>

        <label>
          Customer Email
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="optional@email.com"
          />
        </label>

        <label>
          Customer Phone
          <input
            type="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="Optional phone number"
          />
        </label>

        {error ? <p className="error">{error}</p> : null}

        <button
          className="paid-btn"
          onClick={markPaid}
          disabled={saving || order.status === "paid"}
        >
          {order.status === "paid"
            ? "Already Paid"
            : saving
              ? "Saving..."
              : "Mark Paid and Issue Coupons"}
        </button>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 24px;
          background: #111827;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .panel {
          width: 100%;
          max-width: 560px;
          background: #ffffff;
          border-radius: 18px;
          padding: 28px;
        }
        h1 {
          margin-top: 0;
        }
        p {
          color: #666;
        }
        .order-id {
          margin: 16px 0;
          font-weight: 700;
        }
        .items {
          list-style: none;
          padding: 0;
          margin: 0 0 16px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        }
        .items li {
          display: flex;
          justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .items li:last-child {
          border-bottom: none;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }
        .total {
          font-size: 1.1rem;
          margin-bottom: 16px;
        }
        label {
          display: block;
          margin-top: 14px;
          font-weight: 600;
        }
        input {
          width: 100%;
          margin-top: 6px;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          box-sizing: border-box;
        }
        .error {
          color: #b91c1c;
          font-weight: 600;
        }
        .paid-btn {
          width: 100%;
          margin-top: 20px;
          padding: 14px;
          border: none;
          border-radius: 10px;
          background: #16a34a;
          color: #fff;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
        }
        .paid-btn:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
