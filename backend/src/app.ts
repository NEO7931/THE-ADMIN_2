import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import cookieSession from "cookie-session";
import router from "./routes/index.js";
import { logger } from "./lib/logger.js";
import { db, usersTable } from "./db.js";
import { eq } from "drizzle-orm";

const app: Express = express();

app.set("trust proxy", 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(
  cors({
    origin: process.env["CORS_ORIGIN"] ?? "http://localhost:5173",
    credentials: true,
  })
);

app.use(
  cookieSession({
    name: "session",
    secret: process.env["SESSION_SECRET"] ?? "libcore-dev-secret-change-in-production",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Account Status Middleware ─────────────────────────────────────────────
const EXEMPT_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/verify-otp",
  "/api/auth/resend-otp",
  "/api/auth/logout",
  "/api/healthz",
];

app.use("/api", async (req: Request, res: Response, next: NextFunction) => {
  const EXEMPT = ["/auth/login", "/auth/register", "/auth/verify-otp", "/auth/resend-otp", "/auth/logout", "/healthz"];
  if (EXEMPT.some(p => req.path === p)) return next();

  const userId = (req as any).session?.userId;
  if (!userId) return next();

  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) return next();

    // Auto-lift expired timeouts
    if (user.status === "suspended" && user.suspendedUntil && new Date() > new Date(user.suspendedUntil)) {
      await db.update(usersTable)
        .set({ status: "active", suspendedUntil: null, suspensionReason: null })
        .where(eq(usersTable.id, userId));
      return next();
    }

    if (user.status === "suspended") {
      // Force logout
      (req as any).session = null;
      const until = user.suspendedUntil
        ? `Until: ${new Date(user.suspendedUntil).toLocaleString("en-PH")}`
        : null;
      return res.status(403).json({
        error: "Account suspended",
        status: "suspended",
        reason: user.suspensionReason ?? "Your account has been suspended.",
        until,
      });
    }

    if (user.status === "banned") {
      (req as any).session = null;
      return res.status(403).json({
        error: "Account banned",
        status: "banned",
        reason: user.suspensionReason ?? "Your account has been permanently banned.",
      });
    }

    if (user.status === "deleted") {
      (req as any).session = null;
      return res.status(403).json({ error: "Account not found", status: "deleted" });
    }

    next();
  } catch (err) {
    next(err);
  }
});

app.use("/api", router);

export default app;