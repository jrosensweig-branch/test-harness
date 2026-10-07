export function linearScale(domain: [number, number], range: [number, number]) {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0 || 1;
  return (value: number) => r0 + ((value - d0) / span) * (r1 - r0);
}

/** Clean, human tick values (0 / 250 / 500…) covering [min, max]. */
export function niceTicks(min: number, max: number, count = 4): number[] {
  const span = max - min || Math.abs(max) || 1;
  const rawStep = span / count;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  const step = (normalized >= 5 ? 10 : normalized >= 2 ? 5 : normalized >= 1 ? 2 : 1) * magnitude;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let tick = start; tick <= end + step / 2; tick += step) ticks.push(Number(tick.toFixed(10)));
  return ticks;
}

const round = (value: number) => Math.round(value * 100) / 100;

/** Monotone cubic interpolation (Fritsch–Carlson): smooth, never overshoots the data. */
export function monotonePath(points: [number, number][]): string {
  const count = points.length;
  if (count === 0) return "";
  if (count === 1) return `M${round(points[0][0])},${round(points[0][1])}`;

  const dx: number[] = [];
  const slopes: number[] = [];
  for (let index = 0; index < count - 1; index++) {
    dx[index] = points[index + 1][0] - points[index][0];
    slopes[index] = (points[index + 1][1] - points[index][1]) / dx[index];
  }
  // Collapsed x-range (e.g. a chart measured at zero width mid-layout): fall back to straight segments.
  if (dx.some((step) => step <= 0)) {
    return points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${round(x)},${round(y)}`).join("");
  }

  const tangents: number[] = [slopes[0]];
  for (let index = 1; index < count - 1; index++) {
    if (slopes[index - 1] * slopes[index] <= 0) {
      tangents[index] = 0;
    } else {
      const weightA = 2 * dx[index] + dx[index - 1];
      const weightB = dx[index] + 2 * dx[index - 1];
      tangents[index] = (weightA + weightB) / (weightA / slopes[index - 1] + weightB / slopes[index]);
    }
  }
  tangents[count - 1] = slopes[count - 2];

  let path = `M${round(points[0][0])},${round(points[0][1])}`;
  for (let index = 0; index < count - 1; index++) {
    const third = dx[index] / 3;
    const [x0, y0] = points[index];
    const [x1, y1] = points[index + 1];
    path += `C${round(x0 + third)},${round(y0 + third * tangents[index])} ${round(x1 - third)},${round(
      y1 - third * tangents[index + 1],
    )} ${round(x1)},${round(y1)}`;
  }
  return path;
}

/** Rect path with rounded top corners and a square base, for columns anchored to the baseline. */
export function columnPath(x: number, y: number, width: number, rawHeight: number, radius = 4): string {
  // Zero-height columns keep the same command structure so motion can morph them in and out.
  const height = Math.max(0, rawHeight);
  const r = Math.min(radius, width / 2, height);
  return `M${round(x)},${round(y + height)}V${round(y + r)}Q${round(x)},${round(y)} ${round(x + r)},${round(y)}H${round(
    x + width - r,
  )}Q${round(x + width)},${round(y)} ${round(x + width)},${round(y + r)}V${round(y + height)}Z`;
}

/** SVG arc path for donut/gauge segments. Angles in radians, 0 = 12 o'clock, clockwise. */
export function arcPath(cx: number, cy: number, radius: number, start: number, end: number): string {
  const sweep = end - start;
  if (sweep <= 0) return "";
  const clamped = Math.min(sweep, Math.PI * 2 - 0.0001);
  const finish = start + clamped;
  const x0 = cx + radius * Math.sin(start);
  const y0 = cy - radius * Math.cos(start);
  const x1 = cx + radius * Math.sin(finish);
  const y1 = cy - radius * Math.cos(finish);
  const largeArc = clamped > Math.PI ? 1 : 0;
  return `M${round(x0)},${round(y0)}A${radius},${radius} 0 ${largeArc} 1 ${round(x1)},${round(y1)}`;
}
