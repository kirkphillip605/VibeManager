CREATE TABLE "square_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"access_token" text NOT NULL,
	"environment" text DEFAULT 'sandbox' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_tested" timestamp with time zone,
	"test_result" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
