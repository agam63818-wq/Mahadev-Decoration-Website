import { and, desc, eq, ilike, or } from "drizzle-orm";
import { Router, type IRouter } from "express";
import {
  CreateAdminPaymentBody,
  CreateAdminPaymentResponse,
  CreateBookingRequestBody,
  CreateBookingRequestResponse,
  GetAdminBookingsQueryParams,
  GetAdminBookingsResponse,
  GetAdminPaymentsResponse,
  GetAdminSummaryResponse,
  UpdateBookingStatusBody,
  UpdateBookingStatusParams,
  UpdateBookingStatusResponse,
} from "@workspace/api-zod";
import {
  bookingRequestsTable,
  bookingStatusHistoryTable,
  db,
  paymentsTable,
} from "@workspace/db";

const router: IRouter = Router();

const dateOnly = (value: Date) => value.toISOString().slice(0, 10);
const startOfMonth = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));

router.post("/booking-requests", async (req, res): Promise<void> => {
  const parsed = CreateBookingRequestBody.safeParse(req.body);
  if (!parsed.success) {
    req.log.warn({ errors: parsed.error.message }, "Invalid booking request");
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const [booking] = await db.transaction(async (tx) => {
    const [created] = await tx.insert(bookingRequestsTable).values({
      customerName: input.customerName.trim(),
      phone: input.phone.trim(),
      eventType: input.eventType.trim(),
      eventDate: dateOnly(input.eventDate),
      venue: input.venue.trim(),
      message: input.message?.trim() || null,
      status: "inquiry",
    }).returning();

    await tx.insert(bookingStatusHistoryTable).values({
      bookingRequestId: created.id,
      fromStatus: null,
      toStatus: "inquiry",
      reason: "Public booking request created",
    });

    return [created];
  });

  res.status(201).json(CreateBookingRequestResponse.parse(booking));
});

router.get("/admin/summary", async (_req, res): Promise<void> => {
  const [bookings, payments] = await Promise.all([
    db.select().from(bookingRequestsTable),
    db.select().from(paymentsTable),
  ]);
  const now = new Date();
  const today = dateOnly(now);
  const monthStart = startOfMonth(now);
  const previousMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const nonRefunded = payments.filter((payment) => payment.status.toLowerCase() !== "refunded");
  const received = payments.filter((payment) => ["received", "verified", "paid"].includes(payment.status.toLowerCase()));
  const pending = payments.filter((payment) => ["pending", "due", "overdue"].includes(payment.status.toLowerCase()));
  const currentMonthBookings = bookings.filter((booking) => booking.createdAt >= monthStart).length;
  const previousMonthBookings = bookings.filter(
    (booking) => booking.createdAt >= previousMonthStart && booking.createdAt < monthStart,
  ).length;
  const monthlyGrowth = previousMonthBookings === 0
    ? (currentMonthBookings > 0 ? 100 : 0)
    : Math.round(((currentMonthBookings - previousMonthBookings) / previousMonthBookings) * 100);

  const data = {
    todayEvents: bookings.filter((booking) => booking.eventDate === today).length,
    upcomingEvents: bookings.filter((booking) => booking.eventDate >= today && booking.status !== "cancelled").length,
    pendingInquiries: bookings.filter((booking) => ["inquiry", "quote_sent"].includes(booking.status)).length,
    confirmedBookings: bookings.filter((booking) => ["confirmed", "completed"].includes(booking.status)).length,
    totalRevenue: nonRefunded.reduce((total, payment) => total + payment.amount, 0),
    advanceReceived: received.reduce((total, payment) => total + payment.amount, 0),
    pendingPayments: pending.reduce((total, payment) => total + payment.amount, 0),
    monthlyGrowth,
  };

  res.json(GetAdminSummaryResponse.parse(data));
});

router.get("/admin/bookings", async (req, res): Promise<void> => {
  const parsed = GetAdminBookingsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const query = parsed.data.q?.trim();
  const bookings = await db.select()
    .from(bookingRequestsTable)
    .where(query ? or(
      ilike(bookingRequestsTable.customerName, `%${query}%`),
      ilike(bookingRequestsTable.phone, `%${query}%`),
      ilike(bookingRequestsTable.eventType, `%${query}%`),
      ilike(bookingRequestsTable.venue, `%${query}%`),
    ) : undefined)
    .orderBy(desc(bookingRequestsTable.createdAt));

  res.json(GetAdminBookingsResponse.parse(bookings));
});

router.patch("/admin/bookings/:id/status", async (req, res): Promise<void> => {
  const params = UpdateBookingStatusParams.safeParse(req.params);
  const body = UpdateBookingStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    const error = params.success ? (body.success ? "Invalid request" : body.error.message) : params.error.message;
    res.status(400).json({ error });
    return;
  }

  const [updated] = await db.transaction(async (tx) => {
    const [current] = await tx.select().from(bookingRequestsTable)
      .where(eq(bookingRequestsTable.id, params.data.id));
    if (!current) return [];

    const [booking] = await tx.update(bookingRequestsTable)
      .set({ status: body.data.status.trim(), updatedAt: new Date() })
      .where(eq(bookingRequestsTable.id, params.data.id))
      .returning();
    await tx.insert(bookingStatusHistoryTable).values({
      bookingRequestId: booking.id,
      fromStatus: current.status,
      toStatus: booking.status,
      reason: body.data.reason?.trim() || null,
    });
    return [booking];
  });

  if (!updated) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  res.json(UpdateBookingStatusResponse.parse(updated));
});

router.get("/admin/payments", async (_req, res): Promise<void> => {
  const payments = await db.select().from(paymentsTable).orderBy(desc(paymentsTable.paymentDate));
  res.json(GetAdminPaymentsResponse.parse(payments));
});

router.post("/admin/payments", async (req, res): Promise<void> => {
  const parsed = CreateAdminPaymentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [payment] = await db.insert(paymentsTable).values({
    bookingRequestId: parsed.data.bookingRequestId ?? null,
    customerName: parsed.data.customerName.trim(),
    eventType: parsed.data.eventType.trim(),
    amount: parsed.data.amount,
    status: parsed.data.status.trim(),
    notes: parsed.data.notes?.trim() || null,
  }).returning();
  res.status(201).json(CreateAdminPaymentResponse.parse(payment));
});

export default router;