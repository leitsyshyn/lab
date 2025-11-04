// components/link-preview-card.tsx
"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export type LinkPreviewData = {
  url: string;
  title: string;
  description: string;
  image: string | null;
  siteName: string;
  favicon: string;
};

export function LinkPreviewCard({ data }: { data: LinkPreviewData }) {
  const host = (() => {
    try {
      return new URL(data.url).hostname;
    } catch {
      return data.siteName;
    }
  })();

  return (
    <Card className="overflow-hidden">
      {data.image && (
        <div className="relative h-40 w-full">
          <Image
            src={data.image}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority={false}
          />
        </div>
      )}
      <CardHeader className="flex flex-row items-center gap-3">
        <Avatar className="h-8 w-8">
          <AvatarImage src={data.favicon} />
          <AvatarFallback>{host[0]?.toUpperCase() ?? "W"}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="line-clamp-1">{data.title}</CardTitle>
          <CardDescription className="line-clamp-1">{host}</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3">
          {data.description || "No description available."}
        </p>
      </CardContent>
      <CardFooter>
        <Button asChild variant="secondary" size="sm">
          <a href={data.url} target="_blank" rel="noreferrer">
            Open link
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
