import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  transactionsTable,
  booksTable,
  finesTable,
  fineSettingsTable,
  notificationsTable,
} from "../db.js";

const router: IRouter = Router();

router.patch("/borrow/:id/return", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, id));

  if (!transaction) {
    res.status(404).json({ error: "Transaction not found" });
    return;
  }

  if (transaction.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (transaction.status !== "approved") {
    res.status(400).json({ error: "Only approved borrows can be returned" });
    return;
  }

  const now = new Date();
  const today = now.toISOString().split("T")[0]!;

  const [updated] = await db
    .update(transactionsTable)
    .set({ status: "returned", actualReturnDate: now })
    .where(eq(transactionsTable.id, id))
    .returning();

  await db
    .update(booksTable)
    .set({ status: "available" })
    .where(eq(booksTable.id, transaction.bookId));

  const [settingsRow] = await db.select().from(fineSettingsTable);
  const settings = settingsRow ?? {
    dailyRate: "5.00",
    maxFinePerBook: "500.00",
    gracePeriodDays: 0,
  };

  let fine = null;
  const dueDate = transaction.dueDate;

  if (dueDate && today > dueDate) {
    const due = new Date(dueDate);
    const ret = new Date(today);
    const diffMs = ret.getTime() - due.getTime();
    const overdueDays = Math.max(0, Math.floor(diffMs / 86_400_000) - Number(settings.gracePeriodDays));

    if (overdueDays > 0) {
      const dailyRate = parseFloat(String(settings.dailyRate));
      const maxFine = parseFloat(String(settings.maxFinePerBook));
      const gross = overdueDays * dailyRate;
      const fineAmount = Math.min(gross, maxFine);

      const [createdFine] = await db
        .insert(finesTable)
        .values({
          transactionId: id,
          userId,
          overdueDays,
          dailyRate: String(dailyRate),
          grossAmount: String(gross),
          fineAmount: String(fineAmount),
          amountPaid: "0.00",
          status: "unpaid",
        })
        .returning();

      fine = createdFine;

      await db.insert(notificationsTable).values({
        userId,
        type: "fine_issued",
        title: "Overdue Fine Issued",
        message: `Your book was returned ${overdueDays} day(s) late. A fine of ₱${fineAmount.toFixed(2)} has been issued.`,
        metadata: { fineId: createdFine?.id, transactionId: id, overdueDays },
      });
    }
  }

  await db.insert(notificationsTable).values({
    userId,
    type: "book_returned",
    title: "Book Returned",
    message: fine
      ? `Book returned successfully. A fine of ₱${parseFloat(String(fine.fineAmount)).toFixed(2)} was issued for overdue return.`
      : "Book returned successfully. Thank you!",
    metadata: { transactionId: id },
  });

  res.json({
    transaction: { ...updated!, createdAt: updated!.createdAt.toISOString() },
    fine: fine
      ? {
          id: fine.id,
          overdueDays: fine.overdueDays,
          fineAmount: fine.fineAmount,
          status: fine.status,
        }
      : null,
  });
});

export default router;
