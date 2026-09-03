import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminNav from "../../components/AdminNav";

const emptyUser = {
  id: null,
  name: "",
  username: "",
  password: "",
  active: true,
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyUser);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadUsers = async () => {
    const session = await fetch("/api/admin/session").then((res) => res.json());
    if (!session.authenticated) {
      router.replace("/admin");
      return;
    }

    const res = await fetch("/api/admin/scanner-users");
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to load scanner users");
    setUsers(data.users);
  };

  useEffect(() => {
    loadUsers()
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const openAdd = () => {
    setForm(emptyUser);
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setForm({ ...user, password: "" });
    setDialogOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/scanner-users", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save scanner user");
      setUsers((prev) =>
        form.id
          ? prev.map((user) => (user.id === data.user.id ? data.user : user))
          : [...prev, data.user],
      );
      setDialogOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this scanner user?")) return;
    const res = await fetch("/api/admin/scanner-users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed to delete scanner user");
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  if (loading) return <div style={{ padding: 24 }}>Loading users...</div>;

  return (
    <AdminFrame
      title="Scanner Users"
      description="Only active users can log into the QR scanner."
      onAdd={openAdd}
    >
      {error ? <p className="error">{error}</p> : null}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Username</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>
                <span className={user.active ? "active" : "inactive"}>
                  {user.active ? "Active" : "Inactive"}
                </span>
              </td>
              <td>
                <button onClick={() => openEdit(user)}>Edit</button>
                <button className="delete" onClick={() => remove(user.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {!users.length ? (
            <tr>
              <td colSpan="4">No scanner users added.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
      {dialogOpen ? (
        <UserDialog
          form={form}
          saving={saving}
          onChange={setForm}
          onClose={() => setDialogOpen(false)}
          onSave={save}
        />
      ) : null}
    </AdminFrame>
  );
}

function UserDialog({ form, saving, onChange, onClose, onSave }) {
  const set = (field) => (event) =>
    onChange((prev) => ({
      ...prev,
      [field]:
        event.target.type === "checkbox"
          ? event.target.checked
          : event.target.value,
    }));
  return (
    <div className="overlay">
      <div className="dialog">
        <h2>{form.id ? "Edit Scanner User" : "Add Scanner User"}</h2>
        <label>
          Name
          <input value={form.name} onChange={set("name")} />
        </label>
        <label>
          Username
          <input value={form.username} onChange={set("username")} />
        </label>
        <label>
          {form.id ? "New Password (leave blank to keep)" : "Password"}
          <input
            type="password"
            value={form.password}
            onChange={set("password")}
          />
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={form.active}
            onChange={set("active")}
          />
          Active
        </label>
        <div className="actions">
          <button onClick={onClose}>Cancel</button>
          <button className="dark" disabled={saving} onClick={onSave}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
        <style jsx>{`
          .overlay {
            position: fixed;
            inset: 0;
            background: #0008;
            display: grid;
            place-items: center;
            padding: 20px;
            z-index: 1000;
          }
          .dialog {
            width: min(460px, 100%);
            background: #fff;
            padding: 24px;
            border-radius: 14px;
            display: grid;
            gap: 14px;
          }
          .dialog h2 {
            margin: 0;
          }
          .dialog label {
            display: grid;
            gap: 6px;
            font-weight: 700;
          }
          .dialog input {
            padding: 10px;
            border: 1px solid #d1d5db;
            border-radius: 7px;
          }
          .dialog .check {
            display: flex;
            align-items: center;
          }
          .actions {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
          }
          .actions button {
            border: 0;
            border-radius: 7px;
            padding: 10px 14px;
            font-weight: 700;
            cursor: pointer;
          }
          .dark {
            background: #111827;
            color: white;
          }
        `}</style>
      </div>
    </div>
  );
}

function AdminFrame({ title, description, onAdd, children }) {
  return (
    <div className="scanner-users-page">
      <Head>
        <title>{title}</title>
      </Head>
      <main className="scanner-users-main">
        <AdminNav />
        <div className="scanner-users-heading">
          <p>{description}</p>
          {onAdd ? (
            <button className="add" onClick={onAdd}>
              + Add User
            </button>
          ) : null}
        </div>
        {children}
      </main>
      <style jsx global>{`
        .scanner-users-page {
          min-height: 100vh;
          background: #f4f4f4;
          padding: 24px;
        }
        .scanner-users-main {
          max-width: 1100px;
          margin: auto;
          background: white;
          border-radius: 16px;
          padding: 24px;
        }
        .scanner-users-heading {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: center;
          margin: 20px 0;
        }
        .scanner-users-heading p {
          color: #6b7280;
        }
        .scanner-users-main .add,
        .scanner-users-main button {
          border: 0;
          border-radius: 7px;
          padding: 9px 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .scanner-users-main .add {
          background: #111827;
          color: #fff;
        }
        .scanner-users-main table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .scanner-users-main th,
        .scanner-users-main td {
          text-align: left;
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        .scanner-users-main th {
          background: #f8fafc;
        }
        .scanner-users-main td button {
          background: #0ea5e9;
          color: white;
          margin-right: 8px;
        }
        .scanner-users-main td .delete {
          background: #dc2626;
        }
        .scanner-users-main .active,
        .scanner-users-main .inactive {
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 700;
        }
        .scanner-users-main .active {
          background: #dcfce7;
          color: #166534;
        }
        .scanner-users-main .inactive {
          background: #fee2e2;
          color: #991b1b;
        }
        .scanner-users-main .error {
          color: #b42318;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
