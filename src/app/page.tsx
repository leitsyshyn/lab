"use client";

import { Crown } from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { Button } from "@/components/ui/button";
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
              <Link href="/flag">
                <Button variant="outline" size="sm">
                  <Crown className="w-4 h-4 mr-2" />
                  Flag
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground">
                {session.user.email}
              </span>
              <SignOutButton />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
