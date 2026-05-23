import { Router, type IRouter } from "express";
import { desc, eq, type SQL } from "drizzle-orm";
import {
  db,
  transactionsTable,
  booksTable,
  usersTable,
  reservationsTable,
  notificationsTable,
} from "../db.js";
import {
  ListAdminRequestsQueryParams,
  ListAllReservationsQueryParams,
  RejectRequestBody,
} from "../schemas.js";

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

async function requireStaff(req: any, res: any): Promise<boolean> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return false;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "admin" && user.role !== "librarian")) {
    res.status(403).json({ error: "Staff access required (admin or librarian)" });
    return false;
  }
  return true;
}

function computeOverdue(transactions: { status: string; dueDate: string }[]): number {
  const today = new Date().toISOString().split("T")[0]!;
  return transactions.filter(
    (t) => t.status === "approved" && t.dueDate < today
  ).length;
}

router.get("/admin/stats", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const books = await db.select().from(booksTable);
  const totalBooks = books.length;
  const availableBooks = books.filter((b) => b.status === "available").length;
  const borrowedBooks = books.filter((b) => b.status === "borrowed").length;

  const transactions = await db.select().from(transactionsTable);
  const pendingRequests = transactions.filter((t) => t.status === "pending").length;
  const overdueBooks = computeOverdue(transactions);

  const reservations = await db.select().from(reservationsTable);
  const reservationsCount = reservations.filter((r) => r.status === "pending" || r.status === "confirmed").length;

  const users = await db.select().from(usersTable);
  const totalUsers = users.length;

  res.json({
    totalBooks,
    availableBooks,
    borrowedBooks,
    pendingRequests,
    totalUsers,
    overdueBooks,
    reservationsCount,
    totalFinesUnpaid: "0.00",
    totalFinesCollected: "0.00",
  });
});

router.get("/admin/requests", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const params = ListAdminRequestsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

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
    .innerJoin(usersTable, eq(transactionsTable.userId, usersTable.id));

  if (params.data.status && params.data.status !== "overdue") {
    baseQuery = baseQuery.where(eq(transactionsTable.status, params.data.status)) as typeof baseQuery;
  }

  const transactions = await baseQuery.orderBy(desc(transactionsTable.createdAt));

  const mapped = transactions.map((t) => ({
    ...t,
    status: t.status === "approved" && t.dueDate < today ? "overdue" : t.status,
    createdAt: t.createdAt.toISOString(),
    actualReturnDate: t.actualReturnDate?.toISOString() ?? null,
    book: { ...t.book, createdAt: t.book.createdAt.toISOString() },
    user: { ...t.user, createdAt: t.user.createdAt.toISOString() },
  }));

  const filtered = params.data.status === "overdue"
    ? mapped.filter((t) => t.status === "overdue")
    : mapped;

  res.json(filtered);
});

router.put("/admin/approve/:id", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const adminId = req.session!.userId!;
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
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [updated] = await db
    .update(transactionsTable)
    .set({ status: "approved", approvedBy: adminId, approvedDate: new Date() })
    .where(eq(transactionsTable.id, id))
    .returning();

  await db
    .update(booksTable)
    .set({ status: "borrowed" })
    .where(eq(booksTable.id, transaction.bookId));

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, transaction.bookId));

  await db.insert(notificationsTable).values({
    userId: transaction.userId,
    type: "borrow_approved",
    title: "Borrow Request Approved",
    message: `Your request to borrow "${book?.title ?? "a book"}" has been approved. Please pick it up before the due date.`,
    metadata: { transactionId: id, bookId: transaction.bookId },
  });

  res.json({ ...updated!, createdAt: updated!.createdAt.toISOString() });
});

router.put("/admin/reject/:id", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const adminId = req.session!.userId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = RejectRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [transaction] = await db
    .select()
    .from(transactionsTable)
    .where(eq(transactionsTable.id, id));

  if (!transaction) {
    res.status(404).json({ error: "Request not found" });
    return;
  }

  const [updated] = await db
    .update(transactionsTable)
    .set({
      status: "rejected",
      rejectionReason: parsed.data.rejectionReason,
      rejectedBy: adminId,
      rejectionDate: new Date(),
    })
    .where(eq(transactionsTable.id, id))
    .returning();

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, transaction.bookId));

  await db.insert(notificationsTable).values({
    userId: transaction.userId,
    type: "borrow_rejected",
    title: "Borrow Request Rejected",
    message: `Your request to borrow "${book?.title ?? "a book"}" was rejected. Reason: ${parsed.data.rejectionReason}`,
    metadata: { transactionId: id, bookId: transaction.bookId },
  });

  res.json({ ...updated!, createdAt: updated!.createdAt.toISOString() });
});

