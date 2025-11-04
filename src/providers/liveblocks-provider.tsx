"use client";

import { LiveblocksProvider as LiveblocksProviderReact } from "@liveblocks/react";
import type { ReactNode } from "react";

export default function LiveblocksProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <LiveblocksProviderReact
      //   publicApiKey={process.env.NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY!}
      authEndpoint="/api/liveblocks-auth"
    >
      {children}
    </LiveblocksProviderReact>
  );
}
