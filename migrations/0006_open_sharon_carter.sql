ALTER TABLE "queued_chain_steps" ADD COLUMN "current_cycle" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "queued_chains" ADD COLUMN "current_cycle" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chain_steps" DROP COLUMN "current_cycle";--> statement-breakpoint
ALTER TABLE "chains" DROP COLUMN "current_cycle";