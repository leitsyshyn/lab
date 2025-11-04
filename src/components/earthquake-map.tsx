"use client";

import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { Activity, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface EarthquakeData {
  id: string;
  time: number;
  mag: number | null;
  place: string | null;
  url?: string;
  coordinates?: {
    lon: number;
    lat: number;
    depthKm: number;
  };
}

function AutoFitBounds({ earthquakes }: { earthquakes: EarthquakeData[] }) {
  const map = useMap();

  useEffect(() => {
    if (earthquakes.length === 0) return;
    const coords = earthquakes
      .map((eq) =>
        eq.coordinates
          ? ([eq.coordinates.lat, eq.coordinates.lon] as [number, number])
          : null,
      )
      .filter((c): c is [number, number] => c !== null);

    if (coords.length > 0) {
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [earthquakes, map]);

  return null;
}

const MAG_SCALE = [
  { min: 5, color: "#ff0000", label: "≥ 5.0" },
  { min: 4, color: "#ff6600", label: "4.0 – 5.0" },
  { min: 3, color: "#ff9900", label: "3.0 – 4.0" },
  { min: 2, color: "#ffcc00", label: "2.0 – 3.0" },
  { min: 1, color: "#99cc00", label: "1.0 – 2.0" },
  { min: 0, color: "#00cc00", label: "< 1.0" },
] as const;

function getMagnitudeColor(magnitude: number): string {
  return MAG_SCALE.find((s) => magnitude >= s.min)?.color ?? "#00cc00";
}

function getMagnitudeRadius(magnitude: number): number {
  return Math.max(3, magnitude * 3);
}

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MagnitudeLegend() {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">Magnitude scale</h4>
      <ul className="space-y-1.5">
        {MAG_SCALE.map(({ color, label }) => (
          <li key={label} className="flex items-center gap-2 text-sm">
            <span
              className="inline-block size-3 rounded-full ring-1 ring-border"
              style={{ backgroundColor: color }}
            />
            <span className="text-muted-foreground">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

type TimePeriod = "hour" | "day" | "week" | "month";

function SidePanel({
  count,
  now,
  timePeriod,
  onTimePeriodChange,
  minMagnitude,
  onMinMagnitudeChange,
  filteredCount,
}: {
  count: number;
  now: string;
  timePeriod: TimePeriod;
  onTimePeriodChange: (period: TimePeriod) => void;
  minMagnitude: number;
  onMinMagnitudeChange: (mag: number) => void;
  filteredCount: number;
}) {
  return (
    <Card className="absolute right-4 top-4 z-1001 w-72 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="size-4 text-primary" />
          Earthquake Data
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Live USGS feed</span>
            <Badge variant="secondary" className="tabular-nums">
              {filteredCount} / {count}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">{now}</div>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Time Period</Label>
            <Select value={timePeriod} onValueChange={onTimePeriodChange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-2000">
                <SelectItem value="hour">Past Hour</SelectItem>
                <SelectItem value="day">Past Day</SelectItem>
                <SelectItem value="week">Past Week</SelectItem>
                <SelectItem value="month">Past Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Min Magnitude</Label>
              <Badge variant="outline" className="tabular-nums">
                {minMagnitude.toFixed(1)}
              </Badge>
            </div>
            <Slider
              value={[minMagnitude]}
              onValueChange={([val]) => onMinMagnitudeChange(val)}
              min={0}
              max={6}
              step={0.5}
              className="w-full"
            />
          </div>
        </div>

        <MagnitudeLegend />
      </CardContent>
    </Card>
  );
}

function LoadingOverlay() {
  return (
    <Card className="absolute left-1/2 top-1/2 z-1000 -translate-x-1/2 -translate-y-1/2 shadow-lg">
      <CardContent className="flex items-center gap-2 p-4">
        <Activity className="size-4 animate-spin text-primary" />
        <span className="text-sm">Loading earthquake data…</span>
      </CardContent>
    </Card>
  );
}

export function EarthquakeMap() {
  const [earthquakes, setEarthquakes] = useState<EarthquakeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("week");
  const [minMagnitude, setMinMagnitude] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Close existing connection if any
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    // Reset state for new connection
    setError(null);
    setIsLoading(true);

    // Map time period to USGS feed URLs
    const feedUrls: Record<TimePeriod, string> = {
      hour: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson",
      day: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
      week: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson",
      month:
        "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_month.geojson",
    };

    const feedUrl = encodeURIComponent(feedUrls[timePeriod]);
    const es = new EventSource(`/api/quakes/stream?feed=${feedUrl}`);
    eventSourceRef.current = es;

    es.onopen = () => setIsLoading(false);

    es.addEventListener("earthquake", (event) => {
      const data = JSON.parse((event as MessageEvent).data) as EarthquakeData;
      setEarthquakes((prev) => [...prev, data]);
    });

    es.addEventListener("error", (event) => {
      try {
        const messageEvent = event as MessageEvent;
        if (messageEvent.data) {
          const data = JSON.parse(messageEvent.data);
          setError(data.error || "Failed to load earthquake data");
        }
      } catch {}
    });

    es.onerror = () => {
      if (es.readyState === EventSource.CLOSED) setIsLoading(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [timePeriod]);

  // Filter earthquakes by magnitude
  const filteredEarthquakes = useMemo(() => {
    return earthquakes.filter(
      (eq) => eq.mag !== null && eq.mag >= minMagnitude,
    );
  }, [earthquakes, minMagnitude]);

  const now = useMemo(() => new Date().toLocaleTimeString(), []);

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Error Loading Earthquake Data</AlertTitle>
          <AlertDescription className="mt-1">{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="relative h-screen w-full">
      {isLoading && <LoadingOverlay />}
      <SidePanel
        count={earthquakes.length}
        now={now}
        timePeriod={timePeriod}
        onTimePeriodChange={(period) => {
          setTimePeriod(period);
          setEarthquakes([]);
        }}
        minMagnitude={minMagnitude}
        onMinMagnitudeChange={setMinMagnitude}
        filteredCount={filteredEarthquakes.length}
      />

      <MapContainer
        center={[20, 0]}
        zoom={2}
        className="z-0"
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {filteredEarthquakes
          .filter((eq) => eq.coordinates)
          .map((eq) => {
            if (!eq.coordinates || eq.mag === null) return null;

            const color = getMagnitudeColor(eq.mag);
            const radius = getMagnitudeRadius(eq.mag);

            return (
              <CircleMarker
                key={eq.id}
                center={[eq.coordinates.lat, eq.coordinates.lon]}
                radius={radius}
                fillColor={color}
                color="#fff"
                weight={1}
                opacity={0.9}
                fillOpacity={0.65}
              >
                <Popup>
                  <div className="min-w-[220px] space-y-3">
                    <h3 className="text-sm font-semibold leading-tight">
                      {eq.place || "Unknown Location"}
                    </h3>

                    <div className="space-y-2">
                      <StatRow
                        label="Magnitude"
                        value={
                          <Badge
                            variant="outline"
                            className="border-transparent text-white"
                            style={{ backgroundColor: color }}
                          >
                            {eq.mag.toFixed(1)}
                          </Badge>
                        }
                      />
                      <StatRow
                        label="Depth"
                        value={
                          <span className="text-muted-foreground">
                            {eq.coordinates.depthKm.toFixed(1)} km
                          </span>
                        }
                      />
                      <StatRow
                        label="Time"
                        value={
                          <span className="text-muted-foreground">
                            {new Date(eq.time).toLocaleString()}
                          </span>
                        }
                      />
                      <StatRow
                        label="Coordinates"
                        value={
                          <span className="font-mono text-muted-foreground">
                            {eq.coordinates.lat.toFixed(2)}°,{" "}
                            {eq.coordinates.lon.toFixed(2)}°
                          </span>
                        }
                      />
                    </div>

                    {eq.url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        asChild
                      >
                        <a
                          href={eq.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="mr-2 size-3.5 " />
                          View on USGS
                        </a>
                      </Button>
                    )}
                  </div>
                </Popup>
              </CircleMarker>
            );
          })}

        <AutoFitBounds earthquakes={filteredEarthquakes} />
      </MapContainer>
    </div>
  );
}
