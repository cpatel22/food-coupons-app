import dynamic from "next/dynamic";
import BusinessName from "./BusinessName";

const Barcode = dynamic(() => import("react-barcode"), {
  ssr: false,
  loading: () => <p>Loading Code...</p>,
});

export default function CouponReceipt({ item, showScissors }) {
  return (
    <div className="coupon-wrapper">
      <div className={`coupon ${item.is_used ? "voided" : ""}`}>
        <BusinessName />
        <p className="coupon-type">Food Coupon</p>
        <hr className="divider" />
        <div className="item">
          <span className="name">{item.name}</span>
          <span className="price">${item.price.toFixed(2)}</span>
        </div>

        <p className="qty">Qty: {item.qty}</p>

        <div className="barcode-container">
          {item.code ? (
            <div
              className="barcode-inner"
              style={{ position: "relative", display: "inline-block" }}
            >
              <Barcode
                value={item.code}
                width={1.5}
                height={40}
                fontSize={10}
                lineColor={item.is_used ? "#ff0000" : "#000000"}
              />

              {item.is_used && (
                <div
                  className="strike-line"
                  style={{
                    position: "absolute",
                    top: "40%",
                    left: "-5%",
                    width: "110%",
                    height: "8px",
                    background: "red",
                    opacity: 0.9,
                    pointerEvents: "none",
                    zIndex: 10,
                  }}
                ></div>
              )}
            </div>
          ) : (
            <p style={{ color: "red" }}>NO CODE</p>
          )}
        </div>

        {item.is_used ? (
          <div className="void-stamp" style={{ color: "blue" }}>
            VOIDED
            <br />
            <span style={{ fontSize: "10px" }}>
              {new Date(item.voided_at).toLocaleDateString()}
            </span>
            <br />
            <span style={{ fontSize: "10px" }}>
              {new Date(item.voided_at).toLocaleTimeString()}
            </span>
          </div>
        ) : null}

        <p className="footer">Enjoy your meal!</p>
      </div>

      {showScissors && (
        <div className="cut-line-container">
          <span className="scissors">✂</span>
          <div className="dashed-line"></div>
        </div>
      )}

      <style jsx>{`
        .coupon-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 220px;
          margin-bottom: 0;
        }
        .barcode-container {
          width: 100%;
          overflow: hidden;
          text-align: center;
        }
        .barcode-container :global(svg) {
          display: block;
          width: 100%;
          height: auto;
        }

        .coupon {
          position: relative;
          width: 100%;
          font-family: "Courier New", Courier, monospace;
          font-size: 12px;
          padding: 10px 5px;
          background: #fff;
          box-sizing: border-box;
        }
        .coupon.voided {
          color: red;
          border-color: red;
        }
        .coupon.voided .qty {
          border-color: red;
          color: red;
        }
        .coupon.voided .divider {
          border-top-color: red;
        }

        .void-stamp {
          position: absolute;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-15deg);
          color: red;
          border: 3px solid red;
          font-size: 20px;
          font-weight: bold;
          padding: 5px 10px;
          text-transform: uppercase;
          opacity: 0.8;
          pointer-events: none;
          background: rgba(255, 255, 255, 0.8);
          z-index: 20;
          text-align: center;
        }
        @media print {
          .coupon-wrapper {
            width: 100%;
            margin: 0;
            break-inside: avoid;
          }
          .coupon {
            border: none;
            padding: 5px 0;
          }
        }
        .item {
          display: flex;
          justify-content: space-between;
          font-weight: 900;
          font-size: 18px;
          margin: 10px 0;
          align-items: baseline;
        }
        .name {
          font-size: 22px;
          text-transform: uppercase;
        }
        .divider {
          border: none;
          border-top: 1px dashed #000;
          margin: 8px 0;
        }
        :global(.business-name) {
          text-align: center;
          margin: 5px 0;
        }
        p {
          text-align: center;
          margin: 3px 0;
        }
        .coupon-type {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .qty {
          font-weight: 900;
          font-size: 24px;
          margin: 10px auto;
          text-align: center;
          border: 3px solid #000;
          display: table; /* Centers the box */
          padding: 4px 12px;
        }
        .footer {
          margin-top: 10px;
          font-style: italic;
        }

        /* Cut Line Styles */
        .cut-line-container {
          width: 100%;
          display: flex;
          align-items: center;
          margin: 10px 0;
          overflow: hidden;
        }
        .scissors {
          font-size: 16px;
          margin-right: 5px;
          transform: rotate(
            180deg
          ); /* Point scissors right if preferred, or remove transform */
        }
        .dashed-line {
          flex: 1;
          border-top: 2px dashed #000;
        }
      `}</style>
    </div>
  );
}
