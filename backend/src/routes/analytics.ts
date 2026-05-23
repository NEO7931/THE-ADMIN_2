import { Router, type IRouter } from "express";
import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import {
  db,
  transactionsTable,
  booksTable,
  usersTable,
  finesTable,
  reservationsTable,
} from "../db.js";

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

router.get("/analytics/overview", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0]!;

  const [books, transactions, reservations, fines] = await Promise.all([
    db.select().from(booksTable),
    db.select().from(transactionsTable),
    db.select().from(reservationsTable),
    db.select().from(finesTable),
  ]);

  const today = now.toISOString().split("T")[0]!;

  const totalBooks = books.length;
  const activeBorrows = transactions.filter((t) => t.status === "approved").length;
  const overdueItems = transactions.filter(
    (t) => t.status === "approved" && t.dueDate < today
  ).length;

  const totalFinesUnpaid = fines
    .filter((f) => f.status === "unpaid")
    .reduce((sum, f) => sum + parseFloat(String(f.fineAmount)), 0);

  const revenueThisMonth = fines
    .filter((f) => f.status === "paid" && f.createdAt.toISOString().split("T")[0]! >= startOfMonth)
    .reduce((sum, f) => sum + parseFloat(String(f.amountPaid)), 0);

  const newBorrowsThisMonth = transactions.filter(
    (t) => t.borrowDate >= startOfMonth
  ).length;

  const pendingRequests = transactions.filter((t) => t.status === "pending").length;

  res.json({
    totalBooks,
    activeBorrows,
    overdueItems,
    revenueThisMonth: revenueThisMonth.toFixed(2),
    newBorrowsThisMonth,
    pendingRequests,
    totalFinesUnpaid: totalFinesUnpaid.toFixed(2),
  });
});

router.get("/analytics/borrow-trends", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const from = (req.query["from"] as string) ?? new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0]!;
  const to = (req.query["to"] as string) ?? new Date().toISOString().split("T")[0]!;

  const rows = await db
    .select({
      date: transactionsTable.borrowDate,
      count: sql<number>`count(*)::int`,
    })
    .from(transactionsTable)
    .where(and(gte(transactionsTable.borrowDate, from), lte(transactionsTable.borrowDate, to)))
    .groupBy(transactionsTable.borrowDate)
    .orderBy(transactionsTable.borrowDate);

  res.json({ trends: rows.map((r) => ({ date: r.date, count: r.count })) });
});

router.get("/analytics/top-books", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const limit = parseInt(String(req.query["limit"] ?? "10"), 10);
  const from = req.query["from"] as string | undefined;
  const to = req.query["to"] as string | undefined;

  let conditions: any[] = [];
  if (from) conditions.push(gte(transactionsTable.borrowDate, from));
  if (to) conditions.push(lte(transactionsTable.borrowDate, to));

  const rows = await db
    .select({
      bookId: booksTable.id,
      title: booksTable.title,
      author: booksTable.author,
      category: booksTable.category,
      borrowCount: sql<number>`count(${transactionsTable.id})::int`,
    })
    .from(transactionsTable)
    .innerJoin(booksTable, eq(transactionsTable.bookId, booksTable.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .groupBy(booksTable.id, booksTable.title, booksTable.author, booksTable.category)
    .orderBy(desc(sql`count(${transactionsTable.id})`))
    .limit(limit);

  res.json(rows);
});

router.get("/analytics/request-status", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const transactions = await db.select({ status: transactionsTable.status }).from(transactionsTable);

  const counts = { pending: 0, approved: 0, rejected: 0, returned: 0 };
  for (const t of transactions) {
    if (t.status in counts) counts[t.status as keyof typeof counts]++;
  }

  res.json(counts);
});

