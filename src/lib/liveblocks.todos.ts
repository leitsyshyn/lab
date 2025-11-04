"use client";
import type { LiveList, LiveObject } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { liveblocksClient } from "@/lib/liveblocks-client";
import type { Todo } from "@/types/todo-types";

type TodosPresence = {
  cursor: { x: number; y: number } | null;
  isDragging: boolean;
  draggedItemId: string | null;
};
type TodosStorage = { todos: LiveList<LiveObject<Todo>> };
type UserMeta = {
  id: string;
  info: { name: string; email: string | null; color: string };
};

export const {
  RoomProvider,
  useStorage,
  useMutation,
  useOthers,
  useSelf,
  useUpdateMyPresence,
} = createRoomContext<TodosPresence, TodosStorage, UserMeta>(liveblocksClient);
