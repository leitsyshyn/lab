import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import { organization, user } from "./auth";

export const list = pgTable("list", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").references(() => organization.id, {
    onDelete: "set null",
  }),
  roomId: text("room_id").unique().notNull(), // unique -> auto index
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  archivedAt: timestamp("archived_at"),
});

export const todo = pgTable("todo", {
  id: text("id").primaryKey(),
  listId: text("list_id")
    .notNull()
    .references(() => list.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  position: integer("position").notNull(), // DnD ordering (10, 20, 30, ...)
  assignedTo: text("assigned_to").references(() => user.id, {
    onDelete: "set null",
  }),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const listMember = pgTable(
  "list_member",
  {
    listId: text("list_id")
      .notNull()
      .references(() => list.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("editor"),
    addedAt: timestamp("added_at").defaultNow().notNull(),
  },
  (t) => [{ pk: { columns: [t.listId, t.userId] } }],
);
