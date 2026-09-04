import { useEffect, useState } from "react";
import Head from "next/head";
import { APP_CONFIG } from "../config";
import Link from "next/link";
import MenuItem from "../components/MenuItem";
import BusinessName from "../components/BusinessName";
import { loadCart, saveCart } from "../lib/cart-storage";

export default function Home() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [menuError, setMenuError] = useState("");
  const [cartReady, setCartReady] = useState(false);

  useEffect(() => {
    setCart(loadCart());
    setCartReady(true);

    const loadMenu = async () => {
      try {
        const res = await fetch("/api/menu-items");
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to load menu");
        }

        setMenu(data.items);
        setCart((prev) => prev.flatMap((cartItem) => {
          const item = data.items.find((menuItem) => menuItem.id === cartItem.id);
          if (!item) return [];
          const sellableQty = Math.max(0, item.stock_qty - item.deactivate_threshold);
          return cartItem.qty > sellableQty ? [{ ...item, qty: sellableQty }] : [cartItem];
        }).filter((cartItem) => cartItem.qty > 0));
      } catch (error) {
        setMenuError(error.message);
      }
    };

    loadMenu();
  }, []);

  useEffect(() => {
    if (!cartReady) {
      return;
    }

    saveCart(cart);
  }, [cart, cartReady]);

  const updateQty = (item, delta) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (!existing && delta > 0) {
        const sellableQty = Math.max(0, item.stock_qty - item.deactivate_threshold);
        if (sellableQty <= 0) {
          return prev;
        }
        // Add new item
        return [...prev, { ...item, qty: 1 }];
      }
      if (existing) {
        const newQty = existing.qty + delta;
        const sellableQty = Math.max(0, item.stock_qty - item.deactivate_threshold);
        if (delta > 0 && newQty > sellableQty) {
          return prev;
        }
        if (newQty <= 0) {
          // Remove item
          return prev.filter((i) => i.id !== item.id);
        }
        // Update quantity
        return prev.map((i) => (i.id === item.id ? { ...i, qty: newQty } : i));
      }
      return prev;
    });
  };

  const getItemQty = (id) => {
    return cart.find((i) => i.id === id)?.qty || 0;
  };

  const cartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="container">
      <Head>
        <title>{APP_CONFIG.BUSINESS_NAME}</title>
        <meta name="description" content="Order food and print coupons" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="screen-only">
        <header className="header">
          <div className="header-top">
            <div>
              <BusinessName />
            </div>
            <div className="header-actions">
              <Link className="orders-link" href="/orders">
                My Orders
              </Link>
              <Link className="cart-toggle" href="/checkout">
                <span className="cart-icon" aria-hidden="true">
                  🛒
                </span>
                <span className="cart-count">{cartQty}</span>
              </Link>
            </div>
          </div>
        </header>

        <main className="menu-list">
          {menuError ? <p className="error-banner">{menuError}</p> : null}
          {menu.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              qty={getItemQty(item.id)}
              onUpdate={(delta) => updateQty(item, delta)}
            />
          ))}
        </main>
      </div>

      <style jsx global>{`
        body {
          margin: 0;
          padding: 0;
          font-family:
            -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica,
            Arial, sans-serif;
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
          .container {
            margin: 0;
            padding: 0;
            max-width: 100%;
          }
        }
      `}</style>

      <style jsx>{`
        .container {
          max-width: ${APP_CONFIG.MENU_COLUMNS > 1 ? "800px" : "600px"};
          margin: 0 auto;
          padding: 20px;
          min-height: 100vh;
        }
        .header {
          margin-bottom: 30px;
        }
        .header-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .orders-link {
          padding: 10px 16px;
          background: #111;
          color: #fff;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 600;
        }
        .cart-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          border: none;
          border-radius: 999px;
          background: #111;
          color: #fff;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: 700;
        }
        .cart-icon {
          font-size: 1.1rem;
          line-height: 1;
        }
        .cart-count {
          min-width: 20px;
          height: 20px;
          border-radius: 999px;
          background: #fff;
          color: #111;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.85rem;
        }
        .menu-list {
          display: grid;
          grid-template-columns: ${Array(APP_CONFIG.MENU_COLUMNS)
            .fill("1fr")
            .join(" ")};
          gap: 15px;
        }
        @media (max-width: 640px) {
          .header-top {
            flex-direction: column;
            align-items: stretch;
          }
          .cart-toggle {
            align-self: flex-end;
          }
        }
        .error-banner {
          grid-column: 1 / -1;
          background: #fdecea;
          color: #b42318;
          border: 1px solid #f5c2c7;
          padding: 12px;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
