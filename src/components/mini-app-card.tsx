import { ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MiniAppCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export function MiniAppCard({
  title,
  description,
  href,
  icon: Icon,
  badge,
}: MiniAppCardProps) {
  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-primary/10 p-2">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          {badge && (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/20 text-primary">
              {badge}
            </span>
          )}
        </div>
        <CardDescription className="mt-3">{description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        <Button asChild className="w-full group">
          <Link href={href}>
            Try it out
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
