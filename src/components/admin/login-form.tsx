"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("katiso");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ username, password }) });
      const result = await response.json() as { message?: string };
      if (!response.ok) throw new Error(result.message || "Unable to sign in.");
      router.replace("/admin"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to sign in."); }
    finally { setBusy(false); }
  }
  return <form className="admin-login-form" onSubmit={submit}><label>Username<input required autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Password<input required type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>{error ? <p className="inline-error">{error}</p> : null}<button className="button button-primary button-full" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <LockKeyhole size={16} />} Sign in</button></form>;
}