router.get("/admin/transactions", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const today = new Date().toISOString().split("T")[0]!;

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
    .orderBy(desc(transactionsTable.createdAt));

  res.json(
    transactions.map((t) => ({
      ...t,
      status: t.status === "approved" && t.dueDate < today ? "overdue" : t.status,
      createdAt: t.createdAt.toISOString(),
      actualReturnDate: t.actualReturnDate?.toISOString() ?? null,
      book: { ...t.book, createdAt: t.book.createdAt.toISOString() },
      user: { ...t.user, createdAt: t.user.createdAt.toISOString() },
    }))
  );
});

router.get("/admin/reservations", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const params = ListAllReservationsQueryParams.safeParse(req.query);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  let baseQuery = db
    .select({
      id: reservationsTable.id,
      userId: reservationsTable.userId,
      bookId: reservationsTable.bookId,
      pickupDate: reservationsTable.pickupDate,
      returnDate: reservationsTable.returnDate,
      status: reservationsTable.status,
      createdAt: reservationsTable.createdAt,
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
    .from(reservationsTable)
    .innerJoin(booksTable, eq(reservationsTable.bookId, booksTable.id))
    .innerJoin(usersTable, eq(reservationsTable.userId, usersTable.id));

  if (params.data.status) {
    baseQuery = baseQuery.where(eq(reservationsTable.status, params.data.status)) as typeof baseQuery;
  }

  const reservations = await baseQuery.orderBy(desc(reservationsTable.createdAt));

  res.json(
    reservations.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      book: { ...r.book, createdAt: r.book.createdAt.toISOString() },
      user: { ...r.user, createdAt: r.user.createdAt.toISOString() },
    }))
  );
});

router.put("/admin/reservations/approve/:id", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [reservation] = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.id, id));

  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const [updated] = await db
    .update(reservationsTable)
    .set({ status: "confirmed" })
    .where(eq(reservationsTable.id, id))
    .returning();

  await db
    .update(booksTable)
    .set({ status: "reserved" })
    .where(eq(booksTable.id, reservation.bookId));

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, reservation.bookId));

  await db.insert(notificationsTable).values({
    userId: reservation.userId,
    type: "reservation_confirmed",
    title: "Reservation Confirmed",
    message: `Your reservation for "${book?.title ?? "a book"}" has been confirmed. Please pick it up on ${reservation.pickupDate}.`,
    metadata: { reservationId: id, bookId: reservation.bookId },
  });

  res.json({ ...updated!, createdAt: updated!.createdAt.toISOString() });
});

router.put("/admin/reservations/reject/:id", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const parsed = RejectRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [reservation] = await db
    .select()
    .from(reservationsTable)
    .where(eq(reservationsTable.id, id));

  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const [updated] = await db
    .update(reservationsTable)
    .set({ status: "cancelled", rejectionReason: parsed.data.rejectionReason })
    .where(eq(reservationsTable.id, id))
    .returning();

  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, reservation.bookId));

  await db.insert(notificationsTable).values({
    userId: reservation.userId,
    type: "reservation_cancelled",
    title: "Reservation Cancelled",
    message: `Your reservation for "${book?.title ?? "a book"}" was cancelled. Reason: ${parsed.data.rejectionReason}`,
    metadata: { reservationId: id, bookId: reservation.bookId },
  });

  res.json({ ...updated!, createdAt: updated!.createdAt.toISOString() });
});


// ─── User Management ─────────────────────────────────────────────────────────

