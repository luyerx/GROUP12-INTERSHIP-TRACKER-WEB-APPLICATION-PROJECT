// Calendar dates are local date-only values, never UTC timestamps.
export function parseAppDate(value: string): Date | null {
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const legacy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(value);
  if (!iso && !legacy) return null;
  const [year, month, day] = iso
    ? [Number(iso[1]), Number(iso[2]), Number(iso[3])]
    : [Number(legacy![3]), Number(legacy![2]), Number(legacy![1])];
  const date = new Date(0);
  date.setFullYear(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return year >= 1 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
}

export function formatDateKey(date: Date): string {
  return [String(date.getFullYear()).padStart(4, "0"), String(date.getMonth() + 1).padStart(2, "0"), String(date.getDate()).padStart(2, "0")].join("-");
}

export function toDateInputValue(value: string): string {
  const date = parseAppDate(value);
  return date ? formatDateKey(date) : "";
}

export function isDateInputValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && parseAppDate(value) !== null;
}

export function formatAppDate(
  value: string
): string {
  const date = parseAppDate(value);

  if (!date) {
    return value || "No deadline";
  }

  return new Intl.DateTimeFormat(
    "en-NZ",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

export function formatAppDateShort(
  value: string
): string {
  const date = parseAppDate(value);

  if (!date) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-NZ",
    {
      day: "numeric",
      month: "short",
    }
  ).format(date);
}