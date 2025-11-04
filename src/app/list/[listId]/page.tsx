import { and, eq, isNull } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { getTodos } from "@/actions/todo-actions";
import { TodoPage } from "@/components/todo/todo-page";
import { db } from "@/db/drizzle";
import { list, listMember } from "@/db/schema/todo";
import { auth } from "@/lib/auth";

interface PageProps {
  params: Promise<{ listId: string }>;
}

export default async function ListPage({ params }: PageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/sign-in");
  }

  const { listId } = await params;

  const listData = await db
    .select()
    .from(list)
    .where(and(eq(list.id, listId), isNull(list.archivedAt)))
    .limit(1);

  if (listData.length === 0) {
    notFound();
  }

  const [currentList] = listData;

  const isOwner = currentList.ownerId === session.user.id;
  let isMember = false;

  if (!isOwner) {
    const membership = await db
      .select()
      .from(listMember)
      .where(
        and(
          eq(listMember.listId, listId),
          eq(listMember.userId, session.user.id),
        ),
      )
      .limit(1);

    isMember = membership.length > 0;
  }

  if (!isOwner && !isMember) {
    notFound();
  }

  const todos = await getTodos(listId);

  return <TodoPage initialTodos={todos} listId={listId} />;
}
