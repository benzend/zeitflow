ALTER TABLE "queued_chain_steps" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "queued_chain_steps" ADD COLUMN "prompt" text NOT NULL;--> statement-breakpoint
ALTER TABLE "queued_chain_steps" ADD COLUMN "position" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "queued_chains" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "queued_chains" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "queued_chain_steps" ADD CONSTRAINT "queued_chain_steps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queued_chains" ADD CONSTRAINT "queued_chains_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;