import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminNav from "../../components/AdminNav";

export default function AdminOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const pageSize = 25;
  const pageCount = Math.max(Math.ceil(total / pageSize), 1);

  useEffect(() => {
    async function load() {
      const session = await fetch("/api/admin/session").then((res) =>
        res.json(),
      );
      if (!session.authenticated) return router.replace("/admin");
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        search: appliedSearch,
      });
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load orders");
      setOrders(data.orders);
      setTotal(data.total);
    }
    load().catch((err) => setError(err.message));
  }, [appliedSearch, page, router]);

  const submitSearch = (event) => {
    event.preventDefault();
    setPage(1);
    setAppliedSearch(search.trim());
  };

  return (
    <div className="page">
      <Head>
        <title>Orders</title>
      </Head>
      <main>
        <AdminNav />
        <p>Read-only list of issued orders and coupons.</p>
        <form className="search" onSubmit={submitSearch}>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search order, customer, email, phone, item..."
            aria-label="Search orders"
          />
          <button type="submit">Search</button>
        </form>
        {error ? <b className="error">{error}</b> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Order</th>
                <th>Customer</th>
                <th>Payment</th>
                <th>Items</th>
                <th>Qty</th>
                <th>Total</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.order_id}>
                  <td title={order.order_id}>
                    {order.order_id.slice(0, 12)}...
                  </td>
                  <td>
                    {order.customer}
                    <small>{order.email}</small>
                    {order.phone ? <small>{order.phone}</small> : null}
                  </td>
                  <td>{order.payment_method}</td>
                  <td>
                    {order.items
                      .map((item) => `${item.name} x${item.qty}`)
                      .join(", ")}
                  </td>
                  <td>{order.total_qty}</td>
                  <td>${order.total_price.toFixed(2)}</td>
                  <td>
                    {order.created_at
                      ? new Date(order.created_at).toLocaleString()
                      : "—"}
                  </td>
                </tr>
              ))}
              {!orders.length ? (
                <tr>
                  <td colSpan="7">No issued orders yet.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>
            {total ? `Showing ${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, total)} of ${total}` : "0 orders"}
          </span>
          <div>
            <button type="button" onClick={() => setPage(page - 1)} disabled={page === 1}>Previous</button>
            <span>Page {page} of {pageCount}</span>
            <button type="button" onClick={() => setPage(page + 1)} disabled={page === pageCount}>Next</button>
          </div>
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
        .search {
          display: flex;
          gap: 8px;
          margin: 16px 0;
        }
        .search input {
          flex: 1;
          min-width: 0;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 10px 12px;
          font: inherit;
        }
        button {
          border: 0;
          border-radius: 8px;
          background: #111827;
          color: #fff;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }
        button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }
        .table-wrap {
          overflow: auto;
          margin-top: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          min-width: 850px;
        }
        th,
        td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #e5e7eb;
          vertical-align: top;
        }
        th {
          background: #f8fafc;
        }
        small {
          display: block;
          color: #6b7280;
          margin-top: 4px;
        }
        .error {
          color: #b42318;
        }
        .pagination {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
          margin-top: 16px;
          color: #4b5563;
        }
        .pagination div {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        @media (max-width: 640px) {
          .pagination {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
