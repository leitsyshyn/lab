"use client";
import { useSyncDemo } from "@tldraw/sync";
import { Tldraw } from "tldraw";
import "tldraw/tldraw.css";

export default function Page() {
  const store = useSyncDemo({ roomId: "leitsyshyn-lab-board" });

  return (
    <div style={{ position: "fixed", inset: 0, top: "3.5rem" }}>
      <Tldraw store={store} />
    </div>
  );
}
