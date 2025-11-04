"use client";

import dynamic from "next/dynamic";

const EarthquakeMap = dynamic(
  () =>
    import("@/components/earthquake-map").then((mod) => ({
      default: mod.EarthquakeMap,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <p>Loading map...</p>
      </div>
    ),
  },
);

export default function MapPage() {
  return (
    <div style={{ height: "calc(100vh - 3.5rem)" }}>
      <EarthquakeMap />
    </div>
  );
}
