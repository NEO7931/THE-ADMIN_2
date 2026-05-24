import { Router, type IRouter } from "express";
import { eq, and, lt } from "drizzle-orm";
import { db, reservationsTable, booksTable, notificationsTable } from "../db.js";
import { CreateReservationBody } from "../schemas.js";

const router: IRouter = Router();

// ─── Lazy auto-cancel: runs on every GET /reservations request ───────────────
async function autoCancelExpiredReservations(): Promise<void> {
  try {
    const now = new Date();

    // Find confirmed reservations where createdAt + 24h has passed (not picked up)
    const allConfirmed = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.status, "confirmed"));

    for (const r of allConfirmed) {
      const pickupDeadline = new Date(r.createdAt.getTime() + 24 * 60 * 60 * 1000);
      if (now > pickupDeadline) {
        // Cancel the reservation
        await db.update(reservationsTable)
          .set({ status: "cancelled", rejectionReason: "Not picked up within 24 hours — automatically cancelled." })
          .where(eq(reservationsTable.id, r.id));

        // Return book to available
        await db.update(booksTable)
          .set({ status: "available" })
          .where(eq(booksTable.id, r.bookId));

        // Notify student
        const [book] = await db.select().from(booksTable).where(eq(booksTable.id, r.bookId));
        await db.insert(notificationsTable).values({
          userId: r.userId,
          type: "reservation_cancelled",
          title: "⚠️ Reservation Expired — Not Picked Up",
          message: `Your reservation for "${book?.title ?? "a book"}" was automatically cancelled because it was not picked up within 24 hours. The book is now available for others.`,
          metadata: { reservationId: r.id, bookId: r.bookId },
        });
      }
    }

    // Also check reservations past their return date (7-day max) — auto-fine
    const allActive = await db
      .select()
      .from(reservationsTable)
      .where(eq(reservationsTable.status, "confirmed"));

    for (const r of allActive) {
      const returnDate = new Date(r.returnDate);
      if (now > returnDate) {
        // Reservation return date passed — mark overdue
        await db.update(reservationsTable)
          .set({ status: "cancelled", rejectionReason: "Return date exceeded — book marked overdue." })
          .where(eq(reservationsTable.id, r.id));

        // Return book to available
        await db.update(booksTable)
          .set({ status: "available" })
          .where(eq(booksTable.id, r.bookId));

        const [book] = await db.select().from(booksTable).where(eq(booksTable.id, r.bookId));
        await db.insert(notificationsTable).values({
          userId: r.userId,
          type: "fine_issued",
          title: "⚠️ Reservation Overdue — Fine Issued",
          message: `Your reservation for "${book?.title ?? "a book"}" exceeded the return date. A fine of ₱50/day will be calculated from the due date.`,
          metadata: { reservationId: r.id, bookId: r.bookId },
        });
      }
    }
  } catch (err) {
    console.error("Auto-cancel check failed:", err);
  }
}

router.get("/reservations", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  // Run lazy auto-cancel (non-blocking)
  autoCancelExpiredReservations().catch(console.error);

  const reservations = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.userId, userId));

  res.json(reservations.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/reservations", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }

  const parsed = CreateReservationBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, parsed.data.bookId));
  if (!book) { res.status(400).json({ error: "Book not found" }); return; }

  // Validate max 7 days reservation window
  const pickup = new Date(parsed.data.pickupDate);
  const returnD = new Date(parsed.data.returnDate);
  const diffDays = Math.ceil((returnD.getTime() - pickup.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 7) {
    res.status(400).json({ error: "Reservation period cannot exceed 7 days. Maximum return date is 7 days from pickup." });
    return;
  }
  if (diffDays < 1) {
    res.status(400).json({ error: "Return date must be after pickup date." });
    return;
  }

  const [reservation] = await db
    .insert(reservationsTable)
    .values({ userId, bookId: parsed.data.bookId, pickupDate: parsed.data.pickupDate, returnDate: parsed.data.returnDate, status: "pending" })
    .returning();

  res.status(201).json({ ...reservation!, createdAt: reservation!.createdAt.toISOString() });
});

export default router;