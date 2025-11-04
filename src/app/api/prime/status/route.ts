import type { NextRequest } from "next/server";
import {
  type JobResultValue,
  type JobStatusValue,
  resultKey,
  statusKey,
} from "@/lib/job-keys";
import { redis } from "@/lib/redis";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const jobId = req.nextUrl.searchParams.get("jobId");
  if (!jobId) {
    return new Response(JSON.stringify({ error: "jobId is required" }), {
      status: 400,
    });
  }

  const [status, result] = await Promise.all([
    redis.get<JobStatusValue>(statusKey(jobId)),
    redis.get<JobResultValue>(resultKey(jobId)),
  ]);

  if (!status && !result) {
    return new Response(JSON.stringify({ jobId, status: "notFound" }), {
      status: 404,
    });
  }

  return new Response(
    JSON.stringify({
      jobId,
      status: status?.status ?? result?.status ?? "unknown",
      progress: status?.progress ?? (result?.status === "finished" ? 1 : 0),
      primeCountSoFar: status?.primeCountSoFar ?? result?.primeCount ?? 0,
      result,
      rawStatus: status,
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
