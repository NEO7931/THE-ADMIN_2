import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  pgTable, serial, text, integer, boolean, timestamp, numeric, json,
} from "drizzle-orm/pg-core";

const pool = new Pool({ connectionString: process.env["DATABASE_URL"] });
export const db = drizzle(pool);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  status: text("status").notNull().default("active"),
  suspendedUntil: timestamp("suspended_until"),
  emailVerified: boolean("email_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),displayName: text("display_name"),
  avatar:text("avatar"), 
  hasGoldenCrowbar: boolean("has_golden_crowbar").default(false).notNull(),
  crowbarFoundAt:  timestamp("crowbar_found_at"),               
  
});

export const booksTable = pgTable("books", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  borrowDate: text("borrow_date").notNull(),
  dueDate: text("due_date").notNull(),
  actualReturnDate: timestamp("actual_return_date"),
  status: text("status").notNull().default("pending"),
  borrowPeriodDays: integer("borrow_period_days").notNull().default(14),
  rejectionReason: text("rejection_reason"),
  approvedBy: integer("approved_by"),
  approvedDate: timestamp("approved_date"),
  rejectedBy: integer("rejected_by"),
  rejectionDate: timestamp("rejection_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  bookId: integer("book_id").notNull(),
  pickupDate: text("pickup_date").notNull(),
  returnDate: text("return_date").notNull(),
  status: text("status").notNull().default("pending"),
  rejectionReason: text("rejection_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const finesTable = pgTable("fines", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull(),
  userId: integer("user_id").notNull(),
  overdueDays: integer("overdue_days").notNull(),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }).notNull(),
  grossAmount: numeric("gross_amount", { precision: 10, scale: 2 }).notNull(),
  fineAmount: numeric("fine_amount", { precision: 10, scale: 2 }).notNull(),
  amountPaid: numeric("amount_paid", { precision: 10, scale: 2 }).notNull().default("0.00"),
  status: text("status").notNull().default("unpaid"),
  waiveReason: text("waive_reason"),
  waivedBy: integer("waived_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const fineSettingsTable = pgTable("fine_settings", {
  id: serial("id").primaryKey(),
  dailyRate: numeric("daily_rate", { precision: 10, scale: 2 }).notNull().default("5.00"),
  maxFinePerBook: numeric("max_fine_per_book", { precision: 10, scale: 2 }).notNull().default("500.00"),
  gracePeriodDays: integer("grace_period_days").notNull().default(0),
  defaultBorrowDays: integer("default_borrow_days").notNull().default(14),
  updatedBy: integer("updated_by"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const notificationsTable = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  readAt: timestamp("read_at"),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  fineId: integer("fine_id").notNull(),
  userId: integer("user_id").notNull(),
  stripeSessionId: text("stripe_session_id"),
  stripePaymentIntent: text("stripe_payment_intent"),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("PHP"),
  status: text("status").notNull().default("pending"),
  paymentMethod: text("payment_method"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});