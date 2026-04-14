CREATE TYPE "public"."platform" AS ENUM('TWITTER', 'LINKEDIN', 'INSTAGRAM', 'FACEBOOK');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('DRAFT', 'SCHEDULED', 'PUBLISHED', 'FAILED');--> statement-breakpoint
CREATE TABLE "analytics_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"followers_count" integer DEFAULT 0 NOT NULL,
	"engagement_rate" text,
	"snapshot_date" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "auto_reply_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"trigger_keywords" jsonb NOT NULL,
	"reply_content" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "connected_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"platform_account_id" varchar(255) NOT NULL,
	"platform_username" varchar(255),
	"access_token" text NOT NULL,
	"refresh_token" text,
	"expires_at" timestamp,
	"profile_picture_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "post_platform_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"post_id" uuid NOT NULL,
	"platform" "platform" NOT NULL,
	"platform_post_id" varchar(255),
	"status" "post_status" DEFAULT 'SCHEDULED' NOT NULL,
	"error_message" text,
	"published_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"media_urls" jsonb DEFAULT '[]'::jsonb,
	"scheduled_at" timestamp,
	"status" "post_status" DEFAULT 'DRAFT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerk_id" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_clerk_id_unique" UNIQUE("clerk_id")
);
--> statement-breakpoint
ALTER TABLE "analytics_snapshots" ADD CONSTRAINT "analytics_snapshots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "auto_reply_rules" ADD CONSTRAINT "auto_reply_rules_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connected_accounts" ADD CONSTRAINT "connected_accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_platform_results" ADD CONSTRAINT "post_platform_results_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;