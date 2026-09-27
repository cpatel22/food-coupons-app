import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminNav from "../../components/AdminNav";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const session = await fetch("/api/admin/session").then((res) =>
        res.json(),
      );
      if (!session.authenticated) {
        router.replace("/login");
        return;
      }

      const res = await fetch("/api/admin/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
      setItems(data.items);
    }

    load()
      .catch((loadError) => setError(loadError.message))
      .finally(() => setLoading(false));
  }, [router]);

  const totals = items.reduce(
    (acc, item) => {
      acc.total += item.total_qty;
      acc.current += item.current_qty;
      acc.sold += item.sold_qty;
      return acc;
    },
    { total: 0, current: 0, sold: 0 },
  );

  return (
    <div className="page">
      <Head>
        <title>Dashboard</title>
      </Head>
      <main>
        <AdminNav />
        <div className="heading">
          <div>
            <h1>Dashboard</h1>
            <p>Stock, remaining quantity, and sales for each menu item.</p>
          </div>
        </div>
        {error ? <p className="error">{error}</p> : null}
        {loading ? <p className="muted">Loading dashboard...</p> : null}
        {!loading && items.length ? (
          <div className="summary">
            <div>
              <span>Total Quantity</span>
              <strong>{totals.total}</strong>
            </div>
            <div>
              <span>Current Stock</span>
              <strong>{totals.current}</strong>
            </div>
            <div>
              <span>Sold</span>
              <strong>{totals.sold}</strong>
            </div>
          </div>
        ) : null}
        <div className="cards">
          {items.map((item) => (
            <article
              key={item.id}
              className={`card ${item.active ? "" : "inactive"}`}
            >
              {item.image ? (
                <img src={item.image} alt={item.name} />
              ) : (
                <div className="placeholder">{item.name.slice(0, 1)}</div>
              )}
              <div className="card-body">
                <div className="card-title">
                  <h2>{item.name}</h2>
                  <span className={item.active ? "active" : "inactive-pill"}>
                    {item.active ? "Active" : "Inactive"}
                  </span>
                </div>
                <p className="role">{item.scanner_role}</p>
                <div className="stats">
                  <div>
                    <span>Total quantity</span>
                    <strong>{item.total_qty}</strong>
                  </div>
                  <div>
                    <span>Current we have</span>
                    <strong>{item.current_qty}</strong>
                  </div>
                  <div>
                    <span>Sold</span>
                    <strong>{item.sold_qty}</strong>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
        {!loading && !items.length ? (
          <p className="muted">No menu items yet. Add products first.</p>
        ) : null}
      </main>
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          background: #f4f6f8;
        }
        main {
          max-width: 1200px;
          margin: 0 auto;
        }
        .heading {
          margin: 20px 0 8px;
        }
        h1 {
          margin: 0 0 6px;
        }
        .heading p,
        .muted,
        .role {
          color: #64748b;
        }
        .error {
          color: #b42318;
          font-weight: 700;
        }
        .summary {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
          margin: 20px 0;
        }
        .summary div {
          background: #fff;
          border-radius: 12px;
          padding: 16px 18px;
          display: grid;
          gap: 6px;
        }
        .summary span,
        .stats span {
          color: #64748b;
          font-size: 0.85rem;
          font-weight: 600;
        }
        .summary strong {
          font-size: 1.6rem;
        }
        .cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
          gap: 16px;
        }
        .card {
          background: #fff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
        }
        .card.inactive {
          opacity: 0.78;
        }
        img,
        .placeholder {
          width: 100%;
          height: 150px;
          object-fit: cover;
          display: block;
        }
        .placeholder {
          display: grid;
          place-items: center;
          background: #e2e8f0;
          color: #334155;
          font-size: 2rem;
          font-weight: 800;
        }
        .card-body {
          padding: 16px;
        }
        .card-title {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 8px;
        }
        h2 {
          margin: 0;
          font-size: 1.1rem;
        }
        .role {
          margin: 6px 0 14px;
          font-size: 0.85rem;
          font-weight: 700;
        }
        .stats {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }
        .stats div {
          background: #f8fafc;
          border-radius: 10px;
          padding: 10px 8px;
          text-align: center;
        }
        .stats strong {
          display: block;
          margin-top: 4px;
          font-size: 1.15rem;
        }
        .active,
        .inactive-pill {
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 0.75rem;
          font-weight: 700;
          white-space: nowrap;
        }
        .active {
          background: #dcfce7;
          color: #166534;
        }
        .inactive-pill {
          background: #fee2e2;
          color: #991b1b;
        }
        @media (max-width: 700px) {
          .summary,
          .stats {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
