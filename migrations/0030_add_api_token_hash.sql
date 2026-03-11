ALTER TABLE "users" ADD COLUMN "api_token_hash" text;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_api_token_hash_unique" UNIQUE("api_token_hash");