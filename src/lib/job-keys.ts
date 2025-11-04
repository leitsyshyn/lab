export function makeJobId(limit: number): string {
  return `limit-${limit}`;
}

export function statusKey(jobId: string): string {
  return `prime-job:${jobId}:status`;
}

export function resultKey(jobId: string): string {
  return `prime-job:${jobId}:result`;
}

export type JobStatusValue = {
  status: "queued" | "running" | "finished" | "error";
  jobId: string;
  limit: number;
  progress: number;
  primeCountSoFar: number;
  startedAt: number;
  updatedAt: number;
  errorMessage?: string;
};

export type JobResultValue = {
  status: "finished";
  jobId: string;
  limit: number;
  primeCount: number;
  durationMs: number;
  startedAt: number;
  finishedAt: number;
};
