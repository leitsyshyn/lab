"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";

interface InvitationPageProps {
  invitationId: string;
}

interface InvitationData {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  inviterId: string;
  status: string;
  organization?: {
    name: string;
    slug: string;
  };
  inviter?: {
    name: string;
    email: string;
  };
}

export default function InvitationPage({ invitationId }: InvitationPageProps) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isAccepting, setIsAccepting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [invitationLoading, setInvitationLoading] = useState(true);
  const [invitationError, setInvitationError] = useState<string | null>(null);

  useEffect(() => {
    if (isPending) return;

    if (!session) {
      router.push(
        `/sign-in?callbackUrl=${encodeURIComponent(`/accept-invitation/${invitationId}`)}`,
      );
      return;
    }

    authClient.organization
      .getInvitation({
        query: { id: invitationId },
      })
      .then((result) => {
        if (result.error) {
          if (
            result.error.status === 401 ||
            result.error.code === "UNAUTHORIZED"
          ) {
            router.push(
              `/sign-in?callbackUrl=${encodeURIComponent(`/accept-invitation/${invitationId}`)}`,
            );
            return;
          }

          setInvitationError(
            result.error.message || "Failed to load invitation",
          );
        } else {
          setInvitation(result.data);
        }
        setInvitationLoading(false);
      })
      .catch(() => {
        setInvitationError("An unexpected error occurred");
        setInvitationLoading(false);
      });
  }, [session, isPending, invitationId, router]);

  async function handleAcceptInvitation() {
    setIsAccepting(true);
    await authClient.organization.acceptInvitation({
      invitationId,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Invitation accepted successfully!");
          router.push("/account");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to accept invitation");
        },
      },
    });
    setIsAccepting(false);
  }

  async function handleRejectInvitation() {
    setIsAccepting(true);
    await authClient.organization.rejectInvitation({
      invitationId,
      fetchOptions: {
        onSuccess: () => {
          toast.success("Invitation rejected");
          router.push("/account");
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to reject invitation");
        },
      },
    });
  }

  if (isPending || invitationLoading || (!session && !invitationError)) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-12">
          <Spinner />
        </CardContent>
      </Card>
    );
  }

  if (invitationError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Invitation</CardTitle>
          <CardDescription>{invitationError}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/account")} variant="outline">
            Go to Account
          </Button>
        </CardFooter>
      </Card>
    );
  }

  if (!invitation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invitation Not Found</CardTitle>
          <CardDescription>
            This invitation may have expired or been revoked.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => router.push("/account")} variant="outline">
            Go to Account
          </Button>
        </CardFooter>
      </Card>
    );
  }

  const { organization, inviter, role } = invitation;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organization Invitation</CardTitle>
        <CardDescription>
          You&apos;ve been invited to join an organization
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {organization && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Organization</span>
            <span className="text-base font-medium">{organization.name}</span>
          </div>
        )}

        {inviter && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Invited by</span>
            <span className="text-base font-medium">
              {inviter.name || inviter.email}
            </span>
          </div>
        )}

        {role && (
          <div className="flex flex-col gap-1">
            <span className="text-sm text-muted-foreground">Role</span>
            <span className="text-base font-medium capitalize">{role}</span>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button
          onClick={handleAcceptInvitation}
          disabled={isAccepting}
          className="flex-1"
        >
          {isAccepting ? "Accepting..." : "Accept Invitation"}
        </Button>
        <Button
          onClick={handleRejectInvitation}
          disabled={isAccepting}
          variant="outline"
          className="flex-1"
        >
          Reject
        </Button>
      </CardFooter>
    </Card>
  );
}
