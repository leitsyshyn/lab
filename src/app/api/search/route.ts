// import { type NextRequest, NextResponse } from "next/server";
// import client from "@/lib/typesense";

// export async function GET(req: NextRequest) {
//   try {
//     const { searchParams } = new URL(req.url);
//     const q = (searchParams.get("q") ?? "").trim();
//     const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
//     const limit = Math.min(
//       100,
//       Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
//     );
//     const page = Math.floor(skip / limit) + 1;

//     const tsParams: Record<string, any> = {
//       q: q || "*",
//       query_by: "term",
//       per_page: limit,
//       page,
//       include_fields: "id,term,seq",
//       prefix: true,
//     };

//     if (!q) tsParams.sort_by = "seq:asc";

//     const res = await client.collections("terms").documents().search(tsParams);

//     const items = (res.hits ?? []).map((h: any) => h.document);
//     const found = res.found || 0;

//     const nextSkip = skip + limit;
//     const hasNext = nextSkip < found;
//     const url = new URL(req.url);
//     url.searchParams.set("skip", String(nextSkip));
//     url.searchParams.set("limit", String(limit));
//     if (q) url.searchParams.set("q", q);
//     const nextLink = hasNext ? url.toString() : null;

//     return NextResponse.json({ items, total: found, nextLink });
//   } catch (e) {
//     console.error(e);
//     return NextResponse.json({ error: "search_failed" }, { status: 500 });
//   }
// }

// app/api/search/route.ts
import { type NextRequest, NextResponse } from "next/server";
import client from "@/lib/typesense";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim();
    const skip = Math.max(0, parseInt(searchParams.get("skip") ?? "0", 10));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)),
    );
    const page = Math.floor(skip / limit) + 1;

    const tsParams: Record<string, any> = {
      q: q || "*",
      query_by: "term",
      per_page: limit,
      page,
      include_fields: "id,term,seq,year,titleType",
      prefix: true,
    };

    if (!q) tsParams.sort_by = "seq:asc";

    const res = await client.collections("terms").documents().search(tsParams);

    const items = (res.hits ?? []).map((h: any) => h.document);
    const found = res.found || 0;

    const nextSkip = skip + limit;
    const hasNext = nextSkip < found;
    const url = new URL(req.url);
    url.searchParams.set("skip", String(nextSkip));
    url.searchParams.set("limit", String(limit));
    if (q) url.searchParams.set("q", q);
    const nextLink = hasNext ? url.toString() : null;

    return NextResponse.json({ items, total: found, nextLink });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "search_failed" }, { status: 500 });
  }
}
