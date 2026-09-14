"use client";
import { CalendarClock } from "lucide-react";
import { parseAppDate, formatAppDate } from "@/lib/date";
export default function Deadline({ value }: { value: string }) {
  const parsed = parseAppDate(value);
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Pacific/Auckland",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
  const current = parseAppDate(today);
  const days =
    parsed && current
      ? Math.round(
          (Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()) -
            Date.UTC(
              current.getFullYear(),
              current.getMonth(),
              current.getDate(),
            )) /
            86400000,
        )
      : null;
  const label =
    days === null
      ? "No deadline set"
      : days < 0
        ? "Deadline passed"
        : days === 0
          ? "Due today"
          : days === 1
            ? "Due tomorrow"
            : days <= 7
              ? `Due in ${days} days`
              : "Deadline";
  return (
    <span
      className={
        "deadline " +
        (days !== null && days >= 0 && days <= 7 ? "deadline-soon" : "")
      }
    >
      <CalendarClock aria-hidden="true" size={14} />
      <span>
        {label}
        {parsed && (
          <span className="block text-xs font-normal mt-0.5">
            {formatAppDate(value)}
          </span>
        )}
      </span>
    </span>
  );
}
