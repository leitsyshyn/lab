import type { NextRequest } from "next/server";
import {
  type JobResultValue,
  type JobStatusValue,
  makeJobId,
  resultKey,
  statusKey,
} from "@/lib/job-keys";
import { qstash } from "@/lib/qstash";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

const MAX_LIMIT = 500_000_000_000_000_000;

function getWorkerUrl() {
  const base = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "";
  if (!base) {
    throw new Error("Set QSTASH_WORKER_BASE_URL or VERCEL_URL for worker URL");
  }

  return `${base}/api/prime/worker`;
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}) as any);
  const raw = body.limit ?? req.nextUrl.searchParams.get("limit");
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(0, Number.parseInt(String(raw ?? "0"), 10) || 0),
  );

  if (!limit || limit < 2) {
    return new Response(
      JSON.stringify({ error: "Provide limit >= 2", limit }),
      { status: 400 },
    );
  }

  const jobId = makeJobId(limit);
  const sKey = statusKey(jobId);
  const rKey = resultKey(jobId);

  const cachedResult = await redis.get<JobResultValue>(rKey);
  if (cachedResult && cachedResult.status === "finished") {
    return new Response(
      JSON.stringify({
        jobId,
        mode: "queue",
        fromCache: true,
        status: "finished",
        result: cachedResult,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }

  const existingStatus = await redis.get<JobStatusValue>(sKey);
  if (existingStatus && existingStatus.status !== "error") {
    return new Response(
      JSON.stringify({
        jobId,
        mode: "queue",
        fromCache: false,
        status: existingStatus.status,
        progress: existingStatus.progress,
      }),
      { status: 202, headers: { "Content-Type": "application/json" } },
    );
  }

  const now = Date.now();
  const initialStatus: JobStatusValue = {
    status: "queued",
    jobId,
    limit,
    progress: 0,
    primeCountSoFar: 0,
    startedAt: now,
    updatedAt: now,
  };

  await redis.set(sKey, initialStatus, { ex: 600 });

  const workerUrl = getWorkerUrl();

  await qstash.publishJSON({
    url: workerUrl,
    body: { jobId, limit },
    headers: {
      "x-vercel-protection-bypass":
        process.env.VERCEL_AUTOMATION_BYPASS_SECRET!,
    },
    retries: 3,
  });

  return new Response(
    JSON.stringify({
      jobId,
      mode: "queue",
      fromCache: false,
      status: "queued",
    }),
    { status: 202, headers: { "Content-Type": "application/json" } },
  );
}
