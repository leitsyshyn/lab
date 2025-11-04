import { type NextRequest, NextResponse } from "next/server";

type WorldBankPoint = {
  date: string; // "YYYY"
  value: number | null;
};

type WorldBankResponse = [any, WorldBankPoint[]];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const country = (searchParams.get("country") ?? "UKR").toUpperCase(); // ISO2 or ISO3
  const indicator = searchParams.get("indicator") ?? "NY.GDP.PCAP.CD";
  const from = searchParams.get("from") ?? "1960";
  const to = searchParams.get("to") ?? "2024";

  const url =
    `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}` +
    `?format=json&per_page=1000&date=${from}:${to}`;

  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 }, // 1 day
  });

  if (!res.ok) {
    console.error("World Bank API error", res.status, await res.text());
    return NextResponse.json(
      { error: "Failed to fetch World Bank data" },
      { status: 500 },
    );
  }

  const json = (await res.json()) as WorldBankResponse;

  const raw = json?.[1] ?? [];

  const data = raw
    .map((d) => {
      const year = Number(d.date);
      const value =
        d.value === null || d.value === undefined ? null : Number(d.value);
      return { year, value };
    })
    .filter((d) => Number.isFinite(d.year))
    .sort((a, b) => a.year - b.year);

  return NextResponse.json({ data });
}
