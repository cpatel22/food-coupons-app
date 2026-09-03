import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import InvoiceReceipt from "../components/InvoiceReceipt";
import CouponReceipt from "../components/CouponReceipt";
import { APP_CONFIG } from "../config";

export default function Success() {
  const router = useRouter();
  const { order_id } = router.query;
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const printMode = APP_CONFIG.PRINT_MODE;

  useEffect(() => {
    if (order_id) {
      // Check if this session has been seen before
      const seenSessions = JSON.parse(
        localStorage.getItem("seen_receipt_sessions") || "{}",
      );
      if (!seenSessions[order_id]) {
        setIsFirstVisit(true);
        seenSessions[order_id] = true;
        localStorage.setItem(
          "seen_receipt_sessions",
          JSON.stringify(seenSessions),
        );
      }

      fetch(`/api/retrieve-session?order_id=${order_id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Receipt Data:", data);

          if (data.error) {
            alert("Error loading receipt: " + data.error);
            setLoading(false);
            return;
          }

          if (data.items && data.items.length > 0) {
            setItems(data.items);
            // Auto print removed
          } else {
            console.warn("No items returned from API");
          }
          setLoading(false);
        })
        .catch((err) => {
          alert("Network error: " + err.message);
          setLoading(false);
        });
    }
  }, [order_id]);

  if (loading) return <div style={{ padding: 20 }}>Loading receipt...</div>;

  const resendEmail = async () => {
    if (!order_id) return;
    setSendingEmail(true);
    try {
      const res = await fetch("/api/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id }),
      });
      const data = await res.json();
      if (data.error) alert(data.error);
      else alert("Email sent successfully!");
    } catch (err) {
      alert("Failed to send email: " + err.message);
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Order Success</title>
      </Head>

      <div className="screen-only receipt-controls">
        {isFirstVisit && (
          <>
            <h1>Order Confirmed</h1>
            <p>Your digital coupons are ready.</p>
          </>
        )}

        <div className="button-group">
          <button className="print-btn" onClick={() => window.print()}>
            Print Coupons
          </button>
          <button
            className="resend-btn"
            onClick={resendEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? "Sending..." : "Email Coupons"}
          </button>
          <button className="close-btn" onClick={() => router.push("/")}>
            New Order
          </button>
        </div>
      </div>

      <div className="print-area">
        {printMode === "ALL_IN_ONE" && <InvoiceReceipt items={items} />}

        {printMode === "BY_ITEM" &&
          items.map((item) => (
            <CouponReceipt key={item.id} item={item} showScissors={true} />
          ))}

        {printMode === "BY_QTY" &&
          items.flatMap((item) =>
            Array.from({ length: item.qty }).map((_, idx) => (
              <CouponReceipt
                key={`${item.id}-${idx}`}
                item={{ ...item, qty: 1 }}
                showScissors={true}
              />
            )),
          )}
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
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
        }
      `}</style>
      <style jsx>{`
        .container {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .receipt-controls {
          text-align: center;
          background: #ffffff;
          padding: 40px;
          border-radius: 12px;
          margin-bottom: 30px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #eee;
        }
        h1 {
          color: #1a1a1a;
          margin-top: 0;
          font-size: 2rem;
        }
        p {
          color: #666;
          margin-bottom: 25px;
          font-size: 1.1rem;
        }
        .button-group {
          display: flex;
          justify-content: center;
          gap: 15px;
        }
        .mode-selector {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin: 20px auto;
          text-align: left;
          background: #fff;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #ddd;
          max-width: 300px;
        }
        .mode-selector label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        .print-btn {
          padding: 12px 28px;
          background: #000;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.2s,
            background 0.2s;
        }
        .print-btn:hover {
          background: #333;
          transform: translateY(-1px);
        }
        .resend-btn {
          padding: 12px 28px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.2s,
            background 0.2s;
        }
        .resend-btn:hover {
          background: #005bc1;
          transform: translateY(-1px);
        }
        .resend-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .close-btn {
          padding: 12px 28px;
          background: #f0f0f0;
          color: #1a1a1a;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition:
            transform 0.2s,
            background 0.2s;
        }
        .close-btn:hover {
          background: #e5e5e5;
          transform: translateY(-1px);
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
