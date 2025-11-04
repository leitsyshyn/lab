"use client";

import { LiveList } from "@liveblocks/client";
import { ClientSideSuspense } from "@liveblocks/react";
import type { ReactNode } from "react";
import { RoomProvider } from "@/lib/liveblocks.todos";

interface RoomProps {
  roomId: string;
  children: ReactNode;
}

export function Room({ roomId, children }: RoomProps) {
  return (
    <RoomProvider
      id={roomId}
      initialPresence={{
        cursor: null,
        isDragging: false,
        draggedItemId: null,
      }}
      initialStorage={{
        todos: new LiveList([]),
      }}
    >
      <ClientSideSuspense
        fallback={<div>Loading collaborative features...</div>}
      >
        {children}
      </ClientSideSuspense>
    </RoomProvider>
  );
}
