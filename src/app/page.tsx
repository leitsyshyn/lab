"use client";

import { SignOutButton } from "@/components/auth/sign-out-button";
import Todos from "@/components/todos";
import { authClient } from "@/lib/auth-client";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between p-4 border-b">
        <h1 className="text-2xl font-bold">Todos</h1>
        <div className="flex items-center gap-4">
          {session?.user && (
            <>
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <SignOutButton />
            </>
          )}
        </div>
      </div>
      <Todos todos={[]} />
    </div>
  );
}
