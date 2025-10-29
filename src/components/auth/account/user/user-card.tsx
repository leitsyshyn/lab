"use client";

import { Laptop, LogOut, Mail, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { UAParser } from "ua-parser-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { authClient } from "@/lib/auth-client";
import type { Session } from "@/types/auth-types";
import { ChangePasswordDialog } from "./change-password-dialog";
import { EditUserDialog } from "./edit-user-dialog";

interface UserCardProps {
  session: Session | null;
  activeSessions: Session["session"][];
}

export default function UserCard({ session, activeSessions }: UserCardProps) {
  const router = useRouter();
  const [emailVerificationPending, setEmailVerificationPending] =
    useState(false);

  const handleSendVerificationEmail = async () => {
    if (!session?.user.email) return;

    setEmailVerificationPending(true);
    await authClient.sendVerificationEmail(
      { email: session.user.email },
      {
        onSuccess: () => {
          toast.success("Verification email sent successfully");
          setEmailVerificationPending(false);
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to send verification email");
          setEmailVerificationPending(false);
        },
      },
    );
  };

  const handleRevokeSession = async (token: string) => {
    await authClient.revokeSession({
      token,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Session terminated successfully");
          router.refresh();
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to terminate session");
        },
      },
    });
  };

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/sign-in");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to sign out");
        },
      },
    });
  };

  if (!session) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Manage your account settings</CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-6">
          <Item className="p-0">
            <ItemHeader className="font-semibold">Profile</ItemHeader>
            <ItemMedia>
              <Avatar className="size-16">
                <AvatarImage
                  src={session.user.image ?? ""}
                  alt="Profile image"
                />
                <AvatarFallback>{session.user.name}</AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>{session.user.name}</ItemTitle>
              <ItemDescription>{session.user.email}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <EditUserDialog
                initialValues={{
                  name: session.user.name,
                  image: session.user.image,
                }}
              />
            </ItemActions>
          </Item>
          {!session.user.emailVerified && (
            <Item variant="outline">
              <ItemContent>
                <ItemTitle>Verify Email</ItemTitle>
                <ItemDescription>
                  Please verify your email address. Check your inbox for the
                  verification email.
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant={"outline"}
                  onClick={handleSendVerificationEmail}
                  disabled={emailVerificationPending}
                >
                  <Mail className="h-4 w-4" />
                  {emailVerificationPending ? "Sending..." : "Resend"}
                </Button>
              </ItemActions>
            </Item>
          )}

          <Item className="p-0">
            <ItemHeader className="font-semibold">Active Sessions</ItemHeader>
            <ItemContent>
              <ItemGroup className="gap-4">
                {activeSessions
                  .filter((s) => s.userAgent)
                  .map((s) => {
                    const parser = new UAParser(s.userAgent || "");
                    const os = parser.getOS();
                    const browser = parser.getBrowser();
                    const isCurrent = s.id === session.session.id;

                    return (
                      <Item key={s.id} variant="outline">
                        <ItemMedia variant="icon">
                          <Laptop className="h-4 w-4" />
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>
                            {os.name}
                            {os.name && browser.name && ", "}
                            {browser.name}
                          </ItemTitle>
                          <ItemDescription>
                            {isCurrent
                              ? "Current session"
                              : `Last active: ${new Date(s.updatedAt).toLocaleString()}`}
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive"
                            onClick={() =>
                              isCurrent
                                ? handleSignOut()
                                : handleRevokeSession(s.token)
                            }
                          >
                            {isCurrent ? (
                              <>
                                <LogOut className="h-4 w-4" />
                                Sign Out
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4" />
                                Terminate
                              </>
                            )}
                          </Button>
                        </ItemActions>
                      </Item>
                    );
                  })}
              </ItemGroup>
            </ItemContent>
          </Item>
          <Item className="p-0">
            <ItemHeader className="font-semibold">Security</ItemHeader>
            <ItemContent>
              <ChangePasswordDialog />
            </ItemContent>
          </Item>
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
