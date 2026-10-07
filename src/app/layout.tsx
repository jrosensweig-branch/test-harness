import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Orbitron, VT323 } from "next/font/google";
import { AppShell } from "@/components/shell/AppShell";
import { DEFAULT_THEME, THEME_BOOT_SCRIPT } from "@/lib/themes";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jbmono", display: "swap" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron", display: "swap" });
const vt323 = VT323({ subsets: ["latin"], weight: "400", variable: "--font-vt323", display: "swap" });

export const metadata: Metadata = {
  title: "Test Harness",
  description: "Mission control for test runs, service health, and live suites.",
};

export const viewport: Viewport = {
  themeColor: "#0b0c10",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-theme={DEFAULT_THEME}
      suppressHydrationWarning
      className={`${inter.variable} ${jetBrainsMono.variable} ${orbitron.variable} ${vt323.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
