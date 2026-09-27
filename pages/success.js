import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import InvoiceReceipt from "../components/InvoiceReceipt";
import CouponReceipt from "../components/CouponReceipt";
import { APP_CONFIG } from "../config";
import { downloadCouponsPdf } from "../lib/download-coupons-pdf";

export default function Success() {
  const router = useRouter();
  const { order_id } = router.query;
  const printAreaRef = useRef(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [printMode, setPrintMode] = useState(APP_CONFIG.PRINT_MODE);
  const [sharing, setSharing] = useState({
    print: true,
    email: true,
    download: true,
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.settings) return;
        setPrintMode(data.settings.qr_group_by_item ? "BY_ITEM" : "BY_QTY");
        setSharing({
          print: data.settings.print_coupons_required !== false,
          email: data.settings.email_coupons_required !== false,
          download: data.settings.download_coupons_required !== false,
        });
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.removeItem("food_coupons_cart");

    if (!order_id) return;

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
        if (data.error) {
          alert("Error loading receipt: " + data.error);
          setLoading(false);
          return;
        }

        if (data.items && data.items.length > 0) {
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch((err) => {
        alert("Network error: " + err.message);
        setLoading(false);
      });
  }, [order_id]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const suffix = String(order_id || "coupons").replace(/[^\w-]+/g, "");
      await downloadCouponsPdf(
        printAreaRef.current,
        `food-coupons-${suffix}.pdf`,
      );
    } catch (error) {
      alert(error.message || "Failed to download coupons PDF");
    } finally {
      setDownloading(false);
    }
  };

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
          <div className="intro">
            <h1>Order Confirmed</h1>
            <p>Your digital coupons are ready.</p>
          </div>
        )}

        <div className="button-group">
          {sharing.print ? (
            <button
              type="button"
              className="icon-btn print-btn"
              onClick={() => window.print()}
              data-tooltip="Print Coupons"
              aria-label="Print Coupons"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
            </button>
          ) : null}
          {sharing.email ? (
            <button
              type="button"
              className="icon-btn resend-btn"
              onClick={resendEmail}
              disabled={sendingEmail}
              data-tooltip={sendingEmail ? "Sending..." : "Email Coupons"}
              aria-label={sendingEmail ? "Sending..." : "Email Coupons"}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </button>
          ) : null}
          {sharing.download ? (
            <button
              type="button"
              className="icon-btn download-btn"
              onClick={downloadPdf}
              disabled={downloading || !items.length}
              data-tooltip={
                downloading ? "Preparing PDF..." : "Download Coupons"
              }
              aria-label={
                downloading ? "Preparing PDF..." : "Download Coupons"
              }
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
          ) : null}
          <button
            type="button"
            className="icon-btn refresh-btn"
            onClick={() => window.location.reload()}
            data-tooltip="Refresh"
            aria-label="Refresh"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            type="button"
            className="icon-btn close-btn"
            onClick={() => router.push("/")}
            data-tooltip="New Order"
            aria-label="New Order"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="print-area" ref={printAreaRef}>
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
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }
        .intro {
          text-align: center;
          margin-bottom: 12px;
        }
        h1 {
          color: #1a1a1a;
          margin: 0 0 4px;
          font-size: 1.4rem;
        }
        p {
          color: #666;
          margin: 0;
          font-size: 0.95rem;
        }
        .button-group {
          display: flex;
          width: 90%;
          max-width: 90%;
          justify-content: stretch;
          flex-wrap: nowrap;
          gap: clamp(6px, 1.6vw, 10px);
          padding: clamp(6px, 1.6vw, 8px);
          box-sizing: border-box;
          background: #ffffff;
          border-radius: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          border: 1px solid #eee;
        }
        .icon-btn {
          position: relative;
          flex: 1 1 0;
          min-width: 0;
          width: auto;
          height: clamp(40px, 11vw, 52px);
          padding: 0;
          border: none;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .icon-btn svg {
          width: clamp(16px, 4.5vw, 22px);
          height: clamp(16px, 4.5vw, 22px);
        }
        .icon-btn::after {
          content: attr(data-tooltip);
          position: absolute;
          left: 50%;
          bottom: calc(100% + 10px);
          transform: translateX(-50%) translateY(4px);
          background: #111827;
          color: #fff;
          font-size: 12px;
          font-weight: 700;
          line-height: 1;
          white-space: nowrap;
          padding: 7px 9px;
          border-radius: 6px;
          opacity: 0;
          pointer-events: none;
          z-index: 5;
        }
        .icon-btn:hover::after,
        .icon-btn:focus-visible::after {
          opacity: 1;
          transform: translateX(-50%);
        }
        .print-btn {
          background: #111827;
          color: white;
        }
        .resend-btn {
          background: #2563eb;
          color: white;
        }
        .download-btn {
          background: #16a34a;
          color: white;
        }
        .refresh-btn {
          background: #d97706;
          color: white;
        }
        .close-btn {
          background: #7c3aed;
          color: white;
        }
        .resend-btn:disabled,
        .download-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }
        .print-area {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .print-area.pdf-capture {
          background: #fff;
          padding: 16px;
        }
        .print-area.pdf-capture :global(.cut-line-container) {
          display: none;
        }
      `}</style>
    </div>
  );
}
