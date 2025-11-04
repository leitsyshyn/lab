"use client";

import { useEffect, useState } from "react";

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

  // Poll for queue status when we have a jobId
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
            // stop polling by not scheduling another call
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
          // Already finished and cached
          setQueueStatus({
            jobId: data.jobId,
            status: "finished",
            progress: 1,
            result: data.result,
          });
        } else {
          // queued or already running; the polling effect will pick up
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
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold mb-2">
        Prime Counting Demo (Direct vs Queue + Redis)
      </h1>

      <div className="space-y-4 border rounded-lg p-4">
        <div className="flex gap-4 items-center">
          <label className="font-medium">Mode:</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={`px-3 py-1 rounded border ${
                mode === "direct" ? "bg-blue-600 text-white" : "bg-transparent"
              }`}
            >
              Direct (no queue/cache)
            </button>
            <button
              type="button"
              onClick={() => setMode("queue")}
              className={`px-3 py-1 rounded border ${
                mode === "queue" ? "bg-blue-600 text-white" : "bg-transparent"
              }`}
            >
              Queue + Redis (QStash)
            </button>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <label className="font-medium">Limit (N):</label>
          <input
            type="number"
            min={2}
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            className="border rounded px-3 py-1 flex-1"
          />
        </div>

        <button
          type="button"
          onClick={handleRun}
          disabled={loading}
          className="px-4 py-2 rounded bg-green-600 text-white disabled:opacity-60"
        >
          {loading ? "Running..." : "Run"}
        </button>
      </div>

      {mode === "direct" && (
        <div className="border rounded-lg p-4 space-y-2">
          <h2 className="font-semibold mb-1">Direct Result</h2>
          {directResult ? (
            <div className="space-y-1">
              <div>Limit: {directResult.limit.toLocaleString()}</div>
              <div>Prime count: {directResult.primeCount.toLocaleString()}</div>
              <div>Duration: {directResult.durationMs} ms</div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              Run in Direct mode to see the blocking behaviour. The request will
              only respond when all primes are counted.
            </p>
          )}
        </div>
      )}

      {mode === "queue" && (
        <div className="border rounded-lg p-4 space-y-3">
          <h2 className="font-semibold mb-1">Queue + Redis Status</h2>

          {queueError && (
            <p className="text-sm text-red-600">Error: {queueError}</p>
          )}

          {queueStatus ? (
            <>
              <div className="text-sm">
                <div>Job ID: {queueStatus.jobId}</div>
                <div>Status: {queueStatus.status}</div>
              </div>

              {queueStatus.status === "queued" ||
              queueStatus.status === "running" ? (
                <>
                  <div className="w-full bg-gray-200 rounded h-3 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-700">
                    Progress: {progressPercent}%
                    {queueStatus.primeCountSoFar != null && (
                      <> – primes so far: {queueStatus.primeCountSoFar}</>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    The enqueue call itself should return quickly. The heavy
                    work is done by the QStash worker, and this UI just polls
                    Redis for status.
                  </p>
                </>
              ) : null}

              {queueStatus.status === "finished" && queueStatus.result && (
                <div className="space-y-1 text-sm">
                  <div>Limit: {queueStatus.result.limit.toLocaleString()}</div>
                  <div>
                    Prime count:{" "}
                    {queueStatus.result.primeCount.toLocaleString()}
                  </div>
                  <div>
                    Duration (worker): {queueStatus.result.durationMs} ms
                  </div>
                  <div>
                    Cached:{" "}
                    {queueStatus.result ? "yes (result stored in Redis)" : "no"}
                  </div>
                </div>
              )}

              {queueStatus.status === "notFound" && (
                <p className="text-sm text-gray-600">
                  Job not found in Redis (expired or never existed).
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600">
              Run in Queue mode to enqueue a job via QStash and observe Redis
              status updates.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
