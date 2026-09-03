import { useEffect, useState } from "react";
import Head from "next/head";

const emptyForm = {
  name: "",
  description: "",
  price: "",
  image: "",
  stock_qty: "",
  active: true,
};

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadAdminState = async () => {
    const sessionRes = await fetch("/api/admin/session");
    const sessionData = await sessionRes.json();
    setAuthenticated(sessionData.authenticated);

    if (sessionData.authenticated) {
      const itemsRes = await fetch("/api/menu-items");
      const itemsData = await itemsRes.json();
      if (!itemsRes.ok) {
        throw new Error(itemsData.error || "Failed to load menu items");
      }
      setItems(itemsData.items);
    }
  };

  useEffect(() => {
    loadAdminState()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const login = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      setPassword("");
      await loadAdminState();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setItems([]);
  };

  const createItem = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
          stock_qty: Number(form.stock_qty),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create item");
      }

      setItems((prev) => [...prev, data.item]);
      setForm(emptyForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateItem = async (item) => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/menu-items", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save item");
      }

      setItems((prev) =>
        prev.map((entry) => (entry.id === data.item.id ? data.item : entry)),
      );
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
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id) => {
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

  return (
    <div className="page">
      <Head>
        <title>Admin</title>
      </Head>

      <div className="panel">
        <div className="header-row">
          <div>
            <h1>Admin</h1>
            <p>Manage menu items and inventory.</p>
          </div>
          {authenticated ? (
            <button className="secondary-btn" onClick={logout}>
              Logout
            </button>
          ) : null}
        </div>

        {error ? <p className="error">{error}</p> : null}

        {!authenticated ? (
          <form onSubmit={login} className="login-form">
            <label>
              Admin Password
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button className="primary-btn" disabled={saving}>
              Login
            </button>
          </form>
        ) : (
          <>
            <form onSubmit={createItem} className="create-form">
              <h2>Add Menu Item</h2>
              <div className="grid">
                <label>
                  Name
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, name: e.target.value }))
                    }
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
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, price: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Image URL
                  <input
                    value={form.image}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, image: e.target.value }))
                    }
                    required
                  />
                </label>
                <label>
                  Qty
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.stock_qty}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        stock_qty: e.target.value,
                      }))
                    }
                    required
                  />
                </label>
              </div>
              <label>
                Description
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  rows="3"
                />
              </label>
              <label className="checkbox-row">
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, active: e.target.checked }))
                  }
                />
                Active
              </label>
              <button className="primary-btn" disabled={saving}>
                Add Item
              </button>
            </form>

            <div className="items-list">
              {items.map((item) => (
                <AdminItemCard
                  key={item.id}
                  item={item}
                  onSave={updateItem}
                  onAdjustStock={adjustStock}
                  onDelete={deleteItem}
                  disabled={saving}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: #f4f4f4;
          padding: 24px;
        }
        .panel {
          max-width: 960px;
          margin: 0 auto;
          background: #fff;
          border-radius: 16px;
          padding: 24px;
        }
        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 16px;
        }
        .login-form,
        .create-form {
          display: grid;
          gap: 16px;
          margin-top: 20px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 16px;
        }
        .items-list {
          display: grid;
          gap: 16px;
          margin-top: 24px;
        }
        label {
          display: grid;
          gap: 6px;
          font-weight: 600;
        }
        input,
        textarea {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-sizing: border-box;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .checkbox-row input {
          width: auto;
        }
        .primary-btn,
        .secondary-btn {
          padding: 12px 18px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: 700;
        }
        .primary-btn {
          background: #111;
          color: #fff;
        }
        .secondary-btn {
          background: #eee;
          color: #111;
        }
        .error {
          color: #b42318;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
}

function AdminItemCard({ item, onSave, onAdjustStock, onDelete, disabled }) {
  const [draft, setDraft] = useState(item);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  return (
    <div className="item-card">
      <div className="grid">
        <label>
          Name
          <input
            value={draft.name}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </label>
        <label>
          Price
          <input
            type="number"
            min="0"
            step="0.01"
            value={draft.price}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, price: Number(e.target.value) }))
            }
          />
        </label>
        <label>
          Image URL
          <input
            value={draft.image}
            onChange={(e) =>
              setDraft((prev) => ({ ...prev, image: e.target.value }))
            }
          />
        </label>
        <label>
          Qty
          <input
            type="number"
            min="0"
            step="1"
            value={draft.stock_qty}
            onChange={(e) =>
              setDraft((prev) => ({
                ...prev,
                stock_qty: Number(e.target.value),
              }))
            }
          />
        </label>
      </div>
      <label>
        Description
        <textarea
          value={draft.description || ""}
          rows="3"
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </label>
      <label className="checkbox-row">
        <input
          type="checkbox"
          checked={draft.active}
          onChange={(e) =>
            setDraft((prev) => ({ ...prev, active: e.target.checked }))
          }
        />
        Active
      </label>
      <div className="stock-row">
        <span>Remaining Qty: {draft.stock_qty}</span>
        <div className="stock-buttons">
          <button
            onClick={() => onAdjustStock(draft.id, -1)}
            disabled={disabled || draft.stock_qty <= 0}
          >
            -1
          </button>
          <button
            onClick={() => onAdjustStock(draft.id, 1)}
            disabled={disabled}
          >
            +1
          </button>
          <button
            onClick={() => onAdjustStock(draft.id, 5)}
            disabled={disabled}
          >
            +5
          </button>
        </div>
      </div>
      <div className="actions">
        <button
          className="primary-btn"
          onClick={() => onSave(draft)}
          disabled={disabled}
        >
          Save
        </button>
        <button
          className="danger-btn"
          onClick={() => onDelete(draft.id)}
          disabled={disabled}
        >
          Delete
        </button>
      </div>

      <style jsx>{`
        .item-card {
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 16px;
          background: #fafafa;
          display: grid;
          gap: 14px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 12px;
        }
        label {
          display: grid;
          gap: 6px;
          font-weight: 600;
        }
        input,
        textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 8px;
          box-sizing: border-box;
        }
        .checkbox-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .checkbox-row input {
          width: auto;
        }
        .stock-row,
        .actions,
        .stock-buttons {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .stock-row {
          justify-content: space-between;
        }
        .stock-buttons button,
        .primary-btn,
        .danger-btn {
          padding: 10px 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 700;
        }
        .stock-buttons button,
        .primary-btn {
          background: #111;
          color: #fff;
        }
        .danger-btn {
          background: #b42318;
          color: #fff;
        }
      `}</style>
    </div>
  );
}
