import docsRouter from "./docs.js";
import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import authRouter from "./auth.js";
import booksRouter from "./books.js";
import borrowRouter from "./borrow.js";
import returnRouter from "./return.js";
import reservationsRouter from "./reservations.js";
import historyRouter from "./history.js";
import adminRouter from "./admin.js";
import notificationsRouter from "./notifications.js";
import finesRouter from "./fines.js";
import paymentsRouter from "./payments.js";
import analyticsRouter from "./analytics.js";
import profileRouter from "./profile";
import easterEggRouter from "./easterEgg";

const router: IRouter = Router();

router.use("/profile", profileRouter);
router.use("/easter-egg", easterEggRouter);
router.use(docsRouter);
router.use(healthRouter);
router.use(authRouter);
router.use(booksRouter);
router.use(borrowRouter);
router.use(returnRouter);
router.use(reservationsRouter);
router.use(historyRouter);
router.use(adminRouter);
router.use(notificationsRouter);
router.use(finesRouter);
router.use(paymentsRouter);
router.use(analyticsRouter);

export default router;
