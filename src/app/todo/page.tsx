import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getTodos } from "@/actions/todo-actions";
import { TodoPageClient } from "@/components/todo/todo-page-client";
import { db } from "@/db/drizzle";
import { list } from "@/db/schema/todo";
import { auth } from "@/lib/auth";

const DEFAULT_LIST_ID = "default-list";

async function ensureDefaultList(userId: string) {
  const existingList = await db
    .select()
    .from(list)
    .where(eq(list.id, DEFAULT_LIST_ID))
    .limit(1);

  if (existingList.length === 0) {
    await db.insert(list).values({
      id: DEFAULT_LIST_ID,
      title: "My Tasks",
      ownerId: userId,
      roomId: `room-${DEFAULT_LIST_ID}`,
    });
  }

  return DEFAULT_LIST_ID;
}

export default async function TodoPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const listId = await ensureDefaultList(session.user.id);
  const todos = await getTodos(listId);

  return <TodoPageClient initialTodos={todos} listId={listId} />;
}
