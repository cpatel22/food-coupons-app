export default function Cart({
  items,
  onPayNow,
  onPayAtKiosk,
  onUpdateQty,
  onRemoveItem,
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
                <div className="item-info">
                  <span className="item-name">{i.name}</span>
                  <span className="item-details">
                    ${i.price.toFixed(2)} each
                  </span>
                </div>
                <div className="item-actions">
                  {onUpdateQty ? (
                    <div className="quantity-controls">
                      <button
                        type="button"
                        onClick={() => onUpdateQty(i.id, -1)}
                        aria-label={`Decrease ${i.name} quantity`}
                      >
                        -
                      </button>
                      <span>{i.qty}</span>
                      <button
                        type="button"
                        onClick={() => onUpdateQty(i.id, 1)}
                        aria-label={`Increase ${i.name} quantity`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className="item-details">x{i.qty}</span>
                  )}
                  {onRemoveItem ? (
                    <button
                      type="button"
                      className="remove-button"
                      onClick={() => onRemoveItem(i.id)}
                      aria-label={`Remove ${i.name}`}
                    >
                      Delete
                    </button>
                  ) : null}
                  <span className="line-total">
                    ${(i.price * i.qty).toFixed(2)}
                  </span>
                </div>
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
          align-items: center;
          gap: 16px;
          padding: 10px 0;
          border-bottom: 1px solid #eee;
        }
        .item-info {
          display: grid;
          gap: 4px;
          min-width: 0;
        }
        .item-name {
          font-weight: 500;
        }
        .item-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
        }
        .item-details {
          color: #777;
          font-size: 0.9rem;
        }
        .quantity-controls {
          display: inline-flex;
          align-items: center;
          border: 1px solid #d0d7e2;
          border-radius: 999px;
          overflow: hidden;
        }
        .quantity-controls button,
        .remove-button {
          border: 0;
          cursor: pointer;
          font-weight: 700;
        }
        .quantity-controls button {
          width: 30px;
          height: 28px;
          background: #f5f7fa;
          color: #1f2f46;
          font-size: 1rem;
        }
        .quantity-controls span {
          min-width: 26px;
          text-align: center;
          font-weight: 700;
        }
        .remove-button {
          padding: 5px 8px;
          background: transparent;
          color: #b42318;
        }
        .line-total {
          min-width: 64px;
          text-align: right;
          font-weight: 700;
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
        @media (max-width: 560px) {
          .cart-item {
            align-items: flex-start;
            flex-direction: column;
            gap: 8px;
          }
          .item-actions {
            width: 100%;
            justify-content: space-between;
          }
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
