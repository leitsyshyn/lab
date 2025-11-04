// app/page.tsx
"use client";

import { useState } from "react";
import {
  LinkPreviewCard,
  type LinkPreviewData,
} from "@/components/link-preview-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [url, setUrl] = useState("https://news.ycombinator.com/");
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setData(null);
    setLoading(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Failed");
      setData(json as LinkPreviewData);
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Link preview (no queue/cache)</h1>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/article"
          type="url"
          required
        />
        <Button type="submit">Preview</Button>
      </form>

      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-40 w-full" />
          <div className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      )}

      {err && <p className="text-sm text-red-600">Error: {err}</p>}

      {data && <LinkPreviewCard data={data} />}
    </main>
  );
}
