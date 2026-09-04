"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

import DashboardLayout from "@/components/layout/DashboardLayout";

type EventType =
  | "deadline"
  | "interview"
  | "reminder";

type ApplicationStatus =
  | "Interested"
  | "Preparing"
  | "Applied"
  | "Interview"
  | "Offer"
  | "Rejected"
  | "Withdrawn";

type Application = {
  id: string;
  organisation: string;
  roleTitle: string;
  location: string;
  deadline: string;
  status: ApplicationStatus;
};

type ApplicationsApiResponse = {
  success: boolean;
  data?: Application[];
  message?: string;
};

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

const eventStyles: Record<
  EventType,
  string
> = {
  deadline:
    "bg-rose-50 text-rose-700 ring-rose-600/20",

  interview:
    "bg-blue-50 text-blue-700 ring-blue-600/20",

  reminder:
    "bg-amber-50 text-amber-700 ring-amber-600/20",
};

const eventIconStyles: Record<
  EventType,
  string
> = {
  deadline:
    "bg-rose-50 text-rose-600",

  interview:
    "bg-blue-50 text-blue-600",

  reminder:
    "bg-amber-50 text-amber-600",
};

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const weekdayNames = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

function convertDeadlineToDateKey(
  deadline: string
) {
  if (!deadline) {
    return null;
  }

  /*
   * Already YYYY-MM-DD
   */
  const isoMatch = deadline.match(
    /^(\d{4})-(\d{2})-(\d{2})$/
  );

  if (isoMatch) {
    return deadline;
  }

  /*
   * DD/MM/YYYY
   */
  const nzMatch = deadline.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/
  );

  if (nzMatch) {
    const [, day, month, year] =
      nzMatch;

    return `${year}-${month.padStart(
      2,
      "0"
    )}-${day.padStart(2, "0")}`;
  }

  return null;
}

