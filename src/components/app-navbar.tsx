"use client";

import { Home, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function AppNavbar() {
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const isHomePage = pathname === "/";

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-xl">Lab</span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-2">
          {!isHomePage && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Home
              </Link>
            </Button>
          )}
          {session?.user && (
            <Button variant="ghost" size="sm" asChild>
              <Link href="/account">
                <User className="h-4 w-4 mr-2" />
                Account
              </Link>
            </Button>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  );
}
