export default function Cart({ items, onCheckout }) {
    const totalQty = items.reduce((a, i) => a + i.qty, 0);
    const totalPrice = items.reduce((a, i) => a + i.qty * i.price, 0);

    return (
        <div className="cart">
            <h2>Your Cart</h2>
            {items.length === 0 ? (
                <p className="empty-cart">Cart is empty</p>
            ) : (
                <>
                    <ul className="cart-items">
                        {items.map((i) => (
                            <li key={i.id} className="cart-item">
                                <span className="item-name">{i.name}</span>
                                <span className="item-details">x{i.qty} — ${(i.price * i.qty).toFixed(2)}</span>
                            </li>
                        ))}
                    </ul>
                    <hr />
                    <div className="cart-summary">
                        <p>Total Items: <span>{totalQty}</span></p>
                        <p className="total-price">Total Price: <span>${totalPrice.toFixed(2)}</span></p>
                    </div>
                    <button className="checkout-btn" onClick={onCheckout}>Checkout</button>
                </>
            )}

            <style jsx>{`
        .cart {
          margin-top: 30px;
          border: 1px solid #e0e0e0;
          padding: 20px;
          border-radius: 12px;
          background: #fafafa;
        }
        h2 {
          margin-top: 0;
          font-size: 1.5rem;
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
          padding: 8px 0;
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
          margin-top: 10px;
        }
        hr {
          border: none;
          border-top: 1px solid #ddd;
          margin: 15px 0;
        }
        .checkout-btn {
          width: 100%;
          padding: 12px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          margin-top: 10px;
          transition: background 0.2s;
        }
        .checkout-btn:hover {
          background: #218838;
        }
      `}</style>
        </div>
    );
}
