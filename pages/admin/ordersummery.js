import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminNav from "../../components/AdminNav";

export default function OrderSummaryPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [session, scannerSession] = await Promise.all([fetch("/api/admin/session").then((res) => res.json()), fetch("/api/scanner/session").then((res) => res.json())]);
      if (!session.authenticated && scannerSession.user?.type !== "Kiosk") return router.replace("/login");
      const res = await fetch("/api/admin/order-summary");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.error || "Failed to load order summary");
      setItems(data.items);
    }
    load().catch((err) => setError(err.message));
  }, []);

  const totalQty = items.reduce((sum, item) => sum + item.sold_qty, 0);
  const totalRevenue = items.reduce((sum, item) => sum + item.revenue, 0);
  return (
    <div className="page">
      <Head>
        <title>Order Summary</title>
      </Head>
      <main>
        <AdminNav />
        <p>Sales totals from issued coupons.</p>
        {error ? <b className="error">{error}</b> : null}
        <div className="totals">
          <div>
            <span>Items Sold</span>
            <strong>{totalQty}</strong>
          </div>
          <div>
            <span>Total Sales</span>
            <strong>${totalRevenue.toFixed(2)}</strong>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Kiosk Qty</th>
                <th>Kiosk Amount</th>
                <th>Pay Now Qty</th>
                <th>Pay Now Amount</th>
                <th>Total Qty</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.name}>
                  <td>{item.name}</td>
                  <td>{item.kiosk_qty}</td>
                  <td>${item.kiosk_revenue.toFixed(2)}</td>
                  <td>{item.pay_now_qty}</td>
                  <td>${item.pay_now_revenue.toFixed(2)}</td>
                  <td>{item.sold_qty}</td>
                  <td>${item.revenue.toFixed(2)}</td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan="7">No sales yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </main>
      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f4f4f4;
          padding: 24px;
        }
        main {
          max-width: 1200px;
          margin: auto;
          background: white;
          border-radius: 16px;
          padding: 24px;
        }
        p {
          color: #6b7280;
          margin: 20px 0;
        }
        .totals {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
          margin: 20px 0;
        }
        .totals div {
          background: #f8fafc;
          border-radius: 10px;
          padding: 16px;
        }
        .totals span {
          display: block;
          color: #6b7280;
        }
        .totals strong {
          font-size: 1.6rem;
        }
        .table-wrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          min-width: 980px;
          border-collapse: collapse;
        }
        th,
        td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f8fafc;
        }
        .error {
          color: #b42318;
        }
      `}</style>
    </div>
  );
}
