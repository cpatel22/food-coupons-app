import { useEffect, useRef, useState } from "react";
import Head from "next/head";

export default function Scan() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetch("/api/scanner/session")
      .then((res) => res.json())
      .then((data) => setUser(data.authenticated ? data.user : null));
  }, []);

  useEffect(() => {
    if (user && inputRef.current) inputRef.current.focus();
  }, [user]);

  const login = async (event) => {
    event.preventDefault();
    setLoginError("");
    const res = await fetch("/api/scanner/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) return setLoginError(data.error || "Login failed");
    setUser(data.user);
    setPassword("");
  };

  const logout = async () => {
    await fetch("/api/scanner/logout", { method: "POST" });
    setUser(null);
    setResult(null);
  };

  const handleScan = async (event) => {
    event?.preventDefault();
    if (!code) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "Scan failed" });
    } finally {
      setLoading(false);
      setCode("");
    }
  };

  const redeemCoupon = async () => {
    if (!result?.item || !confirm("Use this coupon?")) return;
    const res = await fetch("/api/validate-coupon", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: result.item.code }),
    });
    const data = await res.json();
    if (!res.ok) return setResult({ error: data.error || "Failed to redeem" });
    setResult((prev) => ({
      ...prev,
      status: "VOIDED",
      item: { ...prev.item, is_used: true, voided_at: data.voidedAt },
      message: "Coupon successfully redeemed.",
    }));
  };

  return (
    <div className="container">
      <Head>
        <title>Scanner</title>
      </Head>
      {!user ? (
        <form className="login" onSubmit={login}>
          <h1>Scanner Login</h1>
          <label>
            Username
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {loginError ? <p className="error">{loginError}</p> : null}
          <button>Login</button>
        </form>
      ) : (
        <>
          <div className="header">
            <div>
              <h1>Coupon Scanner</h1>
              <p>Signed in as {user.name}</p>
            </div>
            <button onClick={logout}>Logout</button>
          </div>
          <form onSubmit={handleScan} className="scan-form">
            <input
              ref={inputRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Scan barcode here..."
              autoComplete="off"
            />
            <button disabled={loading}>
              {loading ? "Checking..." : "Check"}
            </button>
          </form>
          {result ? (
            <div
              className={`result-card ${result.status === "VALID" ? "valid" : "void"}`}
            >
              {result.error ? (
                <p className="error">{result.error}</p>
              ) : (
                <>
                  <h2>{result.status}</h2>
                  <h3>{result.item.menu_item_name}</h3>
                  <p>Qty: {result.item.qty}</p>
                  <p className="code">{result.item.code}</p>
                  {result.status === "VALID" ? (
                    <button className="redeem" onClick={redeemCoupon}>
                      MARK AS USED
                    </button>
                  ) : (
                    <p>{result.message}</p>
                  )}
                </>
              )}
            </div>
          ) : null}
        </>
      )}
      <style jsx>{`
        .container {
          max-width: 520px;
          margin: auto;
          padding: 24px;
        }
        .login {
          display: grid;
          gap: 14px;
          margin-top: 80px;
        }
        .login label {
          display: grid;
          gap: 6px;
          font-weight: 700;
        }
        .login input,
        .scan-form input {
          padding: 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
        }
        .login button,
        .header button,
        .scan-form button {
          border: 0;
          border-radius: 8px;
          background: #111827;
          color: #fff;
          padding: 12px 16px;
          font-weight: 700;
          cursor: pointer;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .header p {
          color: #6b7280;
        }
        .scan-form {
          display: flex;
          gap: 10px;
          margin: 24px 0;
        }
        .scan-form input {
          flex: 1;
        }
        .result-card {
          padding: 20px;
          border: 2px solid #ccc;
          border-radius: 12px;
          text-align: center;
        }
        .valid {
          background: #ecfdf5;
          border-color: #16a34a;
        }
        .void {
          background: #fef2f2;
          border-color: #dc2626;
        }
        .redeem {
          background: #15803d;
          color: #fff;
          border: 0;
          border-radius: 8px;
          padding: 14px 20px;
          font-weight: 700;
          cursor: pointer;
          width: 100%;
        }
        .code {
          font-family: monospace;
        }
        .error {
          color: #b42318;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
