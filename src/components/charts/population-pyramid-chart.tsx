"use client";

import * as React from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { COUNTRIES } from "@/lib/countries";

const chartConfig = {
  male: {
    label: "Male",
    color: "blue",
  },
  female: {
    label: "Female",
    color: "magenta",
  },
} satisfies ChartConfig;

type PyramidPoint = {
  ageGroup: string;
  male: number;
  female: number;
};

export function PopulationPyramidChart() {
  const [country, setCountry] = React.useState("UKR");
  const [data, setData] = React.useState<PyramidPoint[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/charts/population?country=${country}&year=2024`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`API error ${res.status}`);
        return (await res.json()) as { data: PyramidPoint[] };
      })
      .then((json) => {
        if (!cancelled) {
          setData(json.data);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error(err);
          setError("Failed to load population data.");
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
  }, [country]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNTRIES.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                <span className="flex items-center gap-2">
                  <span className="text-base">{c.flag}</span>
                  <span>{c.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex min-h-[400px] items-center justify-center">
          <Spinner />
        </div>
      ) : error || !data ? (
        <div className="flex min-h-[400px] items-center justify-center text-sm text-destructive">
          {error ?? "No data available"}
        </div>
      ) : (
        <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
          <BarChart
            accessibilityLayer
            data={data}
            layout="vertical"
            stackOffset="sign"
            margin={{ left: 40, right: 40, top: 16, bottom: 16 }}
          >
            <CartesianGrid horizontal={false} />
            <XAxis
              type="number"
              domain={[
                -Math.max(...data.map((d) => Math.abs(d.male)), 0.0001),
                Math.max(...data.map((d) => Math.abs(d.female)), 0.0001),
              ]}
              tickFormatter={(value) =>
                `${Math.abs(value as number).toFixed(1)}M`
              }
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              dataKey="ageGroup"
              type="category"
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <ReferenceLine x={0} stroke="var(--border)" />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  labelFormatter={(label) => `Age ${label}`}
                />
              }
            />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="male"
              stackId="population"
              fill="var(--color-male)"
              radius={[0, 4, 4, 0]}
            />
            <Bar
              dataKey="female"
              stackId="population"
              fill="var(--color-female)"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
