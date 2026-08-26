import {
  date,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const bookingRequestsTable = pgTable("booking_requests", {
  id: serial("id").primaryKey(),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  phone: varchar("phone", { length: 32 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  eventDate: date("event_date", { mode: "string" }).notNull(),
  venue: varchar("venue", { length: 240 }).notNull(),
  message: text("message"),
  status: varchar("status", { length: 32 }).notNull().default("inquiry"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("booking_requests_created_at_idx").on(table.createdAt),
}));

export const bookingStatusHistoryTable = pgTable("booking_status_history", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id")
    .notNull()
    .references(() => bookingRequestsTable.id, { onDelete: "cascade" }),
  fromStatus: varchar("from_status", { length: 32 }),
  toStatus: varchar("to_status", { length: 32 }).notNull(),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("booking_status_history_created_at_idx").on(table.createdAt),
}));

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingRequestId: integer("booking_request_id")
    .references(() => bookingRequestsTable.id, { onDelete: "set null" }),
  customerName: varchar("customer_name", { length: 160 }).notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 32 }).notNull().default("received"),
  paymentDate: timestamp("payment_date", { withTimezone: true }).defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  createdAtIdx: index("payments_created_at_idx").on(table.createdAt),
}));

type InferInsert<T> = T extends { $inferInsert: infer Insert } ? Insert : never;

export type BookingRequest = typeof bookingRequestsTable.$inferSelect;
export type InsertBookingRequest = InferInsert<typeof bookingRequestsTable>;
export type BookingStatusHistory = typeof bookingStatusHistoryTable.$inferSelect;
export type Payment = typeof paymentsTable.$inferSelect;
export type InsertPayment = InferInsert<typeof paymentsTable>;