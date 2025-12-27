ALTER TABLE "assets" DROP CONSTRAINT "assets_uploaded_by_users_id_fk";
--> statement-breakpoint
ALTER TABLE "assets" ADD CONSTRAINT "assets_uploaded_by_users_email_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("email") ON DELETE set null ON UPDATE no action;