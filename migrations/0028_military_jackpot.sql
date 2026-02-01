CREATE TABLE "workflow_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"slug" text NOT NULL,
	"category" text NOT NULL,
	"tags" text,
	"icon" text,
	"visibility" text DEFAULT 'private' NOT NULL,
	"author_id" text,
	"author_name" text,
	"nodes" text NOT NULL,
	"connections" text NOT NULL,
	"use_count" integer DEFAULT 0 NOT NULL,
	"last_used_at" timestamp,
	"instructions" text,
	"preview_image" text,
	"source_workflow_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "workflow_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workflow_templates" ADD CONSTRAINT "workflow_templates_source_workflow_id_workflows_id_fk" FOREIGN KEY ("source_workflow_id") REFERENCES "public"."workflows"("id") ON DELETE set null ON UPDATE no action;