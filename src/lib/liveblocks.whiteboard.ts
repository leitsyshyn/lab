"use client";
import type { JsonObject, LiveMap } from "@liveblocks/client";
import { createRoomContext } from "@liveblocks/react";
import { liveblocksClient } from "@/lib/liveblocks-client";

type WhiteboardPresence = { cursor: { x: number; y: number } | null };
type WhiteboardStorage = { records: LiveMap<string, JsonObject> };
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
} = createRoomContext<WhiteboardPresence, WhiteboardStorage, UserMeta>(
  liveblocksClient,
);