router.get("/admin/users", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const users = await db
    .select({
      id: usersTable.id,
      username: usersTable.username,
      email: usersTable.email,
      role: usersTable.role,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .orderBy(desc(usersTable.createdAt));

  res.json(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

async function setUserStatus(req: any, res: any, newStatus: string): Promise<void> {
  if (!(await requireStaff(req, res))) return;

  const adminId = req.session!.userId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetId = parseInt(raw!, 10);

  if (isNaN(targetId)) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }
  if (adminId === targetId) {
    res.status(400).json({ error: "Cannot perform this action on your own account" });
    return;
  }

  // Get caller role
  const [caller] = await db.select().from(usersTable).where(eq(usersTable.id, adminId));

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  // Librarians can only act on regular users — not admins or other librarians
  if (caller?.role === "librarian" && (target.role === "admin" || target.role === "librarian")) {
    res.status(403).json({ error: "Librarians can only manage regular user accounts" });
    return;
  }

  // Prevent deleting the last admin
  if (newStatus === "deleted" && target.role === "admin") {
    const admins = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
    if (admins.length <= 1) {
      res.status(400).json({ error: "Cannot delete the last admin account" });
      return;
    }
  }

  const [updated] = await db
    .update(usersTable)
    .set({ status: newStatus })
    .where(eq(usersTable.id, targetId))
    .returning();

  res.json({ ...updated!, createdAt: updated!.createdAt.toISOString() });
}

router.put("/admin/users/:id/ban", (req, res) => setUserStatus(req, res, "banned"));
router.put("/admin/users/:id/unban", (req, res) => setUserStatus(req, res, "active"));
router.put("/admin/users/:id/suspend", (req, res) => setUserStatus(req, res, "suspended"));
router.put("/admin/users/:id/unsuspend", (req, res) => setUserStatus(req, res, "active"));
router.put("/admin/users/:id/restore", (req, res) => setUserStatus(req, res, "active"));
router.delete("/admin/users/:id", (req, res) => setUserStatus(req, res, "deleted"));

// ─── Book status override (admin or librarian) ────────────────────────────────
router.patch("/admin/books/:id/status", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  const [caller] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!caller || (caller.role !== "admin" && caller.role !== "librarian")) {
    res.status(403).json({ error: "Staff access required" }); return;
  }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw!, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { status } = req.body;
  if (!["available", "borrowed", "reserved"].includes(status)) {
    res.status(400).json({ error: "Invalid status. Must be available, borrowed, or reserved." });
    return;
  }

  const [book] = await db.update(booksTable).set({ status }).where(eq(booksTable.id, id)).returning();
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }
  res.json({ ...book, createdAt: book.createdAt.toISOString() });
});

// ─── Hard delete user (admin only) ───────────────────────────────────────────
router.delete("/admin/users/:id/permanent", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const adminId = req.session!.userId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetId = parseInt(raw!, 10);

  if (isNaN(targetId)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (adminId === targetId) { res.status(400).json({ error: "Cannot delete your own account" }); return; }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  if (target.role === "admin") {
    const admins = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
    if (admins.length <= 1) {
      res.status(400).json({ error: "Cannot delete the last admin account" }); return;
    }
  }

  await db.delete(usersTable).where(eq(usersTable.id, targetId));
  res.json({ message: `User ${target.username} permanently deleted` });
});

// ─── Change user role (admin only) ───────────────────────────────────────────
router.put("/admin/users/:id/role", async (req, res): Promise<void> => {
  if (!(await requireAdmin(req, res))) return;

  const adminId = req.session!.userId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetId = parseInt(raw!, 10);

  if (isNaN(targetId)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (adminId === targetId) { res.status(400).json({ error: "Cannot change your own role" }); return; }

  const { role } = req.body;
  if (!["user", "librarian", "admin"].includes(role)) {
    res.status(400).json({ error: "Invalid role. Must be user, librarian, or admin." }); return;
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));
  if (!target) { res.status(404).json({ error: "User not found" }); return; }

  // Prevent demoting the last admin
  if (target.role === "admin" && role !== "admin") {
    const admins = await db.select().from(usersTable).where(eq(usersTable.role, "admin"));
    if (admins.length <= 1) {
      res.status(400).json({ error: "Cannot demote the last admin account" }); return;
    }
  }

  const [updated] = await db.update(usersTable).set({ role }).where(eq(usersTable.id, targetId)).returning();
  res.json({ ...updated!, createdAt: updated!.createdAt.toISOString() });
});

// ─── Timeout (timed suspension) ──────────────────────────────────────────────
router.put("/admin/users/:id/timeout", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;

  const callerId = req.session!.userId!;
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const targetId = parseInt(raw!, 10);

  if (isNaN(targetId)) { res.status(400).json({ error: "Invalid id" }); return; }
  if (callerId === targetId) { res.status(400).json({ error: "Cannot timeout your own account" }); return; }

  const [caller] = await db.select().from(usersTable).where(eq(usersTable.id, callerId));
  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, targetId));

  if (!target) { res.status(404).json({ error: "User not found" }); return; }
  if (caller?.role === "librarian" && (target.role === "admin" || target.role === "librarian")) {
    res.status(403).json({ error: "Librarians can only manage regular user accounts" }); return;
  }

  // Duration in minutes
  const { durationMinutes } = req.body;
  if (!durationMinutes || typeof durationMinutes !== "number" || durationMinutes <= 0) {
    res.status(400).json({ error: "Valid durationMinutes is required" }); return;
  }

  const suspendedUntil = new Date(Date.now() + durationMinutes * 60 * 1000);

  const [updated] = await db.update(usersTable)
    .set({ status: "suspended", suspendedUntil })
    .where(eq(usersTable.id, targetId))
    .returning();

  res.json({
    ...updated!,
    createdAt: updated!.createdAt.toISOString(),
    suspendedUntil: suspendedUntil.toISOString(),
    message: `User timed out until ${suspendedUntil.toLocaleString()}`,
  });
});

export default router;