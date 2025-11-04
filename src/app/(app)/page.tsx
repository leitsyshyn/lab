import {
  BarChart3,
  Boxes,
  Camera,
  Crown,
  Gamepad2,
  Hash,
  ListTodo,
  Map as MapIcon,
  Search,
} from "lucide-react";
import { MiniAppCard } from "@/components/mini-app-card";

export default function Home() {
  const miniApps = [
    {
      title: "Todo Lists",
      description:
        "Collaborative task management with real-time updates using Liveblocks. Create and share lists with team members.",
      href: "/account",
      icon: ListTodo,
      badge: "Collaborative",
    },
    {
      title: "Whiteboard",
      description:
        "Interactive drawing board powered by tldraw. Sketch, collaborate, and brainstorm with real-time sync.",
      href: "/board",
      icon: Boxes,
      badge: "Real-time",
    },
    {
      title: "Data Charts",
      description:
        "Visualize World Bank data with interactive charts. Explore GDP trends and population pyramids by country.",
      href: "/charts",
      icon: BarChart3,
    },
    {
      title: "Earthquake Map",
      description:
        "Interactive map displaying real-time earthquake data worldwide. Powered by Leaflet and USGS data.",
      href: "/map",
      icon: MapIcon,
      badge: "Live Data",
    },
    {
      title: "Search Demo",
      description:
        "Fast semantic search powered by Typesense. Search and filter through large datasets instantly.",
      href: "/combobox",
      icon: Search,
    },
    {
      title: "Prime Counter",
      description:
        "Compare direct computation vs. queue-based processing with QStash and Redis caching for prime number counting.",
      href: "/prime",
      icon: Hash,
    },
    {
      title: "Snake Game",
      description:
        "Classic snake game built with Canvas API. Test your reflexes and beat your high score!",
      href: "/game",
      icon: Gamepad2,
      badge: "Game",
    },
    {
      title: "Feature Flags",
      description:
        "Vercel feature flags demonstration. Premium content accessible only with Plus subscription.",
      href: "/flag",
      icon: Crown,
      badge: "Premium",
    },
    {
      title: "Low-level APIs",
      description:
        "Explore File API, WebRTC camera, and WebAssembly image processing. Upload files, capture photos, and apply filters.",
      href: "/low-level",
      icon: Camera,
    },
  ];

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Web Development Lab
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            A collection of interactive demos showcasing modern web
            technologies, APIs, and real-time features.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {miniApps.map((app) => (
            <MiniAppCard
              key={app.href}
              title={app.title}
              description={app.description}
              href={app.href}
              icon={app.icon}
              badge={app.badge}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
