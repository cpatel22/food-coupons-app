import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminNav from "../components/AdminNav";

const emptyForm = {
  id: null,
  name: "",
  description: "",
  price: "",
  image: "",
  stock_qty: "",
  deactivate_threshold: "",
  active: true,
};

export default function AdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [stockAdjustments, setStockAdjustments] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAdminState = async () => {
    const sessionRes = await fetch("/api/admin/session");
    const sessionData = await sessionRes.json();
    setAuthenticated(sessionData.authenticated);

    if (!sessionData.authenticated) {
      router.replace("/login");
      return;
    }

    const itemsRes = await fetch("/api/menu-items?admin=true");
    const itemsData = await itemsRes.json();
    if (!itemsRes.ok) {
      throw new Error(itemsData.error || "Failed to load menu items");
    }
    setItems(itemsData.items);
  };

  useEffect(() => {
    loadAdminState()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [router]);

  const login = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setUsername("");
      setPassword("");
      await loadAdminState();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openAddDialog = () => {
    setForm(emptyForm);
    setIsEditing(false);
    setDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setForm({
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: item.price,
      image: item.image,
      stock_qty: item.stock_qty,
      deactivate_threshold: item.deactivate_threshold,
      active: item.active,
    });
    setIsEditing(true);
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setIsEditing(false);
    setForm(emptyForm);
  };

  const saveItem = async () => {
    setSaving(true);
    setError("");

    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock_qty: Number(form.stock_qty),
        deactivate_threshold: Number(form.deactivate_threshold || 0),
      };

      const res = await fetch("/api/menu-items", {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save item");
      }

      setItems((prev) =>
        isEditing
          ? prev.map((entry) => (entry.id === data.item.id ? data.item : entry))
          : [...prev, data.item],
      );
      closeDialog();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const adjustStock = async (id, delta) => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/menu-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, delta }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust stock");
      }

      setItems((prev) =>
        prev.map((entry) => (entry.id === data.item.id ? data.item : entry)),
      );
      setStockAdjustments((prev) => ({ ...prev, [id]: "" }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const applyStockAdjustment = (id) => {
    const delta = Number(stockAdjustments[id]);

    if (!Number.isInteger(delta) || delta === 0) {
      setError("Enter a whole positive or negative quantity to update stock.");
      return;
    }

    adjustStock(id, delta);
  };

  const deleteItem = async (id) => {
    if (!confirm("Delete this menu item permanently?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/menu-items", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to delete item");
      }

      setItems((prev) => prev.filter((entry) => entry.id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 24 }}>Loading admin...</div>;
  }

  if (!authenticated) {
    return <div style={{ padding: 24 }}>Redirecting to login...</div>;
  }

  return (
    <div className="page">
      <Head>
        <title>Admin</title>
      </Head>

      <div className="panel">
        {authenticated ? <AdminNav /> : null}

        <div className="header-row">
          <div>
            {router.pathname !== "/admin/product" ? <h1>Login</h1> : null}
            <p style={{ display: "none" }}>
              {router.pathname === "/admin/product"
                ? "Manage products and inventory."
                : "Manage menu items and inventory."}
            </p>
          </div>
          {authenticated ? (
            <div className="header-actions">
              <button className="primary-btn" onClick={openAddDialog}>
                + Add Item
              </button>
            </div>
          ) : null}
        </div>

        {error ? <p className="error">{error}</p> : null}

        {!authenticated ? (
          <form onSubmit={login} className="login-form">
            <label>
              Username
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username (Required)"
              />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password} placeholder="Password (Required)"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="primary-btn" disabled={saving}>
              Login
            </button>
          </form>
        ) : (
          <div className="table-wrapper">
            <table className="items-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Description</th>
                  <th>Price</th>
                  <th>Qty Adjustment</th>
                  <th>Inactive after</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className={item.active ? "" : "inactive-row"}
                  >
                    <td className="name-cell">{item.name}</td>
                    <td className="desc-cell" title={item.description}>
                      {item.description || "—"}
                    </td>
                    <td>${Number(item.price).toFixed(2)}</td>
                    <td>
                      <div className="qty-cell">
                        <span className="qty-value">{item.stock_qty}</span>
                        <input
                          className="qty-input"
                          type="number"
                          step="1"
                          value={stockAdjustments[item.id] || ""}
                          onChange={(e) =>
                            setStockAdjustments((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="+ / -"
                          disabled={saving}
                        />
                        <button
                          className="qty-btn"
                          onClick={() => applyStockAdjustment(item.id)}
                          disabled={saving}
                        >
                          Update
                        </button>
                      </div>
                    </td>
                    <td>
                      {Number(item.deactivate_threshold) > 0
                        ? item.deactivate_threshold
                        : "—"}
                    </td>
                    <td>
                      <span
                        className={`status-pill ${item.active ? "active-pill" : "inactive-pill"}`}
                      >
                        {item.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button
                          className="edit-btn"
                          onClick={() => openEditDialog(item)}
                          disabled={saving}
                        >
                          Edit
                        </button>
                        <button
                          className="danger-btn"
                          onClick={() => deleteItem(item.id)}
                          disabled={saving}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-table">
                      No menu items yet. Click "+ Add Item" to create one.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {dialogOpen ? (
        <ItemDialog
          form={form}
          isEditing={isEditing}
          saving={saving}
          onChange={setForm}
          onSave={saveItem}
          onClose={closeDialog}
        />
      ) : null}

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f4f4f4;
          padding: 24px;
        }
        .panel {
          max-width: 1200px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          padding: 24px;
        }
        .header-row,
        .header-actions,
        .row-actions,
        .qty-cell {
          display: flex;
          align-items: center;
        }
        .header-row {
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .header-actions,
        .row-actions,
        .qty-cell {
          gap: 8px;
        }
        .login-form {
          display: grid;
          gap: 14px;
          max-width: 360px;
          margin-top: 20px;
        }
        .login-form label {
          display: grid;
          gap: 6px;
          font-weight: 600;
        }
        .login-form input {
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
        .primary-btn,
        .secondary-btn,
        .edit-btn,
        .danger-btn,
        .qty-btn {
          border: none;
          border-radius: 8px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }
        .primary-btn {
          background: #111827;
          color: #fff;
        }
        .secondary-btn {
          background: #e5e7eb;
          color: #111827;
        }
        .edit-btn {
          background: #0ea5e9;
          color: #fff;
        }
        .danger-btn {
          background: #dc2626;
          color: #fff;
        }
        .qty-btn {
          background: #111827;
          color: #fff;
          padding: 8px 10px;
        }
        button:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }
        .error {
          color: #b42318;
          font-weight: 600;
        }
        .table-wrapper {
          margin-top: 20px;
          overflow-x: auto;
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          white-space: nowrap;
        }
        .items-table th,
        .items-table td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
          vertical-align: middle;
        }
        .items-table th {
          background: #f8fafc;
          color: #374151;
        }
        .inactive-row {
          background: #fef2f2;
        }
        .name-cell {
          font-weight: 700;
        }
        .desc-cell {
          max-width: 240px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .qty-value {
          min-width: 28px;
          text-align: center;
          font-weight: 700;
        }
        .qty-input {
          width: 70px;
          padding: 8px;
          border: 1px solid #d1d5db;
          border-radius: 6px;
        }
        .status-pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
        }
        .active-pill {
          background: #dcfce7;
          color: #166534;
        }
        .inactive-pill {
          background: #fee2e2;
          color: #991b1b;
        }
        .empty-table {
          padding: 32px 0;
          text-align: center;
          color: #6b7280;
        }
      `}</style>
    </div>
  );
}

function ItemDialog({ form, isEditing, saving, onChange, onSave, onClose }) {
  const set = (field) => (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    onChange((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div
      className="admin-modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="admin-modal" role="dialog" aria-modal="true">
        <div className="admin-modal-header">
          <h2>{isEditing ? "Edit Menu Item" : "Add Menu Item"}</h2>
          <button className="close-x" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="admin-modal-body">
          <div className="grid">
            <label>
              Name
              <input
                type="text"
                value={form.name}
                onChange={set("name")}
                required
              />
            </label>
            <label>
              Price
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={set("price")}
                required
              />
            </label>
            <label>
              Image URL
              <input
                type="url"
                value={form.image}
                onChange={set("image")}
                required
              />
            </label>
            <label>
              Qty (Stock)
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock_qty}
                onChange={set("stock_qty")}
                required
              />
            </label>
          </div>

          {form.image ? (
            <div className="image-preview">
              <img src={form.image} alt="Menu item preview" />
            </div>
          ) : null}

          <label>
            Description
            <textarea
              rows="3"
              value={form.description}
              onChange={set("description")}
            />
          </label>

          <label className="hint-label">
            Inactive after stock reaches
            <input
              type="number"
              min="0"
              step="1"
              value={form.deactivate_threshold}
              onChange={set("deactivate_threshold")}
              placeholder="0 = never auto-inactivate"
            />
            <span className="hint">
              Item is automatically removed from the customer menu when stock
              drops to or below this count. Use 0 to never auto-inactivate.
            </span>
          </label>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.active}
              onChange={set("active")}
            />
            Active (visible to customers)
          </label>
        </div>

        <div className="admin-modal-footer">
          <button className="secondary-btn" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="primary-btn" onClick={onSave} disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Add Item"}
          </button>
        </div>

        <style jsx global>{`
          .admin-modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(15, 23, 42, 0.55);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            z-index: 1000;
          }
          .admin-modal {
            background: #fff;
            border-radius: 14px;
            width: 100%;
            max-width: 620px;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            box-shadow: 0 24px 60px rgba(0, 0, 0, 0.25);
          }
          .admin-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 18px 22px;
            border-bottom: 1px solid #e5e7eb;
          }
          .admin-modal-header h2 {
            margin: 0;
            font-size: 1.15rem;
            color: #111827;
          }
          .close-x {
            border: none;
            background: #f3f4f6;
            width: 34px;
            height: 34px;
            border-radius: 8px;
            font-size: 1.2rem;
            cursor: pointer;
            color: #374151;
          }
          .close-x:hover {
            background: #e5e7eb;
          }
          .admin-modal-body {
            padding: 20px 22px;
            overflow-y: auto;
            display: grid;
            gap: 14px;
          }
          .admin-modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 16px 22px;
            border-top: 1px solid #e5e7eb;
          }
          .grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 14px;
          }
          label {
            display: grid;
            gap: 6px;
            font-weight: 600;
            color: #1f2937;
            font-size: 0.9rem;
          }
          input,
          textarea {
            width: 100%;
            padding: 11px 12px;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            box-sizing: border-box;
            font-weight: 400;
          }
          .checkbox-row {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          .checkbox-row input {
            width: auto;
          }
          .image-preview {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 8px;
            width: fit-content;
          }
          .image-preview img {
            width: 160px;
            height: 100px;
            object-fit: cover;
            border-radius: 5px;
            display: block;
          }
          .hint-label .hint {
            font-weight: 400;
            font-size: 0.8rem;
            color: #6b7280;
          }
          .secondary-btn {
            background: #e5e7eb;
            color: #111827;
          }
          .primary-btn {
            background: #111827;
            color: #fff;
          }
          .secondary-btn,
          .primary-btn {
            padding: 11px 18px;
            border: none;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
          }
          .secondary-btn:disabled,
          .primary-btn:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          @media (max-width: 560px) {
            .grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>
      </div>
    </div>
  );
}
