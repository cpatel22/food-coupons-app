import React from "react";

export default function MenuItem({ item, qty, onUpdate }) {
  const sellableQty = Math.max(0, item.stock_qty - item.deactivate_threshold);
  const remainingQty = sellableQty - qty;
  const isSoldOut = sellableQty <= 0;
  const disableAdd = isSoldOut || remainingQty <= 0;

  return (
    <div className="menu-item">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={item.image} alt={item.name} />
      <div className="info">
        <div>
          <h3>{item.name}</h3>
          {item.description ? (
            <p className="description">{item.description}</p>
          ) : null}
        </div>
        <p>${item.price.toFixed(2)}</p>
      </div>
      <div className="controls">
        {qty === 0 ? (
          <button
            className="add-btn"
            onClick={() => onUpdate(1)}
            disabled={disableAdd}
          >
            Add
          </button>
        ) : (
          <div className="stepper">
            <button className="stepper-btn" onClick={() => onUpdate(-1)}>
              {qty === 1 ? (
                // Trash Icon
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                </svg>
              ) : (
                // Minus Icon
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              )}
            </button>

            <span className="qty-display">{qty}</span>

            <button
              className="stepper-btn"
              onClick={() => onUpdate(1)}
              disabled={disableAdd}
            >
              {/* Plus Icon */}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        .menu-item {
          display: flex;
          flex-direction: column;
          border: 1px solid #eee;
          border-radius: 12px;
          padding: 16px;
          background: #fff;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
          transition:
            transform 0.2s,
            box-shadow 0.2s;
        }
        .menu-item:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 12px rgba(0, 0, 0, 0.1);
        }
        img {
          border-radius: 8px;
          object-fit: cover;
          width: 100%;
          height: 150px;
          margin-bottom: 12px;
        }
        .info {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 12px;
        }
        h3 {
          margin: 0;
          font-size: 1.1rem;
          color: #333;
        }
        p {
          margin: 0;
          color: #666;
          font-weight: 600;
        }
        .description {
          margin-top: 6px;
          font-size: 0.9rem;
          color: #777;
          font-weight: 400;
        }
        .controls {
          display: flex;
          justify-content: flex-end; /* Align button to right or center as preferred, right looks cleaner */
        }

        .add-btn {
          background: #f4f4f4;
          color: #333;
          border: 1px solid #ccc;
          padding: 8px 20px;
          border-radius: 20px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }
        .add-btn:hover {
          background: #e0e0e0;
        }
        .add-btn:disabled,
        .stepper-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .stepper {
          display: flex;
          align-items: center;
          background: #fff;
          border: 2px solid #ffd700; /* Yellow border as requested */
          border-radius: 25px; /* Pill shape */
          padding: 2px;
          height: 40px;
          min-width: 120px;
          justify-content: space-between;
        }

        .stepper-btn {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          cursor: pointer;
          color: #000;
        }

        .qty-display {
          font-weight: bold;
          font-size: 1rem;
          width: 30px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