function formatDateKey(
  date: Date
) {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDisplayDate(
  date: string,
  longMonth = false
) {
  return new Date(
    `${date}T00:00:00`
  ).toLocaleDateString("en-NZ", {
    day: "numeric",
    month: longMonth
      ? "long"
      : "short",
    year: "numeric",
  });
}

export default function CalendarPage() {
  const today = new Date();

  const [
    currentDate,
    setCurrentDate,
  ] = useState(
    new Date(
      today.getFullYear(),
      today.getMonth(),
      1
    )
  );

  const [
    applications,
    setApplications,
  ] = useState<Application[]>([]);

  const [
    manualEvents,
    setManualEvents,
  ] =
    useState<CalendarEvent[]>([]);

  const [
    isLoadingApplications,
    setIsLoadingApplications,
  ] = useState(true);

  const [
    applicationsError,
    setApplicationsError,
  ] = useState("");

  const [
    selectedEvent,
    setSelectedEvent,
  ] =
    useState<CalendarEvent | null>(
      null
    );

  const [
    editingEventId,
    setEditingEventId,
  ] =
    useState<string | number | null>(
      null
    );

  const [
    showEventForm,
    setShowEventForm,
  ] = useState(false);

  const [
    formMode,
    setFormMode,
  ] =
    useState<
      "create" | "edit"
    >("create");

  const [
    showDeleteModal,
    setShowDeleteModal,
  ] = useState(false);

  const [
    isSavingEvent,
    setIsSavingEvent,
  ] = useState(false);

  const [
    isDeletingEvent,
    setIsDeletingEvent,
  ] = useState(false);

  const [
    eventType,
    setEventType,
  ] =
    useState<EventType>(
      "interview"
    );

  const [
    organisation,
    setOrganisation,
  ] = useState("");

  const [
    applicationId,
    setApplicationId,
  ] = useState("");

  const [
    eventTitle,
    setEventTitle,
  ] = useState("");

  const [
    eventDate,
    setEventDate,
  ] = useState("");

  const [
    eventTime,
    setEventTime,
  ] = useState("");

  const [
    eventLocation,
    setEventLocation,
  ] = useState("");

  const [
    eventNotes,
    setEventNotes,
  ] = useState("");

  const currentYear =
    currentDate.getFullYear();

  const currentMonth =
    currentDate.getMonth();

  /*
   * Load applications from the real API.
   */
  useEffect(() => {
    let cancelled = false;

    const loadApplications =
      async () => {
        try {
          const response =
            await fetch(
              "/api/applications",
              {
                method: "GET",
                cache:
                  "no-store",
              }
            );

          const result: ApplicationsApiResponse =
            await response.json();

          if (
            !response.ok ||
            !result.success
          ) {
            throw new Error(
              result.message ||
                "Failed to load applications."
            );
          }

          if (!cancelled) {
            setApplications(
              Array.isArray(
                result.data
              )
                ? result.data
                : []
            );
          }
        } catch (error) {
          console.error(
            "Calendar application load error:",
            error
          );

          if (!cancelled) {
            setApplicationsError(
              error instanceof
                Error
                ? error.message
                : "Unable to load application deadlines."
            );
          }
        } finally {
          if (!cancelled) {
            setIsLoadingApplications(
              false
            );
          }
        }
      };

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, []);

  /*
   * Application deadlines become
   * automatic calendar events.
   */
  const deadlineEvents =
    useMemo(() => {
      return applications.flatMap(
        (application) => {
          const date =
            convertDeadlineToDateKey(
              application.deadline
            );

          if (!date) {
            return [];
          }

          const event: CalendarEvent =
            {
              /*
               * Prefixed IDs separate
               * automatic application
               * deadlines from manual
               * events.
               */
              id: `deadline-${application.id}`,

              applicationId:
                application.id,

              type: "deadline",

              title:
                "Application deadline",

              organisation:
                application.organisation,

              date,

              location:
                application.location ||
                undefined,
            };

          return [event];
        }
      );
    }, [applications]);

  /*
   * Combined calendar source.
   */
  const events = useMemo(
    () => [
      ...deadlineEvents,
      ...manualEvents,
    ],
    [
      deadlineEvents,
      manualEvents,
    ]
  );

  const calendarDays =
    useMemo(() => {
      const firstDay =
        new Date(
          currentYear,
          currentMonth,
          1
        );

      const lastDay =
        new Date(
          currentYear,
          currentMonth + 1,
          0
        );

      const daysInMonth =
        lastDay.getDate();

      const firstWeekday =
        firstDay.getDay() === 0
          ? 6
          : firstDay.getDay() -
            1;

      const previousMonthLastDay =
        new Date(
          currentYear,
          currentMonth,
          0
        ).getDate();

      const days: {
        date: Date;
        currentMonth: boolean;
      }[] = [];

      for (
        let index =
          firstWeekday - 1;
        index >= 0;
        index--
      ) {
        days.push({
          date: new Date(
            currentYear,
            currentMonth - 1,
            previousMonthLastDay -
              index
          ),

          currentMonth: false,
        });
      }

      for (
        let day = 1;
        day <= daysInMonth;
        day++
      ) {
        days.push({
          date: new Date(
            currentYear,
            currentMonth,
            day
          ),

          currentMonth: true,
        });
      }

      while (
        days.length < 42
      ) {
        const day =
          days.length -
          (firstWeekday +
            daysInMonth) +
          1;

        days.push({
          date: new Date(
            currentYear,
            currentMonth + 1,
            day
          ),

          currentMonth: false,
        });
      }

      return days;
    }, [
      currentYear,
      currentMonth,
    ]);

  const upcomingEvents =
    useMemo(() => {
      const todayKey =
        formatDateKey(
          new Date()
        );

      return [...events]
        .filter(
          (event) =>
            event.date >=
            todayKey
        )
        .sort(
          (a, b) =>
            new Date(
              `${a.date}T00:00:00`
            ).getTime() -
            new Date(
              `${b.date}T00:00:00`
            ).getTime()
        )
        .slice(0, 6);
    }, [events]);

  const resetEventForm =
    () => {
      const firstApplication =
        applications[0];

      setEventType(
        "interview"
      );

      setApplicationId(
        firstApplication
          ? String(
              firstApplication.id
            )
          : ""
      );

      setOrganisation(
        firstApplication
          ? firstApplication.organisation
          : ""
      );

      setEventTitle("");
      setEventDate("");
      setEventTime("");
      setEventLocation("");
      setEventNotes("");
    };

  const openCreateEvent =
    () => {
      resetEventForm();

      setEditingEventId(
        null
      );

      setFormMode("create");

      setShowEventForm(
        true
      );
    };

  const openEditEvent =
    () => {
      if (
        !selectedEvent
      ) {
        return;
      }

      /*
       * Automatic deadlines cannot
       * be edited directly.
       */
      if (
        selectedEvent.type ===
          "deadline" &&
        String(selectedEvent.id).startsWith("deadline-")
      ) {
        return;
      }

      setEditingEventId(
        selectedEvent.id
      );

      setEventType(
        selectedEvent.type
      );

      setOrganisation(
        selectedEvent.organisation
      );

      setApplicationId(
        String(
          selectedEvent.applicationId
        )
      );

      setEventTitle(
        selectedEvent.title
      );

      setEventDate(
        selectedEvent.date
      );

      setEventTime(
        selectedEvent.time ?? ""
      );

      setEventLocation(
        selectedEvent.location ??
          ""
      );

      setEventNotes(
        selectedEvent.notes ?? ""
      );

      setFormMode("edit");

      setShowEventForm(
        true
      );
    };

  const closeEventForm =
    () => {
      if (isSavingEvent) {
        return;
      }

      setShowEventForm(
        false
      );

      setEditingEventId(
        null
      );

      resetEventForm();
    };

  const handleSaveEvent =
    async () => {
      if (
        !applicationId ||
        !organisation.trim() ||
        !eventDate.trim()
      ) {
        return;
      }

      setIsSavingEvent(
        true
      );

      /*
       * Temporary manual event save.
       *
       * Later:
       * POST /api/events
       * PUT /api/events/:id
       */
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            700
          )
      );

      const eventData = {
        applicationId,

        type: eventType,

        title:
          eventTitle.trim() ||
          (eventType ===
          "interview"
            ? "Interview"
            : "Reminder"),

        organisation:
          organisation.trim(),

        date:
          eventDate.trim(),

        time:
          eventTime.trim() ||
          undefined,

        location:
          eventLocation.trim() ||
          undefined,

        notes:
          eventNotes.trim() ||
          undefined,
      };

      if (
        formMode === "edit" &&
        editingEventId !==
          null
      ) {
        setManualEvents(
          (current) =>
            current.map(
              (event) =>
                event.id ===
                editingEventId
                  ? {
                      ...event,
                      ...eventData,
                    }
                  : event
            )
        );
      } else {
        const newEvent: CalendarEvent =
          {
            id: Date.now(),
            ...eventData,
          };

        setManualEvents(
          (current) => [
            ...current,
            newEvent,
          ]
        );
      }

      const selectedDate =
        new Date(
          `${eventDate}T00:00:00`
        );

      setCurrentDate(
        new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          1
        )
      );

      if (
        formMode === "edit" &&
        editingEventId !==
          null
      ) {
        setSelectedEvent({
          id: editingEventId,
          ...eventData,
        });
      }

      setIsSavingEvent(
        false
      );

      setShowEventForm(
        false
      );

      setEditingEventId(
        null
      );

      resetEventForm();
    };

  const handleDeleteEvent =
    async () => {
      if (
        !selectedEvent
      ) {
        return;
      }

      /*
       * Automatic deadlines cannot
       * be deleted directly.
       */
      if (
        selectedEvent.type ===
          "deadline" &&
        String(selectedEvent.id).startsWith("deadline-")
      ) {
        return;
      }

      setIsDeletingEvent(
        true
      );

      /*
       * Temporary manual delete.
       *
       * Later:
       * DELETE /api/events/:id
       */
      await new Promise(
        (resolve) =>
          setTimeout(
            resolve,
            700
          )
      );

      setManualEvents(
        (current) =>
          current.filter(
            (event) =>
              event.id !==
              selectedEvent.id
          )
      );

      setIsDeletingEvent(
        false
      );

      setShowDeleteModal(
        false
      );

      setSelectedEvent(
        null
      );
    };

  const retryApplications =
    async () => {
      setIsLoadingApplications(
        true
      );

      setApplicationsError("");

      try {
        const response =
          await fetch(
            "/api/applications",
            {
              method: "GET",
              cache:
                "no-store",
            }
          );

        const result: ApplicationsApiResponse =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Failed to load applications."
          );
        }

        setApplications(
          Array.isArray(
            result.data
          )
            ? result.data
            : []
        );
      } catch (error) {
        console.error(
          "Calendar application load error:",
          error
        );

        setApplicationsError(
          error instanceof
            Error
            ? error.message
            : "Unable to load application deadlines."
        );
      } finally {
        setIsLoadingApplications(
          false
        );
      }
    };

  const goToPreviousMonth =
    () => {
      setCurrentDate(
        new Date(
          currentYear,
          currentMonth - 1,
          1
        )
      );
    };

  const goToNextMonth =
    () => {
      setCurrentDate(
        new Date(
          currentYear,
          currentMonth + 1,
          1
        )
      );
    };

  const goToToday =
    () => {
      const today =
        new Date();

      setCurrentDate(
        new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        )
      );
    };

  const isAutomaticDeadline =
    selectedEvent?.type ===
      "deadline" &&
    String(selectedEvent.id).startsWith("deadline-");

  return (
    <DashboardLayout>
      <div>
        {/* Header */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Schedule management
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Calendar
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Keep track of
              application deadlines,
              interviews, reminders,
              and important
              recruitment dates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={
                openCreateEvent
              }
              disabled={
                applications.length ===
                  0 ||
                isLoadingApplications
              }
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add event
            </button>

            <button
              type="button"
              onClick={
                goToToday
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              Today
            </button>

            <button
              type="button"
              onClick={
                goToPreviousMonth
              }
              aria-label="Previous month"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={
                goToNextMonth
              }
              aria-label="Next month"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50 hover:text-slate-950"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* API status */}
        {isLoadingApplications && (
          <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <LoaderCircle className="h-4 w-4 animate-spin text-slate-500" />

            <div>
              <p className="text-sm font-medium text-slate-700">
                Loading application
                deadlines...
              </p>

              <p className="mt-0.5 text-xs text-slate-400">
                Calendar deadlines
                are synchronised from
                your applications.
              </p>
            </div>
          </div>
        )}

        {!isLoadingApplications &&
          applicationsError && (
            <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-rose-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                  <AlertCircle className="h-4 w-4" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Unable to load
                    application
                    deadlines
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {
                      applicationsError
                    }
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  void retryApplications()
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                <RefreshCw className="h-4 w-4" />
                Try again
              </button>
            </div>
          )}

        <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
          {/* Calendar */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-slate-950">
                    {
                      monthNames[
                        currentMonth
                      ]
                    }{" "}
                    {currentYear}
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

            {/* Weekdays */}
            <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/70">
              {weekdayNames.map(
                (day) => (
                  <div
                    key={day}
                    className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-400"
                  >
                    {day}
                  </div>
                )
              )}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {calendarDays.map(
                ({
                  date,
                  currentMonth:
                    isCurrentMonth,
                }) => {
                  const dateKey =
                    formatDateKey(
                      date
                    );

                  const dayEvents =
                    events.filter(
                      (event) =>
                        event.date ===
                        dateKey
                    );

                  const isToday =
                    dateKey ===
                    formatDateKey(
                      new Date()
                    );

                  return (
                    <div
                      key={
                        dateKey
                      }
                      className={`min-h-35 border-b border-r border-slate-100 p-2.5 ${
                        isCurrentMonth
                          ? "bg-white"
                          : "bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
                            isToday
                              ? "bg-slate-950 text-white"
                              : isCurrentMonth
                                ? "text-slate-700"
                                : "text-slate-300"
                          }`}
                        >
                          {
                            date.getDate()
                          }
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {dayEvents.map(
                          (event) => (
                            <button
                              key={
                                event.id
                              }
                              type="button"
                              onClick={() =>
                                setSelectedEvent(
                                  event
                                )
                              }
                              className={`block w-full rounded-lg px-2 py-1.5 text-left text-[11px] font-medium ring-1 ring-inset transition hover:opacity-80 ${
                                eventStyles[
                                  event.type
                                ]
                              }`}
                            >
                              <span className="block truncate">
                                {
                                  event.organisation
                                }
                              </span>

                              <span className="mt-0.5 block truncate text-[10px] opacity-75">
                                {event.type ===
                                "deadline"
                                  ? "Deadline"
                                  : event.type ===
                                      "reminder"
                                    ? event.title
                                    : event.time ||
                                      "Interview"}
                              </span>
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </section>

          {/* Upcoming */}
          <aside className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-base font-semibold text-slate-950">
                Upcoming
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Your next important
                dates.
              </p>

              <div className="mt-5 space-y-3">
                {upcomingEvents.length >
                0 ? (
                  upcomingEvents.map(
                    (event) => (
                      <button
                        key={
                          event.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedEvent(
                            event
                          )
                        }
                        className="block w-full rounded-xl border border-slate-100 p-4 text-left transition hover:border-slate-200 hover:bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                              eventIconStyles[
                                event
                                  .type
                              ]
                            }`}
                          >
                            {event.type ===
                            "interview" ? (
                              <Clock3 className="h-4 w-4" />
                            ) : (
                              <CalendarDays className="h-4 w-4" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              {
                                event.organisation
                              }
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {
                                event.title
                              }
                            </p>

                            <p className="mt-2 text-xs font-medium text-slate-600">
                              {formatDisplayDate(
                                event.date
                              )}
                            </p>

                            {event.time && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                <Clock3 className="h-3.5 w-3.5" />
                                {
                                  event.time
                                }
                              </p>
                            )}

                            {event.location && (
                              <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                                <MapPin className="h-3.5 w-3.5" />
                                {
                                  event.location
                                }
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  )
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center">
                    <CalendarDays className="mx-auto h-5 w-5 text-slate-300" />

                    <p className="mt-3 text-sm font-medium text-slate-700">
                      No upcoming
                      events
                    </p>

                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Future deadlines,
                      interviews, and
                      reminders will
                      appear here.
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm">
              <CalendarDays className="h-5 w-5 text-slate-300" />

              <h2 className="mt-4 text-base font-semibold">
                Stay ahead of
                deadlines
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-400">
                Application
                deadlines are
                automatically
                synchronised from
                your tracker.
                Interviews and
                reminders can be
                added manually.
              </p>
            </section>
          </aside>
        </div>
      </div>

      {/* Event detail modal */}
      {selectedEvent &&
        !showDeleteModal &&
        !showEventForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
            <button
              type="button"
              aria-label="Close event details"
              onClick={() =>
                setSelectedEvent(
                  null
                )
              }
              className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
            />

            <div className="relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                      eventIconStyles[
                        selectedEvent
                          .type
                      ]
                    }`}
                  >
                    {selectedEvent.type ===
                    "interview" ? (
                      <Clock3 className="h-5 w-5" />
                    ) : (
                      <CalendarDays className="h-5 w-5" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-semibold text-slate-950">
                        {
                          selectedEvent.title
                        }
                      </h2>

                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                          eventStyles[
                            selectedEvent
                              .type
                          ]
                        }`}
                      >
                        {selectedEvent.type
                          .charAt(
                            0
                          )
                          .toUpperCase() +
                          selectedEvent.type.slice(
                            1
                          )}
                      </span>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      {
                        selectedEvent.organisation
                      }
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedEvent(
                      null
                    )
                  }
                  className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-5 p-6">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Date
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {formatDisplayDate(
                        selectedEvent.date,
                        true
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                      Time
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedEvent.time ||
                        "Not specified"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Location /
                    meeting link
                  </p>

                  <p className="mt-2 flex items-center gap-2 text-sm text-slate-700">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />

                    {selectedEvent.location ||
                      "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Notes
                  </p>

                  <div className="mt-2 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                    {selectedEvent.notes ||
                      (isAutomaticDeadline
                        ? "This deadline is automatically synchronised from the related application."
                        : "No notes added for this event.")}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Related
                    application
                  </p>

                  <p className="mt-2 text-sm font-medium text-slate-800">
                    Application #
                    {
                      selectedEvent.applicationId
                    }
                  </p>
                </div>
              </div>

              {/* Automatic deadline actions */}
              {isAutomaticDeadline ? (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs leading-5 text-slate-400">
                    This deadline is
                    managed by the
                    related
                    application.
                  </p>

                  <Link
                    href={`/applications/${selectedEvent.applicationId}/edit`}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                  >
                    <Pencil className="h-4 w-4" />
                    Edit application
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() =>
                      setShowDeleteModal(
                        true
                      )
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-white px-4 py-2.5 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete event
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={
                        openEditEvent
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit event
                    </button>

                    <Link
                      href={`/applications/${selectedEvent.applicationId}`}
                      className="rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                    >
                      Go to
                      application
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Event form modal */}
      {showEventForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <button
            type="button"
            aria-label="Close event form"
            disabled={
              isSavingEvent
            }
            onClick={
              closeEventForm
            }
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]"
          />

          <div className="relative z-10 max-h-full w-full max-w-xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-white">
                  {formMode ===
                  "edit" ? (
                    <Pencil className="h-5 w-5" />
                  ) : (
                    <CalendarDays className="h-5 w-5" />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    {formMode ===
                    "edit"
                      ? "Edit calendar event"
                      : "Add calendar event"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {formMode ===
                    "edit"
                      ? "Update the selected interview or reminder."
                      : "Add an interview or reminder related to an application."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={
                  isSavingEvent
                }
                onClick={
                  closeEventForm
                }
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {/* Event type */}
              <div>
                <label
                  htmlFor="eventType"
                  className="text-sm font-medium text-slate-700"
                >
                  Event type
                </label>

                <select
                  id="eventType"
                  value={
                    eventType
                  }
                  disabled={
                    isSavingEvent
                  }
                  onChange={(
                    event
                  ) =>
                    setEventType(
                      event.target
                        .value as EventType
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
                >
                  <option value="interview">
                    Interview
                  </option>

                  <option value="reminder">
                    Reminder
                  </option>
                </select>

                <p className="mt-2 text-xs leading-5 text-slate-400">
                  Application
                  deadlines are
                  generated
                  automatically and
                  cannot be created
                  manually.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Application */}
                <div>
                  <label
                    htmlFor="applicationId"
                    className="text-sm font-medium text-slate-700"
                  >
                    Application{" "}
                    <span className="text-rose-500">
                      *
                    </span>
                  </label>

                  <select
                    id="applicationId"
                    value={
                      applicationId
                    }
                    disabled={
                      isSavingEvent
                    }
                    onChange={(
                      event
                    ) => {
                      const value =
                        event.target
                          .value;

                      setApplicationId(
                        value
                      );

                      const relatedApplication =
                        applications.find(
                          (
                            application
                          ) =>
                            String(
                              application.id
                            ) ===
                            value
                        );

                      if (
                        relatedApplication
                      ) {
                        setOrganisation(
                          relatedApplication.organisation
                        );
                      }
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
                  >
                    {applications.length >
                    0 ? (
                      applications.map(
                        (
                          application
                        ) => (
                          <option
                            key={
                              application.id
                            }
                            value={
                              application.id
                            }
                          >
                            {
                              application.organisation
                            }{" "}
                            —{" "}
                            {
                              application.roleTitle
                            }
                          </option>
                        )
                      )
                    ) : (
                      <option value="">
                        No
                        applications
                        available
                      </option>
                    )}
                  </select>
                </div>

                {/* Organisation */}
                <div>
                  <label
                    htmlFor="organisation"
                    className="text-sm font-medium text-slate-700"
                  >
                    Organisation
                  </label>

                  <input
                    id="organisation"
                    type="text"
                    value={
                      organisation
                    }
                    readOnly
                    className="mt-2 w-full cursor-default rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-600 outline-none"
                  />
                </div>
              </div>

              {/* Event title */}
              <div>
                <label
                  htmlFor="eventTitle"
                  className="text-sm font-medium text-slate-700"
                >
                  Event title
                </label>

                <input
                  id="eventTitle"
                  type="text"
                  value={
                    eventTitle
                  }
                  disabled={
                    isSavingEvent
                  }
                  onChange={(
                    event
                  ) =>
                    setEventTitle(
                      event.target
                        .value
                    )
                  }
                  placeholder={
                    eventType ===
                    "interview"
                      ? "Technical interview"
                      : "Follow-up reminder"
                  }
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {/* Date */}
                <div>
                  <label
                    htmlFor="eventDate"
                    className="text-sm font-medium text-slate-700"
                  >
                    Date{" "}
                    <span className="text-rose-500">
                      *
                    </span>
                  </label>

                  <input
                    id="eventDate"
                    type="text"
                    inputMode="numeric"
                    value={
                      eventDate
                    }
                    disabled={
                      isSavingEvent
                    }
                    onChange={(
                      event
                    ) =>
                      setEventDate(
                        event.target
                          .value
                      )
                    }
                    placeholder="YYYY-MM-DD"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
                  />
                </div>

                {/* Time */}
                <div>
                  <label
                    htmlFor="eventTime"
                    className="text-sm font-medium text-slate-700"
                  >
                    Time
                  </label>

                  <input
                    id="eventTime"
                    type="text"
                    value={
                      eventTime
                    }
                    disabled={
                      isSavingEvent
                    }
                    onChange={(
                      event
                    ) =>
                      setEventTime(
                        event.target
                          .value
                      )
                    }
                    placeholder="e.g. 10:30 AM"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label
                  htmlFor="eventLocation"
                  className="text-sm font-medium text-slate-700"
                >
                  Location /
                  meeting link
                </label>

                <input
                  id="eventLocation"
                  type="text"
                  value={
                    eventLocation
                  }
                  disabled={
                    isSavingEvent
                  }
                  onChange={(
                    event
                  ) =>
                    setEventLocation(
                      event.target
                        .value
                    )
                  }
                  placeholder="e.g. Zoom, Teams, Auckland CBD"
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
                />
              </div>

              {/* Notes */}
              <div>
                <label
                  htmlFor="eventNotes"
                  className="text-sm font-medium text-slate-700"
                >
                  Notes
                </label>

                <textarea
                  id="eventNotes"
                  rows={4}
                  value={
                    eventNotes
                  }
                  disabled={
                    isSavingEvent
                  }
                  onChange={(
                    event
                  ) =>
                    setEventNotes(
                      event.target
                        .value
                    )
                  }
                  placeholder="Add useful preparation notes or reminders..."
                  className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 disabled:opacity-60"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                disabled={
                  isSavingEvent
                }
                onClick={
                  closeEventForm
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  isSavingEvent ||
                  !applicationId ||
                  !organisation.trim() ||
                  !eventDate.trim()
                }
                onClick={() =>
                  void handleSaveEvent()
                }
                className="inline-flex min-w-34 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSavingEvent ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />

                    {formMode ===
                    "edit"
                      ? "Saving changes..."
                      : "Saving..."}
                  </>
                ) : formMode ===
                  "edit" ? (
                  <>
                    <Pencil className="h-4 w-4" />
                    Save changes
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Add event
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {selectedEvent &&
        showDeleteModal &&
        !isAutomaticDeadline && (
          <div className="fixed inset-0 z-60 flex items-center justify-center px-4">
            <button
              type="button"
              aria-label="Close delete confirmation"
              disabled={
                isDeletingEvent
              }
              onClick={() =>
                setShowDeleteModal(
                  false
                )
              }
              className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px]"
            />

            <div className="relative z-10 w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <Trash2 className="h-5 w-5" />
              </div>

              <h2 className="mt-5 text-lg font-semibold text-slate-950">
                Delete event?
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                You are about to
                delete{" "}
                <span className="font-medium text-slate-700">
                  {
                    selectedEvent.title
                  }
                </span>{" "}
                for{" "}
                <span className="font-medium text-slate-700">
                  {
                    selectedEvent.organisation
                  }
                </span>
                .
              </p>

              <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50/60 p-4">
                <p className="text-xs leading-5 text-rose-700">
                  This action cannot
                  be undone.
                </p>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  disabled={
                    isDeletingEvent
                  }
                  onClick={() =>
                    setShowDeleteModal(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={
                    isDeletingEvent
                  }
                  onClick={() =>
                    void handleDeleteEvent()
                  }
                  className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingEvent ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete event
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </DashboardLayout>
  );
}
