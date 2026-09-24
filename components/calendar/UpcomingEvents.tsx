"use client";
import { CalendarDays, Clock3, MapPin } from "lucide-react";
type EventType = "deadline" | "interview" | "reminder";
type CalendarEvent = {
  id: string | number;
  applicationId: string;
  type: EventType;
  title: string;
  organisation: string;
  date: string;
  time?: string;
  location?: string;
  notes?: string;
};

const eventIconStyles: Record<EventType, string> = {
  deadline: "bg-rose-50 text-rose-600",

  interview: "bg-blue-50 text-blue-600",

  reminder: "bg-amber-50 text-amber-600",
};

function formatDisplayDate(date: string, longMonth = false) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: longMonth ? "long" : "short",
    year: "numeric",
  });
}

export default function UpcomingEvents({ events, onSelect }: { events: CalendarEvent[]; onSelect: (event: CalendarEvent) => void }) { return (
            <section className="card p-5">
              <h2 className="text-base font-semibold text-slate-950">
                Upcoming
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your next important dates.
              </p>

              <div className="mt-5 space-y-3">
                {events.length > 0 ? (
                  events.map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      onClick={() => onSelect(event)}
                      className="block w-full rounded-xl border border-slate-100 p-4 text-left transition hover:border-slate-200 hover:bg-slate-50"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            eventIconStyles[event.type]
                          }`}
                        >
                          {event.type === "interview" ? (
                            <Clock3 className="h-4 w-4" />
                          ) : (
                            <CalendarDays className="h-4 w-4" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">
                            {event.organisation}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {event.title}
                          </p>

                          <p className="mt-2 text-xs font-medium text-slate-600">
                            {formatDisplayDate(event.date)}
                          </p>

                          {event.time && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock3 className="h-3.5 w-3.5" />
                              {event.time} NZ time
                            </p>
                          )}

                          {event.location && (
                            <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5" />
                              {event.location}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                    <CalendarDays className="mx-auto h-5 w-5 text-slate-300" />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No upcoming events
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Future deadlines, interviews, and reminders will appear
                      here.
                    </p>
                  </div>
                )}
              </div>
            </section>
); }
