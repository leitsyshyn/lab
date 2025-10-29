import { cva, type VariantProps } from "class-variance-authority";
import { Crown, Shield, User } from "lucide-react";
import type * as React from "react";
import { cn } from "@/lib/utils";

const roleIcons = {
  owner: Crown,
  admin: Shield,
  member: User,
};

const roleBadgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors",
  {
    variants: {
      role: {
        owner:
          "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
        admin:
          "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
        member:
          "border-transparent bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
      },
    },
    defaultVariants: {
      role: "member",
    },
  },
);

export interface RoleBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof roleBadgeVariants> {
  role: "owner" | "admin" | "member";
}

export function RoleBadge({ role, className, ...props }: RoleBadgeProps) {
  const RoleIcon = roleIcons[role];

  return (
    <span className={cn(roleBadgeVariants({ role }), className)} {...props}>
      <RoleIcon className="h-3 w-3 mr-1" />
      <span className="capitalize">{role}</span>
    </span>
  );
}
