import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Trading Dashboard",
  description: "Money-first trading operations dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-background text-foreground antialiased`}>
        <ThemeProvider defaultTheme="system" storageKey="trading-dashboard-theme">
          <div className="relative flex min-h-screen flex-col bg-background transition-colors">
            <div className="pointer-events-none absolute inset-0 -z-10 opacity-40 blur-3xl">
              <div className="absolute left-1/2 top-[-20%] h-64 w-64 -translate-x-1/2 rounded-full bg-primary/40" />
              <div className="absolute right-0 top-1/2 h-56 w-56 translate-x-1/3 rounded-full bg-emerald-500/30" />
            </div>
            <Navigation />
            <main className="container mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