router.get("/analytics/fine-collection", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const fines = await db
    .select({
      createdAt: finesTable.createdAt,
      fineAmount: finesTable.fineAmount,
      amountPaid: finesTable.amountPaid,
      status: finesTable.status,
    })
    .from(finesTable)
    .orderBy(finesTable.createdAt);

  const monthMap = new Map<string, { paid: number; unpaid: number }>();

  for (const f of fines) {
    const month = f.createdAt.toISOString().substring(0, 7);
    const entry = monthMap.get(month) ?? { paid: 0, unpaid: 0 };
    if (f.status === "paid") {
      entry.paid += parseFloat(String(f.amountPaid));
    } else if (f.status === "unpaid") {
      entry.unpaid += parseFloat(String(f.fineAmount));
    }
    monthMap.set(month, entry);
  }

  const result = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({ month, paid: data.paid, unpaid: data.unpaid }));

  res.json(result);
});

router.get("/analytics/student-activity", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const limit = parseInt(String(req.query["limit"] ?? "10"), 10);

  const rows = await db
    .select({
      userId: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      borrowCount: sql<number>`count(${transactionsTable.id})::int`,
    })
    .from(transactionsTable)
    .innerJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
    .groupBy(usersTable.id, usersTable.username, usersTable.email)
    .orderBy(desc(sql`count(${transactionsTable.id})`))
    .limit(limit);

  const userIds = rows.map((r) => r.userId);
  const finesData = userIds.length
    ? await db.select({ userId: finesTable.userId, fineAmount: finesTable.fineAmount }).from(finesTable)
    : [];

  const finesByUser = new Map<number, number>();
  for (const f of finesData) {
    finesByUser.set(f.userId, (finesByUser.get(f.userId) ?? 0) + parseFloat(String(f.fineAmount)));
  }

  res.json(
    rows.map((r) => ({
      userId: r.userId,
      username: r.username,
      email: r.email,
      borrowCount: r.borrowCount,
      fineTotal: (finesByUser.get(r.userId) ?? 0).toFixed(2),
    }))
  );
});

router.get("/analytics/export", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const report = req.query["report"] as string;
  const from = req.query["from"] as string | undefined;
  const to = req.query["to"] as string | undefined;

  let csv = "";

  if (report === "transactions") {
    let conditions: any[] = [];
    if (from) conditions.push(gte(transactionsTable.borrowDate, from));
    if (to) conditions.push(lte(transactionsTable.borrowDate, to));

    const rows = await db
      .select({
        id: transactionsTable.id,
        borrowDate: transactionsTable.borrowDate,
        dueDate: transactionsTable.dueDate,
        status: transactionsTable.status,
        bookTitle: booksTable.title,
        bookCode: booksTable.code,
        username: usersTable.username,
      })
      .from(transactionsTable)
      .innerJoin(booksTable, eq(transactionsTable.bookId, booksTable.id))
      .innerJoin(usersTable, eq(transactionsTable.userId, usersTable.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(transactionsTable.createdAt));

    csv = "ID,Book Code,Book Title,Username,Borrow Date,Due Date,Status\n";
    csv += rows.map((r) => `${r.id},"${r.bookCode}","${r.bookTitle}","${r.username}",${r.borrowDate},${r.dueDate},${r.status}`).join("\n");
  } else if (report === "fines") {
    const rows = await db
      .select({
        id: finesTable.id,
        overdueDays: finesTable.overdueDays,
        fineAmount: finesTable.fineAmount,
        amountPaid: finesTable.amountPaid,
        status: finesTable.status,
        createdAt: finesTable.createdAt,
        username: usersTable.username,
        bookTitle: booksTable.title,
      })
      .from(finesTable)
      .innerJoin(usersTable, eq(finesTable.userId, usersTable.id))
      .innerJoin(transactionsTable, eq(finesTable.transactionId, transactionsTable.id))
      .innerJoin(booksTable, eq(transactionsTable.bookId, booksTable.id))
      .orderBy(desc(finesTable.createdAt));

    csv = "ID,Username,Book,Overdue Days,Fine Amount,Amount Paid,Status,Date\n";
    csv += rows.map((r) => `${r.id},"${r.username}","${r.bookTitle}",${r.overdueDays},${r.fineAmount},${r.amountPaid},${r.status},${r.createdAt.toISOString().split("T")[0]}`).join("\n");
  } else {
    res.status(400).json({ error: "Unknown report type" });
    return;
  }

  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="${report}-${Date.now()}.csv"`);
  res.send(csv);
});

export default router;
