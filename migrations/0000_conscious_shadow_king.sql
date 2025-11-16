CREATE TYPE "public"."audit_action" AS ENUM('INSERT', 'UPDATE', 'DELETE');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('business', 'person');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('owner', 'manager', 'personnel');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action_timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"action" "audit_action" NOT NULL,
	"schema_name" text NOT NULL,
	"table_name" text NOT NULL,
	"record_id" uuid,
	"user_id" uuid,
	"old_data" jsonb,
	"new_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "contact_roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "contact_roles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text,
	"email" text,
	"phone" text,
	"title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_contacts" (
	"customer_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"contact_role_id" uuid,
	CONSTRAINT "customer_contacts_customer_id_contact_id_pk" PRIMARY KEY("customer_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "customer_type" NOT NULL,
	"business_name" text,
	"first_name" text,
	"last_name" text,
	"primary_email" text,
	"primary_phone" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "document_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"file_url" text NOT NULL,
	"document_type_id" uuid,
	"description" text,
	"uploaded_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig_check_ins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid NOT NULL,
	"personnel_id" uuid NOT NULL,
	"check_in_time" timestamp with time zone,
	"check_out_time" timestamp with time zone,
	"check_in_location" text,
	"check_out_location" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "gig_files" (
	"gig_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"notes" text,
	CONSTRAINT "gig_files_gig_id_file_id_pk" PRIMARY KEY("gig_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "gig_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid NOT NULL,
	"external_invoice_id" text NOT NULL,
	"external_invoice_url" text,
	"amount" numeric(10, 2),
	"status" text,
	"issue_date" date,
	"due_date" date
);
--> statement-breakpoint
CREATE TABLE "gig_personnel" (
	"gig_id" uuid NOT NULL,
	"personnel_id" uuid NOT NULL,
	"role_notes" text,
	CONSTRAINT "gig_personnel_gig_id_personnel_id_pk" PRIMARY KEY("gig_id","personnel_id")
);
--> statement-breakpoint
CREATE TABLE "gig_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "gig_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "gigs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"customer_id" uuid NOT NULL,
	"venue_id" uuid NOT NULL,
	"gig_type_id" uuid,
	"status" text DEFAULT 'pending',
	"notes" text,
	"recurrence_group_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(10, 2) NOT NULL,
	"rate" numeric(10, 2) NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_number" text NOT NULL,
	"customer_id" uuid NOT NULL,
	"gig_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"tax" numeric(10, 2) DEFAULT '0',
	"total" numeric(10, 2) NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"issue_date" date NOT NULL,
	"due_date" date NOT NULL,
	"paid_date" date,
	"payment_method_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_invoice_number_unique" UNIQUE("invoice_number")
);
--> statement-breakpoint
CREATE TABLE "payment_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "payment_methods_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "personnel" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"first_name" text NOT NULL,
	"middle_name" text,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"dob" date,
	"ssn" text,
	"address1" text,
	"address2" text,
	"city" text,
	"state" text,
	"zip" text,
	"personnel_type_id" uuid,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "personnel_email_unique" UNIQUE("email"),
	CONSTRAINT "personnel_phone_unique" UNIQUE("phone")
);
--> statement-breakpoint
CREATE TABLE "personnel_files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"personnel_id" uuid NOT NULL,
	"document_type_id" uuid,
	"file_path" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text,
	"file_size_bytes" bigint,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "personnel_payouts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_id" uuid NOT NULL,
	"personnel_id" uuid NOT NULL,
	"payment_method_id" uuid,
	"amount" numeric(10, 2) NOT NULL,
	"date_paid" date NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "personnel_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "personnel_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_token" text NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "sessions_session_token_unique" UNIQUE("session_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp with time zone,
	"image" text,
	"password_hash" text,
	"role" "user_role" DEFAULT 'personnel' NOT NULL,
	"personnel_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "venue_contacts" (
	"venue_id" uuid NOT NULL,
	"contact_id" uuid NOT NULL,
	"contact_role_id" uuid,
	CONSTRAINT "venue_contacts_venue_id_contact_id_pk" PRIMARY KEY("venue_id","contact_id")
);
--> statement-breakpoint
CREATE TABLE "venue_files" (
	"venue_id" uuid NOT NULL,
	"file_id" uuid NOT NULL,
	"notes" text,
	CONSTRAINT "venue_files_venue_id_file_id_pk" PRIMARY KEY("venue_id","file_id")
);
--> statement-breakpoint
CREATE TABLE "venue_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "venue_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"city" text,
	"state" text,
	"zip" text,
	"phone" text,
	"website" text,
	"occupancy" integer,
	"venue_type_id" uuid,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "verification_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_contacts" ADD CONSTRAINT "customer_contacts_contact_role_id_contact_roles_id_fk" FOREIGN KEY ("contact_role_id") REFERENCES "public"."contact_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_check_ins" ADD CONSTRAINT "gig_check_ins_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_check_ins" ADD CONSTRAINT "gig_check_ins_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_files" ADD CONSTRAINT "gig_files_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_files" ADD CONSTRAINT "gig_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_invoices" ADD CONSTRAINT "gig_invoices_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_personnel" ADD CONSTRAINT "gig_personnel_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_personnel" ADD CONSTRAINT "gig_personnel_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gigs" ADD CONSTRAINT "gigs_gig_type_id_gig_types_id_fk" FOREIGN KEY ("gig_type_id") REFERENCES "public"."gig_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice_items" ADD CONSTRAINT "invoice_items_invoice_id_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel" ADD CONSTRAINT "personnel_personnel_type_id_personnel_types_id_fk" FOREIGN KEY ("personnel_type_id") REFERENCES "public"."personnel_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_files" ADD CONSTRAINT "personnel_files_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_files" ADD CONSTRAINT "personnel_files_document_type_id_document_types_id_fk" FOREIGN KEY ("document_type_id") REFERENCES "public"."document_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_payouts" ADD CONSTRAINT "personnel_payouts_gig_id_gigs_id_fk" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_payouts" ADD CONSTRAINT "personnel_payouts_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "personnel_payouts" ADD CONSTRAINT "personnel_payouts_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_personnel_id_personnel_id_fk" FOREIGN KEY ("personnel_id") REFERENCES "public"."personnel"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_contacts" ADD CONSTRAINT "venue_contacts_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_contacts" ADD CONSTRAINT "venue_contacts_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_contacts" ADD CONSTRAINT "venue_contacts_contact_role_id_contact_roles_id_fk" FOREIGN KEY ("contact_role_id") REFERENCES "public"."contact_roles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_files" ADD CONSTRAINT "venue_files_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_files" ADD CONSTRAINT "venue_files_file_id_files_id_fk" FOREIGN KEY ("file_id") REFERENCES "public"."files"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_venue_type_id_venue_types_id_fk" FOREIGN KEY ("venue_type_id") REFERENCES "public"."venue_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_audit_log_table_record" ON "audit_log" USING btree ("table_name","record_id");--> statement-breakpoint
CREATE INDEX "idx_audit_log_user_id" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contacts_email_phone_index" ON "contacts" USING btree ("email","phone");--> statement-breakpoint
CREATE UNIQUE INDEX "gig_invoices_gig_id_external_invoice_id_index" ON "gig_invoices" USING btree ("gig_id","external_invoice_id");