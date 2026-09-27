import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import BusinessName from "./BusinessName";

export default function AdminNav() {
  const router = useRouter();
  const [type, setType] = useState(null);
  useEffect(() => {
    Promise.all([
      fetch("/api/admin/session").then((res) => res.json()),
      fetch("/api/scanner/session").then((res) => res.json()),
    ]).then(([adminSession, scannerSession]) => {
      setType(adminSession.type || scannerSession.user?.type || null);
    });
  }, []);
  const tabs = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/product", label: "Products" },
    { href: "/admin/settings", label: "Settings" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/orders", label: "Orders" },
    { href: "/admin/ordersummery", label: "Order Summary" },
    { href: "/kiosk-scan", label: "Kiosk Scanner" },
  ].filter((tab) => {
    if (type === "Kiosk") {
      return ["/admin/orders", "/admin/ordersummery", "/kiosk-scan"].includes(
        tab.href,
      );
    }
    if (tab.href === "/admin/settings") return type === "Superadmin";
    if (tab.href === "/admin/dashboard") return type !== "Kiosk";
    return true;
  });

  const logout = async () => {
    await Promise.all([
      fetch("/api/admin/logout", { method: "POST" }),
      fetch("/api/scanner/logout", { method: "POST" }),
    ]);
    router.replace("/login");
  };

  return (
    <nav className="admin-nav">
      <div className="top-row">
        <BusinessName />
        <button type="button" onClick={logout}>
          Logout
        </button>
      </div>
      <div className="tabs">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={router.pathname === tab.href ? "active" : ""}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <style jsx>{`
        .admin-nav {
          margin: 24px 0 8px;
        }
        .top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 12px;
        }
        .tabs {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .admin-nav :global(a) {
          border-radius: 8px;
          background: #eef2f7;
          color: #1f2937;
          padding: 9px 12px;
          font-weight: 700;
          text-decoration: none;
        }
        .admin-nav :global(a.active) {
          background: #111827;
          color: #fff;
        }
        button {
          border: 0;
          border-radius: 8px;
          background: #e5e7eb;
          color: #111827;
          padding: 9px 12px;
          font-weight: 700;
          cursor: pointer;
        }
        @media (max-width: 640px) {
          .top-row {
            align-items: flex-start;
          }
        }
      `}</style>
    </nav>
  );
}
