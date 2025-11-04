import { type NextRequest, NextResponse } from "next/server";

type AgeGroupConfig = {
  label: string;
  maleIndicator: string;
  femaleIndicator: string;
};

const AGE_GROUPS: AgeGroupConfig[] = [
  {
    label: "0-4",
    maleIndicator: "SP.POP.0004.MA",
    femaleIndicator: "SP.POP.0004.FE",
  },
  {
    label: "5-9",
    maleIndicator: "SP.POP.0509.MA",
    femaleIndicator: "SP.POP.0509.FE",
  },
  {
    label: "10-14",
    maleIndicator: "SP.POP.1014.MA",
    femaleIndicator: "SP.POP.1014.FE",
  },
  {
    label: "15-19",
    maleIndicator: "SP.POP.1519.MA",
    femaleIndicator: "SP.POP.1519.FE",
  },
  {
    label: "20-24",
    maleIndicator: "SP.POP.2024.MA",
    femaleIndicator: "SP.POP.2024.FE",
  },
  {
    label: "25-29",
    maleIndicator: "SP.POP.2529.MA",
    femaleIndicator: "SP.POP.2529.FE",
  },
  {
    label: "30-34",
    maleIndicator: "SP.POP.3034.MA",
    femaleIndicator: "SP.POP.3034.FE",
  },
  {
    label: "35-39",
    maleIndicator: "SP.POP.3539.MA",
    femaleIndicator: "SP.POP.3539.FE",
  },
  {
    label: "40-44",
    maleIndicator: "SP.POP.4044.MA",
    femaleIndicator: "SP.POP.4044.FE",
  },
  {
    label: "45-49",
    maleIndicator: "SP.POP.4549.MA",
    femaleIndicator: "SP.POP.4549.FE",
  },
  {
    label: "50-54",
    maleIndicator: "SP.POP.5054.MA",
    femaleIndicator: "SP.POP.5054.FE",
  },
  {
    label: "55-59",
    maleIndicator: "SP.POP.5559.MA",
    femaleIndicator: "SP.POP.5559.FE",
  },
  {
    label: "60-64",
    maleIndicator: "SP.POP.6064.MA",
    femaleIndicator: "SP.POP.6064.FE",
  },
  {
    label: "65-69",
    maleIndicator: "SP.POP.6569.MA",
    femaleIndicator: "SP.POP.6569.FE",
  },
  {
    label: "70-74",
    maleIndicator: "SP.POP.7074.MA",
    femaleIndicator: "SP.POP.7074.FE",
  },
  {
    label: "75-79",
    maleIndicator: "SP.POP.7579.MA",
    femaleIndicator: "SP.POP.7579.FE",
  },
  {
    label: "80+",
    maleIndicator: "SP.POP.80UP.MA",
    femaleIndicator: "SP.POP.80UP.FE",
  },
].reverse();

async function fetchIndicatorValue(
  country: string,
  indicator: string,
  year: number,
): Promise<number | null> {
  const url = `https://api.worldbank.org/v2/country/${country}/indicator/${indicator}?format=json&per_page=1&date=${year}`;
  const res = await fetch(url, {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    console.error("World Bank API error", res.status, indicator);
    return null;
  }

  const json = await res.json();
  const value = json?.[1]?.[0]?.value;

  if (value == null) return null;

  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const country = (searchParams.get("country") ?? "UKR").toUpperCase();
  const year = Number(searchParams.get("year") ?? "2024");

  const groups = await Promise.all(
    AGE_GROUPS.map(async (group) => {
      const [male, female] = await Promise.all([
        fetchIndicatorValue(country, group.maleIndicator, year),
        fetchIndicatorValue(country, group.femaleIndicator, year),
      ]);

      return {
        ageGroup: group.label,
        male: male ?? 0,
        female: female ?? 0,
      };
    }),
  );

  const data = groups.map((g) => ({
    ageGroup: g.ageGroup,
    male: -(g.male / 1_000_000),
    female: g.female / 1_000_000,
  }));

  return NextResponse.json({
    data,
    meta: {
      unit: "millions",
      country,
      year,
    },
  });
}
