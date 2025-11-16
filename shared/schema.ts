import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  uuid,
  timestamp,
  pgEnum,
  boolean,
  integer,
  date,
  numeric,
  bigint,
  uniqueIndex,
  primaryKey,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["owner", "manager", "personnel"]);
export const customerTypeEnum = pgEnum("customer_type", ["business", "person"]);
export const auditActionEnum = pgEnum("audit_action", ["INSERT", "UPDATE", "DELETE"]);

// Lookup Tables
export const venueTypes = pgTable("venue_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
});

export const personnelTypes = pgTable("personnel_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
});

export const gigTypes = pgTable("gig_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
});

export const documentTypes = pgTable("document_types", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
});

export const contactRoles = pgTable("contact_roles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
});

// Personnel table (must be before users)
export const personnel = pgTable("personnel", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  middleName: text("middle_name"),
  lastName: text("last_name").notNull(),
  email: text("email").unique().notNull(),
  phone: text("phone").unique(),
  dob: date("dob"),
  ssn: text("ssn"), // Will be encrypted in application
  address1: text("address1"),
  address2: text("address2"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  personnelTypeId: uuid("personnel_type_id").references(() => personnelTypes.id, {
    onDelete: "set null",
  }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Users table (Auth)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { withTimezone: true }),
  image: text("image"),
  passwordHash: text("password_hash"),
  role: userRoleEnum("role").notNull().default("personnel"),
  personnelId: uuid("personnel_id").references(() => personnel.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Sessions table (Auth)
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionToken: text("session_token").unique().notNull(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { withTimezone: true }).notNull(),
});

// Verification Tokens table
export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").unique().notNull(),
    expires: timestamp("expires", { withTimezone: true }).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identifier, table.token] }),
  })
);

// Contacts table
export const contacts = pgTable(
  "contacts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    title: text("title"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    uniqueEmailPhone: uniqueIndex().on(table.email, table.phone),
  })
);

// Personnel Files table
export const personnelFiles = pgTable("personnel_files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  personnelId: uuid("personnel_id")
    .notNull()
    .references(() => personnel.id, { onDelete: "cascade" }),
  documentTypeId: uuid("document_type_id").references(() => documentTypes.id, {
    onDelete: "set null",
  }),
  filePath: text("file_path").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type"),
  fileSizeBytes: bigint("file_size_bytes", { mode: "number" }),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: customerTypeEnum("type").notNull(),
  businessName: text("business_name"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  primaryEmail: text("primary_email"),
  primaryPhone: text("primary_phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Venues table
export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zip: text("zip"),
  phone: text("phone"),
  website: text("website"),
  occupancy: integer("occupancy"),
  venueTypeId: uuid("venue_type_id").references(() => venueTypes.id, {
    onDelete: "set null",
  }),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Gigs table
export const gigs = pgTable("gigs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  startTime: timestamp("start_time", { withTimezone: true }).notNull(),
  endTime: timestamp("end_time", { withTimezone: true }).notNull(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  venueId: uuid("venue_id")
    .notNull()
    .references(() => venues.id, { onDelete: "restrict" }),
  gigTypeId: uuid("gig_type_id").references(() => gigTypes.id, {
    onDelete: "set null",
  }),
  status: text("status").default("pending"),
  notes: text("notes"),
  recurrenceGroupId: uuid("recurrence_group_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Gig Personnel junction table
export const gigPersonnel = pgTable(
  "gig_personnel",
  {
    gigId: uuid("gig_id")
      .notNull()
      .references(() => gigs.id, { onDelete: "cascade" }),
    personnelId: uuid("personnel_id")
      .notNull()
      .references(() => personnel.id, { onDelete: "cascade" }),
    roleNotes: text("role_notes"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.gigId, table.personnelId] }),
  })
);

// Customer Contacts junction table
export const customerContacts = pgTable(
  "customer_contacts",
  {
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    contactRoleId: uuid("contact_role_id").references(() => contactRoles.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.customerId, table.contactId] }),
  })
);

// Venue Contacts junction table
export const venueContacts = pgTable(
  "venue_contacts",
  {
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    contactId: uuid("contact_id")
      .notNull()
      .references(() => contacts.id, { onDelete: "cascade" }),
    contactRoleId: uuid("contact_role_id").references(() => contactRoles.id, {
      onDelete: "set null",
    }),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.venueId, table.contactId] }),
  })
);

