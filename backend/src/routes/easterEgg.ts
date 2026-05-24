import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "../db.js";

const router = Router();

// 🔒 SECRET — only on the server. Set these to real book titles in your catalog.
// Tip: pick 8 books whose first letters spell a word for the "lore" crowd.
const CROWBAR_SEQUENCE = [
  "the silent patient", "1984", "brave new world",
  "dune", "fahrenheit 451", "neuromancer",
  "snow crash", "the road",
].map((t) => t.toLowerCase().trim());

export const SEQUENCE_LENGTH = CROWBAR_SEQUENCE.length; // frontend only needs this number

router.post("/attempt", async (req: any, res) => {
  if (!req.session?.userId) return res.status(401).json({ error: "Not authenticated" });
  const seq: string[] = (req.body?.sequence ?? []).map((s: string) => String(s).toLowerCase().trim());

  const tail = seq.slice(-SEQUENCE_LENGTH);
  const match = tail.length === SEQUENCE_LENGTH &&
                tail.every((v, i) => v === CROWBAR_SEQUENCE[i]);
  if (!match) return res.json({ awarded: false });

  const [me] = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId));
  if (me.hasGoldenCrowbar) return res.json({ awarded: true, alreadyHad: true });

  await db.update(usersTable)
    .set({ hasGoldenCrowbar: true, crowbarFoundAt: new Date() })
    .where(eq(usersTable.id, req.session.userId));
  res.json({ awarded: true });
});

// expose the length so the frontend knows how big its rolling buffer is
router.get("/meta", (_req, res) => res.json({ length: SEQUENCE_LENGTH }));

export default router;