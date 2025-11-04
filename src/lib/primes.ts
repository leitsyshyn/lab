export interface PrimeProgress {
  current: number;
  limit: number;
  progress: number;
  primeCountSoFar: number;
  elapsedMs: number;
}

export interface PrimeResult {
  limit: number;
  primeCount: number;
  durationMs: number;
}

function isPrime(n: number): boolean {
  if (n < 2) return false;
  if (n === 2) return true;
  if (n % 2 === 0) return false;

  const max = Math.floor(Math.sqrt(n));
  for (let i = 3; i <= max; i += 2) {
    if (n % i === 0) return false;
  }
  return true;
}

export async function countPrimes(
  limit: number,
  onProgress?: (p: PrimeProgress) => Promise<void> | void,
): Promise<PrimeResult> {
  const startedAt = Date.now();
  let count = 0;

  if (limit < 2) {
    return { limit, primeCount: 0, durationMs: 0 };
  }

  const steps = Math.max(100, Math.min(1000, Math.floor(limit / 1000)));
  const reportEvery = Math.max(1, Math.floor(limit / steps));

  for (let n = 2; n <= limit; n++) {
    if (isPrime(n)) count++;

    if (onProgress && n % reportEvery === 0) {
      const now = Date.now();
      await onProgress({
        current: n,
        limit,
        progress: n / limit,
        primeCountSoFar: count,
        elapsedMs: now - startedAt,
      });
    }
  }

  const durationMs = Date.now() - startedAt;
  return { limit, primeCount: count, durationMs };
}
