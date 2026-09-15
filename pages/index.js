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
  const [menuView, setMenuView] = useState("grid");

  useEffect(() => {
    setCart(loadCart());
    setCartReady(true);

    const loadMenu = async () => {
      try {
        const [menuRes, settingsRes] = await Promise.all([
          fetch("/api/menu-items"),
          fetch("/api/settings"),
        ]);
        const data = await menuRes.json();
        const settingsData = await settingsRes.json();

        if (!menuRes.ok) {
          throw new Error(data.error || "Failed to load menu");
        }

        setMenu(data.items);
        if (settingsRes.ok) {
          setMenuView(settingsData.settings.show_menu_as_grid ? "grid" : "list");
        }
        setCart((prev) =>
          prev
            .flatMap((cartItem) => {
              const item = data.items.find(
                (menuItem) => menuItem.id === cartItem.id,
              );
              if (!item) return [];
              const sellableQty = Math.max(
                0,
                item.stock_qty - item.deactivate_threshold,
              );
              return cartItem.qty > sellableQty
                ? [{ ...item, qty: sellableQty }]
                : [cartItem];
            })
            .filter((cartItem) => cartItem.qty > 0),
        );
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
        const sellableQty = Math.max(
          0,
          item.stock_qty - item.deactivate_threshold,
        );
        if (sellableQty <= 0) {
          return prev;
        }
        // Add new item
        return [...prev, { ...item, qty: 1 }];
      }
      if (existing) {
        const newQty = existing.qty + delta;
        const sellableQty = Math.max(
          0,
          item.stock_qty - item.deactivate_threshold,
        );
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
          <div className="brand-block">
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
        </header>

        <main className={`menu-list ${menuView === "list" ? "list-view" : ""}`}>
          {menuError ? <p className="error-banner">{menuError}</p> : null}
          {menu.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              qty={getItemQty(item.id)}
              onUpdate={(delta) => updateQty(item, delta)}
              layout={menuView}
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
          max-width: 760px;
          margin: 0 auto;
          padding: 24px 18px 36px;
          min-height: 100vh;
          background: #e7edf5;
        }
        .header {
          margin-bottom: 18px;
          padding: 8px 12px 0;
        }
        .brand-block {
          display: flex;
          justify-content: center;
          text-align: center;
          min-width: 0;
        }
        .header-actions {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 10px;
          flex-wrap: wrap;
        }
        .orders-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 14px;
          background: transparent;
          color: #1f2937;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 700;
        }
        .orders-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: #111827;
          color: #fff;
          font-size: 0.72rem;
        }
        .cart-toggle {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          text-decoration: none;
          border: none;
          border-radius: 999px;
          background: transparent;
          color: #111827;
          padding: 8px 12px;
          cursor: pointer;
          font-weight: 700;
        }
        .cart-icon {
          font-size: 1.1rem;
          line-height: 1;
        }
        .cart-count {
          min-width: 18px;
          height: 18px;
          border-radius: 999px;
          background: #111827;
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
        }
        .menu-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 18px;
          padding: 0 4px;
        }
        .view-toggle {
          display: flex;
          justify-content: flex-end;
          gap: 4px;
          margin: 0 4px 12px;
        }
        .view-toggle button {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          background: #fff;
          color: #475569;
          padding: 7px 11px;
          cursor: pointer;
          font-size: 0.82rem;
          font-weight: 700;
        }
        .view-toggle button.active {
          border-color: #1f2937;
          background: #1f2937;
          color: #fff;
        }
        .menu-list.list-view {
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (max-width: 640px) {
          .container {
            padding-left: 12px;
            padding-right: 12px;
          }
          .header {
            padding-left: 0;
            padding-right: 0;
          }
          .header-actions {
            justify-content: right;
          }
          .orders-link,
          .cart-toggle {
            font-size: 0.95rem;
          }
          .view-toggle {
            justify-content: center;
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
