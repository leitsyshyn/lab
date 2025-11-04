import type { NextRequest } from "next/server";
import { countPrimes } from "@/lib/primes";

export const runtime = "nodejs";

const MAX_LIMIT = 500_000_000_000_000_000;

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

  const result = await countPrimes(limit);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
