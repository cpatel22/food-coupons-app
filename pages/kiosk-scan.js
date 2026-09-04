import { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

export default function KioskScanPage() {
  const router = useRouter();
  const videoRef = useRef(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [cameraOn, setCameraOn] = useState(false);

  const submit = async (event, scannedValue = value) => {
    event?.preventDefault();
    if (!scannedValue) return;
    const res = await fetch("/api/scan-kiosk-qr", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ value: scannedValue }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Unable to read kiosk QR code");
    router.push(`/kiosk-pay?order_id=${data.order_id}`);
  };

  useEffect(() => {
    let stream; let frame;
    if (!cameraOn || !navigator.mediaDevices?.getUserMedia || !window.BarcodeDetector) return;
    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    const detect = async () => { if (videoRef.current) { const codes = await detector.detect(videoRef.current); if (codes[0]?.rawValue) { setCameraOn(false); submit(null, codes[0].rawValue); return; } } frame = requestAnimationFrame(detect); };
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } }).then((media) => { stream = media; videoRef.current.srcObject = media; videoRef.current.play(); frame = requestAnimationFrame(detect); }).catch(() => setError("Camera access was not granted."));
    return () => { cancelAnimationFrame(frame); stream?.getTracks().forEach((track) => track.stop()); };
  }, [cameraOn]);

  return <main><Head><title>Kiosk QR Scanner</title></Head><h1>Scan Pay-at-Kiosk QR</h1><p>Use the camera or scan/paste the customer kiosk QR code.</p><button onClick={() => setCameraOn(true)} disabled={cameraOn}>Use Camera</button>{cameraOn ? <video ref={videoRef} muted playsInline /> : null}<form onSubmit={submit}><input autoFocus value={value} onChange={(event) => setValue(event.target.value)} placeholder="Scan kiosk QR code" /><button>Open Payment</button></form>{error ? <b>{error}</b> : null}<style jsx>{`main{max-width:520px;margin:60px auto;padding:24px}p{color:#6b7280}form{display:flex;gap:8px;margin-top:20px}input{flex:1;padding:12px;border:1px solid #d1d5db;border-radius:8px}button{border:0;border-radius:8px;background:#111827;color:#fff;padding:12px 16px;font-weight:700;cursor:pointer}video{width:100%;margin-top:16px;border-radius:12px}b{display:block;color:#b42318;margin-top:12px}`}</style></main>;
}