// Invoices table (enhanced for internal invoice generation)
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").unique().notNull(),
  customerId: uuid("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  gigId: uuid("gig_id")
    .references(() => gigs.id, { onDelete: "set null" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 10, scale: 2 }).default("0"),
  total: numeric("total", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  issueDate: date("issue_date").notNull(),
  dueDate: date("due_date").notNull(),
  paidDate: date("paid_date"),
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Invoice Line Items table
export const invoiceItems = pgTable("invoice_items", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceId: uuid("invoice_id")
    .notNull()
    .references(() => invoices.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  quantity: numeric("quantity", { precision: 10, scale: 2 }).notNull(),
  rate: numeric("rate", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

// Gig Invoices table (keeping for backward compatibility)
export const gigInvoices = pgTable(
  "gig_invoices",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    gigId: uuid("gig_id")
      .notNull()
      .references(() => gigs.id, { onDelete: "cascade" }),
    externalInvoiceId: text("external_invoice_id").notNull(),
    externalInvoiceUrl: text("external_invoice_url"),
    amount: numeric("amount", { precision: 10, scale: 2 }),
    status: text("status"),
    issueDate: date("issue_date"),
    dueDate: date("due_date"),
  },
  (table) => ({
    uniqueGigInvoice: uniqueIndex().on(table.gigId, table.externalInvoiceId),
  })
);

// Personnel Payouts table
export const personnelPayouts = pgTable("personnel_payouts", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  gigId: uuid("gig_id")
    .notNull()
    .references(() => gigs.id, { onDelete: "cascade" }),
  personnelId: uuid("personnel_id")
    .notNull()
    .references(() => personnel.id, { onDelete: "restrict" }),
  paymentMethodId: uuid("payment_method_id").references(() => paymentMethods.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  datePaid: date("date_paid").notNull(),
  notes: text("notes"),
});

// Personnel Check-in/out table
export const gigCheckIns = pgTable("gig_check_ins", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  gigId: uuid("gig_id")
    .notNull()
    .references(() => gigs.id, { onDelete: "cascade" }),
  personnelId: uuid("personnel_id")
    .notNull()
    .references(() => personnel.id, { onDelete: "cascade" }),
  checkInTime: timestamp("check_in_time", { withTimezone: true }),
  checkOutTime: timestamp("check_out_time", { withTimezone: true }),
  checkInLocation: text("check_in_location"), // Could store GPS coords or address
  checkOutLocation: text("check_out_location"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Files/Documents table
export const files = pgTable("files", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  documentTypeId: uuid("document_type_id").references(() => documentTypes.id),
  description: text("description"),
  uploadedBy: uuid("uploaded_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});


// Gig Files junction table
export const gigFiles = pgTable(
  "gig_files",
  {
    gigId: uuid("gig_id")
      .notNull()
      .references(() => gigs.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    notes: text("notes"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.gigId, table.fileId] }),
  })
);

// Venue Files junction table
export const venueFiles = pgTable(
  "venue_files",
  {
    venueId: uuid("venue_id")
      .notNull()
      .references(() => venues.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    notes: text("notes"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.venueId, table.fileId] }),
  })
);

// Audit Log table
export const auditLog = pgTable(
  "audit_log",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    actionTimestamp: timestamp("action_timestamp", { withTimezone: true })
      .notNull()
      .defaultNow(),
    action: auditActionEnum("action").notNull(),
    schemaName: text("schema_name").notNull(),
    tableName: text("table_name").notNull(),
    recordId: uuid("record_id"),
    userId: uuid("user_id"),
    oldData: jsonb("old_data"),
    newData: jsonb("new_data"),
  },
  (table) => ({
    tableRecordIdx: index("idx_audit_log_table_record").on(
      table.tableName,
      table.recordId
    ),
    userIdIdx: index("idx_audit_log_user_id").on(table.userId),
  })
);

// Relations
export const usersRelations = relations(users, ({ one }) => ({
  personnel: one(personnel, {
    fields: [users.personnelId],
    references: [personnel.id],
  }),
}));

export const personnelRelations = relations(personnel, ({ one, many }) => ({
  user: one(users, {
    fields: [personnel.id],
    references: [users.personnelId],
  }),
  personnelType: one(personnelTypes, {
    fields: [personnel.personnelTypeId],
    references: [personnelTypes.id],
  }),
  files: many(personnelFiles),
  gigAssignments: many(gigPersonnel),
  payouts: many(personnelPayouts),
}));

export const customersRelations = relations(customers, ({ many }) => ({
  gigs: many(gigs),
  contacts: many(customerContacts),
}));

export const venuesRelations = relations(venues, ({ one, many }) => ({
  venueType: one(venueTypes, {
    fields: [venues.venueTypeId],
    references: [venueTypes.id],
  }),
  gigs: many(gigs),
  contacts: many(venueContacts),
}));

export const gigsRelations = relations(gigs, ({ one, many }) => ({
  customer: one(customers, {
    fields: [gigs.customerId],
    references: [customers.id],
  }),
  venue: one(venues, {
    fields: [gigs.venueId],
    references: [venues.id],
  }),
  gigType: one(gigTypes, {
    fields: [gigs.gigTypeId],
    references: [gigTypes.id],
  }),
  assignedPersonnel: many(gigPersonnel),
  invoices: many(gigInvoices),
  payouts: many(personnelPayouts),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPersonnelSchema = createInsertSchema(personnel).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertVenueSchema = createInsertSchema(venues).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGigSchema = createInsertSchema(gigs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPayoutSchema = createInsertSchema(personnelPayouts).omit({
  id: true,
});

export const insertGigInvoiceSchema = createInsertSchema(gigInvoices).omit({
  id: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceItemSchema = createInsertSchema(invoiceItems).omit({
  id: true,
});

export const insertCheckInSchema = createInsertSchema(gigCheckIns).omit({
  id: true,
  createdAt: true,
});

export const insertFileSchema = createInsertSchema(files).omit({
  id: true,
  createdAt: true,
});

export const insertPersonnelFileSchema = createInsertSchema(personnelFiles).omit({
  id: true,
  uploadedAt: true,
});

// Lookup table insert schemas
export const insertVenueTypeSchema = createInsertSchema(venueTypes).omit({
  id: true,
});

export const insertPersonnelTypeSchema = createInsertSchema(personnelTypes).omit({
  id: true,
});

export const insertGigTypeSchema = createInsertSchema(gigTypes).omit({
  id: true,
});

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods).omit({
  id: true,
});

export const insertDocumentTypeSchema = createInsertSchema(documentTypes).omit({
  id: true,
});

export const insertContactRoleSchema = createInsertSchema(contactRoles).omit({
  id: true,
});

// Type Exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AuditLog = typeof auditLog.$inferSelect;

export type Personnel = typeof personnel.$inferSelect;
export type InsertPersonnel = z.infer<typeof insertPersonnelSchema>;

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;

export type Venue = typeof venues.$inferSelect;
export type InsertVenue = z.infer<typeof insertVenueSchema>;

export type Gig = typeof gigs.$inferSelect;
export type InsertGig = z.infer<typeof insertGigSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type PersonnelPayout = typeof personnelPayouts.$inferSelect;
export type InsertPayout = z.infer<typeof insertPayoutSchema>;

export type GigInvoice = typeof gigInvoices.$inferSelect;
export type InsertGigInvoice = z.infer<typeof insertGigInvoiceSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceItem = typeof invoiceItems.$inferSelect;
export type InsertInvoiceItem = z.infer<typeof insertInvoiceItemSchema>;

export type GigCheckIn = typeof gigCheckIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

export type FileRecord = typeof files.$inferSelect;
export type InsertFile = z.infer<typeof insertFileSchema>;

export type PersonnelFile = typeof personnelFiles.$inferSelect;
export type InsertPersonnelFile = z.infer<typeof insertPersonnelFileSchema>;

// Alias for backward compatibility
export type InsertPersonnelPayout = InsertPayout;

// Lookup types
export type VenueType = typeof venueTypes.$inferSelect;
export type PersonnelType = typeof personnelTypes.$inferSelect;
export type GigType = typeof gigTypes.$inferSelect;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type DocumentType = typeof documentTypes.$inferSelect;
export type ContactRole = typeof contactRoles.$inferSelect;