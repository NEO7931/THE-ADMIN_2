import { Router, type IRouter } from "express";
import { eq, ilike, and, type SQL } from "drizzle-orm";
import { db, booksTable, usersTable } from "../db.js";
import {
  ListBooksQueryParams, CreateBookBody, GetBookParams,
  UpdateBookParams, UpdateBookBody, DeleteBookParams,
} from "../schemas.js";

const router: IRouter = Router();

// Helper: require admin or librarian
async function requireStaff(req: any, res: any): Promise<boolean> {
  const userId = req.session?.userId;
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return false; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user || (user.role !== "admin" && user.role !== "librarian")) {
    res.status(403).json({ error: "Staff access required" }); return false;
  }
  return true;
}

router.get("/books", async (req, res): Promise<void> => {
  const params = ListBooksQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const conditions: SQL[] = [];
  if (params.data.search) conditions.push(ilike(booksTable.title, `%${params.data.search}%`));
  if (params.data.category) conditions.push(eq(booksTable.category, params.data.category));
  if (params.data.status) conditions.push(eq(booksTable.status, params.data.status));
  const books = conditions.length > 0
    ? await db.select().from(booksTable).where(and(...conditions))
    : await db.select().from(booksTable);
  res.json(books.map((b) => ({ ...b, createdAt: b.createdAt.toISOString() })));
});

router.get("/books/categories", async (_req, res): Promise<void> => {
  const books = await db.select({ category: booksTable.category }).from(booksTable);
  const categories = [...new Set(books.map((b) => b.category))].sort();
  res.json(categories);
});

router.get("/books/:id", async (req, res): Promise<void> => {
  const params = GetBookParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [book] = await db.select().from(booksTable).where(eq(booksTable.id, params.data.id));
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }
  res.json({ ...book, createdAt: book.createdAt.toISOString() });
});

router.post("/books", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;
  const parsed = CreateBookBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [book] = await db.insert(booksTable).values(parsed.data).returning();
  res.json({ ...book!, createdAt: book!.createdAt.toISOString() });
});

router.put("/books/:id", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;
  const paramsResult = UpdateBookParams.safeParse(req.params);
  if (!paramsResult.success) { res.status(400).json({ error: paramsResult.error.message }); return; }
  const bodyResult = UpdateBookBody.safeParse(req.body);
  if (!bodyResult.success) { res.status(400).json({ error: bodyResult.error.message }); return; }
  const updateData: Record<string, unknown> = {};
  if (bodyResult.data.code !== undefined) updateData.code = bodyResult.data.code;
  if (bodyResult.data.title !== undefined) updateData.title = bodyResult.data.title;
  if (bodyResult.data.author !== undefined) updateData.author = bodyResult.data.author;
  if (bodyResult.data.category !== undefined) updateData.category = bodyResult.data.category;
  if (bodyResult.data.status !== undefined) updateData.status = bodyResult.data.status;
  if (bodyResult.data.imageUrl !== undefined) updateData.imageUrl = bodyResult.data.imageUrl;
  const [book] = await db.update(booksTable).set(updateData).where(eq(booksTable.id, paramsResult.data.id)).returning();
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }
  res.json({ ...book, createdAt: book.createdAt.toISOString() });
});

router.delete("/books/:id", async (req, res): Promise<void> => {
  if (!(await requireStaff(req, res))) return;
  const params = DeleteBookParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [book] = await db.delete(booksTable).where(eq(booksTable.id, params.data.id)).returning();
  if (!book) { res.status(404).json({ error: "Book not found" }); return; }
  res.sendStatus(204);
});

export default router;