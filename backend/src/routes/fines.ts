import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import {
  db,
  finesTable,
  fineSettingsTable,
  transactionsTable,
  booksTable,
  usersTable,
  notificationsTable,
} from "../db.js";
import { WaiveFineBody, UpdateFineSettingsBody } from "../schemas.js";

const router: IRouter = Router();

async function requireAdmin(req: any, res: any): Promise<boolean> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return false;
  }
  return true;
}

router.get("/fines/my", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const fines = await db
    .select({
      id: finesTable.id,
      transactionId: finesTable.transactionId,
      overdueDays: finesTable.overdueDays,
      dailyRate: finesTable.dailyRate,
      grossAmount: finesTable.grossAmount,
      fineAmount: finesTable.fineAmount,
      amountPaid: finesTable.amountPaid,
      status: finesTable.status,
      waiveReason: finesTable.waiveReason,
      createdAt: finesTable.createdAt,
      updatedAt: finesTable.updatedAt,
      transaction: {
        id: transactionsTable.id,
        borrowDate: transactionsTable.borrowDate,
        dueDate: transactionsTable.dueDate,
        actualReturnDate: transactionsTable.actualReturnDate,
        status: transactionsTable.status,
      },
      book: {
        id: booksTable.id,
        code: booksTable.code,
        title: booksTable.title,
        author: booksTable.author,
      },
    })
    .from(finesTable)
    .innerJoin(transactionsTable, eq(finesTable.transactionId, transactionsTable.id))
    .innerJoin(booksTable, eq(transactionsTable.bookId, booksTable.id))
    .where(eq(finesTable.userId, userId))
    .orderBy(desc(finesTable.createdAt));

  const totalUnpaid = fines
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + parseFloat(String(f.fineAmount)), 0);

  res.json({
    fines: fines.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      transaction: {
        ...f.transaction,
        actualReturnDate: f.transaction.actualReturnDate?.toISOString() ?? null,
      },
    })),
    totalUnpaid: totalUnpaid.toFixed(2),
  });
});

router.get("/fines/settings", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const [settings] = await db.select().from(fineSettingsTable);
  if (!settings) {
    res.status(404).json({ error: "Settings not found" });
    return;
  }
  res.json(settings);
});

router.patch("/fines/settings", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const parsed = UpdateFineSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminId = req.session!.userId!;
  const { dailyRate, maxFinePerBook, gracePeriodDays, defaultBorrowDays } = parsed.data;

  const [existing] = await db.select().from(fineSettingsTable);

  let updated;
  if (existing) {
    [updated] = await db
      .update(fineSettingsTable)
      .set({
        ...(dailyRate !== undefined && { dailyRate: String(dailyRate) }),
        ...(maxFinePerBook !== undefined && { maxFinePerBook: String(maxFinePerBook) }),
        ...(gracePeriodDays !== undefined && { gracePeriodDays }),
        ...(defaultBorrowDays !== undefined && { defaultBorrowDays }),
        updatedBy: adminId,
        updatedAt: new Date(),
      })
      .where(eq(fineSettingsTable.id, existing.id))
      .returning();
  } else {
    [updated] = await db
      .insert(fineSettingsTable)
      .values({
        dailyRate: dailyRate !== undefined ? String(dailyRate) : "5.00",
        maxFinePerBook: maxFinePerBook !== undefined ? String(maxFinePerBook) : "500.00",
        gracePeriodDays: gracePeriodDays ?? 0,
        defaultBorrowDays: defaultBorrowDays ?? 14,
        updatedBy: adminId,
      })
      .returning();
  }

  res.json(updated);
});

router.get("/fines", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const statusFilter = req.query["status"] as string | undefined;

  const query = db
    .select({
      id: finesTable.id,
      transactionId: finesTable.transactionId,
      userId: finesTable.userId,
      overdueDays: finesTable.overdueDays,
      dailyRate: finesTable.dailyRate,
      grossAmount: finesTable.grossAmount,
      fineAmount: finesTable.fineAmount,
      amountPaid: finesTable.amountPaid,
      status: finesTable.status,
      waiveReason: finesTable.waiveReason,
      createdAt: finesTable.createdAt,
      updatedAt: finesTable.updatedAt,
      transaction: {
        id: transactionsTable.id,
        borrowDate: transactionsTable.borrowDate,
        dueDate: transactionsTable.dueDate,
        actualReturnDate: transactionsTable.actualReturnDate,
        status: transactionsTable.status,
      },
      book: {
        id: booksTable.id,
        code: booksTable.code,
        title: booksTable.title,
        author: booksTable.author,
      },
      user: {
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
      },
    })
    .from(finesTable)
    .innerJoin(transactionsTable, eq(finesTable.transactionId, transactionsTable.id))
    .innerJoin(booksTable, eq(transactionsTable.bookId, booksTable.id))
    .innerJoin(usersTable, eq(finesTable.userId, usersTable.id))
    .orderBy(desc(finesTable.createdAt));

  const fines = statusFilter
    ? await query.where(eq(finesTable.status, statusFilter))
    : await query;

  const totalUnpaid = fines
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + parseFloat(String(f.fineAmount)), 0);

  const totalCollected = fines
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + parseFloat(String(f.amountPaid)), 0);

  res.json({
    fines: fines.map((f) => ({
      ...f,
      createdAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      transaction: {
        ...f.transaction,
        actualReturnDate: f.transaction.actualReturnDate?.toISOString() ?? null,
      },
    })),
    totalUnpaid: totalUnpaid.toFixed(2),
    totalCollected: totalCollected.toFixed(2),
  });
});

router.post("/fines/:id/waive", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = WaiveFineBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminId = req.session!.userId!;

  const [fine] = await db.select().from(finesTable).where(eq(finesTable.id, id));
  if (!fine) {
    res.status(404).json({ error: "Fine not found" });
    return;
  }

  if (fine.status === "paid") {
    res.status(400).json({ error: "Cannot waive a paid fine" });
    return;
  }

  const [updated] = await db
    .update(finesTable)
    .set({
      status: "waived",
      waivedBy: adminId,
      waiveReason: parsed.data.waiveReason,
      updatedAt: new Date(),
    })
    .where(eq(finesTable.id, id))
    .returning();

  await db.insert(notificationsTable).values({
    userId: fine.userId,
    type: "fine_waived",
    title: "Fine Waived",
    message: `Your fine of ₱${parseFloat(String(fine.fineAmount)).toFixed(2)} has been waived. Reason: ${parsed.data.waiveReason}`,
    metadata: { fineId: id },
  });

  const [transaction] = await db
    .select({ id: transactionsTable.id, borrowDate: transactionsTable.borrowDate, dueDate: transactionsTable.dueDate, actualReturnDate: transactionsTable.actualReturnDate, status: transactionsTable.status })
    .from(transactionsTable)
    .where(eq(transactionsTable.id, updated!.transactionId));

  res.json({ ...updated, transaction, createdAt: updated!.createdAt.toISOString(), updatedAt: updated!.updatedAt.toISOString() });
});

export default router;
