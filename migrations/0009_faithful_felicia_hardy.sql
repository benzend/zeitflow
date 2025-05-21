ALTER TABLE "queued_chain_steps" ALTER COLUMN "status" SET DEFAULT 'pending';--> statement-breakpoint
ALTER TABLE "queued_chains" ALTER COLUMN "status" SET DEFAULT 'pending';