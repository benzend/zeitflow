CREATE TABLE "slack_bots" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text DEFAULT 'ZeitFlow Bot' NOT NULL,
	"bot_token" text NOT NULL,
	"team_id" text NOT NULL,
	"team_name" text,
	"bot_user_id" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slack_bots" ADD CONSTRAINT "slack_bots_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;