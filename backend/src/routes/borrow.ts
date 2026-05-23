import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, transactionsTable, booksTable, fineSettingsTable, notificationsTable } from "../db.js";
import { CreateBorrowBody } from "../schemas.js";

const router: IRouter = Router();

router.get("/borrow", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const transactions = await db
    .select({
      id: transactionsTable.id,
      userId: transactionsTable.userId,
      bookId: transactionsTable.bookId,
      borrowDate: transactionsTable.borrowDate,
      dueDate: transactionsTable.dueDate,
      actualReturnDate: transactionsTable.actualReturnDate,
      status: transactionsTable.status,
      rejectionReason: transactionsTable.rejectionReason,
      createdAt: transactionsTable.createdAt,
      book: {
        id: booksTable.id,
        code: booksTable.code,
        title: booksTable.title,
        author: booksTable.author,
        category: booksTable.category,
        status: booksTable.status,
        imageUrl: booksTable.imageUrl,
        createdAt: booksTable.createdAt,
      },
    })
    .from(transactionsTable)
    .innerJoin(booksTable, eq(transactionsTable.bookId, booksTable.id))
    .where(eq(transactionsTable.userId, userId))
    .orderBy(desc(transactionsTable.createdAt));

  const today = new Date().toISOString().split("T")[0]!;

  res.json(
    transactions.map((t) => ({
      ...t,
      status: t.status === "approved" && t.dueDate < today ? "overdue" : t.status,
      createdAt: t.createdAt.toISOString(),
      actualReturnDate: t.actualReturnDate?.toISOString() ?? null,
      book: { ...t.book, createdAt: t.book.createdAt.toISOString() },
    }))
  );
});

router.post("/borrow", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreateBorrowBody.safeParse(req.body);
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

  if (book.status !== "available") {
    res.status(400).json({ error: "Book is not available for borrowing" });
    return;
  }

  const [settingsRow] = await db.select().from(fineSettingsTable);
  const borrowPeriodDays = settingsRow?.defaultBorrowDays ?? 14;

  const borrowDate = parsed.data.borrowDate;
  const dueDate = parsed.data.returnDate ?? (() => {
    const d = new Date(borrowDate);
    d.setDate(d.getDate() + borrowPeriodDays);
    return d.toISOString().split("T")[0]!;
  })();

  const [transaction] = await db
    .insert(transactionsTable)
    .values({
      userId,
      bookId: parsed.data.bookId,
      borrowDate,
      dueDate,
      status: "pending",
      borrowPeriodDays,
    })
    .returning();

  await db.insert(notificationsTable).values({
    userId,
    type: "borrow_requested",
    title: "Borrow Request Submitted",
    message: `Your request to borrow "${book.title}" has been submitted and is pending approval.`,
    metadata: { transactionId: transaction!.id, bookId: book.id },
  });

  res.status(201).json({
    ...transaction!,
    createdAt: transaction!.createdAt.toISOString(),
  });
});

export default router;
