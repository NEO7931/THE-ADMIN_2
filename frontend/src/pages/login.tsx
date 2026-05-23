import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { authApi } from "@/lib/api";
import { BookOpen, Mail } from "lucide-react";

export default function Login() {
  const { setAuthUser } = useAuth();
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [resendSent, setResendSent] = useState(false);

  const neonInput = { width: "100%", padding: "11px 14px", background: "#151e2d", border: "1px solid #384558", color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", fontSize: "14px", outline: "none", transition: "all 0.2s" } as React.CSSProperties;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setUnverifiedEmail(null); setLoading(true);
    try {
      const data = await authApi.login(form);
      setAuthUser(data.user ?? data);
      setLocation("/");
    } catch (err: any) {
      if (err.code === "EMAIL_NOT_VERIFIED" || err.message?.includes("verify your")) {
        setUnverifiedEmail(err.email ?? null);
      }
      setError(err.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    try {
      await authApi.resendOTP(unverifiedEmail);
      setResendSent(true);
    } catch { setError("Could not resend. Please try again later."); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#141a24", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <Link href="/">
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div style={{ width: "32px", height: "32px", border: "1px solid #38bdf8", background: "#38bdf80a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen style={{ width: "16px", height: "16px", color: "#38bdf8" }} />
              </div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", letterSpacing: "6px", color: "#38bdf8", textShadow: "0 0 12px #38bdf866" }}>LIBCORE</span>
            </div>
          </Link>
          <p style={{ color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "2px", margin: "16px 0 4px 0" }}>SIGN IN</p>
          <p style={{ color: "#444", fontSize: "11px", fontFamily: "'Share Tech Mono', monospace", margin: 0, letterSpacing: "1px" }}>welcome back to the system</p>
        </div>

        {/* Card */}
        <div style={{ background: "#1e2a3d", border: "1px solid #2e3a4e", padding: "32px", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, left: 0, width: "12px", height: "12px", borderTop: "2px solid #38bdf8", borderLeft: "2px solid #38bdf8" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", borderBottom: "2px solid #64748b", borderRight: "2px solid #64748b" }} />

          {error && (
            <div style={{ background: "#38bdf80a", border: "1px solid #38bdf833", padding: "10px 14px", marginBottom: "16px", color: "#38bdf8", fontSize: "12px", fontFamily: "'Share Tech Mono', monospace" }}>
              ✗ {error}
            </div>
          )}

          {/* Unverified email */}
          {unverifiedEmail && !resendSent && (
            <div style={{ background: "#64748b0a", border: "1px solid #64748b33", padding: "12px 14px", marginBottom: "16px", display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <Mail style={{ width: "14px", height: "14px", color: "#64748b", flexShrink: 0, marginTop: "2px" }} />
              <div>
                <p style={{ color: "#64748b", fontSize: "11px", fontFamily: "'Share Tech Mono', monospace", margin: "0 0 4px 0", fontWeight: 700 }}>EMAIL_NOT_VERIFIED</p>
                <p style={{ color: "#888", fontSize: "11px", fontFamily: "'Rajdhani', sans-serif", margin: 0 }}>
                  Check your inbox for the OTP code.{" "}
                  <button onClick={handleResend} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", fontFamily: "'Share Tech Mono', monospace", fontSize: "11px", textDecoration: "underline", padding: 0 }}>
                    Resend code
                  </button>
                </p>
              </div>
            </div>
          )}

          {resendSent && (
            <div style={{ background: "#00ff880a", border: "1px solid #00ff8833", padding: "10px 14px", marginBottom: "16px", color: "#00ff88", fontSize: "11px", fontFamily: "'Share Tech Mono', monospace" }}>
              ✓ New OTP sent — check your email.
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div>
              <label style={{ display: "block", color: "#666", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px", fontFamily: "'Share Tech Mono', monospace" }}>USERNAME</label>
              <input type="text" required value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                placeholder="Enter your username" style={neonInput}
                onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.boxShadow = "0 0 8px #38bdf822"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; e.currentTarget.style.boxShadow = "none"; }} />
            </div>
            <div>
              <label style={{ display: "block", color: "#666", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px", fontFamily: "'Share Tech Mono', monospace" }}>PASSWORD</label>
              <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password" style={neonInput}
                onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.boxShadow = "0 0 8px #38bdf822"; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; e.currentTarget.style.boxShadow = "none"; }} />
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: "13px", background: "#38bdf8", border: "1px solid #38bdf8", color: "#fff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "14px", letterSpacing: "3px", cursor: "pointer", boxShadow: "0 0 16px #38bdf833", transition: "all 0.2s", opacity: loading ? 0.7 : 1 }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 24px #38bdf855"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 16px #38bdf833"; }}>
              {loading ? "AUTHENTICATING..." : "[ SIGN IN ]"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "20px", color: "#444", fontSize: "12px", fontFamily: "'Share Tech Mono', monospace" }}>
            no_account?{" "}
            <Link href="/register" style={{ color: "#38bdf8", textDecoration: "none" }}>register →</Link>
          </p>
        </div>
      </div>
    </div>
  );
}