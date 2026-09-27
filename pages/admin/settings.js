import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import AdminNav from "../../components/AdminNav";

const defaults = {
  qr_group_by_item: true,
  show_menu_as_grid: true,
  email_enabled: true,
  allow_pay_now: true,
  allow_pay_at_kiosk: true,
  smtp_host: "",
  smtp_port: "587",
  smtp_user: "",
  smtp_pass: "",
  email_from: "",
  stripe_secret_key: "",
  stripe_publishable_key: "",
};

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState(defaults);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("email");

  useEffect(() => {
    const load = async () => {
      const sessionRes = await fetch("/api/admin/session");
      const session = await sessionRes.json();
      if (!session.authenticated) {
        router.replace("/login");
        return;
      }
      if (session.type !== "Superadmin") {
        router.replace("/admin/dashboard");
        return;
      }

      const settingsRes = await fetch("/api/settings?admin=true");
      const data = await settingsRes.json();
      if (!settingsRes.ok)
        throw new Error(data.error || "Failed to load settings");
      setSettings({
        ...defaults,
        ...data.settings,
        smtp_pass: data.settings.smtp_pass ? "********" : "",
        stripe_secret_key: data.settings.stripe_secret_key ? "********" : "",
      });
    };

    load().catch((loadError) => setError(loadError.message));
  }, [router]);

  const saveSettings = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");

    try {
      const payload = { ...settings };
      if (payload.smtp_pass === "********") delete payload.smtp_pass;
      if (payload.stripe_secret_key === "********")
        delete payload.stripe_secret_key;
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save settings");
      setSettings({
        ...settings,
        ...data.settings,
        smtp_pass: data.settings.smtp_pass ? "********" : "",
        stripe_secret_key: data.settings.stripe_secret_key ? "********" : "",
      });
      setStatus("Settings saved.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <Head>
        <title>Settings</title>
      </Head>
      <div className="panel">
        <AdminNav />
        <h1>Settings</h1>
        <p className="intro">
          Configure notifications, payments, coupons, and the customer menu.
        </p>
        {error ? <p className="error">{error}</p> : null}
        {status ? <p className="success">{status}</p> : null}
        <div className="tabs" role="tablist" aria-label="Settings sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "email"}
            className={activeTab === "email" ? "active" : ""}
            onClick={() => setActiveTab("email")}
          >
            Email Configuration
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "other"}
            className={activeTab === "other" ? "active" : ""}
            onClick={() => setActiveTab("other")}
          >
            Other Configuration
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "payment"}
            className={activeTab === "payment" ? "active" : ""}
            onClick={() => setActiveTab("payment")}
          >
            Payment Configuration
          </button>
        </div>
        <form onSubmit={saveSettings} className="settings-form">
          {activeTab === "email" ? (
            <>
              <h2>Email Notifications</h2>
              <label className="setting-row">
                <span>
                  <strong>Enable email notifications</strong>
                  <small>Send coupons to the customer after payment.</small>
                </span>
                <select
                  value={settings.email_enabled ? "yes" : "no"}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      email_enabled: event.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="field">
                SMTP Host
                <input
                  value={settings.smtp_host}
                  onChange={(event) =>
                    setSettings({ ...settings, smtp_host: event.target.value })
                  }
                  placeholder="smtp.example.com"
                />
              </label>
              <label className="field">
                SMTP Port
                <input
                  value={settings.smtp_port}
                  onChange={(event) =>
                    setSettings({ ...settings, smtp_port: event.target.value })
                  }
                  inputMode="numeric"
                />
              </label>
              <label className="field">
                SMTP Username
                <input
                  value={settings.smtp_user}
                  onChange={(event) =>
                    setSettings({ ...settings, smtp_user: event.target.value })
                  }
                />
              </label>
              <label className="field">
                SMTP Password
                <input
                  type="password"
                  value={settings.smtp_pass}
                  onChange={(event) =>
                    setSettings({ ...settings, smtp_pass: event.target.value })
                  }
                  placeholder="Leave unchanged to keep current password"
                />
              </label>
              <label className="field">
                Email From
                <input
                  value={settings.email_from}
                  onChange={(event) =>
                    setSettings({ ...settings, email_from: event.target.value })
                  }
                  placeholder="Business Name &lt;noreply@example.com&gt;"
                />
              </label>
            </>
          ) : activeTab === "other" ? (
            <>
              <h2>Menu and Coupons</h2>
              <label className="setting-row">
                <span>
                  <strong>Generate QR codes grouped by item</strong>
                  <small>
                    Yes creates one coupon code per menu item with its quantity.
                    No creates one per unit.
                  </small>
                </span>
                <select
                  value={settings.qr_group_by_item ? "yes" : "no"}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      qr_group_by_item: event.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="setting-row">
                <span>
                  <strong>Show menu as Grid</strong>
                  <small>
                    Yes shows menu cards in a grid. No shows one item per row.
                  </small>
                </span>
                <select
                  value={settings.show_menu_as_grid ? "yes" : "no"}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      show_menu_as_grid: event.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </>
          ) : (
            <>
              <h2>Stripe</h2>
              <label className="field">
                Stripe Secret Key
                <input
                  type="password"
                  value={settings.stripe_secret_key}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      stripe_secret_key: event.target.value,
                    })
                  }
                  placeholder="Leave unchanged to keep current key"
                />
              </label>
              <label className="field">
                Stripe Publishable Key
                <input
                  value={settings.stripe_publishable_key}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      stripe_publishable_key: event.target.value,
                    })
                  }
                />
              </label>
              <h2>Payment Options</h2>
              <label className="setting-row">
                <span>
                  <strong>Allow to collect payment (Pay Now by cards)</strong>
                  <small>
                    Allow customers to pay immediately through Stripe card
                    checkout.
                  </small>
                </span>
                <select
                  value={settings.allow_pay_now ? "yes" : "no"}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      allow_pay_now: event.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
              <label className="setting-row">
                <span>
                  <strong>Allow Pay at Kiosk (pay by cash)</strong>
                  <small>
                    Allow customers to create an order for cash payment at the
                    kiosk.
                  </small>
                </span>
                <select
                  value={settings.allow_pay_at_kiosk ? "yes" : "no"}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      allow_pay_at_kiosk: event.target.value === "yes",
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            </>
          )}
          <button className="primary-btn" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </form>
      </div>
      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          background: #f4f6f8;
        }
        .panel {
          max-width: 900px;
          margin: 0 auto;
        }
        h1 {
          margin: 28px 0 8px;
        }
        .intro {
          color: #64748b;
          margin-top: 0;
        }
        .settings-form {
          display: grid;
          gap: 14px;
          margin-top: 24px;
        }
        h2 {
          margin: 18px 0 0;
          font-size: 1.1rem;
        }
        .tabs {
          display: flex;
          gap: 8px;
          margin-top: 24px;
          border-bottom: 1px solid #dbe2ea;
        }
        .tabs button {
          padding: 11px 14px;
          border: 0;
          border-bottom: 3px solid transparent;
          background: transparent;
          color: #64748b;
          font: inherit;
          font-weight: 700;
          cursor: pointer;
        }
        .tabs button.active {
          border-bottom-color: #111827;
          color: #111827;
        }
        .field {
          display: grid;
          gap: 6px;
          font-weight: 700;
        }
        .field input {
          padding: 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font: inherit;
        }
        .setting-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 24px;
          padding: 18px;
          background: #fff;
          border: 1px solid #dbe2ea;
          border-radius: 8px;
        }
        .setting-row span {
          display: grid;
          gap: 6px;
        }
        .setting-row small {
          color: #64748b;
        }
        select {
          min-width: 90px;
          padding: 9px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          background: #fff;
        }
        .primary-btn {
          width: fit-content;
          padding: 10px 16px;
          border: 0;
          border-radius: 6px;
          background: #111827;
          color: #fff;
          font-weight: 700;
          cursor: pointer;
        }
        .primary-btn:disabled {
          opacity: 0.6;
          cursor: wait;
        }
        .error {
          color: #b42318;
        }
        .success {
          color: #087443;
        }
        @media (max-width: 600px) {
          .page {
            padding: 14px;
          }
          .setting-row {
            align-items: flex-start;
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
