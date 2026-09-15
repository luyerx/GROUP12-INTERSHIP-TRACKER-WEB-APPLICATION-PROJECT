"use client";
import { CalendarEvent, eventStyles, monthNames, weekdayNames } from "@/components/calendar/calendarTypes";
import { formatDateKey } from "@/lib/date";
import {
  CalendarDays
} from "lucide-react";

export default function MonthGrid({ currentMonth, currentYear, calendarDays, events, setSelectedEvent }: { currentMonth: number; currentYear: number; calendarDays: { date: Date; currentMonth: boolean }[]; events: CalendarEvent[]; setSelectedEvent: (event: CalendarEvent) => void }) {
  return (<section className="order-2 overflow-hidden card xl:order-1">
    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
          <CalendarDays className="h-5 w-5" />
        </div>

        <div>
          <h2 className="text-base font-semibold text-slate-950">
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Monthly overview
          </p>
        </div>
      </div>

      <div className="hidden items-center gap-4 text-xs font-medium text-slate-500 sm:flex">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
          Deadline
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-blue-400" />
          Interview
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          Reminder
        </div>
      </div>
    </div>

    <p className="px-4 py-2 text-xs text-slate-500 sm:hidden">
      Scroll across to explore the month. Upcoming dates are listed
      above.
    </p>
    <div
      className="overflow-x-auto"
      role="region"
      aria-label="Monthly calendar, scroll horizontally to see all days"
      tabIndex={0}
    >
      <div className="min-w-[640px]">
        {/* Weekdays */}
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
          {weekdayNames.map((day) => (
            <div
              key={day}
              className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {calendarDays.map(
            ({ date, currentMonth: isCurrentMonth }) => {
              const dateKey = formatDateKey(date);

              const dayEvents = events.filter(
                (event) => event.date === dateKey,
              );

              const isToday = dateKey === formatDateKey(new Date());

              return (
                <div
                  key={dateKey}
                  className={`min-h-35 border-b border-r border-slate-100 p-2.5 ${isCurrentMonth ? "bg-white" : "bg-slate-50/50"
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${isToday
                          ? "bg-slate-950 text-white"
                          : isCurrentMonth
                            ? "text-slate-700"
                            : "text-slate-300"
                        }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    {dayEvents.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => setSelectedEvent(event)}
                        aria-label={
                          event.type +
                          ": " +
                          event.organisation +
                          ", " +
                          event.title +
                          ", " +
                          event.date
                        }
                        className={`block w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-medium ring-1 ring-inset transition hover:opacity-80 ${eventStyles[event.type]
                          }`}
                      >
                        <span className="block truncate">
                          {event.organisation}
                        </span>

                        <span className="mt-0.5 block truncate text-[10px] opacity-75">
                          {event.type === "deadline"
                            ? "Deadline"
                            : event.type === "reminder"
                              ? event.title
                              : event.time || "Interview"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>
      </div>
    </div>
  </section>);
}
