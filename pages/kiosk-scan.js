import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { playScanBeep } from "../lib/scan-beep";

export default function KioskScanPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);

  useEffect(() => {
    fetch("/api/scanner/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) return router.replace("/login");
        const userType = data.user.type || "";
        if (userType === "Admin" || userType === "Superadmin") {
          return router.replace("/admin/dashboard");
        }
        if (String(userType).startsWith("Premvati")) {
          return router.replace("/scan");
        }
        if (userType !== "Kiosk") {
          return router.replace("/login");
        }
      });
  }, [router]);

  const submit = async (event, scannedValue = value) => {
    event?.preventDefault();
    if (!scannedValue) return;
    playScanBeep();
    const res = await fetch("/api/scan-kiosk-qr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value: scannedValue }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Unable to read kiosk QR code");
    router.push(`/kiosk-pay?order_id=${data.order_id}`);
  };

  useEffect(() => {
    let stream;
    let frame;
    if (
      !cameraOn ||
      !navigator.mediaDevices?.getUserMedia ||
      !window.BarcodeDetector
    )
      return;
    let detector;
    const detect = async () => {
      try {
        if (videoRef.current?.readyState >= 2) {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            setCameraOn(false);
            playScanBeep();
            submit(null, codes[0].rawValue);
            return;
          }
        }
      } catch {
        // Keep scanning when a video frame cannot be decoded.
      }
      frame = requestAnimationFrame(detect);
    };
    const start = async () => {
      const supported = await window.BarcodeDetector.getSupportedFormats();
      if (!supported.includes("qr_code")) {
        throw new Error("This browser cannot scan QR codes.");
      }
      detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
      });
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      frame = requestAnimationFrame(detect);
    };
    start().catch((scanError) => {
      setError(scanError.message || "Camera access was not granted.");
      setCameraOn(false);
    });
    return () => {
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraOn]);

  return (
    <main>
      <Head>
        <title>Kiosk QR Scanner</title>
      </Head>
      <div className="topbar">
        <div />
        <button
          type="button"
          className="lookup-btn"
          onClick={() => router.push("/admin/orders")}
        >
          Order Lookup
        </button>
      </div>
      <h1>Scan Pay-at-Kiosk QR</h1>
      <p>Use the camera or scan/paste the customer kiosk QR code.</p>
      <button onClick={() => setCameraOn(true)} disabled={cameraOn}>
        Use Camera
      </button>
      {cameraOn ? <video ref={videoRef} muted playsInline /> : null}
      <form onSubmit={submit}>
        <input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Scan kiosk QR code"
        />
        <button>Open Payment</button>
      </form>
      {error ? <b>{error}</b> : null}
      <style jsx>{`
        main {
          max-width: 520px;
          margin: 60px auto;
          padding: 24px;
        }
        .topbar {
          display: flex;
          justify-content: flex-end;
          margin-bottom: 16px;
        }
        .lookup-btn {
          background: #111827;
          color: #fff;
          border: 0;
          border-radius: 8px;
          padding: 10px 14px;
          font-weight: 700;
          cursor: pointer;
        }
        p {
          color: #6b7280;
        }
        form {
          display: flex;
          gap: 8px;
          margin-top: 20px;
        }
        input {
          flex: 1;
          padding: 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
        }
        button {
          border: 0;
          border-radius: 8px;
          background: #111827;
          color: #fff;
          padding: 12px 16px;
          font-weight: 700;
          cursor: pointer;
        }
        video {
          width: 100%;
          margin-top: 16px;
          border-radius: 12px;
        }
        b {
          display: block;
          color: #b42318;
          margin-top: 12px;
        }
      `}</style>
    </main>
  );
}
