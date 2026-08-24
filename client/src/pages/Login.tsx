import { useState, type FormEvent } from "react";
import { ShieldCheck } from "lucide-react";
import { Kicker } from "@/components/workspace/Primitives";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Sign-in failed.");
      window.location.href = "/admin";
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed.");
    } finally { setBusy(false); }
  };

  return (
    <main className="adm__login">
      <form className="adm__login-panel" onSubmit={submit}>
        <ShieldCheck size={32} aria-hidden="true" color="var(--brand)" />
        <Kicker>Arabtec Employee Workspace</Kicker>
        <h1>Administrator sign in</h1>
        <p>Use the administrator credentials configured on this server.</p>
        <label className="ws-field" style={{ inlineSize: "100%", textAlign: "start" }}>
          <span>Email</span>
          <input className="ws-input" type="email" autoComplete="username" required value={email} onChange={event => setEmail(event.target.value)} />
        </label>
        <label className="ws-field" style={{ inlineSize: "100%", textAlign: "start" }}>
          <span>Password</span>
          <input className="ws-input" type="password" autoComplete="current-password" required minLength={12} value={password} onChange={event => setPassword(event.target.value)} />
        </label>
        {error && <p className="ws-field__error" role="alert">{error}</p>}
        <button className="ws-btn ws-btn--primary ws-btn--block" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
        <a className="ws-btn ws-btn--block" href="/">Return to website</a>
      </form>
    </main>
  );
}
