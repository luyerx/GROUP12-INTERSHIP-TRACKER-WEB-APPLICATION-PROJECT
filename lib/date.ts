export function parseAppDate(
  value: string
): Date | null {
  if (!value) {
    return null;
  }

  // YYYY-MM-DD
  const isoMatch = value.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoMatch) {
    const [, year, month, day] =
      isoMatch;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  // DD/MM/YYYY
  const slashMatch = value.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (slashMatch) {
    const [, day, month, year] =
      slashMatch;

    const date = new Date(
      Number(year),
      Number(month) - 1,
      Number(day)
    );

    return Number.isNaN(date.getTime())
      ? null
      : date;
  }

  return null;
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