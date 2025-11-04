import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { LiveTodoPage } from "@/components/todo/live-todo-page";
import { db } from "@/db/drizzle";
import { list } from "@/db/schema/todo";
import { Room } from "./Room";

interface PageProps {
  params: Promise<{ listId: string }>;
}

export default async function CollaborativeTodoListPage({ params }: PageProps) {
  const { listId } = await params;

  // Fetch list to get roomId
  const [listData] = await db
    .select()
    .from(list)
    .where(eq(list.id, listId))
    .limit(1);

  if (!listData) {
    notFound();
  }

  return (
    <Room roomId={listData.roomId}>
      <LiveTodoPage />
    </Room>
  );
}
