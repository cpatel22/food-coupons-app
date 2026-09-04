import { useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import BusinessName from "../components/BusinessName";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => { event.preventDefault(); setError(""); const res = await fetch("/api/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) }); const data = await res.json(); if (!res.ok) return setError(data.error); router.replace(data.destination); };
  return <main><Head><title>Login</title></Head><form onSubmit={submit}><BusinessName /><h1>Sign in</h1><label>Username<input value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error ? <p>{error}</p> : null}<button>Login</button></form><style jsx>{`main{min-height:100vh;display:grid;place-items:center;padding:24px;background:#f4f4f4}form{width:min(400px,100%);display:grid;gap:14px;padding:28px;background:#fff;border-radius:14px}h1{margin:0}label{display:grid;gap:6px;font-weight:700}input{padding:12px;border:1px solid #d1d5db;border-radius:8px;font:inherit}button{border:0;border-radius:8px;padding:12px;background:#111827;color:#fff;font-weight:700;cursor:pointer}p{margin:0;color:#b42318}`}</style></main>;
}
