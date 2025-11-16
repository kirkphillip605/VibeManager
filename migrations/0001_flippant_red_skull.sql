CREATE TABLE "gig_invoice_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"gig_invoice_id" uuid NOT NULL,
	"payment_amount" numeric(10, 2) NOT NULL,
	"payment_method_id" uuid,
	"payment_date" timestamp with time zone DEFAULT now() NOT NULL,
	"origin" text DEFAULT 'manual' NOT NULL,
	"notes" text,
	"square_payment_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "gig_invoice_payments_square_payment_id_unique" UNIQUE("square_payment_id")
);
--> statement-breakpoint
CREATE TABLE "square_customers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"square_customer_id" text NOT NULL,
	"full_data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "square_customers_square_customer_id_unique" UNIQUE("square_customer_id")
);
--> statement-breakpoint
CREATE TABLE "square_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"square_invoice_id" text NOT NULL,
	"square_customer_id" text,
	"full_data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "square_invoices_square_invoice_id_unique" UNIQUE("square_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "square_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"square_payment_id" text NOT NULL,
	"square_invoice_id" text,
	"square_customer_id" text,
	"full_data" jsonb NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "square_payments_square_payment_id_unique" UNIQUE("square_payment_id")
);
--> statement-breakpoint
ALTER TABLE "customers" ADD COLUMN "square_customer_id" text;--> statement-breakpoint
ALTER TABLE "gig_invoices" ADD COLUMN "square_invoice_uuid" uuid;--> statement-breakpoint
ALTER TABLE "gig_invoice_payments" ADD CONSTRAINT "gig_invoice_payments_gig_invoice_id_gig_invoices_id_fk" FOREIGN KEY ("gig_invoice_id") REFERENCES "public"."gig_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "gig_invoice_payments" ADD CONSTRAINT "gig_invoice_payments_payment_method_id_payment_methods_id_fk" FOREIGN KEY ("payment_method_id") REFERENCES "public"."payment_methods"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "gig_invoice_payments_gig_invoice_id_idx" ON "gig_invoice_payments" USING btree ("gig_invoice_id");--> statement-breakpoint
CREATE INDEX "gig_invoice_payments_payment_method_id_idx" ON "gig_invoice_payments" USING btree ("payment_method_id");--> statement-breakpoint
CREATE INDEX "square_invoices_square_customer_id_idx" ON "square_invoices" USING btree ("square_customer_id");--> statement-breakpoint
CREATE INDEX "square_payments_square_invoice_id_idx" ON "square_payments" USING btree ("square_invoice_id");--> statement-breakpoint
CREATE INDEX "square_payments_square_customer_id_idx" ON "square_payments" USING btree ("square_customer_id");--> statement-breakpoint
ALTER TABLE "gig_invoices" ADD CONSTRAINT "gig_invoices_square_invoice_uuid_square_invoices_id_fk" FOREIGN KEY ("square_invoice_uuid") REFERENCES "public"."square_invoices"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_square_customer_id_unique" UNIQUE("square_customer_id");