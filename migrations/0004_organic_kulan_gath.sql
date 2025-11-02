ALTER TABLE "todo" ALTER COLUMN "id" SET DATA TYPE serial;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "created_by_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "assignee_id" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_created_by_id_user_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_assignee_id_user_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;