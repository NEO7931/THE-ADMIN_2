import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { authApi } from "@/lib/api";
import { BookOpen, CheckCircle, XCircle, Eye, EyeOff, ShieldCheck, RefreshCw } from "lucide-react";

// ─── Password rules ───────────────────────────────────────────────────────────
const BLOCKED_PASSWORDS = new Set([
  "password123","password1","password","123456789","12345678","1234567890",
  "qwerty123","iloveyou","admin123","letmein","welcome1","monkey123",
  "dragon123","master123","sunshine1","princess1","football1","shadow123",
  "superman1","michael1","abc123456","passw0rd","p@ssword1","p@ssw0rd",
  "qwertyuiop","123456abc","test1234","hello123","welcome123","pass1234",
]);

interface Rule { id: string; label: string; test: (pw: string, u: string) => boolean; }
const PASSWORD_RULES: Rule[] = [
  { id: "length",   label: "At least 12 characters",                     test: (pw) => pw.length >= 12 },
  { id: "upper",    label: "At least one uppercase letter (A–Z)",         test: (pw) => /[A-Z]/.test(pw) },
  { id: "lower",    label: "At least one lowercase letter (a–z)",         test: (pw) => /[a-z]/.test(pw) },
  { id: "number",   label: "At least one number (0–9)",                   test: (pw) => /[0-9]/.test(pw) },
  { id: "special",  label: "At least one special character (!@#$%^&*…)",  test: (pw) => /[!@#$%^&*()\-_=+\[\]{};':",.<>/?`~\\|]/.test(pw) },
  { id: "username", label: "Must not contain your username",              test: (pw, u) => u.length === 0 || !pw.toLowerCase().includes(u.toLowerCase()) },
  { id: "breach",   label: "Not a commonly breached password",            test: (pw) => !BLOCKED_PASSWORDS.has(pw.toLowerCase()) },
];

function strengthLabel(n: number) {
  if (n <= 2) return { label: "Very Weak",   color: "#f87171", bar: "#ef4444" };
  if (n <= 3) return { label: "Weak",        color: "#fb923c", bar: "#f97316" };
  if (n <= 5) return { label: "Fair",        color: "#fbbf24", bar: "#f59e0b" };
  if (n === 6) return { label: "Strong",     color: "#38bdf8", bar: "#0ea5e9" };
  return               { label: "Very Strong", color: "#2dd4bf", bar: "#14b8a6" };
}

function validateEmailClient(email: string): string {
  if (!email) return "";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  const blocked = new Set(["mailinator.com","guerrillamail.com","tempmail.com","yopmail.com","10minutemail.com","trashmail.com","maildrop.cc","discard.email","fakeinbox.com","throwam.com","spam4.me","discardmail.com"]);
  if (blocked.has(domain)) return "Disposable email addresses are not allowed";
  return "";
}

// ─── OTP Input Component ──────────────────────────────────────────────────────
function OTPInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (value[i]) {
        const next = [...value];
        next[i] = "";
        onChange(next);
      } else if (i > 0) {
        refs.current[i - 1]?.focus();
      }
    }
  };

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "").slice(-1);
    const next = [...value];
    next[i] = val;
    onChange(next);
    if (val && i < 5) refs.current[i + 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (paste.length > 0) {
      const next = paste.split("").concat(Array(6).fill("")).slice(0, 6);
      onChange(next);
      refs.current[Math.min(paste.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  return (
    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={el => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={handlePaste}
          style={{
            width: "48px",
            height: "60px",
            textAlign: "center",
            fontSize: "24px",
            fontWeight: 700,
            fontFamily: "'Share Tech Mono', monospace",
            background: digit ? "#38bdf80a" : "#151e2d",
            border: digit ? "1px solid #38bdf8" : "1px solid #384558",
            color: "#38bdf8",
            outline: "none",
            transition: "all 0.15s",
            boxShadow: digit ? "0 0 8px #38bdf833" : "none",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.boxShadow = "0 0 8px #38bdf844"; }}
          onBlur={e => { if (!digit) { e.currentTarget.style.borderColor = "#4a5f78"; e.currentTarget.style.boxShadow = "none"; } }}
        />
      ))}
    </div>
  );
}

// ─── OTP Verification Screen ──────────────────────────────────────────────────
function OTPScreen({ email, otpFallback, onSuccess }: { email: string; otpFallback: string | null; onSuccess: () => void }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendMsg, setResendMsg] = useState("");
  const [newFallback, setNewFallback] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(600); // 10 minutes

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const mins = Math.floor(countdown / 60).toString().padStart(2, "0");
  const secs = (countdown % 60).toString().padStart(2, "0");
  const code = otp.join("");

  const handleVerify = async () => {
    if (code.length < 6) { setError("Please enter all 6 digits"); return; }
    setError(""); setLoading(true);
    try {
      await authApi.verifyOTP(email, code);
      onSuccess();
    } catch (err: any) {
      setError(err.message ?? "Invalid code");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg(""); setError("");
    try {
      const data = await authApi.resendOTP(email);
      setResendMsg(data.message);
      setNewFallback(data.otpFallback ?? null);
      setCountdown(600);
      setOtp(["", "", "", "", "", ""]);
    } catch { setError("Could not resend. Please try again."); }
  };

  const fallback = newFallback ?? otpFallback;

  return (
    <div style={{ textAlign: "center" }}>
      {/* Icon */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div style={{ width: "56px", height: "56px", border: "1px solid #38bdf8", background: "#38bdf80a", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px #38bdf833" }}>
          <ShieldCheck style={{ width: "24px", height: "24px", color: "#38bdf8" }} />
        </div>
      </div>

      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", letterSpacing: "4px", color: "#ffffff", margin: "0 0 8px 0" }}>
        VERIFY ACCOUNT
      </h2>
      <p style={{ color: "#666", fontSize: "13px", margin: "0 0 6px 0", fontFamily: "'Rajdhani', sans-serif" }}>
        {fallback ? "Email delivery failed — use this code:" : `Code sent to`}
      </p>
      <p style={{ color: "#64748b", fontSize: "13px", fontFamily: "'Share Tech Mono', monospace", margin: "0 0 28px 0" }}>
        {fallback ? "" : email}
      </p>

      {/* Fallback OTP displayed on screen */}
      {fallback && (
        <div style={{ background: "#38bdf80a", border: "1px solid #38bdf833", padding: "16px", marginBottom: "24px" }}>
          <p style={{ color: "#888", fontSize: "10px", letterSpacing: "3px", margin: "0 0 8px 0", fontFamily: "'Share Tech Mono', monospace" }}>YOUR CODE</p>
          <p style={{ color: "#38bdf8", fontSize: "36px", fontWeight: 900, fontFamily: "'Share Tech Mono', monospace", letterSpacing: "12px", margin: 0, textShadow: "0 0 20px #38bdf866" }}>{fallback}</p>
        </div>
      )}

      {/* OTP boxes */}
      <div style={{ marginBottom: "24px" }}>
        <OTPInput value={otp} onChange={setOtp} />
      </div>

      {/* Timer */}
      {countdown > 0 ? (
        <p style={{ color: "#444", fontSize: "11px", fontFamily: "'Share Tech Mono', monospace", marginBottom: "20px", letterSpacing: "2px" }}>
          EXPIRES IN <span style={{ color: countdown < 60 ? "#38bdf8" : "#64748b" }}>{mins}:{secs}</span>
        </p>
      ) : (
        <p style={{ color: "#38bdf8", fontSize: "11px", fontFamily: "'Share Tech Mono', monospace", marginBottom: "20px" }}>
          CODE EXPIRED — REQUEST A NEW ONE
        </p>
      )}

      {error && (
        <div style={{ background: "#38bdf80a", border: "1px solid #38bdf833", padding: "10px", marginBottom: "16px", color: "#38bdf8", fontSize: "12px", fontFamily: "'Share Tech Mono', monospace" }}>
          ✗ {error}
        </div>
      )}

      {resendMsg && (
        <div style={{ background: "#00ff880a", border: "1px solid #00ff8833", padding: "10px", marginBottom: "16px", color: "#00ff88", fontSize: "12px", fontFamily: "'Share Tech Mono', monospace" }}>
          ✓ {resendMsg}
        </div>
      )}

      {/* Verify button */}
      <button
        onClick={handleVerify}
        disabled={loading || code.length < 6 || countdown === 0}
        style={{
          width: "100%", padding: "14px", marginBottom: "12px",
          background: code.length === 6 && countdown > 0 ? "#38bdf8" : "transparent",
          border: "1px solid #38bdf8",
          color: code.length === 6 && countdown > 0 ? "#fff" : "#38bdf844",
          fontFamily: "'Rajdhani', sans-serif",
          fontWeight: 700, fontSize: "14px", letterSpacing: "3px",
          cursor: code.length === 6 && countdown > 0 ? "pointer" : "not-allowed",
          transition: "all 0.2s",
          boxShadow: code.length === 6 && countdown > 0 ? "0 0 12px #38bdf833" : "none",
        }}
      >
        {loading ? "VERIFYING..." : "[ VERIFY CODE ]"}
      </button>

      {/* Resend */}
      <button
        onClick={handleResend}
        style={{
          background: "transparent", border: "none", color: "#666",
          fontFamily: "'Share Tech Mono', monospace", fontSize: "11px",
          letterSpacing: "1px", cursor: "pointer", display: "flex",
          alignItems: "center", gap: "6px", margin: "0 auto",
          transition: "color 0.2s",
        }}
        onMouseEnter={e => (e.currentTarget.style.color = "#64748b")}
        onMouseLeave={e => (e.currentTarget.style.color = "#666")}
      >
        <RefreshCw style={{ width: "10px", height: "10px" }} /> resend_code
      </button>
    </div>
  );
}

// ─── Success Screen ───────────────────────────────────────────────────────────
function SuccessScreen() {
  const [, setLocation] = useLocation();
  useEffect(() => { const t = setTimeout(() => setLocation("/login"), 3000); return () => clearTimeout(t); }, []);
  return (
    <div style={{ textAlign: "center", padding: "20px 0" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <div style={{ width: "56px", height: "56px", border: "1px solid #00ff88", background: "#00ff880a", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px #00ff8833" }}>
          <CheckCircle style={{ width: "24px", height: "24px", color: "#00ff88" }} />
        </div>
      </div>
      <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "28px", letterSpacing: "4px", color: "#00ff88", margin: "0 0 12px 0", textShadow: "0 0 12px #00ff8866" }}>
        ACCESS GRANTED
      </h2>
      <p style={{ color: "#666", fontSize: "12px", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1px" }}>
        Account verified. Redirecting to login...
      </p>
    </div>
  );
}

// ─── Main Register Component ──────────────────────────────────────────────────
export default function Register() {
  const [, setLocation] = useLocation();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  const [otpData, setOtpData] = useState<{ email: string; otpFallback: string | null } | null>(null);

  const ruleResults = useMemo(() =>
    PASSWORD_RULES.map(r => ({ ...r, passed: r.test(form.password, form.username) })),
    [form.password, form.username]
  );
  const passedCount = ruleResults.filter(r => r.passed).length;
  const allRulesPassed = passedCount === PASSWORD_RULES.length;
  const strength = strengthLabel(passedCount);
  const emailError = useMemo(() => validateEmailClient(form.email), [form.email]);
  const confirmMismatch = touched.confirm && form.confirm.length > 0 && form.password !== form.confirm;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (emailError) { setError(emailError); return; }
    if (!allRulesPassed) { setError("Please meet all password requirements."); return; }
    if (form.password !== form.confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const data = await authApi.register({ username: form.username, email: form.email, password: form.password });
      setOtpData({ email: form.email, otpFallback: data.otpFallback ?? null });
      setStep("otp");
    } catch (err: any) {
      setError(err.message ?? "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const neonInput = {
    width: "100%", padding: "10px 14px",
    background: "#151e2d", border: "1px solid #384558",
    color: "#ffffff", fontFamily: "'Rajdhani', sans-serif",
    fontSize: "14px", outline: "none", transition: "all 0.2s",
  } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100vh", background: "#141a24", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 16px" }}>
      <div style={{ width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <Link href="/">
            <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
              <div style={{ width: "32px", height: "32px", border: "1px solid #38bdf8", background: "#38bdf80a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <BookOpen style={{ width: "16px", height: "16px", color: "#38bdf8" }} />
              </div>
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: "24px", letterSpacing: "6px", color: "#38bdf8", textShadow: "0 0 12px #38bdf866" }}>LIBCORE</span>
            </div>
          </Link>
          {step === "form" && (
            <>
              <p style={{ color: "#ffffff", fontFamily: "'Rajdhani', sans-serif", fontWeight: 700, fontSize: "16px", letterSpacing: "2px", margin: "16px 0 4px 0" }}>CREATE ACCOUNT</p>
              <p style={{ color: "#444", fontSize: "11px", fontFamily: "'Share Tech Mono', monospace", margin: 0 }}>join the library system</p>
            </>
          )}
        </div>

        {/* Card */}
        <div style={{ background: "#1e2a3d", border: "1px solid #2e3a4e", padding: "32px", position: "relative" }}>
          {/* Corner accents */}
          <div style={{ position: "absolute", top: 0, left: 0, width: "12px", height: "12px", borderTop: "2px solid #38bdf8", borderLeft: "2px solid #38bdf8" }} />
          <div style={{ position: "absolute", bottom: 0, right: 0, width: "12px", height: "12px", borderBottom: "2px solid #64748b", borderRight: "2px solid #64748b" }} />

          {step === "success" && <SuccessScreen />}

          {step === "otp" && otpData && (
            <OTPScreen
              email={otpData.email}
              otpFallback={otpData.otpFallback}
              onSuccess={() => setStep("success")}
            />
          )}

          {step === "form" && (
            <>
              {error && (
                <div style={{ background: "#38bdf80a", border: "1px solid #38bdf833", padding: "10px 14px", marginBottom: "20px", color: "#38bdf8", fontSize: "12px", fontFamily: "'Share Tech Mono', monospace" }}>
                  ✗ {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {/* Username */}
                <div>
                  <label style={{ display: "block", color: "#888", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px", fontFamily: "'Share Tech Mono', monospace" }}>USERNAME</label>
                  <input type="text" required minLength={3} maxLength={32}
                    value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                    placeholder="3–32 characters"
                    style={neonInput}
                    onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.boxShadow = "0 0 8px #38bdf822"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{ display: "block", color: "#888", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px", fontFamily: "'Share Tech Mono', monospace" }}>EMAIL</label>
                  <input type="email" required value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    style={{ ...neonInput, borderColor: emailError && form.email ? "#38bdf844" : "#4a5f78" }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.boxShadow = "0 0 8px #38bdf822"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = emailError && form.email ? "#38bdf844" : "#4a5f78"; e.currentTarget.style.boxShadow = "none"; }}
                  />
                  {emailError && form.email && (
                    <p style={{ color: "#38bdf8", fontSize: "11px", margin: "4px 0 0 0", fontFamily: "'Share Tech Mono', monospace", display: "flex", alignItems: "center", gap: "4px" }}>
                      <XCircle style={{ width: "11px", height: "11px" }} /> {emailError}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label style={{ display: "block", color: "#888", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px", fontFamily: "'Share Tech Mono', monospace" }}>PASSWORD</label>
                  <div style={{ position: "relative" }}>
                    <input type={showPw ? "text" : "password"} required value={form.password}
                      onChange={e => { setForm({ ...form, password: e.target.value }); setTouched(t => ({ ...t, password: true })); }}
                      placeholder="Create a strong password"
                      style={{ ...neonInput, paddingRight: "40px" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.boxShadow = "0 0 8px #38bdf822"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = "#4a5f78"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#444", cursor: "pointer", padding: 0 }}>
                      {showPw ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                    </button>
                  </div>

                  {touched.password && form.password.length > 0 && (
                    <div style={{ marginTop: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ color: "#444", fontSize: "10px", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1px" }}>STRENGTH</span>
                        <span style={{ color: strength.color, fontSize: "10px", fontFamily: "'Share Tech Mono', monospace", letterSpacing: "1px" }}>{strength.label.toUpperCase()}</span>
                      </div>
                      <div style={{ display: "flex", gap: "3px" }}>
                        {[...Array(7)].map((_, i) => (
                          <div key={i} style={{ height: "3px", flex: 1, background: i < passedCount ? strength.bar : "#354a63", transition: "background 0.3s", boxShadow: i < passedCount ? `0 0 4px ${strength.bar}` : "none" }} />
                        ))}
                      </div>
                      <ul style={{ marginTop: "10px", padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {ruleResults.map(r => (
                          <li key={r.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", fontFamily: "'Rajdhani', sans-serif", color: r.passed ? "#00ff88" : "#444" }}>
                            {r.passed
                              ? <CheckCircle style={{ width: "11px", height: "11px", color: "#00ff88", flexShrink: 0 }} />
                              : <XCircle style={{ width: "11px", height: "11px", color: "#a8becc", flexShrink: 0 }} />
                            }
                            {r.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm */}
                <div>
                  <label style={{ display: "block", color: "#888", fontSize: "10px", letterSpacing: "2px", marginBottom: "6px", fontFamily: "'Share Tech Mono', monospace" }}>CONFIRM PASSWORD</label>
                  <div style={{ position: "relative" }}>
                    <input type={showConfirm ? "text" : "password"} required value={form.confirm}
                      onChange={e => { setForm({ ...form, confirm: e.target.value }); setTouched(t => ({ ...t, confirm: true })); }}
                      placeholder="Repeat your password"
                      style={{ ...neonInput, paddingRight: "40px", borderColor: confirmMismatch ? "#38bdf844" : "#4a5f78" }}
                      onFocus={e => { e.currentTarget.style.borderColor = "#38bdf8"; e.currentTarget.style.boxShadow = "0 0 8px #38bdf822"; }}
                      onBlur={e => { e.currentTarget.style.borderColor = confirmMismatch ? "#38bdf844" : "#4a5f78"; e.currentTarget.style.boxShadow = "none"; }}
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#444", cursor: "pointer", padding: 0 }}>
                      {showConfirm ? <EyeOff style={{ width: "14px", height: "14px" }} /> : <Eye style={{ width: "14px", height: "14px" }} />}
                    </button>
                  </div>
                  {confirmMismatch && (
                    <p style={{ color: "#38bdf8", fontSize: "11px", margin: "4px 0 0 0", fontFamily: "'Share Tech Mono', monospace" }}>✗ Passwords do not match</p>
                  )}
                  {touched.confirm && !confirmMismatch && form.confirm.length > 0 && (
                    <p style={{ color: "#00ff88", fontSize: "11px", margin: "4px 0 0 0", fontFamily: "'Share Tech Mono', monospace" }}>✓ Passwords match</p>
                  )}
                </div>

                {/* Submit */}
                <button type="submit"
                  disabled={loading || !allRulesPassed || !!emailError || form.password !== form.confirm || !form.confirm}
                  style={{
                    padding: "13px",
                    background: allRulesPassed && !emailError && form.password === form.confirm && form.confirm ? "#38bdf8" : "transparent",
                    border: "1px solid #38bdf8",
                    color: allRulesPassed && !emailError && form.password === form.confirm && form.confirm ? "#fff" : "#38bdf844",
                    fontFamily: "'Rajdhani', sans-serif",
                    fontWeight: 700, fontSize: "14px", letterSpacing: "3px",
                    cursor: allRulesPassed && !emailError && form.password === form.confirm && form.confirm ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    marginTop: "4px",
                  }}
                >
                  {loading ? "CREATING ACCOUNT..." : "[ CREATE ACCOUNT ]"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "20px", color: "#444", fontSize: "12px", fontFamily: "'Share Tech Mono', monospace" }}>
                already_registered?{" "}
                <Link href="/login" style={{ color: "#38bdf8", textDecoration: "none" }}>sign_in →</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}