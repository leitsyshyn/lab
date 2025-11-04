// app/api/prime/worker/route.ts
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import type { NextRequest } from "next/server";
import {
  type JobResultValue,
  type JobStatusValue,
  resultKey,
  statusKey,
} from "@/lib/job-keys";
import { countPrimes } from "@/lib/primes";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

async function handler(req: NextRequest) {
  console.log("[prime-worker] invoked"); // <- watch for this in `npm run dev`

  const { jobId, limit } = (await req.json()) as {
    jobId: string;
    limit: number;
  };

  const startedAt = Date.now();

  const initialStatus: JobStatusValue = {
    status: "running",
    jobId,
    limit,
    progress: 0,
    primeCountSoFar: 0,
    startedAt,
    updatedAt: startedAt,
  };

  await redis.set(statusKey(jobId), initialStatus);

  try {
    const result = await countPrimes(limit, async (p) => {
      const now = Date.now();
      const status: JobStatusValue = {
        status: "running",
        jobId,
        limit,
        progress: p.progress,
        primeCountSoFar: p.primeCountSoFar,
        startedAt,
        updatedAt: now,
      };
      await redis.set(statusKey(jobId), status);
    });

    const finishedAt = Date.now();

    const finalResult: JobResultValue = {
      status: "finished",
      jobId,
      limit: result.limit,
      primeCount: result.primeCount,
      durationMs: result.durationMs,
      startedAt,
      finishedAt,
    };

    const finalStatus: JobStatusValue = {
      status: "finished",
      jobId,
      limit,
      progress: 1,
      primeCountSoFar: result.primeCount,
      startedAt,
      updatedAt: finishedAt,
    };

    await Promise.all([
      redis.set(resultKey(jobId), finalResult, { ex: 600 }),
      redis.set(statusKey(jobId), finalStatus, { ex: 600 }),
    ]);

    return new Response(JSON.stringify({ ok: true, jobId }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    const now = Date.now();
    const errorStatus: JobStatusValue = {
      status: "error",
      jobId,
      limit,
      progress: 0,
      primeCountSoFar: 0,
      startedAt,
      updatedAt: now,
      errorMessage: e?.message ?? "Unknown error",
    };

    await redis.set(statusKey(jobId), errorStatus, { ex: 600 });

    return new Response(
      JSON.stringify({ ok: false, jobId, error: errorStatus.errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

// env toggle
const USE_VERIFY = process.env.SKIP_QSTASH_VERIFY !== "1";
export const POST = USE_VERIFY ? verifySignatureAppRouter(handler) : handler;
