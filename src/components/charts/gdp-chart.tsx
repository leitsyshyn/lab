"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { CountryMultiSelect } from "@/components/ui/country-multi-select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { generateChartColor } from "@/lib/color-utils";
import { getCountryName } from "@/lib/countries";

type CountryData = {
  country: string;
  data: { year: number; value: number | null }[];
};

type MergedDataPoint = {
  year: number;
  [key: string]: number | null;
};

const currentYear = new Date().getFullYear();

export function GdpChart() {
  const [selectedCountries, setSelectedCountries] = React.useState<string[]>([
    "UKR",
  ]);
  const [fromYear, setFromYear] = React.useState("2000");
  const [toYear, setToYear] = React.useState(currentYear.toString());
  const [countriesData, setCountriesData] = React.useState<CountryData[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (selectedCountries.length === 0) {
      setCountriesData([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const from = Number(fromYear) || 1960;
    const to = Number(toYear) || currentYear;

    if (from > to) {
      setError("Start year must be before end year");
      setLoading(false);
      return;
    }

    Promise.all(
      selectedCountries.map(async (country) => {
        const res = await fetch(
          `/api/charts/gdp?country=${country}&indicator=NY.GDP.PCAP.CD&from=${from}&to=${to}`,
        );
        if (!res.ok) throw new Error(`API error ${res.status}`);
        const json = (await res.json()) as {
          data: { year: number; value: number | null }[];
        };
        return {
          country,
          data: json.data.filter((d) => d.value !== null),
        };
      }),
    )
      .then((results) => {
        if (!cancelled) {
          setCountriesData(results);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setError("Failed to load GDP data.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCountries, fromYear, toYear]);

  // Merge data from all countries by year
  const mergedData = React.useMemo(() => {
    if (countriesData.length === 0) return [];

    const yearMap = new Map<number, MergedDataPoint>();

    countriesData.forEach(({ country, data }) => {
      data.forEach(({ year, value }) => {
        if (!yearMap.has(year)) {
          yearMap.set(year, { year });
        }
        const point = yearMap.get(year);
        if (point) {
          point[country] = value;
        }
      });
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [countriesData]);

  // Create dynamic chart config with colors generated from country names
  const chartConfig = React.useMemo(() => {
    const config: ChartConfig = {};
    selectedCountries.forEach((countryCode) => {
      config[countryCode] = {
        label: getCountryName(countryCode),
        color: generateChartColor(countryCode),
      };
    });
    return config;
  }, [selectedCountries]);

  return (
    <div className="space-y-4">
      <div className="w-full">
        <Label htmlFor="country-select" className="text-xs mb-1.5">
          Countries (select multiple)
        </Label>
        <CountryMultiSelect
          selected={selectedCountries}
          onChange={setSelectedCountries}
          maxDisplayed={6}
          placeholder="Select countries to compare..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="from-year" className="text-xs mb-1.5">
            From
          </Label>
          <Input
            id="from-year"
            type="number"
            min="1960"
            max={currentYear}
            value={fromYear}
            onChange={(e) => setFromYear(e.target.value)}
            placeholder="1960"
          />
        </div>

        <div>
          <Label htmlFor="to-year" className="text-xs mb-1.5">
            To
          </Label>
          <Input
            id="to-year"
            type="number"
            min="1960"
            max={currentYear}
            value={toYear}
            onChange={(e) => setToYear(e.target.value)}
            placeholder={currentYear.toString()}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner />
        </div>
      ) : error ? (
        <div className="flex min-h-[400px] items-center justify-center text-sm text-destructive">
          {error}
        </div>
      ) : selectedCountries.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
          Select at least one country to view data
        </div>
      ) : mergedData.length === 0 ? (
        <div className="flex min-h-[400px] items-center justify-center text-sm text-muted-foreground">
          No data available for selected countries
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
          <AreaChart
            accessibilityLayer
            data={mergedData}
            margin={{ left: 12, right: 12, top: 12, bottom: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="year"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value.toString()}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                `$${(value as number).toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`
              }
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(_, payload) => {
                    return `Year ${payload[0].payload.year}`;
                  }}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            {selectedCountries.map((countryCode) => (
              <Area
                key={countryCode}
                dataKey={countryCode}
                type="monotone"
                fill={`var(--color-${countryCode})`}
                fillOpacity={0.2}
                stroke={`var(--color-${countryCode})`}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        </ChartContainer>
      )}
    </div>
  );
}
