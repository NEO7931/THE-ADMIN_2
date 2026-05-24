import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "../db.js";
import { RegisterBody, LoginBody, validatePassword } from "../schemas.js";

const router: IRouter = Router();

// ─── Generate 6-digit OTP ─────────────────────────────────────────────────────
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// ─── Send OTP via Resend ──────────────────────────────────────────────────────
async function sendOTPEmail(email: string, username: string, otp: string): Promise<boolean> {
  const resendApiKey = process.env["RESEND_API_KEY"];
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY not set — OTP will be shown on screen as fallback");
    return false;
  }

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#0a0a0a;">
      <div style="text-align:center;margin-bottom:32px;">
        <h1 style="font-size:28px;font-weight:700;color:#ff2d2d;margin:0;letter-spacing:6px;font-family:'Arial Black',sans-serif;">LIBCORE</h1>
        <p style="color:#666;margin-top:4px;font-size:11px;letter-spacing:3px;">LIBRARY MANAGEMENT SYSTEM</p>
      </div>
      <div style="background:#111;border:1px solid #ff2d2d33;padding:32px;">
        <h2 style="font-size:16px;font-weight:600;color:#f0f0f0;margin:0 0 8px 0;letter-spacing:2px;text-transform:uppercase;">Verify Your Account</h2>
        <p style="color:#888;margin:0 0 28px 0;font-size:13px;">
          Hi <strong style="color:#f0f0f0;">${username}</strong>, enter this 6-digit code to activate your account.
        </p>

        <!-- OTP Code Box -->
        <div style="background:#0d0d0d;border:1px solid #ff2d2d44;padding:28px;text-align:center;margin-bottom:24px;">
          <p style="color:#666;font-size:10px;letter-spacing:3px;margin:0 0 12px 0;text-transform:uppercase;">Your verification code</p>
          <div style="font-size:48px;font-weight:900;color:#ff2d2d;letter-spacing:16px;font-family:'Arial Black',monospace;text-shadow:0 0 20px #ff2d2d66;">
            ${otp}
          </div>
          <p style="color:#444;font-size:11px;margin:12px 0 0 0;letter-spacing:1px;">Expires in <strong style="color:#ff8c00;">10 minutes</strong></p>
        </div>

        <p style="color:#555;font-size:11px;margin:0;text-align:center;">
          If you did not create a LIBCORE account, ignore this email.
        </p>
      </div>
      <p style="color:#333;font-size:10px;text-align:center;margin-top:20px;letter-spacing:2px;">
        LIBCORE // INSTITUTIONAL LIBRARY SYSTEM
      </p>
    </div>
  `;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: process.env["RESEND_FROM_EMAIL"] ?? "LIBCORE <onboarding@resend.dev>",
        to: email,
        subject: `${otp} — Your LIBCORE verification code`,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error("Resend error:", err);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Email send failed:", err);
    return false;
  }
}

// ─── Register ─────────────────────────────────────────────────────────────────
router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? "Invalid input";
    res.status(400).json({ error: firstError });
    return;
  }

  const { username, email, password } = parsed.data;

  const pwErrors = validatePassword(password, username);
  if (pwErrors.length > 0) {
    res.status(400).json({ error: pwErrors[0] });
    return;
  }

  const [existingUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const [existingEmail] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existingEmail) {
    res.status(409).json({ error: "An account with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const [user] = await db
    .insert(usersTable)
    .values({
      username,
      name: username,
      email,
      password: passwordHash,
      role: "user",
      status: "active",
      emailVerified: false,
      verificationToken: otp,
      verificationTokenExpiry: otpExpiry,
    })
    .returning();

  // Try to send OTP email — if it fails, return OTP in response as fallback
  const emailSent = await sendOTPEmail(email, username, otp);

  res.status(201).json({
    message: emailSent
      ? "Account created. Check your email for the 6-digit verification code."
      : "Account created. Email delivery failed — use the code below to verify.",
    username: user!.username,
    email: user!.email,
    emailSent,
    // Only include OTP in response if email failed (fallback for demo)
    otpFallback: emailSent ? null : otp,
  });
});

// ─── Verify OTP ───────────────────────────────────────────────────────────────
router.post("/auth/verify-otp", async (req, res): Promise<void> => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    res.status(400).json({ error: "Email and OTP code are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    res.status(400).json({ error: "Account not found" });
    return;
  }

  if (user.emailVerified) {
    res.json({ message: "Account already verified. You can log in." });
    return;
  }

  if (!user.verificationToken || user.verificationToken !== otp.trim()) {
    res.status(400).json({ error: "Invalid verification code. Please check and try again." });
    return;
  }

  if (user.verificationTokenExpiry && user.verificationTokenExpiry < new Date()) {
    res.status(400).json({ error: "Code has expired. Please request a new one.", code: "OTP_EXPIRED" });
    return;
  }

  await db
    .update(usersTable)
    .set({ emailVerified: true, verificationToken: null, verificationTokenExpiry: null })
    .where(eq(usersTable.id, user.id));

  res.json({ message: "Account verified successfully! You can now log in." });
});

// ─── Resend OTP ───────────────────────────────────────────────────────────────
router.post("/auth/resend-otp", async (req, res): Promise<void> => {
  const { email } = req.body;
  if (!email) { res.status(400).json({ error: "Email is required" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user || user.emailVerified) {
    res.json({ message: "If that email is registered and unverified, a new code has been sent.", emailSent: false });
    return;
  }

  const otp = generateOTP();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  await db.update(usersTable)
    .set({ verificationToken: otp, verificationTokenExpiry: otpExpiry })
    .where(eq(usersTable.id, user.id));

  const emailSent = await sendOTPEmail(email, user.username, otp);

  res.json({
    message: emailSent ? "New code sent! Check your email." : "Email delivery failed — use the code below.",
    emailSent,
    otpFallback: emailSent ? null : otp,
  });
});

// ─── Login ────────────────────────────────────────────────────────────────────
router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { username, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username));

  if (!user) { res.status(401).json({ error: "Invalid username or password" }); return; }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) { res.status(401).json({ error: "Invalid username or password" }); return; }

  if (user.status === "deleted") { res.status(401).json({ error: "Invalid username or password" }); return; }
  if (user.status === "banned") {
    res.status(403).json({
      error: "Your account has been banned. Please contact the administrator.",
      status: "banned",
      reason: user.suspensionReason ?? "No reason provided",
    });
    return;
  }
  if (user.status === "suspended") {
    // Auto-lift timeout if expired
    if (user.suspendedUntil && user.suspendedUntil < new Date()) {
      await db.update(usersTable).set({ status: "active", suspendedUntil: null }).where(eq(usersTable.id, user.id));
    } else {
      const untilStr = user.suspendedUntil
        ? `Suspended until ${new Date(user.suspendedUntil).toLocaleString()}`
        : undefined;
      res.status(403).json({
        error: `Your account has been temporarily suspended${untilStr ? ` until ${new Date(user.suspendedUntil!).toLocaleString()}` : ""}. Please contact the administrator.`,
        status: "suspended",
        reason: user.suspensionReason ?? "No reason provided",
        until: untilStr,
      });
      return;
    }
  }

  if (!user.emailVerified) {
    res.status(403).json({
      error: "Please verify your account before logging in.",
      code: "EMAIL_NOT_VERIFIED",
      email: user.email,
    });
    return;
  }

  req.session!.userId = user.id;
  res.json({ id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt.toISOString() });
});

// ─── Logout ───────────────────────────────────────────────────────────────────
router.post("/auth/logout", async (req, res): Promise<void> => {
  req.session = null;
  res.json({ message: "Logged out" });
});

// ─── Me ───────────────────────────────────────────────────────────────────────
router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.status === "deleted") { res.status(401).json({ error: "User not found" }); return; }

  res.json({ id: user.id, username: user.username, email: user.email, role: user.role, status: user.status, createdAt: user.createdAt.toISOString() });
});

export default router;