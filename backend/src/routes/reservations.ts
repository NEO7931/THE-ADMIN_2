import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, reservationsTable, booksTable } from "../db.js";
import { CreateReservationBody } from "../schemas.js";

const router: IRouter = Router();

router.get("/reservations", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const reservations = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.userId, userId));

  res.json(
    reservations.map((r) => ({
      ...r,
      pickupDate: r.pickupDate,
      returnDate: r.returnDate,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/reservations", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [book] = await db
    .select()
    .from(booksTable)
    .where(eq(booksTable.id, parsed.data.bookId));

  if (!book) {
    res.status(400).json({ error: "Book not found" });
    return;
  }

  const [reservation] = await db
    .insert(reservationsTable)
    .values({
      userId,
      bookId: parsed.data.bookId,
      pickupDate: parsed.data.pickupDate,
      returnDate: parsed.data.returnDate,
      status: "pending",
    })
    .returning();

  res.status(201).json({
    ...reservation!,
    createdAt: reservation!.createdAt.toISOString(),
  });
});

export default router;
