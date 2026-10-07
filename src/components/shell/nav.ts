import { FlaskConical, Gauge, Network, Palette, Radio, type LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Second key of the "G then <key>" jump shortcut. */
  jumpKey: string;
};

export const NAV: NavItem[] = [
  { href: "/", label: "Mission Control", description: "Pass rates, KPIs and the live run feed", icon: Gauge, jumpKey: "o" },
  { href: "/runs", label: "Test Runs", description: "Volume, failure heatmap, slowest tests", icon: FlaskConical, jumpKey: "r" },
  { href: "/services", label: "Service Health", description: "Topology, latency SLOs and uptime", icon: Network, jumpKey: "s" },
  { href: "/live", label: "Live Ops", description: "Streaming logs and the worker pool", icon: Radio, jumpKey: "l" },
  { href: "/themes", label: "Theme Gallery", description: "Preview and apply every theme", icon: Palette, jumpKey: "t" },
];

export function navItemFor(pathname: string): NavItem {
  return NAV.find((item) => item.href === pathname) ?? NAV[0];
}
