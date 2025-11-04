import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import LiveblocksProvider from "@/providers/liveblocks-provider";
import TanStackQueryClientProvider from "../providers/query-client-provider";
import { ThemeProvider } from "../providers/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Web Development Lab",
  description:
    "A collection of interactive demos showcasing modern web technologies, APIs, and real-time features.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <TanStackQueryClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <LiveblocksProvider>
              {children}
              <Toaster richColors />
            </LiveblocksProvider>
          </ThemeProvider>
        </TanStackQueryClientProvider>
      </body>
    </html>
  );
}
