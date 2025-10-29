"use client";

import {
  Building2,
  Mail,
  MoreHorizontal,
  User,
  UserCog,
  UserMinus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { authClient } from "@/lib/auth-client";
import type { ActiveOrganization, Session } from "@/types/auth-types";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { DeleteOrganizationDialog } from "./delete-organization-dialog";
import { EditOrganizationDialog } from "./edit-organization-dialog";
import { InviteMemberDialog } from "./invite-member-dialog";
import { RoleBadge } from "./role-badge";

interface OrganizationCardProps {
  session: Session | null;
  activeOrganization: ActiveOrganization | null;
}

export default function OrganizationCard({
  session,
  activeOrganization,
}: OrganizationCardProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  const { data: organizations } = authClient.useListOrganizations();

  const currentMember = activeOrganization?.members.find(
    (member) => member.userId === session?.user.id,
  );

  const isOwnerOrAdmin =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  const handleSetActiveOrganization = async (organizationId: string | null) => {
    setLoading(organizationId || "personal");

    await authClient.organization.setActive(
      { organizationId },
      {
        onSuccess: () => {
          toast.success("Active organization updated");
          router.refresh();
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to set active organization");
        },
      },
    );

    setLoading(null);
  };

  const handleRemoveMember = async (memberId: string, memberName: string) => {
    setLoading(memberId);

    await authClient.organization.removeMember(
      { memberIdOrEmail: memberId },
      {
        onSuccess: () => {
          toast.success(`${memberName} removed from organization`);
          router.refresh();
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to remove member");
        },
      },
    );

    setLoading(null);
  };

  const handleUpdateMemberRole = async (
    memberId: string,
    newRole: "owner" | "admin" | "member",
    memberName: string,
  ) => {
    setLoading(memberId);

    await authClient.organization.updateMemberRole(
      { memberId, role: newRole },
      {
        onSuccess: () => {
          toast.success(`${memberName}'s role updated to ${newRole}`);
          router.refresh();
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to update role");
        },
      },
    );

    setLoading(null);
  };

  const handleCancelInvitation = async (
    invitationId: string,
    email: string,
  ) => {
    setLoading(invitationId);

    await authClient.organization.cancelInvitation(
      { invitationId },
      {
        onSuccess: () => {
          toast.success(`Invitation to ${email} canceled`);
          router.refresh();
        },
        onError: (ctx) => {
          toast.error(ctx.error.message || "Failed to cancel invitation");
        },
      },
    );

    setLoading(null);
  };

  const currentOrgId = activeOrganization?.id || "personal";

  console.log(
    activeOrganization?.invitations.filter((inv) => inv.status === "pending"),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Organizations</CardTitle>
        <CardDescription>
          Manage your organizations and team members
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ItemGroup className="gap-6">
          <div className="flex items-center gap-2">
            <Select
              value={currentOrgId}
              onValueChange={(value) =>
                handleSetActiveOrganization(value === "personal" ? null : value)
              }
              disabled={loading !== null}
            >
              <SelectTrigger size="sm" className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>Personal</span>
                  </div>
                </SelectItem>
                {organizations?.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span>{org.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <CreateOrganizationDialog />
          </div>
          <Item className="p-0">
            <ItemHeader className="font-semibold">Active</ItemHeader>
            <ItemMedia>
              <Avatar className="size-16">
                <AvatarImage
                  src={
                    activeOrganization
                      ? (activeOrganization.logo ?? "")
                      : (session?.user.image ?? "")
                  }
                  alt={activeOrganization?.name || "Personal"}
                />
                <AvatarFallback>
                  {activeOrganization ? (
                    <Building2 className="h-8 w-8" />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </AvatarFallback>
              </Avatar>
            </ItemMedia>
            <ItemContent>
              <ItemTitle>
                {activeOrganization?.name || "Personal Workspace"}
              </ItemTitle>
              <ItemDescription>
                {activeOrganization?.slug || "Your personal workspace"}
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <div className="flex items-center gap-2">
                {activeOrganization && currentMember && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <EditOrganizationDialog
                        organization={activeOrganization}
                      />
                      {currentMember.role === "owner" && (
                        <DeleteOrganizationDialog
                          organization={activeOrganization}
                        />
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </ItemActions>
          </Item>

          {activeOrganization && (
            <Item className="p-0">
              <ItemHeader className="font-semibold">
                Members
                {isOwnerOrAdmin && <InviteMemberDialog />}
              </ItemHeader>
              <ItemContent>
                <ItemGroup className="gap-4">
                  {activeOrganization.members.map((member) => {
                    if (!member.user) return null;

                    const isCurrentUser = member.userId === session?.user.id;

                    return (
                      <Item key={member.id} variant="outline">
                        <ItemMedia variant="image">
                          <Avatar>
                            <AvatarImage
                              src={member.user.image ?? ""}
                              alt={member.user.name}
                            />
                            <AvatarFallback>
                              {member.user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                        </ItemMedia>
                        <ItemContent>
                          <ItemTitle>
                            {member.user.name}
                            {isCurrentUser && (
                              <span className="text-xs text-muted-foreground">
                                {" "}
                                (You)
                              </span>
                            )}
                          </ItemTitle>
                          <ItemDescription className="flex items-center gap-2">
                            <RoleBadge
                              role={member.role as "owner" | "admin" | "member"}
                            />
                            <span className="text-muted-foreground">
                              {member.user.email}
                            </span>
                          </ItemDescription>
                        </ItemContent>
                        <ItemActions>
                          {isOwnerOrAdmin && !isCurrentUser && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={loading === member.id}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {member.role === "member" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateMemberRole(
                                        member.id,
                                        "admin",
                                        member.user.name,
                                      )
                                    }
                                  >
                                    <UserCog className="h-4 w-4" />
                                    Make Admin
                                  </DropdownMenuItem>
                                )}
                                {member.role === "admin" && (
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleUpdateMemberRole(
                                        member.id,
                                        "member",
                                        member.user.name,
                                      )
                                    }
                                  >
                                    <User className="h-4 w-4" />
                                    Make Member
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() =>
                                    handleRemoveMember(
                                      member.id,
                                      member.user.name,
                                    )
                                  }
                                >
                                  <UserMinus className="h-4 w-4" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </ItemActions>
                      </Item>
                    );
                  })}
                </ItemGroup>
              </ItemContent>
            </Item>
          )}

          {activeOrganization &&
            activeOrganization.invitations.filter(
              (inv) => inv.status === "pending",
            ).length > 0 && (
              <Item className="p-0">
                <ItemHeader className="font-semibold">
                  Pending Invitations
                </ItemHeader>
                <ItemContent>
                  <ItemGroup className="gap-4">
                    {activeOrganization.invitations
                      .filter((inv) => inv.status === "pending")
                      .map((invitation) => {
                        const invitationRole = invitation.role || "member";

                        return (
                          <Item key={invitation.id} variant="outline">
                            <ItemMedia variant="icon">
                              <Mail className="h-4 w-4" />
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>{invitation.email}</ItemTitle>
                              <ItemDescription className="flex items-center gap-2">
                                <RoleBadge
                                  role={
                                    invitationRole as
                                      | "owner"
                                      | "admin"
                                      | "member"
                                  }
                                />
                                <span className="text-muted-foreground">
                                  Expires{" "}
                                  {new Date(
                                    invitation.expiresAt,
                                  ).toLocaleDateString()}
                                </span>
                              </ItemDescription>
                            </ItemContent>
                            <ItemActions>
                              {isOwnerOrAdmin && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() =>
                                    handleCancelInvitation(
                                      invitation.id,
                                      invitation.email,
                                    )
                                  }
                                  disabled={loading === invitation.id}
                                >
                                  {loading === invitation.id
                                    ? "Canceling..."
                                    : "Cancel"}
                                </Button>
                              )}
                            </ItemActions>
                          </Item>
                        );
                      })}
                  </ItemGroup>
                </ItemContent>
              </Item>
            )}
        </ItemGroup>
      </CardContent>
    </Card>
  );
}
