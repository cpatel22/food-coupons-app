export default function Cart({
  items,
  onPayNow,
  onPayAtKiosk,
  loadingMode,
  title = "Your Cart",
  compact = false,
  showActions = true,
}) {
  const totalQty = items.reduce((a, i) => a + i.qty, 0);
  const totalPrice = items.reduce((a, i) => a + i.qty * i.price, 0);
  const isPayNowLoading = loadingMode === "pay-now";
  const isKioskLoading = loadingMode === "kiosk";
  const isAnyLoading = Boolean(loadingMode);

  return (
    <div className="cart">
      {title ? <h2>{title}</h2> : null}
      {items.length === 0 ? (
        <p className="empty-cart">Cart is empty</p>
      ) : (
        <>
          <ul className="cart-items">
            {items.map((i) => (
              <li key={i.id} className="cart-item">
                <span className="item-name">{i.name}</span>
                <span className="item-details">
                  x{i.qty} — ${(i.price * i.qty).toFixed(2)}
                </span>
              </li>
            ))}
          </ul>
          <hr />
          <div className="cart-summary">
            <p>
              Total Items: <span>{totalQty}</span>
            </p>
            <p className="total-price">
              Total Price: <span>${totalPrice.toFixed(2)}</span>
            </p>
          </div>
          {showActions ? (
            <div className="action-buttons">
              <button
                className="kiosk-btn"
                onClick={onPayAtKiosk}
                disabled={isAnyLoading}
              >
                {isKioskLoading ? "Preparing QR..." : "Pay at Kiosk"}
              </button>
              <button
                className="checkout-btn"
                onClick={onPayNow}
                disabled={isAnyLoading}
              >
                {isPayNowLoading ? "Redirecting..." : "Pay Now"}
              </button>
            </div>
          ) : null}
        </>
      )}

      <style jsx>{`
        .cart {
          border: 1px solid #e0e0e0;
          padding: ${compact ? "16px" : "20px"};
          border-radius: 12px;
          background: #fff;
          box-shadow: ${compact ? "none" : "0 8px 20px rgba(0,0,0,0.04)"};
        }
        h2 {
          margin-top: 0;
          margin-bottom: 14px;
          font-size: 1.25rem;
          color: #333;
        }
        .empty-cart {
          color: #888;
          font-style: italic;
        }
        .cart-items {
          list-style: none;
          padding: 0;
          margin: 0 0 15px 0;
        }
        .cart-item {
          display: flex;
          justify-content: space-between;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .item-name {
          font-weight: 500;
        }
        .cart-summary p {
          display: flex;
          justify-content: space-between;
          margin: 5px 0;
          color: #555;
        }
        .total-price {
          font-weight: bold;
          font-size: 1.1rem;
          color: #000;
          margin-top: 6px;
        }
        hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 15px 0;
        }
        .action-buttons {
          display: grid;
          gap: 10px;
          margin-top: 10px;
        }
        .kiosk-btn,
        .checkout-btn {
          width: 100%;
          padding: 12px;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s;
        }
        .kiosk-btn {
          background: #6f42c1;
        }
        .kiosk-btn:hover {
          background: #5b33a6;
        }
        .checkout-btn {
          background: #28a745;
        }
        .checkout-btn:hover {
          background: #218838;
        }
        .kiosk-btn:disabled,
        .checkout-btn:disabled {
          background: #b8b8b8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
