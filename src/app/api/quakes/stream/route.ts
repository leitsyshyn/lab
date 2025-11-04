// app/api/earthquakes/stream/route.ts
import type { NextRequest } from "next/server";

export const runtime = "nodejs"; // use Node.js for setInterval
export const dynamic = "force-dynamic"; // ensure streaming, no static optimization

type UsgsFeature = {
  id: string;
  properties: {
    mag: number | null;
    place: string | null;
    time: number; // epoch ms
    url?: string;
    [k: string]: unknown;
  };
  geometry?: {
    type: "Point";
    coordinates: [number, number, number]; // [lon, lat, depth]
  };
};

type UsgsFeed = {
  type: "FeatureCollection";
  features: UsgsFeature[];
};

function sseFormat(data: unknown, event?: string) {
  const payload = typeof data === "string" ? data : JSON.stringify(data);
  const lines = payload.split("\n").map((l) => `data: ${l}`);
  return (event ? `event: ${event}\n` : "") + lines.join("\n") + "\n\n";
}

export async function GET(req: NextRequest) {
  // Config via query params (with sensible defaults)
  const { searchParams } = new URL(req.url);
  const feed =
    searchParams.get("feed") ??
    // USGS: all quakes in the past hour (updated every minute)
    "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson";
  const intervalMs = Math.max(
    5000,
    Number(searchParams.get("interval") ?? 1000),
  );
  const retryMs = Math.max(2000, Number(searchParams.get("retry") ?? 5000));

  const encoder = new TextEncoder();

  // Per-connection state
  const seen = new Set<string>();
  let etag: string | undefined;
  let lastModified: string | undefined;
  let timer: NodeJS.Timeout | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      // Send initial retry hint for EventSource clients
      controller.enqueue(encoder.encode(`retry: ${retryMs}\n\n`));

      // Optional: initial comment to keep some proxies happy
      controller.enqueue(
        encoder.encode(`: connected ${new Date().toISOString()}\n\n`),
      );

      const poll = async () => {
        if (closed) return;

        const headers: Record<string, string> = {};
        if (etag) headers["If-None-Match"] = etag;
        if (lastModified) headers["If-Modified-Since"] = lastModified;

        try {
          const res = await fetch(feed, {
            headers,
            signal: req.signal as AbortSignal,
          });

          // 304 => no changes
          if (res.status === 304) {
            controller.enqueue(encoder.encode(`: no-change\n\n`));
            return;
          }
          if (!res.ok) {
            controller.enqueue(
              encoder.encode(
                sseFormat({ error: `feed error ${res.status}` }, "error"),
              ),
            );
            return;
          }

          etag = res.headers.get("ETag") ?? undefined;
          lastModified = res.headers.get("Last-Modified") ?? undefined;

          const json = (await res.json()) as UsgsFeed;

          // Sort new items by time ascending so the stream is chronological
          const fresh = json.features.filter((f) => !seen.has(f.id));
          fresh.sort((a, b) => a.properties.time - b.properties.time);

          for (const f of fresh) {
            seen.add(f.id);

            // Minimal, client-friendly payload
            const out = {
              id: f.id,
              time: f.properties.time, // epoch ms
              mag: f.properties.mag,
              place: f.properties.place,
              url: f.properties.url,
              coordinates:
                f.geometry?.type === "Point"
                  ? {
                      lon: f.geometry.coordinates[0],
                      lat: f.geometry.coordinates[1],
                      depthKm: f.geometry.coordinates[2],
                    }
                  : undefined,
              // pass through original in case clients want it:
              // raw: f,  // uncomment if desired
            };

            controller.enqueue(encoder.encode(sseFormat(out, "earthquake")));
          }

          // Heartbeat to keep idle connections alive (every poll)
          controller.enqueue(encoder.encode(`: hb ${Date.now()}\n\n`));
        } catch (err: any) {
          if (req.signal.aborted || closed) return;
          controller.enqueue(
            encoder.encode(
              sseFormat({ error: err?.message ?? "fetch failed" }, "error"),
            ),
          );
        }
      };

      // Kick off immediately, then poll on interval
      void poll();
      timer = setInterval(poll, intervalMs);

      // If client disconnects, close
      const onAbort = () => {
        if (closed) return;
        closed = true;
        if (timer) clearInterval(timer);
        controller.close();
      };
      req.signal.addEventListener("abort", onAbort);
    },

    cancel() {
      // Stream consumer canceled (e.g., network closed)
      if (timer) clearInterval(timer);
      closed = true;
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
