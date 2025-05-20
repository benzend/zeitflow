CREATE TABLE "responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"completed_chain_step_id" integer NOT NULL,
	"response" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_completed_chain_step_id_completed_chain_steps_id_fk" FOREIGN KEY ("completed_chain_step_id") REFERENCES "public"."completed_chain_steps"("id") ON DELETE cascade ON UPDATE no action;