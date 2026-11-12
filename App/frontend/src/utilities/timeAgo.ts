// helpers to turn a timestamp into "3 hours ago" / "3h ago" style labels

const UNITS: { limit: number; secs: number; long: string; short: string }[] = [
  { limit: 60, secs: 1, long: "second", short: "s" },
  { limit: 3600, secs: 60, long: "minute", short: "m" },
  { limit: 86400, secs: 3600, long: "hour", short: "h" },
  { limit: 604800, secs: 86400, long: "day", short: "d" },
  { limit: 2629800, secs: 604800, long: "week", short: "w" },
  { limit: 31557600, secs: 2629800, long: "month", short: "mo" },
  { limit: Infinity, secs: 31557600, long: "year", short: "y" },
];

export function timeAgo(
  date: string | Date,
  style: "long" | "short" = "long",
  now: Date = new Date(),
): string {
  const then = typeof date === "string" ? new Date(date) : date;
  const diff = Math.max(0, (now.getTime() - then.getTime()) / 1000);

  if (Number.isNaN(diff)) return "";
  if (diff < 45) return "just now";

  const unit = UNITS.find((u) => diff < u.limit) ?? UNITS[UNITS.length - 1];
  const value = Math.floor(diff / unit.secs);

  return style === "short"
    ? `${value}${unit.short} ago`
    : `${value} ${unit.long}${value === 1 ? "" : "s"} ago`;
}

// compact number formatting (e.g. 2400 -> 2.4k)
export function compactNumber(n: number): string {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${+(n / 1000).toFixed(1)}k`;
  return `${+(n / 1_000_000).toFixed(1)}m`;
}
