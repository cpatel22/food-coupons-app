import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import BusinessName from "../components/BusinessName";

export default function KioskOrderPage() {
  const router = useRouter();
  const { order_id } = router.query;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!order_id) {
      return;
    }

    let isMounted = true;
    let pollTimer;

    const loadOrder = async () => {
      try {
        const res = await fetch(`/api/kiosk-order?order_id=${order_id}`);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load kiosk order");
        }

        if (!isMounted) {
          return;
        }

        setOrder(data.order);
        setLoading(false);

        if (data.order.status === "paid") {
          router.replace(`/success?order_id=${order_id}`);
          return;
        }

        pollTimer = setTimeout(loadOrder, 3000);
      } catch (err) {
        if (!isMounted) {
          return;
        }

        setError(err.message);
        setLoading(false);
      }
    };

    loadOrder();

    return () => {
      isMounted = false;
      clearTimeout(pollTimer);
    };
  }, [order_id, router]);

  if (loading) {
    return <div style={{ padding: 20 }}>Preparing kiosk payment...</div>;
  }

  if (error) {
    return <div style={{ padding: 20, color: "red" }}>{error}</div>;
  }

  return (
    <div className="container">
      <Head>
        <title>Pay at Kiosk</title>
      </Head>

      <div className="card">
        <BusinessName />
        <h1>Pay at Kiosk</h1>
        <p>
          Show this QR code at the kiosk. The kiosk screen will load your order
          and can mark it paid.
        </p>

        <img
          className="qr-image"
          src={`/api/kiosk-qr?order_id=${order_id}`}
          alt="Kiosk payment QR code"
        />

        <div className="order-meta">
          <div>
            <strong>Order:</strong> {order.id}
          </div>
          <div>
            <strong>Status:</strong>{" "}
            <span className="status">{order.status}</span>
          </div>
        </div>

        <ul className="items">
          {order.items.map((item) => (
            <li key={item.id}>
              <span>{item.name}</span>
              <span>x{item.qty}</span>
            </li>
          ))}
        </ul>

        <div className="summary">
          <span>Total</span>
          <strong>${Number(order.total_price).toFixed(2)}</strong>
        </div>

        <p className="polling-text">
          Waiting for kiosk payment confirmation...
        </p>
        <button className="back-btn" onClick={() => router.push("/")}>
          Back to Menu
        </button>
      </div>

      <style jsx>{`
        .container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: #f5f5f5;
        }
        .card {
          width: 100%;
          max-width: 460px;
          background: #fff;
          border-radius: 16px;
          padding: 28px;
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.08);
          text-align: center;
        }
        h1 {
          margin-top: 0;
        }
        p {
          color: #666;
          line-height: 1.5;
        }
        .qr-image {
          width: 260px;
          max-width: 100%;
          margin: 20px auto;
          display: block;
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 12px;
          background: #fff;
        }
        .order-meta {
          text-align: left;
          display: grid;
          gap: 8px;
          margin-bottom: 18px;
        }
        .status {
          text-transform: capitalize;
          color: #6f42c1;
        }
        .items {
          list-style: none;
          padding: 0;
          margin: 0;
          border-top: 1px solid #eee;
          border-bottom: 1px solid #eee;
        }
        .items li {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
        }
        .summary {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          font-size: 1.1rem;
        }
        .polling-text {
          margin-top: 20px;
          font-weight: 600;
          color: #333;
        }
        .back-btn {
          width: 100%;
          margin-top: 12px;
          padding: 12px;
          border: none;
          border-radius: 8px;
          background: #111;
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
