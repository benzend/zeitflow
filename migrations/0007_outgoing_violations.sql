CREATE TABLE "processing_chain_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"queued_chain_step_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processing_chains" (
	"id" serial PRIMARY KEY NOT NULL,
	"queued_chain_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "completed_chain_steps" DROP CONSTRAINT "completed_chain_steps_queued_chain_step_id_queued_chain_steps_id_fk";
--> statement-breakpoint
ALTER TABLE "completed_chains" DROP CONSTRAINT "completed_chains_queued_chain_id_queued_chains_id_fk";
--> statement-breakpoint
ALTER TABLE "completed_chain_steps" ADD COLUMN "processing_chain_steps_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "completed_chains" ADD COLUMN "processing_chain_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "processing_chain_steps" ADD CONSTRAINT "processing_chain_steps_queued_chain_step_id_queued_chain_steps_id_fk" FOREIGN KEY ("queued_chain_step_id") REFERENCES "public"."queued_chain_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processing_chains" ADD CONSTRAINT "processing_chains_queued_chain_id_queued_chains_id_fk" FOREIGN KEY ("queued_chain_id") REFERENCES "public"."queued_chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completed_chain_steps" ADD CONSTRAINT "completed_chain_steps_processing_chain_steps_id_processing_chain_steps_id_fk" FOREIGN KEY ("processing_chain_steps_id") REFERENCES "public"."processing_chain_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completed_chains" ADD CONSTRAINT "completed_chains_processing_chain_id_processing_chains_id_fk" FOREIGN KEY ("processing_chain_id") REFERENCES "public"."processing_chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completed_chain_steps" DROP COLUMN "queued_chain_step_id";--> statement-breakpoint
ALTER TABLE "completed_chains" DROP COLUMN "queued_chain_id";--> statement-breakpoint
ALTER TABLE "queued_chain_steps" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "queued_chain_steps" DROP COLUMN "current_cycle";--> statement-breakpoint
ALTER TABLE "queued_chains" DROP COLUMN "status";--> statement-breakpoint
ALTER TABLE "queued_chains" DROP COLUMN "current_cycle";