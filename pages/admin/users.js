import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminNav from "../../components/AdminNav";

const emptyUser = {
  id: null,
  name: "",
  username: "",
  password: "",
  type: "Kiosk",
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
    if (!res.ok) throw new Error(data.error || "Failed to load users");
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
      title="Users"
      description="Only active users can log into the QR scanner."
      onAdd={openAdd}
    >
      {error ? <p className="error">{error}</p> : null}
      <table>
        <thead>
          <tr>
            <th>Name</th>
              <th>Username</th>
              <th>Type</th>
              <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.name}</td>
              <td>{user.username}</td>
              <td>{user.type || "Kiosk"}</td>
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
              <td colSpan="5">No users added.</td>
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
    <div className="user-modal-overlay" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="user-modal" role="dialog" aria-modal="true" aria-label="Scanner user form">
        <div className="user-modal-header">
          <h2>{form.id ? "Edit Scanner User" : "Add Scanner User"}</h2>
          <button className="close-x" onClick={onClose} aria-label="Close">×</button>
        </div>
        <div className="user-modal-body">
          <label>Name<input value={form.name} onChange={set("name")} /></label>
          <label>Username<input value={form.username} onChange={set("username")} /></label>
          <label>Type<select value={form.type} onChange={set("type")}><option value="Admin">Admin</option><option value="Kiosk">Kiosk</option><option value="Premvati">Premvati</option></select></label>
          <label>{form.id ? "New Password (leave blank to keep)" : "Password"}<input type="password" value={form.password} onChange={set("password")} /></label>
          <label className="checkbox-row"><input type="checkbox" checked={form.active} onChange={set("active")} />Active</label>
        </div>
        <div className="user-modal-footer">
          <button className="secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="primary" disabled={saving} onClick={onSave}>{saving ? "Saving..." : form.id ? "Save Changes" : "Add User"}</button>
        </div>
        <style jsx global>{`
          .user-modal-overlay { position: fixed !important; inset: 0 !important; z-index: 1000; display: grid !important; place-items: center !important; padding: 20px; background: rgba(15, 23, 42, .55); }
          .user-modal { width: 100%; max-width: 480px; max-height: 90vh; display: flex; flex-direction: column; overflow: hidden; border-radius: 14px; background: #fff; box-shadow: 0 24px 60px rgba(0, 0, 0, .25); }
          .user-modal-header, .user-modal-footer { display: flex; align-items: center; justify-content: space-between; padding: 18px 22px; }
          .user-modal-header { border-bottom: 1px solid #e5e7eb; }
          .user-modal-header h2 { margin: 0; color: #111827; font-size: 1.15rem; }
          .close-x { width: 34px; height: 34px; border: 0; border-radius: 8px; background: #f3f4f6; color: #374151; font-size: 1.2rem; cursor: pointer; }
          .user-modal-body { display: grid; gap: 14px; overflow-y: auto; padding: 20px 22px; }
          .user-modal-body label { display: grid; gap: 6px; color: #1f2937; font-size: .9rem; font-weight: 600; }
          .user-modal-body input, .user-modal-body select { width: 100%; box-sizing: border-box; padding: 11px 12px; border: 1px solid #d1d5db; border-radius: 8px; font: inherit; }
          .user-modal-body .checkbox-row { display: flex; align-items: center; gap: 8px; }
          .user-modal-body .checkbox-row input { width: auto; }
          .user-modal-footer { justify-content: flex-end; gap: 10px; border-top: 1px solid #e5e7eb; }
          .user-modal-footer button { border: 0; border-radius: 8px; padding: 10px 14px; font-weight: 700; cursor: pointer; }
          .secondary { background: #e5e7eb; color: #111827; }
          .primary { background: #111827; color: #fff; }
          button:disabled { cursor: not-allowed; opacity: .55; }
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
          max-width: 1200px;
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
