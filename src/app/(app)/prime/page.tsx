"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type Mode = "direct" | "queue";

type DirectResult = {
  limit: number;
  primeCount: number;
  durationMs: number;
};

type QueueEnqueueResponse = {
  jobId: string;
  mode: "queue";
  fromCache: boolean;
  status: "queued" | "running" | "finished";
  progress?: number;
  result?: QueueResult;
};

type QueueResult = {
  status: "finished";
  jobId: string;
  limit: number;
  primeCount: number;
  durationMs: number;
  startedAt: number;
  finishedAt: number;
};

type StatusResponse = {
  jobId: string | null;
  status: "queued" | "running" | "finished" | "notFound" | "unknown";
  progress?: number;
  primeCountSoFar?: number;
  result?: QueueResult;
};

export default function PrimeDemoPage() {
  const [mode, setMode] = useState<Mode>("direct");
  const [limit, setLimit] = useState("300000");
  const [loading, setLoading] = useState(false);

  const [directResult, setDirectResult] = useState<DirectResult | null>(null);

  const [queueJobId, setQueueJobId] = useState<string | null>(null);
  const [queueStatus, setQueueStatus] = useState<StatusResponse | null>(null);
  const [queueError, setQueueError] = useState<string | null>(null);

  useEffect(() => {
    if (!queueJobId) return;

    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch(`/api/prime/status?jobId=${queueJobId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setQueueStatus({
              jobId: queueJobId,
              status: "notFound",
            });
          }
          return;
        }
        const data = (await res.json()) as StatusResponse;
        if (!cancelled) {
          setQueueStatus(data);
          if (data.status === "finished") {
            return;
          }
        }
      } catch (e: any) {
        if (!cancelled) {
          setQueueError(e?.message ?? "Status poll failed");
        }
      }

      if (!cancelled) {
        setTimeout(poll, 1000);
      }
    }

    poll();

    return () => {
      cancelled = true;
    };
  }, [queueJobId]);

  const handleRun = async () => {
    setLoading(true);
    setDirectResult(null);
    setQueueStatus(null);
    setQueueError(null);

    const numericLimit = Number.parseInt(limit, 10) || 0;

    try {
      if (mode === "direct") {
        const res = await fetch("/api/prime/direct", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: numericLimit }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(
            body.error ?? `Direct request failed (${res.status})`,
          );
        }

        const data = (await res.json()) as DirectResult;
        setDirectResult(data);
      } else {
        const res = await fetch("/api/prime/queue", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ limit: numericLimit }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? `Queue request failed (${res.status})`);
        }

        const data = (await res.json()) as QueueEnqueueResponse;
        setQueueJobId(data.jobId);

        if (data.fromCache && data.result) {
          setQueueStatus({
            jobId: data.jobId,
            status: "finished",
            progress: 1,
            result: data.result,
          });
        } else {
          setQueueStatus({
            jobId: data.jobId,
            status: data.status,
            progress: data.progress ?? 0,
          });
        }
      }
    } catch (e: any) {
      if (mode === "direct") {
        alert(e?.message ?? "Direct run failed");
      } else {
        setQueueError(e?.message ?? "Queue run failed");
      }
    } finally {
      setLoading(false);
    }
  };

  const progressPercent =
    queueStatus?.progress != null ? Math.round(queueStatus.progress * 100) : 0;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Prime Counting Demo</CardTitle>
            <CardDescription>
              Compare direct computation vs. queue-based processing with QStash
              and Redis caching
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Mode</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={mode === "direct" ? "default" : "outline"}
                    onClick={() => setMode("direct")}
                    className="flex-1"
                  >
                    Direct
                  </Button>
                  <Button
                    type="button"
                    variant={mode === "queue" ? "default" : "outline"}
                    onClick={() => setMode("queue")}
                    className="flex-1"
                  >
                    Queue + Redis
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="limit">Limit (N)</Label>
                <Input
                  id="limit"
                  type="number"
                  min={2}
                  value={limit}
                  onChange={(e) => setLimit(e.target.value)}
                />
              </div>

              <Button
                type="button"
                onClick={handleRun}
                disabled={loading}
                className="w-full"
              >
                {loading ? "Running..." : "Run Calculation"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {mode === "direct" && (
          <Card>
            <CardHeader>
              <CardTitle>Direct Result</CardTitle>
              <CardDescription>
                Blocking computation - response only after completion
              </CardDescription>
            </CardHeader>
            <CardContent>
              {directResult ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Limit:</span>
                    <span className="font-mono">
                      {directResult.limit.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prime count:</span>
                    <span className="font-mono">
                      {directResult.primeCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration:</span>
                    <span className="font-mono">
                      {directResult.durationMs} ms
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run in Direct mode to see blocking behavior. The request will
                  only respond when all primes are counted.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {mode === "queue" && (
          <Card>
            <CardHeader>
              <CardTitle>Queue + Redis Status</CardTitle>
              <CardDescription>
                Non-blocking computation with real-time status updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              {queueError && (
                <div className="text-sm text-destructive mb-4">
                  Error: {queueError}
                </div>
              )}

              {queueStatus ? (
                <div className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Job ID:</span>
                      <Badge variant="outline" className="font-mono">
                        {queueStatus.jobId?.slice(0, 8)}...
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge
                        variant={
                          queueStatus.status === "finished"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {queueStatus.status}
                      </Badge>
                    </div>
                  </div>

                  {(queueStatus.status === "queued" ||
                    queueStatus.status === "running") && (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Progress
                          </span>
                          <span className="font-mono">{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} />
                        {queueStatus.primeCountSoFar != null && (
                          <p className="text-xs text-muted-foreground">
                            Primes found so far:{" "}
                            {queueStatus.primeCountSoFar.toLocaleString()}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        The enqueue call returns immediately. Heavy computation
                        is done by QStash worker, with status polled from Redis.
                      </p>
                    </>
                  )}

                  {queueStatus.status === "finished" && queueStatus.result && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Limit:</span>
                        <span className="font-mono">
                          {queueStatus.result.limit.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Prime count:
                        </span>
                        <span className="font-mono">
                          {queueStatus.result.primeCount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Duration (worker):
                        </span>
                        <span className="font-mono">
                          {queueStatus.result.durationMs} ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cached:</span>
                        <Badge variant="secondary">Yes (Redis)</Badge>
                      </div>
                    </div>
                  )}

                  {queueStatus.status === "notFound" && (
                    <p className="text-sm text-muted-foreground">
                      Job not found in Redis (expired or never existed).
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run in Queue mode to enqueue a job via QStash and observe
                  Redis status updates in real-time.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
