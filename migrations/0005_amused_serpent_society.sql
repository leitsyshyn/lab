CREATE TABLE "list" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"owner_id" text NOT NULL,
	"organization_id" text,
	"room_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"archived_at" timestamp,
	CONSTRAINT "list_room_id_unique" UNIQUE("room_id")
);
--> statement-breakpoint
CREATE TABLE "list_member" (
	"list_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'editor' NOT NULL,
	"added_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "todo" DROP CONSTRAINT "todo_created_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "todo" DROP CONSTRAINT "todo_assignee_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "todo" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "list_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "position" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "assigned_to" text;--> statement-breakpoint
ALTER TABLE "todo" ADD COLUMN "deleted_at" timestamp;--> statement-breakpoint
ALTER TABLE "list" ADD CONSTRAINT "list_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list" ADD CONSTRAINT "list_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_member" ADD CONSTRAINT "list_member_list_id_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "list_member" ADD CONSTRAINT "list_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_list_id_list_id_fk" FOREIGN KEY ("list_id") REFERENCES "public"."list"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" ADD CONSTRAINT "todo_assigned_to_user_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN "order";--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN "created_by_id";--> statement-breakpoint
ALTER TABLE "todo" DROP COLUMN "assignee_id";