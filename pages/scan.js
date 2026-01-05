import { useState, useRef, useEffect } from 'react';
import Head from 'next/head';

export default function Scan() {
    const [code, setCode] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef(null);

    // Focus input automatically for standard scanners acting as keyboard
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus();

        const interval = setInterval(() => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                // Optional: Force focus if needed for kiosk mode
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleScan = async (e) => {
        if (e) e.preventDefault();
        if (!code) return;

        setLoading(true);
        setResult(null);

        try {
            const res = await fetch('/api/validate-coupon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            setResult(data);
        } catch (err) {
            console.error(err);
            setResult({ error: "Scan failed" });
        } finally {
            setLoading(false);
            setCode(''); // Clear for next scan
        }
    };

    const redeemCoupon = async (codeToRedeem) => {
        if (!confirm("Use this coupon?")) return;

        try {
            const res = await fetch('/api/validate-coupon', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codeToRedeem })
            });
            const data = await res.json();
            if (data.success) {
                setResult(prev => ({
                    ...prev,
                    status: 'VOIDED',
                    item: {
                        ...prev.item,
                        is_used: 1,
                        voided_at: data.voidedAt
                    },
                    message: "Coupon successfully redeemed just now."
                }));
            }
        } catch (err) {
            alert('Failed to redeem');
        }
    };

    return (
        <div className="container">
            <Head><title>Scanner</title></Head>
            <h1>Coupon Scanner</h1>

            <form onSubmit={handleScan} className="scan-form">
                <input
                    ref={inputRef}
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Scan barcode here..."
                    autoComplete="off"
                />
                <button type="submit" disabled={loading}> Check </button>
            </form>

            {result && (
                <div className={`result-card ${result.status === 'VALID' ? 'valid' : 'void'}`}>
                    {result.error ? (
                        <p className="error">{result.error}</p>
                    ) : (
                        <>
                            <h2>{result.status}</h2>
                            <div className="details">
                                <h3>{result.item.menu_item_name}</h3>
                                <p>Qty: {result.item.qty}</p>
                                <p className="code">{result.item.code}</p>
                            </div>

                            {result.status === 'VALID' && (
                                <button className="redeem-btn" onClick={() => redeemCoupon(result.item.code)}>
                                    MARK AS USED
                                </button>
                            )}

                            {result.status === 'VOIDED' && (
                                <p className="void-msg">{result.message}</p>
                            )}
                        </>
                    )}
                </div>
            )}

            <style jsx>{`
        .container {
            max-width: 480px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        .scan-form {
            display: flex;
            gap: 10px;
            margin-bottom: 30px;
        }
        input {
            flex: 1;
            padding: 15px;
            font-size: 18px;
            text-align: center;
        }
        button {
            padding: 0 20px;
            font-size: 16px;
            cursor: pointer;
        }
        .result-card {
            border: 2px solid #ccc;
            padding: 20px;
            border-radius: 12px;
            background: #fff;
        }
        .result-card.valid {
            border-color: green;
            background: #e8f5e9;
        }
        .result-card.void {
            border-color: red;
            background: #ffebee;
        }
        h2 { margin: 0 0 10px; text-transform: uppercase; }
        .details h3 { margin: 0; font-size: 1.5rem; }
        .code { font-family: monospace; color: #666; }
        .redeem-btn {
            background: green;
            color: white;
            border: none;
            padding: 15px 30px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 15px;
            width: 100%;
        }
        .void-msg {
            color: red;
            font-weight: bold;
            margin-top: 10px;
        }
      `}</style>
        </div>
    );
}
