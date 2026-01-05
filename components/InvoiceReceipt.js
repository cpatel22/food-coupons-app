export default function InvoiceReceipt({ items }) {
  const totalQty = items.reduce((a, i) => a + i.qty, 0);
  const totalPrice = items.reduce((a, i) => a + i.qty * i.price, 0);

  return (
    <div className="invoice">
      <h2>My Restaurant</h2>
      <p className="subtitle">Official Receipt</p>
      <hr />
      <div className="items-list">
        {items.map((item) => (
          <div key={item.id} className="item-row">
            <div className="item-col name">
              {item.name} <span className="qty-x">x{item.qty}</span>
            </div>
            <div className="item-col price">${(item.price * item.qty).toFixed(2)}</div>
          </div>
        ))}
      </div>
      <hr />
      <div className="summary">
        <div className="summary-row">
          <span>Total Qty:</span>
          <span>{totalQty}</span>
        </div>
        <div className="summary-row total">
          <span>Total:</span>
          <span>${totalPrice.toFixed(2)}</span>
        </div>
      </div>
      <p className="footer">Thank you for your order!</p>

      <style jsx>{`
        .invoice {
          width: 220px;
          font-family: 'Courier New', Courier, monospace;
          padding: 10px;
          background: #fff;
          font-size: 12px;
          margin-bottom: 20px;
        }
        @media print {
          .invoice {
            width: 100%;
            border: none;
            margin: 0;
            padding: 0;
            page-break-after: avoid; /* Keep invoice together */
          }
        }
        h2 {
          text-align: center;
          margin: 5px 0;
          font-size: 16px;
          text-transform: uppercase;
        }
        .subtitle {
          text-align: center;
          font-size: 10px;
          margin-bottom: 5px;
        }
        hr {
          border: none;
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        .item-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          align-items: center;
        }
        .name {
          font-size: 16px;
          font-weight: 800;
          text-transform: uppercase;
        }
        .qty-x {
          font-weight: 900;
          font-size: 18px;
          margin-left: 8px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        .total {
          font-weight: bold;
          font-size: 14px;
          margin-top: 8px;
        }
        .footer {
          text-align: center;
          margin-top: 15px;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
