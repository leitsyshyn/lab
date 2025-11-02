"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/db/drizzle";
import { todo } from "@/db/schema/todo";
import { auth } from "@/lib/auth";

async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session;
}

export async function getTodos(listId: string) {
  await getSession();

  const todos = await db
    .select()
    .from(todo)
    .where(and(eq(todo.listId, listId), isNull(todo.deletedAt)))
    .orderBy(todo.position);

  return todos;
}

export async function createTodo(listId: string, text: string) {
  await getSession();

  if (!text.trim()) {
    throw new Error("Todo text cannot be empty");
  }

  const result = await db
    .select({ maxPosition: sql<number>`COALESCE(MAX(${todo.position}), 0)` })
    .from(todo)
    .where(and(eq(todo.listId, listId), isNull(todo.deletedAt)));

  const nextPosition = (result[0]?.maxPosition ?? 0) + 10;

  const [newTodo] = await db
    .insert(todo)
    .values({
      id: crypto.randomUUID(),
      listId,
      text: text.trim(),
      done: false,
      position: nextPosition,
    })
    .returning();

  revalidatePath("/todo");
  return newTodo;
}

export async function toggleTodo(todoId: string, done: boolean) {
  await getSession();

  const [updatedTodo] = await db
    .update(todo)
    .set({ done, updatedAt: new Date() })
    .where(eq(todo.id, todoId))
    .returning();

  revalidatePath("/todo");
  return updatedTodo;
}

export async function updateTodoText(todoId: string, text: string) {
  await getSession();

  if (!text.trim()) {
    throw new Error("Todo text cannot be empty");
  }

  const [updatedTodo] = await db
    .update(todo)
    .set({ text: text.trim(), updatedAt: new Date() })
    .where(eq(todo.id, todoId))
    .returning();

  revalidatePath("/todo");
  return updatedTodo;
}

export async function deleteTodo(todoId: string) {
  await getSession();

  await db
    .update(todo)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(todo.id, todoId));

  revalidatePath("/todo");
}

export async function reorderTodos(
  listId: string,
  reorderedTodos: Array<{ id: string; position: number }>,
) {
  await getSession();

  await db.transaction(async (tx) => {
    for (const { id, position } of reorderedTodos) {
      await tx
        .update(todo)
        .set({ position, updatedAt: new Date() })
        .where(and(eq(todo.id, id), eq(todo.listId, listId)));
    }
  });

  revalidatePath("/todo");
}
