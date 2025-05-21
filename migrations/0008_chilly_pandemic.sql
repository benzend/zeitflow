DROP TABLE "completed_chain_steps" CASCADE;--> statement-breakpoint
DROP TABLE "completed_chains" CASCADE;--> statement-breakpoint
DROP TABLE "processing_chain_steps" CASCADE;--> statement-breakpoint
DROP TABLE "processing_chains" CASCADE;--> statement-breakpoint
DROP TABLE "responses" CASCADE;--> statement-breakpoint
ALTER TABLE "queued_chain_steps" ADD COLUMN "response" text;--> statement-breakpoint
ALTER TABLE "queued_chain_steps" ADD COLUMN "status" text NOT NULL;--> statement-breakpoint
ALTER TABLE "queued_chain_steps" ADD COLUMN "error" text;--> statement-breakpoint
ALTER TABLE "queued_chains" ADD COLUMN "status" text NOT NULL;--> statement-breakpoint
ALTER TABLE "queued_chains" ADD COLUMN "error" text;