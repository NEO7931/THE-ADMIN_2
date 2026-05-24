import { Router } from "express";
import { eq, and, ne } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, usersTable } from "../db.js";
// import { requireAuth } from "../middleware/auth";  // <- use your existing one
// import { strongPassword } from "../schemas";        // <- reuse your register password rule

const router = Router();

// tiny inline guard if you don't already export one — replace with yours
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  next();
}

const SAFE = {
  id: usersTable.id, username: usersTable.username, email: usersTable.email,
  role: usersTable.role, status: usersTable.status,
  displayName: usersTable.displayName, avatar: usersTable.avatar,
  hasGoldenCrowbar: usersTable.hasGoldenCrowbar, crowbarFoundAt: usersTable.crowbarFoundAt,
  createdAt: usersTable.createdAt,
};

// GET own profile
router.get("/me", requireAuth, async (req: any, res) => {
  const [me] = await db.select(SAFE).from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (!me) return res.status(404).json({ error: "Not found" });
  res.json(me);
});

// PATCH display name / username / avatar
router.patch("/", requireAuth, async (req: any, res) => {
  const { displayName, username, avatar } = req.body ?? {};
  const updates: Record<string, unknown> = {};

  if (typeof displayName === "string") {
    if (displayName.length > 40) return res.status(400).json({ error: "Display name too long" });
    updates.displayName = displayName.trim() || null;
  }
  if (typeof username === "string") {
    const u = username.trim();
    if (u.length < 3 || u.length > 24 || !/^[a-zA-Z0-9_]+$/.test(u))
      return res.status(400).json({ error: "Username must be 3–24 letters/numbers/underscores" });
    const [taken] = await db.select({ id: usersTable.id }).from(usersTable)
      .where(and(eq(usersTable.username, u), ne(usersTable.id, req.session.userId)));
    if (taken) return res.status(409).json({ error: "Username already taken" });
    updates.username = u;
  }
  if (typeof avatar === "string") {
    if (avatar && !/^data:image\/(png|jpe?g|webp);base64,/.test(avatar))
      return res.status(400).json({ error: "Invalid image" });
    if (avatar.length > 400_000) return res.status(400).json({ error: "Image too large — compress it" });
    updates.avatar = avatar || null;
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: "Nothing to update" });

  const [updated] = await db.update(usersTable).set(updates)
    .where(eq(usersTable.id, req.session.userId)).returning(SAFE);
  res.json(updated);
});

// POST change own password
router.post("/password", requireAuth, async (req: any, res) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  const ok = await bcrypt.compare(currentPassword, me.passwordHash);
  if (!ok) return res.status(403).json({ error: "Current password is incorrect" });

  // reuse your register-time strong-password validation here instead:
  if (newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword)
      || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)
      || newPassword.toLowerCase().includes(me.username.toLowerCase()))
    return res.status(400).json({ error: "Weak password — 12+ chars, mixed case, number, symbol, no username" });

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, req.session.userId));
  res.json({ ok: true });
});

export default router;