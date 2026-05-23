import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, finesTable, paymentsTable, notificationsTable, usersTable } from "../db.js";
import { CreatePaymentSessionBody } from "../schemas.js";

const router: IRouter = Router();

const STRIPE_SECRET_KEY = process.env["STRIPE_SECRET_KEY"];

async function getStripe() {
  if (!STRIPE_SECRET_KEY) return null;
  const Stripe = (await import("stripe")).default;
  return new Stripe(STRIPE_SECRET_KEY);
}

router.post("/payments/create-session", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const parsed = CreatePaymentSessionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { fineId } = parsed.data;

  const [fine] = await db.select().from(finesTable).where(eq(finesTable.id, fineId));
  if (!fine) {
    res.status(404).json({ error: "Fine not found" });
    return;
  }

  if (fine.userId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }

  if (fine.status !== "unpaid") {
    res.status(400).json({ error: "Fine is not unpaid" });
    return;
  }

  const amountCents = Math.round(parseFloat(String(fine.fineAmount)) * 100);

  const stripe = await getStripe();
  if (!stripe) {
    const [payment] = await db
      .insert(paymentsTable)
      .values({
        fineId,
        userId,
        amount: String(fine.fineAmount),
        currency: "PHP",
        status: "paid",
        paymentMethod: "demo",
        paidAt: new Date(),
      })
      .returning();

    await db.update(finesTable)
      .set({ status: "paid", amountPaid: fine.fineAmount, updatedAt: new Date() })
      .where(eq(finesTable.id, fineId));

    await db.insert(notificationsTable).values({
      userId,
      type: "payment_confirmed",
      title: "Payment Confirmed",
      message: `Your fine payment of ₱${parseFloat(String(fine.fineAmount)).toFixed(2)} has been recorded (demo mode).`,
      metadata: { fineId, paymentId: payment!.id },
    });

    res.json({ sessionId: null, url: null, payment, mode: "demo" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));

  const origin = req.headers["origin"] ?? "http://localhost";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "php",
          product_data: { name: `Library Fine #${fineId}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    customer_email: user?.email,
    success_url: `${origin}/fines?payment=success`,
    cancel_url: `${origin}/fines?payment=cancelled`,
    metadata: { fineId: String(fineId), userId: String(userId) },
  });

  await db.insert(paymentsTable).values({
    fineId,
    userId,
    stripeSessionId: session.id,
    amount: String(fine.fineAmount),
    currency: "PHP",
    status: "pending",
  });

  res.json({ sessionId: session.id, url: session.url });
});

router.post("/payments/webhook", async (req, res): Promise<void> => {
  const stripe = await getStripe();
  if (!stripe) {
    res.json({ received: true });
    return;
  }

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env["STRIPE_WEBHOOK_SECRET"];

  if (!webhookSecret) {
    res.status(400).json({ error: "Webhook secret not configured" });
    return;
  }

  let event: any;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    res.status(400).json({ error: `Webhook error: ${err.message}` });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const fineId = parseInt(session.metadata?.fineId ?? "0", 10);
    const userId = parseInt(session.metadata?.userId ?? "0", 10);

    if (fineId && userId) {
      const [payment] = await db
        .select()
        .from(paymentsTable)
        .where(eq(paymentsTable.stripeSessionId, session.id));

      if (payment) {
        await db.update(paymentsTable)
          .set({
            status: "paid",
            stripePaymentIntent: session.payment_intent,
            paidAt: new Date(),
          })
          .where(eq(paymentsTable.id, payment.id));

        const [fine] = await db.select().from(finesTable).where(eq(finesTable.id, fineId));
        if (fine) {
          await db.update(finesTable)
            .set({ status: "paid", amountPaid: fine.fineAmount, updatedAt: new Date() })
            .where(eq(finesTable.id, fineId));

          await db.insert(notificationsTable).values({
            userId,
            type: "payment_confirmed",
            title: "Payment Confirmed",
            message: `Your fine payment of ₱${parseFloat(String(fine.fineAmount)).toFixed(2)} has been received.`,
            metadata: { fineId, paymentId: payment.id },
          });
        }
      }
    }
  }

  res.json({ received: true });
});

router.get("/payments/my", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const payments = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.userId, userId));

  res.json(payments.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    paidAt: p.paidAt?.toISOString() ?? null,
  })));
});

export default router;
