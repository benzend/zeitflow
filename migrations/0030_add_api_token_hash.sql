ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "api_token_hash" text;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_api_token_hash_unique'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_api_token_hash_unique" UNIQUE("api_token_hash");
  END IF;
END $$;