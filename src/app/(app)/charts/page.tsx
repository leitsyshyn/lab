import { GdpChart } from "@/components/charts/gdp-chart";
import { PopulationPyramidChart } from "@/components/charts/population-pyramid-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ChartsPage() {
  return (
    <main className="container py-8">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Population Pyramid</CardTitle>
            <CardDescription>
              Age-sex distribution by country (World Bank data)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PopulationPyramidChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>GDP Per Capita</CardTitle>
            <CardDescription>
              GDP per capita over time (World Bank data, current US$)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GdpChart />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
