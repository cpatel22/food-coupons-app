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
        <div className="title-wrap">
          <h3>{item.name}</h3>
          {item.description ? (
            <p className="description">{item.description}</p>
          ) : null}
        </div>
        <p className="price">${item.price.toFixed(2)}</p>
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
          border: 1px solid #dfe4eb;
          border-radius: 16px;
          padding: 12px 12px 10px;
          background: #fff;
          box-shadow: 0 2px 6px rgba(17, 24, 39, 0.04);
          min-height: 100%;
        }
        img {
          display: block;
          border-radius: 12px;
          width: 100%;
          height: auto;
          max-height: 220px;
          aspect-ratio: 4 / 3;
          object-fit: contain;
          object-position: center;
          margin-bottom: 14px;
          background: transparent;
        }
        @media (max-width: 640px) {
          img {
            max-height: 180px;
          }
        }
        .info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          gap: 10px;
        }
        .title-wrap {
          flex: 1;
          min-width: 0;
        }
        h3 {
          margin: 0;
          font-size: 1.08rem;
          color: #111827;
          line-height: 1.3;
        }
        .description {
          margin-top: 6px;
          font-size: 0.8rem;
          color: #6b7280;
          font-weight: 400;
          line-height: 1.4;
        }
        .price {
          margin: 0;
          font-size: 1.05rem;
          font-weight: 800;
          color: #111827;
          white-space: nowrap;
        }
        .controls {
          display: flex;
          justify-content: center;
        }

        .add-btn {
          background: #f4f4f4;
          color: #111827;
          border: 1px solid #d1d5db;
          padding: 8px 18px;
          border-radius: 999px;
          font-weight: 700;
          cursor: pointer;
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
          border: 2px solid #facc15;
          border-radius: 999px;
          padding: 2px 4px;
          min-width: 118px;
          justify-content: space-between;
        }

        .stepper-btn {
          background: transparent;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          cursor: pointer;
          color: #111827;
          border-radius: 50%;
        }

        .qty-display {
          font-weight: 800;
          font-size: 1rem;
          width: 24px;
          text-align: center;
          color: #111827;
        }
      `}</style>
    </div>
  );
}
