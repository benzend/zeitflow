CREATE TABLE "queued_chain_variables" (
	"id" serial PRIMARY KEY NOT NULL,
	"queued_chain_id" integer NOT NULL,
	"user_id" text NOT NULL,
	"variable_name" text NOT NULL,
	"variable_value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
DROP TABLE "queued_chain_inputs" CASCADE;--> statement-breakpoint
ALTER TABLE "queued_chain_variables" ADD CONSTRAINT "queued_chain_variables_queued_chain_id_queued_chains_id_fk" FOREIGN KEY ("queued_chain_id") REFERENCES "public"."queued_chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queued_chain_variables" ADD CONSTRAINT "queued_chain_variables_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;