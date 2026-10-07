const compactFormatter = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});
const integerFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export type ValueFormat = "compact" | "int" | "percent" | "duration" | "ms" | "rps";

export function formatValue(value: number, format: ValueFormat): string {
  switch (format) {
    case "compact":
      return value >= 10_000 ? compactFormatter.format(value) : integerFormatter.format(value);
    case "int":
      return integerFormatter.format(value);
    case "percent":
      return `${value.toFixed(1)}%`;
    case "duration":
      return formatDuration(value);
    case "ms":
      return `${integerFormatter.format(value)} ms`;
    case "rps":
      return `${integerFormatter.format(value)}/s`;
  }
}

/** Axis ticks are already round numbers, so they drop the decimals a stat value would show. */
export function formatAxis(value: number, format: ValueFormat): string {
  switch (format) {
    case "percent":
      return `${Number(value.toFixed(1))}%`;
    case "duration":
      return formatDuration(value);
    case "ms":
      return `${integerFormatter.format(value)}`;
    default:
      return value >= 1000 ? compactFormatter.format(value) : integerFormatter.format(value);
  }
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.round(totalSeconds);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  if (minutes < 60) return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}

export function formatDelta(delta: number, kind: "pct" | "abs"): string {
  const sign = delta > 0 ? "+" : delta < 0 ? "−" : "±";
  const magnitude = Math.abs(delta);
  return kind === "pct" ? `${sign}${(magnitude * 100).toFixed(1)}%` : `${sign}${integerFormatter.format(magnitude)}`;
}

export function clockTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour12: false });
}
