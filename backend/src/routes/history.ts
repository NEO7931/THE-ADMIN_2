import { Router, type IRouter } from "express";
import { desc, eq } from "drizzle-orm";
import { db, transactionsTable, booksTable, usersTable } from "../db.js";

const router: IRouter = Router();

router.get("/history", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const page = Math.max(1, parseInt(String(req.query["page"] ?? "1"), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query["limit"] ?? "20"), 10)));
  const statusFilter = req.query["status"] as string | undefined;

  const today = new Date().toISOString().split("T")[0]!;

  let baseQuery = db
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
      user: {
        id: usersTable.id,
        username: usersTable.username,
        email: usersTable.email,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      },
    })
    .from(transactionsTable)
    .innerJoin(booksTable, eq(transactionsTable.bookId, booksTable.id))
    .innerJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .where(eq(transactionsTable.userId, userId));

  const all = await baseQuery.orderBy(desc(transactionsTable.createdAt));

  const mapped = all.map((t) => ({
    ...t,
    status: t.status === "approved" && t.dueDate < today ? "overdue" : t.status,
    createdAt: t.createdAt.toISOString(),
    actualReturnDate: t.actualReturnDate?.toISOString() ?? null,
    book: { ...t.book, createdAt: t.book.createdAt.toISOString() },
    user: { ...t.user, createdAt: t.user.createdAt.toISOString() },
  }));

  const filtered = statusFilter && statusFilter !== "all"
    ? mapped.filter((t) => t.status === statusFilter)
    : mapped;

  const total = filtered.length;
  const offset = (page - 1) * limit;
  const items = filtered.slice(offset, offset + limit);

  res.json({
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
});

export default router;
