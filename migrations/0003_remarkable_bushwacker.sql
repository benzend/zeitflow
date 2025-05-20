CREATE TABLE "queued_chain_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"queued_chain_id" integer NOT NULL,
	"chain_step_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "completed_chain_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"queued_chain_step_id" integer NOT NULL,
	"response" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "completed_chains" (
	"id" serial PRIMARY KEY NOT NULL,
	"queued_chain_id" integer NOT NULL,
	"response" text NOT NULL,
	"error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queued_chains" (
	"id" serial PRIMARY KEY NOT NULL,
	"queue_id" integer NOT NULL,
	"chain_id" integer NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "queues" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "queued_chain_steps" ADD CONSTRAINT "queued_chain_steps_queued_chain_id_queued_chains_id_fk" FOREIGN KEY ("queued_chain_id") REFERENCES "public"."queued_chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queued_chain_steps" ADD CONSTRAINT "queued_chain_steps_chain_step_id_chain_steps_id_fk" FOREIGN KEY ("chain_step_id") REFERENCES "public"."chain_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completed_chain_steps" ADD CONSTRAINT "completed_chain_steps_queued_chain_step_id_queued_chain_steps_id_fk" FOREIGN KEY ("queued_chain_step_id") REFERENCES "public"."queued_chain_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "completed_chains" ADD CONSTRAINT "completed_chains_queued_chain_id_queued_chains_id_fk" FOREIGN KEY ("queued_chain_id") REFERENCES "public"."queued_chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queued_chains" ADD CONSTRAINT "queued_chains_queue_id_queues_id_fk" FOREIGN KEY ("queue_id") REFERENCES "public"."queues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queued_chains" ADD CONSTRAINT "queued_chains_chain_id_chains_id_fk" FOREIGN KEY ("chain_id") REFERENCES "public"."chains"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "queues" ADD CONSTRAINT "queues_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;