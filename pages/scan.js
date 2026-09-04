import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function Scan() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const inputRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    fetch("/api/scanner/session")
      .then((res) => res.json())
      .then((data) => { if (!data.authenticated) router.replace("/login"); else if (data.user.type === "Kiosk") router.replace("/admin/orders"); else setUser(data.user); });
  }, [router]);

  useEffect(() => {
    if (user && inputRef.current) inputRef.current.focus();
  }, [user]);

  const logout = async () => {
    await fetch("/api/scanner/logout", { method: "POST" });
    setUser(null);
    setResult(null);
  };

  const handleScan = async (event, scannedCode = code) => {
    event?.preventDefault();
    if (!scannedCode) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: scannedCode }),
      });
      setResult(await res.json());
    } catch {
      setResult({ error: "Scan failed" });
    } finally {
      setLoading(false);
      setCode("");
    }
  };

  useEffect(() => {
    let stream;
    let frame;
    let stopped = false;
    if (!cameraOn) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) {
      setResult({ error: "Camera scanning is not supported in this browser. Use the scan input instead." });
      setCameraOn(false);
      return;
    }
    const start = async () => {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      const formats = ["qr_code", "code_128"].filter((format) => supported.includes(format));
      if (!formats.length) throw new Error("This browser cannot scan QR or receipt barcodes.");
      const detector = new window.BarcodeDetector({ formats });
      const detect = async () => {
        if (stopped) return;
        try {
          if (videoRef.current?.readyState >= 2) {
            const codes = await detector.detect(videoRef.current);
            if (codes[0]?.rawValue) {
              setCameraOn(false);
              handleScan(null, codes[0].rawValue);
              return;
            }
          }
        } catch {
          // Keep scanning when one video frame cannot be decoded.
        }
        frame = requestAnimationFrame(detect);
      };
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      frame = requestAnimationFrame(detect);
    };
    start()
      .catch((error) => { setResult({ error: error.message || "Camera permission was not granted." }); setCameraOn(false); });
    return () => { stopped = true; cancelAnimationFrame(frame); stream?.getTracks().forEach((track) => track.stop()); };
  }, [cameraOn]);

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

  if (!user) {
    return <div className="redirecting">Redirecting to login...</div>;
  }

  return (
    <div className="container">
      <Head>
        <title>Scanner</title>
      </Head>
      <>
          <div className="header">
            <div>
              <h1>Order Scanner</h1>
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
          <button className="camera-btn" onClick={() => setCameraOn(true)} disabled={cameraOn || loading}>Use Mobile Camera</button>
          {cameraOn ? <video ref={videoRef} muted playsInline /> : null}
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
      <style jsx>{`
        .container {
          max-width: 520px;
          margin: auto;
          padding: 24px;
        }
        .scan-form input {
          padding: 14px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 16px;
        }
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
        .camera-btn { border: 0; border-radius: 8px; background: #374151; color: #fff; padding: 12px 16px; font-weight: 700; cursor: pointer; }
        video { width: 100%; margin-top: 16px; border-radius: 12px; background: #111827; }
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
