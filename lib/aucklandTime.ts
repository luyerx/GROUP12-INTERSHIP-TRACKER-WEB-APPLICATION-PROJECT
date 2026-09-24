// Business wall-clock values use Auckland, independently of the server/browser zone.
export const BUSINESS_TIME_ZONE = "Pacific/Auckland";
const partsFormatter = new Intl.DateTimeFormat("en-NZ", {
  timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});
function parts(date: Date): Record<string, string> {
  return Object.fromEntries(partsFormatter.formatToParts(date).map(p => [p.type, p.value]));
}
export function aucklandDateKey(date = new Date()): string {
  const p = parts(date);
  return [p.year.padStart(4, "0"), p.month, p.day].join("-");
}
export function formatAucklandTime(date: Date): string {
  return new Intl.DateTimeFormat("en-NZ", {
    timeZone: BUSINESS_TIME_ZONE, year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23", timeZoneName: "short",
  }).format(date) + " (New Zealand / Auckland time)";
}
// Find offsets from Intl on both sides of a possible transition, then round-trip.
// Zero matches means a DST gap; two matches means a repeated/ambiguous clock time.
// Both are skipped rather than silently choosing a different time.
export function aucklandOccurrence(date: string, time: string, endOfDay = false): Date | null {
  if (typeof date !== "string" || typeof time !== "string") return null;
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  const t = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  if (!d || !t || Number(d[1]) < 1) return null;
  const wall = new Date(0);
  wall.setUTCFullYear(Number(d[1]), Number(d[2]) - 1, Number(d[3]));
  wall.setUTCHours(Number(t[1]), Number(t[2]), endOfDay ? 59 : 0, 0);
  if (wall.toISOString().slice(0, 10) !== date) return null;
  const offsets = new Set<number>();
  for (const days of [-2, -1, 0, 1, 2]) {
    const sample = new Date(wall.getTime() + days * 86400000);
    const p = parts(sample);
    const local = new Date(0);
    local.setUTCFullYear(Number(p.year), Number(p.month) - 1, Number(p.day));
    local.setUTCHours(Number(p.hour), Number(p.minute), Number(p.second), 0);
    offsets.add(local.getTime() - sample.getTime());
  }
  const matches: Date[] = [];
  for (const offset of offsets) {
    const instant = new Date(wall.getTime() - offset);
    const p = parts(instant);
    if (aucklandDateKey(instant) === date && p.hour === t[1] && p.minute === t[2] && Number(p.second) === (endOfDay ? 59 : 0)) {
      matches.push(new Date(instant.getTime() + (endOfDay ? 999 : 0)));
    }
  }
  return matches.length === 1 ? matches[0] : null;
}
